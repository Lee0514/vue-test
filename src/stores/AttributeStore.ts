import { defineStore } from 'pinia';
import { ref, toRaw, computed, shallowRef } from 'vue';
import axios from 'axios';
import { currentYear, toData, defaultReflect, padZero } from '@/utility/prize_base_info';
import type { AttributeCategory, AttrData, AttributeHandler } from '@/interface/Attribute';
import { useSelectStore } from '@/stores/SelectStore';

// 定義更精確的型別
type NumType = 49 | 60 | number | string;
type YearType = number | string;
type AttributeValue = string | number;
type AttributeResult = string;

// 使用常量枚舉提升型別安全和性能
enum AttributeTypes {
  Animal = 'animal',
  Wuxin = 'wuxin',
  Color = 'color',
  TenDigit = 'tenDigit',
  OnesDigit = 'onesDigit',
  MergeType = 'mergeType',
  SizeByNumber = 'sizeByNumber',
  IsEven = 'isEven',
  Door = 'door',
  Segment = 'segment',
  ColorAndParity = 'colorAndParity'
}

// 常量定義，Record<AttributeCategory, string>近一步定義TYPE_CODES的類型
const TYPE_CODES: Record<AttributeCategory, string> = {
  波色: '3',
  生肖对应号码: '1',
  五行对照: '2',
  合数单双: '4',
  生肖属性: '5',
  号码属性: '11'
};

// 定義緩存鍵生成器
const getCacheKey = (num: AttributeValue, type: string, numType: NumType, year: YearType): string => `${num}:${type}:${numType}:${year}`;

export const useAttributeStore = defineStore(
  'attribute',
  () => {
    // 數據存儲 - 使用 shallowRef 提升性能
    const attrData = shallowRef<Record<string, AttrData>>({});

    // 緩存儲存 - 優化重複查詢性能
    const attributeCache = new Map<string, string>();
    const numbersCache = new Map<string, string[]>();

    // 增加加載狀態追蹤
    const isLoading = ref(false);
    const loadError = ref<Error | null>(null);
    const selectStore = useSelectStore();

    // 計算已加載的年份
    const loadedYears = computed(() => {
      return new Set(Object.keys(attrData.value).map((key) => parseInt(key.substring(0, 4))));
    });

    const initializeData = async () => {
      isLoading.value = true;
      loadError.value = null;

      try {
        // 確保 selectStore 的歷史數據已加載
        if (!selectStore.items.length) {
          await selectStore.getHistoryAPIData();
        }

        // 從 selectStore.items 中提取唯一年份
        const uniqueYears = Array.from(new Set(selectStore.items.map((item) => Number(item.period_now_year))));

        // 加載所有相關年份的數據
        await loadYearsData(uniqueYears);
      } catch (error) {
        console.error('初始化屬性數據失敗:', error);
        loadError.value = error instanceof Error ? error : new Error('Unknown error');
      } finally {
        isLoading.value = false;
      }
    };

    /**
     * 取得資料並依照 key 儲存
     * 優化：添加加載狀態追蹤和重複加載保護
     */
    const getAttrData = async (year: YearType): Promise<boolean> => {
      const yearNum = Number(year);
      // 如果已經加載過此年份的數據，則跳過
      if (loadedYears.value.has(yearNum)) {
        return true;
      }

      isLoading.value = true;
      loadError.value = null;

      try {
        const keys = [`${yearNum}49`, `${yearNum - 1}60`, `${yearNum - 1}49`, `${yearNum}60`];
        const urls = keys.map((key) => `api`);
        const responses = await Promise.all(urls.map((url) => axios.get(url, { timeout: 10000 })));
        const formattedData = responses.map((response) => JSON.parse(toData(response.data.checkstr, response.data.timestamp)));
        // 使用函數式方法批量更新
        const newAttrData = { ...attrData.value };
        keys.forEach((key, index) => {
          newAttrData[key] = formattedData[index];
        });

        attrData.value = newAttrData;
        clearCache(); // 清除所有緩存，因為數據已更新

        return true;
      } catch (error) {
        console.error('獲取屬性數據失敗:', error instanceof Error ? error.message : error);
        loadError.value = error instanceof Error ? error : new Error('Unknown error');
        return false;
      } finally {
        isLoading.value = false;
      }
    };

    const loadYearsData = async (years: YearType[]): Promise<boolean> => {
      try {
        const results = await Promise.all(years.map(year => getAttrData(year)));
        const allSuccess = results.every(result => result === true);
        return allSuccess;
      } catch (error) {
        return false;
      }
    };

    /**
     * 清除緩存
     */
    const clearCache = (): void => {
      attributeCache.clear();
      numbersCache.clear();
    };
    /**
     * 獲取存儲的數據
     * 優化：添加類型斷言和錯誤處理
     */
    const getStoredData = (numType: NumType, inputYear: YearType = currentYear): AttrData => {
      const year = Number(inputYear);
      const range = String(defaultReflect[String(numType)]);
      const key = `${year}${range}`;
      const data = toRaw(attrData.value[key]);
      return data || {};
    };
    /**
     * 通用屬性查詢函數
     * 優化：添加記憶化和更好的錯誤處理
     */
    const getAttributeByNumber = (num: AttributeValue, attributeType: AttributeCategory, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
      // 生成緩存鍵
      const cacheKey = getCacheKey(num, attributeType, numType, inputYear);

      // 嘗試從緩存獲取結果
      if (attributeCache.has(cacheKey)) {
        return attributeCache.get(cacheKey)!;
      }

      const formattedNum = padZero(num);
      if (!formattedNum) return '';

      const data = getStoredData(numType, inputYear);
      const typeCode = TYPE_CODES[attributeType];

      if (!typeCode || !data[typeCode]) {
        return '';
      }

      // 優化查找邏輯
      let result = '';
      const attributeEntries = Object.entries(data[typeCode]);
      for (let i = 0; i < attributeEntries.length; i++) {
        const [attrName, attr] = attributeEntries[i];
        if (attr.type === attributeType) {
          const numbers = attr.content1.split(',');
          if (numbers.includes(formattedNum)) {
            result = attr.name;
            break;
          }
        }
      }

      // 存入緩存
      attributeCache.set(cacheKey, result);
      return result;
    };
    // 顏色相關函數
    const getColorAttribute = (numStr: AttributeValue, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
      if (Number(inputYear) > currentYear) return '红';

      const cacheKey = getCacheKey(numStr, 'color', numType, inputYear);
      if (attributeCache.has(cacheKey)) {
        return attributeCache.get(cacheKey)!;
      }

      const result = getAttributeByNumber(numStr, '波色', numType, inputYear) || '红';
      attributeCache.set(cacheKey, result);
      return result;
    };

    const getBallColor = getColorAttribute;

    const getBallColorRGB = getColorAttribute; // 與 getColorAttribute 相同

    const isMatchingColor = (numStr: AttributeValue, color: string, numType: NumType = 49, inputYear: YearType = currentYear): boolean => {
      return getColorAttribute(numStr, numType, inputYear) === color;
    };

    const getNumbersByColor = (color: string, numType: NumType = 49, inputYear: YearType = currentYear): string[] => {
      const cacheKey = `numbers:${color}:${numType}:${inputYear}`;

      if (numbersCache.has(cacheKey)) {
        return [...numbersCache.get(cacheKey)!]; // 返回副本以避免修改緩存
      }

      const data = getStoredData(numType, inputYear);
      const typeCode = '3'; // 波色的 type_code

      let result: string[] = [];
      if (data[typeCode]?.[color]) {
        result = data[typeCode][color].content1.split(',');
        numbersCache.set(cacheKey, [...result]); // 存入緩存
      }

      return result;
    };

    // ===== 生肖相關函數 =====
    const getZodiacAttribute = (numStr: AttributeValue, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
      const cacheKey = getCacheKey(numStr, 'zodiac', numType, inputYear);

      if (attributeCache.has(cacheKey)) {
        return attributeCache.get(cacheKey)!;
      }

      const result = getAttributeByNumber(numStr, '生肖对应号码', numType, inputYear) || '鼠';
      attributeCache.set(cacheKey, result);
      return result;
    };

    const getZodiacPairAttribute = (zodiac: string, numType: NumType = 49, inputYear: YearType = currentYear): string => {
      const cacheKey = `pair:${zodiac}:${numType}:${inputYear}`;

      if (attributeCache.has(cacheKey)) {
        return attributeCache.get(cacheKey)!;
      }

      const data = getStoredData(numType, inputYear);
      const typeCode = '1';
      const zodiacName = zodiac.replace('肖', '');

      let result = '';
      if (data[typeCode]?.[zodiacName]) {
        result = data[typeCode][zodiacName].content1;
        attributeCache.set(cacheKey, result);
      }

      return result;
    };

    const isMatchingZodiac = (numStr: AttributeValue, zodiac: string, numType: NumType = 49, inputYear: YearType = currentYear): boolean => {
      const actualZodiac = getZodiacAttribute(numStr, numType, inputYear).replace('肖', '');
      return actualZodiac === zodiac;
    };

    const getNumbersByZodiac = (zodiac: string, numType: NumType = 49, inputYear: YearType = currentYear): string[] => {
      const cacheKey = `numbers:zodiac:${zodiac}:${numType}:${inputYear}`;

      if (numbersCache.has(cacheKey)) {
        return [...numbersCache.get(cacheKey)!]; // 返回副本以避免修改緩存
      }

      const data = getStoredData(numType, inputYear);
      const typeCode = '1';
      const zodiacName = zodiac.replace('肖', '');

      let result: string[] = [];
      if (data[typeCode]?.[zodiacName]) {
        result = data[typeCode][zodiacName].content1.split(',');
        numbersCache.set(cacheKey, [...result]); // 存入緩存
      }

      return result;
    };

    // ===== 其他屬性函數 =====
    // 使用工廠函數創建有記憶功能的屬性getter
    const createCachedAttributeGetter = (attrType: AttributeCategory, defaultValue: string) => {
      return (numStr: AttributeValue, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
        const cacheKey = getCacheKey(numStr, attrType, numType, inputYear);

        if (attributeCache.has(cacheKey)) {
          return attributeCache.get(cacheKey)!;
        }

        const result = getAttributeByNumber(numStr, attrType, numType, inputYear) || defaultValue;
        attributeCache.set(cacheKey, result);
        return result;
      };
    };

    // 使用工廠函數創建有記憶功能的屬性getter
    const getElementAttribute = createCachedAttributeGetter('五行对照', '金');
    const getSumParityAttribute = createCachedAttributeGetter('合数单双', '合数单');

    // ===== 数字特性函數 =====
    // 不需要API數據的純函數，更高效
    const getNumberSizeAttribute = (numStr: AttributeValue, numType: NumType = 49): AttributeResult => {
      const num = Number(numStr);
      if (isNaN(num) || num < 1) return '小';

      const midPoint = numType === 49 ? 25 : 31;
      return num >= midPoint ? '大' : '小';
    };

    const getParityAttribute = (numStr: AttributeValue): AttributeResult => {
      const num = Number(numStr);
      if (isNaN(num) || num < 1) return '单';
      return num % 2 === 0 ? '双' : '单';
    };

    const getTensDigit = (numStr: AttributeValue): number | null => {
      const num = Number(numStr);
      if (isNaN(num) || num < 1) return null;
      return Math.floor(num / 10);
    };

    const getOnesDigit = (numStr: AttributeValue): number | null => {
      const num = Number(numStr);
      if (isNaN(num) || num < 1) return null;
      return num % 10;
    };

    // ===== 複合屬性函數 =====
    // 優化: 使用記憶化改進複合屬性函數
    const getDoorAttribute = (numStr: AttributeValue, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
      const cacheKey = getCacheKey(numStr, 'door', numType, inputYear);

      if (attributeCache.has(cacheKey)) {
        return attributeCache.get(cacheKey)!;
      }

      const data = getStoredData(numType, inputYear);
      const typeCode = '11';
      const formattedNum = padZero(numStr);

      if (!formattedNum || !data[typeCode]) {
        const defaultResult = '1门';
        attributeCache.set(cacheKey, defaultResult);
        return defaultResult;
      }

      // 優化查找邏輯
      let result = '1门';
      const entries = Object.entries(data[typeCode]);
      for (let i = 0; i < entries.length; i++) {
        const [attrName, attr] = entries[i];
        if (attrName.includes('门')) {
          const numbers = attr.content1.split(',');
          if (numbers.includes(formattedNum)) {
            result = attr.name;
            break;
          }
        }
      }

      attributeCache.set(cacheKey, result);
      return result;
    };

    const getSegmentAttribute = (numStr: AttributeValue, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
      const cacheKey = getCacheKey(numStr, 'segment', numType, inputYear);

      if (attributeCache.has(cacheKey)) {
        return attributeCache.get(cacheKey)!;
      }

      const data = getStoredData(numType, inputYear);
      const typeCode = '11';
      const formattedNum = padZero(numStr);

      if (!formattedNum || !data[typeCode]) {
        const defaultResult = '1段';
        attributeCache.set(cacheKey, defaultResult);
        return defaultResult;
      }

      const segPrefix = numType === 49 ? '7段' : '10段';

      let result = '1段';
      const entries = Object.entries(data[typeCode]);
      for (let i = 0; i < entries.length; i++) {
        const [attrName, attr] = entries[i];
        if (attrName.startsWith(segPrefix)) {
          const numbers = attr.content1.split(',');
          if (numbers.includes(formattedNum)) {
            result = `${attr.name.substring(segPrefix.length)}段`;
            break;
          }
        }
      }

      attributeCache.set(cacheKey, result);
      return result;
    };

    const getColorParityAttribute = (numStr: AttributeValue, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
      const cacheKey = getCacheKey(numStr, 'colorParity', numType, inputYear);

      if (attributeCache.has(cacheKey)) {
        return attributeCache.get(cacheKey)!;
      }

      const data = getStoredData(numType, inputYear);
      const typeCode = '11';
      const formattedNum = padZero(numStr);

      if (!formattedNum || !data[typeCode]) {
        const defaultResult = '红单';
        attributeCache.set(cacheKey, defaultResult);
        return defaultResult;
      }

      const color = getColorAttribute(numStr, numType, inputYear);
      const parity = getParityAttribute(numStr);
      const colorParityName = color + parity;

      let result = '红单';
      const entries = Object.entries(data[typeCode]);
      for (let i = 0; i < entries.length; i++) {
        const [attrName, attr] = entries[i];
        if (attrName === colorParityName) {
          const numbers = attr.content1.split(',');
          if (numbers.includes(formattedNum)) {
            result = attr.name;
            break;
          }
        }
      }

      attributeCache.set(cacheKey, result);
      return result;
    };

    const getSumValueAttribute = (numStr: AttributeValue, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
      const cacheKey = getCacheKey(numStr, 'sumValue', numType, inputYear);

      if (attributeCache.has(cacheKey)) {
        return attributeCache.get(cacheKey)!;
      }

      const data = getStoredData(numType, inputYear);
      const typeCode = '11';
      const formattedNum = padZero(numStr);

      if (!formattedNum || !data[typeCode]) {
        const defaultResult = '01合';
        attributeCache.set(cacheKey, defaultResult);
        return defaultResult;
      }

      let result = '01合';
      const entries = Object.entries(data[typeCode]);
      for (let i = 0; i < entries.length; i++) {
        const [attrName, attr] = entries[i];
        if (attrName.includes('合') && !attrName.includes('合数') && !attrName.includes('合尾')) {
          const numbers = attr.content1.split(',');
          if (numbers.includes(formattedNum)) {
            result = attr.name;
            break;
          }
        }
      }

      attributeCache.set(cacheKey, result);
      return result;
    };

    // 統一接口
    // 改用 Map 提高查找性能，並使用函數型別提高安全性
    const attributeHandlers = new Map<string, AttributeHandler>([
      [AttributeTypes.Animal, getZodiacAttribute],
      [AttributeTypes.Wuxin, getElementAttribute],
      [AttributeTypes.Color, getColorAttribute],
      [AttributeTypes.TenDigit, (n: AttributeValue) => `${getTensDigit(n)}头`],
      [AttributeTypes.OnesDigit, (n: AttributeValue) => `${getOnesDigit(n)}尾`],
      [AttributeTypes.MergeType, getSumValueAttribute],
      [AttributeTypes.SizeByNumber, getNumberSizeAttribute],
      [AttributeTypes.IsEven, getParityAttribute],
      [AttributeTypes.Door, getDoorAttribute],
      [AttributeTypes.Segment, getSegmentAttribute],
      [AttributeTypes.ColorAndParity, getColorParityAttribute]
    ]);

    const getAttributeFor = (attributeType: string, numStr: AttributeValue, numType: NumType = 49, inputYear: YearType = currentYear): AttributeResult => {
      const handler = attributeHandlers.get(attributeType);
      return handler ? handler(numStr, numType, inputYear) : '未知';
    };
    initializeData();
    return {
      // 數據管理
      getAttrData,
      loadYearsData,
      clearCache,
      isLoading: computed(() => isLoading.value),
      loadError: computed(() => loadError.value),
      loadedYears,

      // 統一接口
      getAttributeFor,
      getAttributeByNumber,

      // 屬性函數
      getColorAttribute,
      getZodiacAttribute,
      getZodiacPairAttribute,
      getElementAttribute,
      getSumParityAttribute,
      getNumberSizeAttribute,
      getParityAttribute,
      getDoorAttribute,
      getSegmentAttribute,
      getColorParityAttribute,
      getSumValueAttribute,

      // 號碼匹配函數
      isMatchingColor,
      isMatchingZodiac,
      getNumbersByZodiac,
      getNumbersByColor,

      // 實用函數
      getBallColor,
      getBallColorRGB,
      getTensDigit,
      getOnesDigit,
      padZero
    };
  },
  {
    persist: true
  }
);
