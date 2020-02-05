import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/bpm-3',
      name: 'bpm-3',
      component: () => import('./visualizations/Bpm3.vue'),
    },
    {
      path: '/bball-ranks-2',
      name: 'bball-ranks-2',
      component: () => import('./visualizations/FantasyBasketball2.vue'),
    },
    {
      path: '/income',
      name: 'income',
      component: () => import('./visualizations/IncomeThresholds.vue'),
    },
  ],
});
