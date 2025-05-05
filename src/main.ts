import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import ElementPlus from 'element-plus';
import App from './App.vue'
import pinia from './stores/index';
import router from './router'

const app = createApp(App)

app.use(pinia);
app.use(router)
app.mount('#app')
app.use(ElementPlus);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}