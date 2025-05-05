<script setup lang="ts">
import { debounce } from 'lodash-es';
import { onMounted, watch, ref, nextTick, onBeforeUnmount, computed } from 'vue';
import { useSelectStore } from '@/stores/selectStore';
import { useAttributeStore } from '@/stores/AttributeStore';
import { useAttributeSelectStore } from '@/stores/attributeSelectStore';
import AttributeSelect from '@/components/AttributeSelect.vue';
import { defaultReflect, getLunarYear, xAxisDataFunc, padZeroPeriod, padZero } from '@/utility/prize_base_info';
import type { NumberTypeForProcessedData } from '@/interface/LineTableInt';
import * as echarts from 'echarts';

// Store 初始化獲取儲存在store的數據
const selectStore = useSelectStore();
const attributeSelectStore = useAttributeSelectStore();
const { getAttributeFor } = useAttributeStore();

// Ref 定義
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
const screenWidth = ref(window.innerWidth);
const isLoading = ref(true);

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

const gridLeft = computed(() => getResponsiveValue('15%', '15%', '25%'));
const axisLabelFontSize = computed(() => getResponsiveValue(12, 12, 15));

// 初始化圖表
const initChart = () => {
  if (!chartRef.value) return;
  // 判斷是否為移動設備
  const renderer = computed(() => {
    return screenWidth.value < 768 ? 'svg' : 'canvas';
  });
  chartInstance = echarts.init(chartRef.value, null, {
    renderer: renderer.value,
    devicePixelRatio: window.devicePixelRatio
  });
};

/*
 * 處理數據並計算每個屬性的出現頻率與最新期數
 * 參考 countDuplicatesForBar 和 newestPrizePeriodForBar 函數
 */
const processData = (
  items: Array<NumberTypeForProcessedData>,
  hasAttribute: boolean,
  resultRange: number
): {
  xAxisData: Array<number | string>;
  frequencyCounts: number[];
  lastPeriods: string[];
  percentages: string[];
} => {
  const selectedNumOption = attributeSelectStore.selectedNumOption as keyof Pick<NumberTypeForProcessedData, 'num_1' | 'num_2' | 'num_3' | 'num_4' | 'num_5' | 'num_6' | 'num_7'>;
  let xAxisData: Array<number | string>;

  // 根據 hasAttribute 決定 xAxisData 的生成方式
  if (hasAttribute) {
    // 獲取Y軸屬性值
    xAxisData = xAxisDataFunc(attributeSelectStore.selectedAttribute, resultRange);
  } else {
    xAxisData = Array.from({ length: resultRange }, (_, i) => (i + 1 < 10 ? `0${i + 1}` : `${i + 1}`));
  }

  // 初始化頻率和最後期數映射
  const frequencyMap: Record<string | number, number> = {};
  const lastPeriodMap: Record<string | number, string> = {};
  xAxisData.forEach((value) => {
    frequencyMap[value] = 0;
    lastPeriodMap[value] = '';
  });

  // 統計頻率和記錄最後期數
  let processedItems: { attributeValue: string | number; periodString: string }[] = [];

  items.forEach((item) => {
    // 確保數據有效
    if (!item || !item[selectedNumOption]) return;
    const num = item[selectedNumOption] as number;
    const year = item.period_now_year;
    const period = item.period_now;
    const periodStr = `${year} ${padZeroPeriod(period)}`;

    try {
      const currentLunarYear = getLunarYear(new Date(Number(year), Number(item.period_now_month) - 1, Number(item.period_now_day)));

      // 處理值（數字或屬性）
      let valueToCount: number | string = num;
      if (hasAttribute) {
        valueToCount = getAttributeFor(attributeSelectStore.selectedAttribute, num, resultRange, currentLunarYear);
      } else {
        // 確保數字格式為 01-49
        valueToCount = num < 10 ? `0${num}` : `${num}`;
      }

      processedItems.push({
        attributeValue: valueToCount,
        periodString: periodStr
      });

      // 更新頻率
      if (valueToCount in frequencyMap) {
        frequencyMap[valueToCount]++;
      } else {
        frequencyMap[valueToCount] = 1;
      }
    } catch (error) {
      console.error('處理數據時出錯:', error);
    }
  });

  // 為每個屬性找到最近期數
  xAxisData.forEach((value) => {
    for (let i = 0; i < processedItems.length; i++) {
      if (processedItems[i].attributeValue === value) {
        lastPeriodMap[value] = processedItems[i].periodString;
        break; // 找到第一個匹配項即停止（因為數據是按時間順序排列的，最新的在前面）
      }
    }
  });

  // 計算百分比
  const percentages = xAxisData.map((value) => {
    const count = frequencyMap[value] || 0;
    const percentage = items.length > 0 ? (count / items.length) * 100 : 0;
    return `${percentage.toFixed(1)}%`;
  });

  // 提取頻率和最後期數數組（保持原始順序）
  const frequencyCounts = xAxisData.map((value) => frequencyMap[value] || 0);
  const lastPeriods = xAxisData.map((value) => lastPeriodMap[value] || '');

  return {
    xAxisData,
    frequencyCounts,
    lastPeriods,
    percentages
  };
};

// 更新圖表
const updateChart = () => {
  if (!chartInstance || selectStore.items.length === 0 || !chartRef.value) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    const resultRange = Number(defaultReflect[selectStore.type]);
    const hasAttribute = Boolean(attributeSelectStore.selectedAttribute);

    // 處理數據
    const { xAxisData, frequencyCounts, lastPeriods, percentages } = processData(selectStore.items, hasAttribute, resultRange);

    // 確保有數據
    if (xAxisData.length === 0) {
      isLoading.value = false;
      return;
    }

    // 調整圖表大小 - 按照原始JS文件的計算方式
    const chartHeight = Math.max(400, xAxisData.length * 60);
    chartRef.value.style.height = `${chartHeight}px`;

    // 創建空數據數組，用於顯示最後期數
    const emptyArray = Array(xAxisData.length).fill(0);

    // 反轉數據，使其按照從上到下的順序顯示
    const reversedxAxis = [...xAxisData].reverse();
    const reversedFrequency = [...frequencyCounts].reverse();
    const reversedLastPeriods = [...lastPeriods].reverse();
    const reversedPercentages = [...percentages].reverse();

    const option = {
      grid: { left: gridLeft.value, right: '10%' },
      xAxis: {
        type: 'value',
        position: 'top',
        axisLabel: {
          fontSize: axisLabelFontSize.value,
          color: '#000000'
        }
      },
      yAxis: {
        type: 'category',
        data: reversedxAxis,
        axisLabel: {
          color: '#000',
          margin: 8,
          show: true,
          formatter: function (value, index) {
            return `${value}\n${reversedPercentages[index]}`;
          }
        },
        z: 3,
        axisTick: {
          show: false
        },
        nameLocation: 'start'
      },
      series: [
        {
          type: 'bar',
          data: reversedFrequency,
          label: {
            show: true,
            formatter: '{c}次',
            position: 'right',
            distance: 5
          },
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 1,
              x2: 0,
              y2: 0,
              colorStops: [
                {
                  offset: 0,
                  color: '#65CA45'
                },
                {
                  offset: 1,
                  color: '#fff'
                }
              ],
              global: false
            },
            borderRadius: 4
          }
        },
        {
          type: 'bar',
          data: emptyArray,
          itemStyle: {
            color: 'rgba(0, 0, 255, 0)'
          },
          label: {
            show: true,
            formatter: function (params) {
              const periodIndex = reversedLastPeriods[params.dataIndex];
              if (periodIndex) {
                return `最近：${periodIndex}期`;
              } else {
                return '最近：无';
              }
            },
            position: 'right',
            color: '#000',
            offset: [0, 2]
          }
        }
      ]
    };

    chartInstance.setOption(option, true);
    chartInstance.resize(); // 強制重新調整大小
  } catch (error) {
    console.error('Error updating chart:', error);
  } finally {
    isLoading.value = false;
  }
};

// 創建節流版本的更新函數
const debouncedUpdate = debounce(updateChart, 200);

// 處理窗口大小變化
const handleResize = debounce(() => {
  if (chartInstance) {
    chartInstance.resize();
    debouncedUpdate();
  }
}, 200);

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
      nextTick(() => debouncedUpdate());
    }
  },
  { deep: true }
);

// 監聽螢幕寬度變化
watch(screenWidth, () => {
  nextTick(() => debouncedUpdate());
});

// 確保在初始化後和獲取數據後更新圖表
watch(
  () => selectStore.items,
  (items) => {
    if (items.length > 0 && chartInstance) {
      debouncedUpdate();
    }
  },
  { immediate: true }
);

// 設置和清理監聽器
onMounted(() => {
  initChart();
  selectStore.getHistoryAPIData();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <AttributeSelect defaultBgColor="#51C01F" activeTextColor="#51C01F" activeBorderColor="#51C01F" />
  <div ref="chartRef" class="chart-container" />
</template>

<style scoped>
.chart-container {
  width: 100%;
  min-height: 400px;
}
</style>
