import { DropdownPlugin } from 'bootstrap-vue';
import Vue from 'vue';
import VueSlider from 'vue-slider-component';
import App from './App.vue';
import router from './router';
import store from './store';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'vue-slider-component/theme/default.css';

Vue.config.productionTip = false;

Vue.use(DropdownPlugin);
Vue.component('VueSlider', VueSlider);

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');
