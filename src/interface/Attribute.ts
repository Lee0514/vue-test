// 定義更清晰的類型
export interface AttributeItem {
  id: number;
  number_type: string;
  year: number;
  type: string;
  type_code: number;
  name: string;
  content1: string;
  content2: string;
}

export type AttributeCategory = '波色' | '生肖对应号码' | '五行对照' | '合数单双' | '生肖属性' | '号码属性';
export type ColorType = '红' | '绿' | '蓝';
export type AttributeMap = Record<string, string>;

interface SingleAttrData {
  id: number;
  number_type: string;
  year: number;
  type: string;
  type_code: number;
  name: string;
  content1: string;
  content2: string;
}

export interface AttrData {
  [key: string]: {
    [key: string]: SingleAttrData;
  };
}

// 可複用的基本型別
export type NumType = 49 | 60 | number | string;
export type YearType = number | string;
export type AttributeValue = string | number;
export type AttributeResult = string;

// 屬性處理器函數型別
export type AttributeHandler = (numStr: AttributeValue, numType?: NumType, inputYear?: YearType) => AttributeResult;
