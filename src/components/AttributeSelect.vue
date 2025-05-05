<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAttributeSelectStore } from '@/stores/attributeSelectStore';
import { useAttributeStore } from '@/stores/AttributeStore';
import { defaultReflect } from '@/utility/prize_base_info';

// 定義屬性和數字選項的類型
interface SelectOption {
  value: string;
  label: string;
}

// 使用類型聲明式 props
interface AttributeSelectProps {
  defaultBgColor?: string;
  defaultTextColor?: string;
  activeBgColor?: string;
  activeTextColor?: string;
  activeBorderColor?: string;
}

// 定義枚舉來增強類型安全
enum AttributeType {
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

// 使用 withDefaults 設置默認值
const props = withDefaults(defineProps<AttributeSelectProps>(), {
  defaultBgColor: '#FF4500',
  defaultTextColor: '#FFFFFF',
  activeBgColor: '#FFFFFF',
  activeTextColor: '#FF4500',
  activeBorderColor: '#FF4500'
});

// 獲取 store 並聲明適當的類型
const attributeStore = useAttributeSelectStore();
const selectStore = useAttributeStore();

const numberOptions: SelectOption[] = [
  { value: 'num_7', label: '特码' },
  { value: 'num_1', label: '平一' },
  { value: 'num_2', label: '平二' },
  { value: 'num_3', label: '平三' },
  { value: 'num_4', label: '平四' },
  { value: 'num_5', label: '平五' },
  { value: 'num_6', label: '平六' }
];

// 計算屬性 - 根據彩種類型動態生成屬性選項
const attributeOptions = computed<SelectOption[]>(() => {
  const is60Mode = defaultReflect[selectStore.type] === '60';

  return [
    { value: AttributeType.Animal, label: '生肖' },
    { value: AttributeType.Wuxin, label: '五行' },
    { value: AttributeType.Color, label: '波色' },
    { value: AttributeType.TenDigit, label: '头数' },
    { value: AttributeType.OnesDigit, label: '尾数' },
    { value: AttributeType.MergeType, label: '合数' },
    { value: AttributeType.SizeByNumber, label: '大小' },
    { value: AttributeType.IsEven, label: '单双' },
    { value: AttributeType.Door, label: is60Mode ? '六门' : '五门' },
    { value: AttributeType.Segment, label: is60Mode ? '十段' : '七段' },
    { value: AttributeType.ColorAndParity, label: '半波' }
  ];
});

const firstRowOptions = computed<SelectOption[]>(() => attributeOptions.value.slice(0, 5));
const secondRowOptions = computed<SelectOption[]>(() => attributeOptions.value.slice(5));

// 檢查選項是否被選中 - 使用箭頭函數簡化
const isAttributeSelected = (value: string): boolean => attributeStore.isAttributeSelected(value);

// 處理屬性選擇 - 使用類型安全的參數
const handleAttributeSelect = (value: string): void => {
  attributeStore.selectAttribute(value);
};

// 處理數字選項選擇
const handleNumOptionSelect = (value: string): void => {
  attributeStore.selectNumOption(value);
};

// 使用 ref 來追蹤懸停狀態 (增強互動性)
const hoveredItem = ref<string | null>(null);

// 設置和清除懸停狀態
const setHoveredItem = (value: string): void => {
  hoveredItem.value = value;
};
const clearHoveredItem = (): void => {
  hoveredItem.value = null;
};
</script>

<template>
  <div class="flex flex-col gap-1 p-1 bg-white">
    <div class="flex flex-row items-center justify-between">
      <div class="w-1/11 px-0.5 width">
        <el-select v-model="attributeStore.selectedNumOption" class="text-center cursor-pointer" placeholder="請選擇" size="default" @change="handleNumOptionSelect">
          <el-option v-for="option in numberOptions" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
      </div>

      <div
        v-for="option in firstRowOptions"
        :key="option.value"
        class="flex items-center justify-center px-0.5 cursor-pointer width"
        :class="{
          selected: isAttributeSelected(option.value),
          hovered: hoveredItem === option.value
        }"
        @click="handleAttributeSelect(option.value)"
        @mouseenter="setHoveredItem(option.value)"
        @mouseleave="clearHoveredItem"
      >
        <div
          :class="`w-full text-center text-white px-0.5`"
          :data-value="option.value"
          :style="{
            backgroundColor: isAttributeSelected(option.value) ? props.activeBgColor : props.defaultBgColor,
            color: isAttributeSelected(option.value) ? props.activeTextColor : props.defaultTextColor,
            border: isAttributeSelected(option.value) ? `1px solid ${props.activeBorderColor}` : 'none'
          }"
        >
          {{ option.label }}
        </div>
      </div>
    </div>

    <div class="flex flex-row items-center justify-between">
      <div
        v-for="option in secondRowOptions"
        :key="option.value"
        class="flex items-center justify-center px-0.5 cursor-pointer width"
        :class="{
          selected: isAttributeSelected(option.value),
          hovered: hoveredItem === option.value
        }"
        @click="handleAttributeSelect(option.value)"
        @mouseenter="setHoveredItem(option.value)"
        @mouseleave="clearHoveredItem"
      >
        <div
          :class="`w-full text-center text-white`"
          :data-value="option.value"
          :style="{
            backgroundColor: isAttributeSelected(option.value) ? props.activeBgColor : props.defaultBgColor,
            color: isAttributeSelected(option.value) ? props.activeTextColor : props.defaultTextColor,
            border: `1px solid ${isAttributeSelected(option.value) ? props.activeBorderColor : 'transparent'}`
          }"
        >
          {{ option.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.option {
  box-sizing: border-box;
}
.width {
  width: 30%;
}
:deep(.el-select__wrapper) {
  box-shadow: 0 0 0 1px #000000 inset !important;
  border-radius: 0.5;
  color: #000000 !important;
  font-weight: 400 !important;
  min-height: 1.55rem !important;
  padding: 4px !important;
  gap: 0px !important;
}
:deep(.el-select__selected-item),
:deep(.el-select__icon) {
  color: #000000 !important;
}
</style>
