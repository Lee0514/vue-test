<script setup lang="ts">
import { ArrowLeft, HomeFilled } from '@element-plus/icons-vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// https://cdn.cdnwss.com/xiniupublic/newBM/baomaqgxg/navImage/nav0.webp
const kindItems = [
  {
    id: 'history',
    path: '/',
    icon: '/src/assets/nav0.webp',
    text: '历史记录'
  },
  {
    id: 'lineChart',
    path: '/LineChart',
    icon: '/src/assets/nav1.webp',
    text: '走势图表'
  },
  {
    id: 'barChart',
    path: '/BarChart',
    icon: '/src/assets/nav2.webp',
    text: '开奖统计'
  },
  {
    id: 'tableChart',
    path: '/TableChart',
    icon: '/src/assets/nav3.webp',
    text: '遗漏统计'
  }
];

// 返回上一頁
const goBack = () => {
  router.back();
};

// 前往首頁
const goHome = () => {
  router.push('/');
};

const isActive = (path: string) => {
  return route.path === path;
};
</script>

<template>
  <div class="header">
    <div class="bg-[#4b5cc4] p-4 text-white flex items-center">
      <el-icon :size="28" @click="goBack" class="flex items-center cursor-pointer">
        <ArrowLeft />
      </el-icon>
      <div class="flex-1 flex justify-center text-xl">
        <h1 class="font-bold">历史记录</h1>
      </div>
      <el-icon :size="28" @click="goHome" class="flex items-center cursor-pointer">
        <HomeFilled />
      </el-icon>
    </div>
  </div>
  <div class="kind flex items-center justify-around py-2">
    <router-link v-for="item in kindItems" :key="item.id" :to="item.path" class="flex flex-col items-center cursor-pointer p-2" :class="{ '': isActive(item.path) }">
      <img :src="item.icon" alt="nav icon" class="w-12 h-12 rounded-full object-cover" />
      <span class="mt-1 text-sm" :class="{ 'text-[#ff5f2e] border-b border-b-[#ff5f2e]': isActive(item.path) }">{{ item.text }}</span>
    </router-link>
  </div>
</template>

<style scoped>
a {
  text-decoration: none !important;
}
</style>
