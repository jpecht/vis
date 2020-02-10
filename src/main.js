import { DropdownPlugin } from 'bootstrap-vue';
import Vue from 'vue';
import VueSlider from 'vue-slider-component';
import App from './App.vue';
import router from './router';
import store from './store';

// Import vendor CSS
import 'vue-slider-component/theme/default.css';
import '@/styles/vendor/css-tooltip.css';
import '@/styles/vendor/vendor.scss';

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
