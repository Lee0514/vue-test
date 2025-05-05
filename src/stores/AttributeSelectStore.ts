import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 狀態管理器
export const useAttributeSelectStore = defineStore('attributeSelect', () => {
  // State 獲取初始狀態
  const selectedNumOption = ref('num_7'); // 默認為特碼
  const selectedAttribute = ref(''); // 默認為空
  const lastSelectedTime = ref(0); // 最後選擇時間

  // Getters 獲取最新的值
  const currentNumOption = computed(() => selectedNumOption.value);
  const currentAttribute = computed(() => selectedAttribute.value);
  const getLastSelectedTime = computed(() => lastSelectedTime.value);

  // 函數式 Getters 檢查該值得狀態是否被選中
  const isAttributeSelected = (attribute: string) => selectedAttribute.value === attribute;
  const isNumOptionSelected = (option: string) => selectedNumOption.value === option;

  // Actions
  // 下拉選單特碼、平碼...
  const selectNumOption = (option: string) => {
    selectedNumOption.value = option;
    lastSelectedTime.value = Date.now();
  };

  // 選擇屬性
  const selectAttribute = (attribute: string) => {
    if (selectedAttribute.value === attribute) {
      selectedAttribute.value = '';
    } else {
      selectedAttribute.value = attribute;
    }
    lastSelectedTime.value = Date.now();
  };

  // 重置選擇
  const resetSelections = () => {
    selectedNumOption.value = 'num_7';
    selectedAttribute.value = '';
    lastSelectedTime.value = Date.now();
  };

  // 返回所有狀態和方法
  return {
    // State
    selectedNumOption,
    selectedAttribute,
    lastSelectedTime,

    // Getters
    currentNumOption,
    currentAttribute,
    isAttributeSelected,
    isNumOptionSelected,
    getLastSelectedTime,

    // Actions
    selectNumOption,
    selectAttribute,
    resetSelections
  };
});
