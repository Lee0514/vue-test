/**
 * ECharts 系列數據點參數類型
 */
export interface EChartsSeriesParams {
  // 組件類型相關
  componentType: 'series';
  componentSubType: 'line' | 'bar' | 'scatter' | 'pie' | 'candlestick' | string;
  componentIndex: number;

  // 系列相關
  seriesType: 'line' | 'bar' | 'scatter' | 'pie' | 'candlestick' | string;
  seriesIndex: number;
  seriesId: string;
  seriesName: string;

  // 數據點相關
  name: string;
  dataIndex: number;
  data: number[]; // 可以根據您的實際數據結構更精確地定義
  dataType: string | null;
  value: number[]; // 數據點的值，通常是坐標值 [x, y]
  color: string; // 點的顏色

  // 維度相關
  dimensionNames: string[]; // 維度名稱
  encode: {
    x: number[];
    y: number[];
    [key: string]: number[]; // 其他可能的編碼
  };

  // 其他
  $vars: string[]; // 可用的變數名稱
  status: 'normal' | 'emphasis' | 'selected' | 'blur'; // 數據點狀態
}

//  Define Type for Data Number
export interface NumberTypeForProcessedData {
  num_1: number;
  num_2: number;
  num_3: number;
  num_4: number;
  num_5: number;
  num_6: number;
  num_7: number;

  // 期數相關屬性
  period_now: string; // 當前期數
  period_now_year: string; // 年份
  period_now_month: string; // 月份
  period_now_day: string; // 日期
}
