<script setup lang="ts">
import { debounce } from 'lodash-es';
import { onMounted, watch, ref, nextTick, onBeforeUnmount, computed } from 'vue';
import { useSelectStore } from '@/stores/selectStore';
import { useAttributeStore } from '@/stores/AttributeStore';
import { useAttributeSelectStore } from '@/stores/attributeSelectStore';
import AttributeSelect from '@/components/AttributeSelect.vue';
import { defaultReflect, padZeroPeriod, getLunarYear, xAxisDataFunc, colorMap, padZero } from '@/utility/prize_base_info';
import type { EChartsSeriesParams, NumberTypeForProcessedData } from '@/interface/LineTableInt';
import * as echarts from 'echarts';

// Store 初始化獲取儲存在store的數據
const selectStore = useSelectStore();
const attributeSelectStore = useAttributeSelectStore();
const { getBallColorRGB, getAttributeFor } = useAttributeStore();

// Ref 定義
const chartRef = ref<HTMLDivElement | null>(null);
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

const gridLeft = computed(() => getResponsiveValue('10%', '10%', '20%'));
const axisLabelFontSize = computed(() => getResponsiveValue(12, 12, 15));
const axisLabelRotate = computed(() => getResponsiveValue(45, 45, 0));
const symbolSize = computed(() => getResponsiveValue(25, 25, 30));
const isSmooth = computed(() => getResponsiveValue(true, true, false));

// 計算動態高度
const chartHeight = computed(() => {
  const minHeight = 300;
  const itemsPerPixel = 45;
  const dynamicHeight = selectStore.items.length * itemsPerPixel;
  return Math.max(minHeight, dynamicHeight);
});

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

// 處理數據
const processData = (items: Array<NumberTypeForProcessedData>, hasAttribute: boolean, resultRange: number) => {
  const selectedNumOption = attributeSelectStore.selectedNumOption as keyof Pick<NumberTypeForProcessedData, 'num_1' | 'num_2' | 'num_3' | 'num_4' | 'num_5' | 'num_6' | 'num_7'>;

  // X.Y軸數據、年份期數、球顏色
  const result = {
    processedDataArray: [] as Array<[number | string, number]>,
    yearAndPeriodArr: [] as string[],
    ballColor: [] as string[]
  };

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const num: number = item[selectedNumOption] as number;
    const year: string = item.period_now_year;
    const yearPeriod: string = `${year}
    ${padZeroPeriod(item.period_now)}期`;
    const currentLunarYear: number = getLunarYear(new Date(Number(year), Number(item.period_now_month) - 1, Number(item.period_now_day)));
    const rgb: string = getBallColorRGB(num, resultRange, Number(year));
    result.ballColor.push(colorMap[rgb]);
    result.yearAndPeriodArr.push(yearPeriod);
    const index: number = items.length - 1 - i;
    const dataPoint: [number | string, number] = hasAttribute ? [getAttributeFor(attributeSelectStore.selectedAttribute, num, resultRange, currentLunarYear), index] : [num, index];
    result.processedDataArray.push(dataPoint);
  }
  return result;
};

// 更新圖表
const updateChart = () => {
  if (!chartInstance || !selectStore.items.length) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  try {
    const resultRange: number = Number(defaultReflect[selectStore.type]);
    const filterNumType: string = attributeSelectStore.selectedAttribute?.trim() ? attributeSelectStore.selectedAttribute : 'num';
    const hasAttribute = Boolean(attributeSelectStore.selectedAttribute);
    const xAxisData = xAxisDataFunc(filterNumType, resultRange);
    const typeForXaxis = xAxisData.length > 14 ? 'value' : 'category';
    const xAxisMax = xAxisData.length > 14 ? xAxisData.length : xAxisData.length - 1;
    const { processedDataArray, yearAndPeriodArr, ballColor } = processData(selectStore.items, hasAttribute, resultRange);

    const option = {
      grid: { left: gridLeft.value, top: 40, right: '5%' },
      xAxis: {
        type: typeForXaxis,
        ...(typeForXaxis === 'category' ? { data: xAxisData } : {}),
        position: 'top',
        min: 0,
        max: xAxisMax,
        splitLine: { show: false },
        axisLabel: {
          interval: 0,
          rotate: axisLabelRotate.value,
          fontSize: axisLabelFontSize.value,
          margin: 8,
          color: '#000000'
        }
      },
      yAxis: {
        type: 'category',
        data: yearAndPeriodArr,
        splitLine: { show: false },
        splitArea: { show: true, areaStyle: { color: ['#e6f0fa', '#ffffff'] } },
        axisLabel: {
          fontSize: axisLabelFontSize.value,
          margin: 12,
          interval: 0,
          color: '#000000'
        }
      },
      series: [
        {
          type: 'line',
          symbol: 'circle',
          symbolSize: symbolSize.value,
          data: processedDataArray,
          itemStyle: {
            color: (params: { dataIndex: number }) => ballColor[params.dataIndex] || '#ff1616'
          },
          label: {
            show: true,
            position: 'inside',
            formatter: (params: EChartsSeriesParams) => {
              const value = params.data[0];
              return typeof value === 'number' ? padZero(value) : `${value}`;
            }
          },
          smooth: isSmooth.value
        }
      ]
    };

    chartInstance.setOption(option, true);
    if (chartRef.value) {
      chartRef.value.style.height = `${chartHeight.value}px`;
      chartInstance.resize();
    }
  } catch (error) {
    console.error('Chart update error:', error);
  } finally {
    isLoading.value = false;
  }
};

// 通過延遲執行和重置計時器，減少高頻函數調用的次數
const debouncedUpdate = debounce(updateChart, 200);

const handleResize = () => {
  screenWidth.value = window.innerWidth;
  chartInstance?.resize();
  debouncedUpdate();
};

// 監控與清理
onMounted(async () => {
  initChart();
  selectStore.getHistoryAPIData();
  // 監聽窗口變化
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});

// 監聽數據變化
watch(
  () => [selectStore.items, selectStore.type, attributeSelectStore.selectedNumOption, attributeSelectStore.selectedAttribute],
  () => nextTick(debouncedUpdate),
  { deep: true }
);
</script>

<template>
  <div class="chart-wrapper">
    <AttributeSelect defaultBgColor="#f95e5f" activeTextColor="#f95e5f" activeBorderColor="#f95e5f" />
    <div ref="chartRef" class="chart-container" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  min-height: 400px;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
