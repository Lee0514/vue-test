<script setup lang="ts">
import { useSelectStore } from '@/stores/SelectStore.ts';
import { padZero, getColorArr } from '@/utility/prize_base_info.ts';
import { onMounted, computed } from 'vue';

const selectStore = useSelectStore();
const { getHistoryAPIData } = useSelectStore();

const numbers = computed(() => {
  return selectStore.items.map((item) => {
    return {
      id: item.id,
      period: `${item.period_now_year}-${item.period_now_month}-${item.period_now_day}`,
      periodNum: padZero(item.period_now),
      balls: [
        { num: item.num_1, attr: item.number_attr_1, color: item.number_attr_1[3], animal: item.number_attr_1[1], wuxin: item.number_attr_1[2] },
        { num: item.num_2, attr: item.number_attr_2, color: item.number_attr_2[3], animal: item.number_attr_2[1], wuxin: item.number_attr_2[2] },
        { num: item.num_3, attr: item.number_attr_3, color: item.number_attr_3[3], animal: item.number_attr_3[1], wuxin: item.number_attr_3[2] },
        { num: item.num_4, attr: item.number_attr_4, color: item.number_attr_4[3], animal: item.number_attr_4[1], wuxin: item.number_attr_4[2] },
        { num: item.num_5, attr: item.number_attr_5, color: item.number_attr_5[3], animal: item.number_attr_5[1], wuxin: item.number_attr_5[2] },
        { num: item.num_6, attr: item.number_attr_6, color: item.number_attr_6[3], animal: item.number_attr_6[1], wuxin: item.number_attr_6[2] },
        { num: item.num_7, attr: item.number_attr_7, color: item.number_attr_7[3], animal: item.number_attr_7[1], wuxin: item.number_attr_7[2] }
      ]
    };
  });
});

onMounted(() => {
  getHistoryAPIData();
});

</script>

<template>
  <div v-for="entry in numbers" :key="entry.id" class="lottery grid grid-cols-5 sm:grid-cols-5 items-center justify-center gap-1 my-1 border-b border-b-[#4b5cc4]">
    <div class="lottery-date-and-time">
      <div class="lottery-date text-gray-500 text-center text-[0.65rem] mb-2">{{ entry.period }}</div>
      <div class="lottery-time text-center text-xs font-bold">{{  padZero(entry.periodNum) }}期</div>
    </div>
    <div class="lottery-box grid grid-cols-8 col-span-4">
      <div v-for="(ball, idx) in entry.balls.slice(0, 6)" :key="idx" class="lottery-box-item flex flex-col items-center space-y-1">
        <div class="lottery-circle-and-number relative w-7.5 sm:w-10 md:w-10 h-7.5 sm:h-10 md:h-10 rounded-full overflow-hidden flex justify-center">
          <div :class="getColorArr(ball.color)" alt="lottery color" class="lottery-main-number-circle w-full h-full object-cover" />
          <div class="main-number-item absolute inset-0 flex items-center justify-center font-bold">{{ String(ball.num).padStart(2, '0') }}</div>
        </div>
        <div class="xiao-box text-center text-xs">{{ ball.animal }}/{{ ball.wuxin }}</div>
      </div>

      <div class="lottery-box-plus flex items-start justify-center">
        <span class="text-lg">+</span>
      </div>

      <div class="lottery-box-item flex flex-col items-center space-y-1">
        <div class="lottery-circle-and-number relative w-7.5 sm:w-10 md:w-10 h-7.5 sm:h-10 md:h-10 rounded-full overflow-hidden flex justify-center">
          <div :class="getColorArr(entry.balls[6].color)" alt="lottery color" class="lottery-special-number-circle w-full h-full object-cover" />
          <div class="special-number-item absolute inset-0 flex items-center justify-center font-bold">{{ String(entry.balls[6].num).padStart(2, '0') }}</div>
        </div>
        <div class="xiao-box text-center text-xs">{{ entry.balls[6].animal }}/{{ entry.balls[6].wuxin }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.red {
  background-image: url(../assets/redCircle.png);
}
.blue {
  background-image: url(../assets/blueCircle.png);
}
.green {
  background-image: url(../assets/greenCircle.png);
}
.lottery-main-number-circle,
.lottery-special-number-circle {
  background-size: cover;
}
</style>
