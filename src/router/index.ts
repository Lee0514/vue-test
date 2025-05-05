import { createRouter, createWebHistory } from 'vue-router';
import PageLayout from '@/layout/PageLayout.vue';
import History from '@/views/HistoryMain.vue';
import LineChart from '@/views/LineChart.vue';
import BarChart from '@/views/BarChart.vue';
import TableChart from '@/views/TableChart.vue';

const routes = [
  {
    path: '/',
    component: PageLayout,
    children: [
      { path: '/', component: History },
      { path: 'LineChart', component: LineChart},
      { path: 'BarChart', component: BarChart },
      { path: 'TableChart', component: TableChart }
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;