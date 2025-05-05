import { defineStore } from 'pinia';
import axios from 'axios';
import { ref } from 'vue';
import { toData } from '@/utility/prize_base_info';

interface SelectOption {
  label: string;
  value: string;
};

interface DataValue {
  id: string;
  num_1: number;
  num_2: number;
  num_3: number;
  num_4: number;
  num_5: number;
  num_6: number;
  num_7: number;
  number_attr_1: { [key: string]: string };
  number_attr_2: { [key: string]: string };
  number_attr_3: { [key: string]: string };
  number_attr_4: { [key: string]: string };
  number_attr_5: { [key: string]: string };
  number_attr_6: { [key: string]: string };
  number_attr_7: { [key: string]: string };
  period_now_year: string;
  period_now_month: string;
  period_now_day: string;
  period_now_hour?: string;
  period_now: string;
};

// 今年年份
const nowYear: number = new Date().getFullYear();
// 建立今年份與去年份
const yearOptions: SelectOption[] = [
  { label: String(nowYear), value: String(nowYear) },
  { label: String(nowYear - 1), value: String(nowYear - 1) }
];

export const useSelectStore = defineStore(
  'select',
  () => {
    const items = ref<Array<DataValue>>([]);
    const type = ref<string>('1');
    const year = ref<string>(String(nowYear));
    const period = ref<string>('50');

    const selectOptions = ref({
      type: [
        { label: '澳門六合彩', value: '1' },
        { label: '澳門六十彩', value: '3' },
        { label: '香港六合彩', value: '2' },
        { label: '香港六十彩', value: '4' }
      ] as SelectOption[],
      year: yearOptions as SelectOption[],
      period: [
        { label: '最新50期', value: '50' },
        { label: '最新100期', value: '100' },
        { label: '最新150期', value: '150' },
        { label: '最新200期', value: '200' },
        { label: '全年', value: '366' }
      ] as SelectOption[]
    });

    const getHistoryAPIData = async () => {
      try {
        const response = await axios.get(`api`);
        const data = await response.data;
        const reMapData = JSON.parse(toData(data.checkstr, data.timestamp))
          .map((da: DataValue) => ({
            id: da.id,
            num_1: da.num_1,
            num_2: da.num_2,
            num_3: da.num_3,
            num_4: da.num_4,
            num_5: da.num_5,
            num_6: da.num_6,
            num_7: da.num_7,
            number_attr_1: da.number_attr_1,
            number_attr_2: da.number_attr_2,
            number_attr_3: da.number_attr_3,
            number_attr_4: da.number_attr_4,
            number_attr_5: da.number_attr_5,
            number_attr_6: da.number_attr_6,
            number_attr_7: da.number_attr_7,
            period_now_year: da.period_now_year,
            period_now_month: da.period_now_month,
            period_now_day: da.period_now_day,
            period_now_hour: da.period_now_hour,
            period_now: da.period_now
          }))
          .reverse()
          .slice(0, period.value);
        items.value = reMapData;
      } catch (error) {
        console.error('API 請求失敗:', error);
      }
    };
    const getYearAPIData = async (item: string) => {
      year.value = item;
      await getHistoryAPIData();
    };
    const getPeriodAPIData = async (item: string) => {
      period.value = item;
      await getHistoryAPIData();
    };
    const getTypeAPIData = async (item: string) => {
      type.value = item;
      await getHistoryAPIData();
    };

    return { items, type, year, period, selectOptions, getHistoryAPIData, getYearAPIData, getPeriodAPIData, getTypeAPIData };
  },
  {
    persist: true
  }
);
