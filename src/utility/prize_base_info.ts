const currentYear: number = new Date().getFullYear();
const defaultReflect: { [key: string | number]: string } = {
  1: '49',
  3: '60',
  2: '49',
  4: '60',
  '49': '49',
  '60': '60'
};
// 輸入任意值，如果是數字或是數字字串，則個位數補零。
const padZero = (input: number | string) => (isNaN(Number(input)) ? null : String(input).padStart(2, '0'));
const padZeroPeriod = (input: number | string) => (isNaN(Number(input)) ? null : String(input).padStart(3, '0'));

const toData = (str: string, time: number) => {
  const numStr: string = time.toString();
  if (numStr.length < 7) return {};
  const num: number = parseInt(numStr.substring(0, 7));
  let result = '';
  for (let i = 0; i < str.length; i += 7) {
    const ascii = parseInt(str.substring(i, i + 7), 10);
    const char = String.fromCharCode(ascii - num);
    result += char;
  }
  return result;
};

interface ColorMap {
  [key: string]: string; // 索引簽名，允許動態鍵
}

// 定義顏色映射
const colorMap: ColorMap = {
  红: 'red',
  绿: 'green',
  蓝: 'blue'
};

// 函數加上輸入和返回型別
const getColorArr = (data: string): string => {
  // 從映射中獲取結果
  const result = colorMap[data];

  // 如果結果不存在，打印警告
  if (!result) {
    console.warn(`顏色未定義: ${data}`);
  }

  // 返回結果，若無則返回空字串
  return result || '';
};

/**
 * 取得公曆日期對應的農曆年份
 * @param date 輸入日期，可以是Date物件或字符串(YYYY/MM/DD或YYYY-MM-DD)
 * @returns 對應的農曆年份
 *
 * // 2024/1/1 在 2024年春節(2月10日)之前，所以屬於農曆2023年
 * console.log(getLunarYear('2024/1/1')); // 輸出: 2023
 * // 2024/3/5 在 2024年春節(2月10日)之後，所以屬於農曆2024年
 * console.log(getLunarYear('2024/3/5')); // 輸出: 2024
 * // 也支持Date物件
 * console.log(getLunarYear(new Date(2024, 0, 1))); // 輸出: 2023
 */
const getLunarYear = (date: Date | string): number => {
  // 將傳入的字符串轉換成Date物件
  const inputDate = typeof date === 'string' ? new Date(date.replace(/\//g, '-')) : new Date(date);

  // 獲取公曆年份
  const solarYear = inputDate.getFullYear();

  // 農曆春節日期映射表 (2022-2035年)
  // 格式: {年份: [月, 日]}
  const chineseNewYearDates: { [key: number]: [number, number] } = {
    2024: [2, 10], // 2024年2月10日是農曆2024年春節
    2025: [1, 29], // 2025年1月29日是農曆2025年春節
    2026: [2, 17], // 2026年2月17日是農曆2026年春節
    2027: [2, 6],
    2028: [1, 26],
    2029: [2, 13],
    2030: [2, 3],
    2031: [1, 23],
    2032: [2, 11],
    2033: [1, 31],
    2034: [2, 19],
    2035: [2, 8],
    2036: [1, 28]
  };

  // 默認情況下，如果日期超出查詢表範圍，我們假設春節在2月1日
  const [nyMonth, nyDay] = chineseNewYearDates[solarYear] || [2, 1];

  // 建立當年農曆新年的Date物件
  const newYearDate = new Date(solarYear, nyMonth - 1, nyDay);

  // 如果輸入日期在春節前，則屬於前一個農曆年
  if (inputDate < newYearDate) {
    return solarYear - 1;
  }

  // 否則屬於當年農曆年
  return solarYear;
};

const xAxisDataFunc = (filterNumType: string, resultRange: number) => {
  const padZeroArr = Array.from({ length: resultRange }, (_, i) => (i + 1).toString().padStart(2, '0'));

  switch (filterNumType) {
    case 'num':
      return padZeroArr;
    case 'animal':
      return ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

    case 'wuxin':
      return ['金', '木', '水', '火', '土'];

    case 'color':
      return ['红', '绿', '蓝'];

    case 'tenDigit':
      if (resultRange === 49) {
        return ['0头', '1头', '2头', '3头', '4头'];
      } else {
        return ['0头', '1头', '2头', '3头', '4头', '5头', '6头'];
      }

    case 'onesDigit':
      return ['0尾', '1尾', '2尾', '3尾', '4尾', '5尾', '6尾', '7尾', '8尾', '9尾'];

    case 'mergeType':
      if (resultRange === 49) {
        return ['01合', '02合', '03合', '04合', '05合', '06合', '07合', '08合', '09合', '10合', '11合', '12合', '13合'];
      } else {
        return ['01合', '02合', '03合', '04合', '05合', '06合', '07合', '08合', '09合', '10合', '11合', '12合', '13合', '14合'];
      }

    case 'sizeByNumber':
      return ['大', '小'];
    case 'isEven':
      return ['单', '双'];
    case 'door':
      if (resultRange === 49) {
        return ['1门', '2门', '3门', '4门', '5门'];
      } else {
        return ['1门', '2门', '3门', '4门', '5门', '6门'];
      }

    case 'segment':
      if (resultRange === 49) {
        return ['1段', '2段', '3段', '4段', '5段', '6段', '7段'];
      } else {
        return ['1段', '2段', '3段', '4段', '5段', '6段', '7段', '8段', '9段', '10段'];
      }

    case 'colorAndParity':
      return ['红单', '红双', '绿单', '绿双', '蓝单', '蓝双'];

    default:
      return padZeroArr;
  }
};

const getColorClass = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    红: 'red',
    绿: 'green',
    蓝: 'blue'
  };
  return colorMap[colorName] || 'red';
};

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

// 常量定義 - 使用 as const 提升型別安全
const TYPE_CODES = {
  波色: '3',
  生肖对应号码: '1',
  五行对照: '2',
  合数单双: '4',
  生肖属性: '5',
  号码属性: '11'
} as const;

const tableTitleName: { [key: string]: string } = {
  animal: '生肖',
  wuxin: '五行',
  color: '波色',
  tenDigit: '头数',
  onesDigit: '尾数',
  mergeType: '合数',
  sizeByNumber: '大小',
  isEven: '单双',
  door: '五门',
  segment: '七段',
  colorAndParity: '半波'
};

export { currentYear, defaultReflect, padZero, padZeroPeriod, toData, getColorArr, getLunarYear, colorMap, xAxisDataFunc, getColorClass, TYPE_CODES, AttributeTypes, tableTitleName };
