<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import { useSelectStore } from '@/stores/selectStore';
import { useAttributeStore } from '@/stores/AttributeStore';
import { useAttributeSelectStore } from '@/stores/attributeSelectStore';
import DataTable from 'datatables.net-vue3';
import DataTablesCore from 'datatables.net-dt';
import AttributeSelect from '@/components/AttributeSelect.vue';
import { defaultReflect, getLunarYear, xAxisDataFunc, padZeroPeriod, tableTitleName } from '@/utility/prize_base_info';
import type { NumberTypeForProcessedData } from '@/interface/LineTableInt';

DataTable.use(DataTablesCore);

// Store 初始化獲取儲存在store的數據
const selectStore = useSelectStore();
const attributeSelectStore = useAttributeSelectStore();
const { getAttributeFor } = useAttributeStore();

// Ref 定義
const tableInstance = ref<any>(null);
const isLoading = ref(true);
const screenWidth = ref(window.innerWidth);

// 響應式計算屬性
// 定義螢幕大小的分類
const deviceType = computed(() => {
  if (screenWidth.value < 400) return 'mobile';
  if (screenWidth.value < 768) return 'tablet';
  return 'desktop';
});

// 基於 deviceType 重新定義響應式屬性
const getResponsiveValue = <T>(mobileValue: T, tabletValue: T, desktopValue: T): T => {
  return deviceType.value === 'mobile' ? mobileValue : deviceType.value === 'tablet' ? tabletValue : desktopValue;
};

const axisLabelFontSize = computed(() => getResponsiveValue('12px', '12px', '15px'));
const cellPadding = computed(() => getResponsiveValue('6px', '8px', '10px'));

// 監聽螢幕寬度變化
const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth;
};

// 處理窗口大小變化
const handleResize = () => {
  updateScreenWidth();
};

// 分割並組合對象，處理 0 開頭排序問題
const splitAndCombine = <T>(obj: Record<string | number, T>): T[] => {
  const keys01to09: Record<string, T> = {};
  const restOfKeys: Record<string, T> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (key >= '01' && key <= '09') {
      keys01to09[key] = value;
    } else {
      restOfKeys[key] = value;
    }
  });

  // 不排序，直接獲取值
  const keys01to09Arr = Object.values(keys01to09);
  const restOfKeysArr = Object.values(restOfKeys);

  return [...keys01to09Arr, ...restOfKeysArr];
};

// 創建表格數據
const createTableData = (attributeValues: (number | string)[], xAxisData: (number | string)[], yearAndPeriodArr: string[]) => {
  const periodCounts: Record<string | number, number> = {};
  const lastPeriodWin: Record<string | number, string> = {};

  // 初始化數據
  xAxisData.forEach((item) => {
    periodCounts[item] = 0;
    lastPeriodWin[item] = '無';
  });
  
// 計算中獎次數
attributeValues.forEach((item) => {
    periodCounts[item] = (periodCounts[item] || 0) + 1;
  });

  // 確保數據從新到舊排序
  const attributeValuesNewestFirst = [...attributeValues].reverse();
  const yearAndPeriodArrNewestFirst = [...yearAndPeriodArr].reverse();

  // 為每個屬性找到最新中獎期數
  for (let i = 0; i < attributeValuesNewestFirst.length; i++) {
    const item = attributeValuesNewestFirst[i];
    const periodStr = yearAndPeriodArrNewestFirst[i];
    if (lastPeriodWin[item] === '無') {
      lastPeriodWin[item] = periodStr;
    }
  }

  // 處理01-09排序問題
  const combinedArrayForCounts = splitAndCombine(periodCounts);
  const combinedArrayForPeriod = splitAndCombine(lastPeriodWin);

  // 計算連續未中次數
  const missingStreakArr: number[] = [];

  combinedArrayForPeriod.forEach((item) => {
    if (item === '無') {
      missingStreakArr.push(yearAndPeriodArr.length);
    } else {
      try {
        // 使用索引差值計算連續未中次數
        const latestPeriod = parseInt(yearAndPeriodArr[yearAndPeriodArr.length - 1].slice(4));
        const winPeriod = parseInt(item.slice(4));
        missingStreakArr.push(latestPeriod - winPeriod);
      } catch (error) {
        console.error('計算連續未中次數時出錯:', error, item);
        missingStreakArr.push(0);
      }
    }
  });
// 建立表格所需的資料
const tableDataObjectsArray = [];

for (let i = 0; i < xAxisData.length; i++) {
  const item = combinedArrayForPeriod[i] as string;

  const obj = {
    name: xAxisData[i],
    missingStreak: `${missingStreakArr[i]}次`,
    lastWinPeriod: item === '無' ? '無' : `${item.slice(4)}期`,
    totalMiss: `${yearAndPeriodArr.length - combinedArrayForCounts[i]}次`
  };

  tableDataObjectsArray.push(obj);
}

return tableDataObjectsArray;
};

// 處理數據並創建表格
const processData = () => {
  if (selectStore.items.length === 0) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    const resultRange = Number(defaultReflect[selectStore.type]);
    const hasAttribute = Boolean(attributeSelectStore.selectedAttribute);
    const selectedNumOption = attributeSelectStore.selectedNumOption as keyof Pick<NumberTypeForProcessedData, 'num_1' | 'num_2' | 'num_3' | 'num_4' | 'num_5' | 'num_6' | 'num_7'>;

    // 獲取X軸數據
    const xAxisData = hasAttribute ? xAxisDataFunc(attributeSelectStore.selectedAttribute, resultRange) : Array.from({ length: resultRange }, (_, i) => (i + 1 < 10 ? `0${i + 1}` : `${i + 1}`));

    // 處理屬性值和期數
    const attributeValues: (number | string)[] = [];
    const yearAndPeriodArr: string[] = [];

    // 從舊到新處理數據
    for (let i = selectStore.items.length - 1; i >= 0; i--) {
      const item = selectStore.items[i];
      if (!item || !item[selectedNumOption]) continue;

      const num = item[selectedNumOption] as number;
      const year = item.period_now_year;
      const period = item.period_now;
      const periodStr = `${year}${padZeroPeriod(period)}`;
      yearAndPeriodArr.push(periodStr);

      try {
        const currentLunarYear = getLunarYear(new Date(Number(year), Number(item.period_now_month) - 1, Number(item.period_now_day)));

        // 處理值（數字或屬性）
        let valueToCount: number | string;
        if (hasAttribute) {
          valueToCount = getAttributeFor(attributeSelectStore.selectedAttribute, num, resultRange, currentLunarYear);
        } else {
          // 確保數字格式為 01-49
          valueToCount = num < 10 ? `0${num}` : `${num}`;
        }

        attributeValues.push(valueToCount);
      } catch (error) {
        console.error('處理數據時出錯:', error);
      }
    }

    // 創建表格數據
    const tableData = createTableData(attributeValues, xAxisData, yearAndPeriodArr);

    // 更新或創建表格
    updateTable(tableData);

    isLoading.value = false;
  } catch (error) {
    console.error('處理表格數據時出錯:', error);
    isLoading.value = false;
  }
};

// 更新或創建表格
const updateTable = (data: any[]) => {
  // 如果表格已存在，先銷毀
  if (tableInstance.value) {
    tableInstance.value.destroy();
  }

  // 設置動態標題名稱
  const titleName = attributeSelectStore.selectedAttribute
    ? tableTitleName[attributeSelectStore.selectedAttribute as keyof typeof tableTitleName] || '號碼'
    : tableTitleName[selectStore.type] || '號碼';

  // 初始化表格
  nextTick(() => {
    const tableElement = document.querySelector('#dataTable') as HTMLTableElement;
    if (!tableElement) return;

    tableInstance.value = new DataTablesCore(tableElement, {
      data: data,
      columns: [
        { title: `${titleName}`, data: 'name' },
        { title: '連續未中', data: 'missingStreak' },
        { title: '最近中獎期數', data: 'lastWinPeriod' },
        { title: '總未中次數', data: 'totalMiss' }
      ],
      // 表格配置
      searching: false,
      paging: false,
      ordering: true,
      info: false,
      autoWidth: false,
      scrollCollapse: true,
      destroy: true,
      language: {
        emptyTable: '沒有數據',
        zeroRecords: '沒有找到匹配的數據'
      },
      createdRow: function (row, data, index) {
        // 為行添加類名或處理行樣式
        row.classList.add('custom-row');
      }
    });
  });
};

// 監聽數據變化
watch(
  () => ({
    items: selectStore.items,
    type: selectStore.type,
    numOption: attributeSelectStore.selectedNumOption,
    attribute: attributeSelectStore.selectedAttribute
  }),
  (newVal, oldVal) => {
    const changes = [];
    if (newVal.items !== oldVal.items) changes.push('資料');
    if (newVal.type !== oldVal.type) changes.push('彩種');
    if (newVal.numOption !== oldVal.numOption) changes.push('號碼選項');
    if (newVal.attribute !== oldVal.attribute) changes.push('屬性選項');

    if (newVal.items.length > 0) {
      console.log(`更新表格: ${changes.join('、')}已變更`);
      nextTick(() => processData());
    }
  },
  { deep: true }
);

onMounted(() => {
  selectStore.getHistoryAPIData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (tableInstance.value) {
    tableInstance.value.destroy();
    tableInstance.value = null;
  }
});
</script>

<template>
  <AttributeSelect defaultBgColor="#ffaf55" activeTextColor="#FF5733" activeBorderColor="#ffaf55" />
  <div class="table-responsive">
    <table id="dataTable" class="display" style="width: 100%"></table>
  </div>
</template>

<style scoped>
.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.table-responsive {
  overflow-x: auto;
  width: 100%;
}

/* 自定義表格樣式 */
:deep(.dataTables_wrapper) {
  padding: 0;
}

:deep(table.dataTable) {
  border-collapse: collapse;
  width: 100%;
}

:deep(table.dataTable thead th) {
  background-color: #fff;
  color: #000;
  border: 1px solid #ff8100;
  font-weight: bold;
  text-align: center;
  padding: v-bind(cellPadding);
  font-size: v-bind(axisLabelFontSize);
}

:deep(table.dataTable tbody td) {
  text-align: center;
  padding: v-bind(cellPadding);
  font-size: v-bind(axisLabelFontSize);
}

:deep(.even-row) {
  background-color: #f5f5f5;
}

:deep(.odd-row) {
  background-color: white;
}
</style>
