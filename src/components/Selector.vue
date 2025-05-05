<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSelectStore } from '@/stores/SelectStore.ts';

const store = useSelectStore();
const { type, year, period, selectOptions } = storeToRefs(store);
const { getTypeAPIData, getYearAPIData, getPeriodAPIData } = store;
</script>

<template>
  <div class="grid grid-cols-3 gap-0 border-solid border border-[#4b5cc4] bg-white">
    <div class="border-r border-[#4b5cc4] text-center relative">
      <el-select v-model="type" :fallback-placements="['bottom-start']" class="bg-white border-none outline-none cursor-pointer">
        <el-option v-for="item in selectOptions.type" :key="item" :label="item.label" :value="item.value" @click="getTypeAPIData(item.value)" />
      </el-select>
    </div>
    <div class="border-r border-[#4b5cc4] text-center px-4">
      <el-select v-model="year" :fallback-placements="['bottom-start']" class="bg-white border-none outline-none cursor-pointer">
        <el-option v-for="item in selectOptions.year" :key="item" :label="item.label" :value="item.value" @click="getYearAPIData(item.value)" />
      </el-select>
    </div>
    <div class="text-center px-1">
      <el-select v-model="period" :fallback-placements="['bottom-start']" class="bg-white border-none outline-none cursor-pointer">
        <el-option v-for="item in selectOptions.period" :key="item" :label="item.label" :value="item.value" @click="getPeriodAPIData(item.value)" />
      </el-select>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-select__wrapper) {
  box-shadow: none !important;
  color: #000000 !important;
  font-weight: 400 !important;
  text-align: center;
  padding: 4px !important;
  gap: 0px !important;
}
:deep(.el-select__wrapper) {
  padding: 4px !important;
  gap: 0px !important;
}
:deep(.el-select__selected-item),
:deep(.el-select__icon) {
  color: #000000 !important;
}
.el-select {
  max-height: 300px;
}
</style>
