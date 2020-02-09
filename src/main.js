import { DropdownPlugin } from 'bootstrap-vue';
import Vue from 'vue';
import VueSlider from 'vue-slider-component';
import App from './App.vue';
import router from './router';
import store from './store';

// Import vendor CSS
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'vue-slider-component/theme/default.css';

// Import global CSS
import '@/styles/vendor.scss';
import '@/styles/main.scss';

Vue.config.productionTip = false;

Vue.use(DropdownPlugin);
Vue.component('VueSlider', VueSlider);

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
