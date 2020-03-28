import { DropdownPlugin } from 'bootstrap-vue';
import Vue from 'vue';
import VueSlider from 'vue-slider-component';
import App from './App.vue';
import router from './router';
import store from './store';

// Import global CSS
import '@/styles/main.scss';

Vue.config.productionTip = false;

Vue.use(DropdownPlugin);
Vue.component('VueSlider', VueSlider);

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
