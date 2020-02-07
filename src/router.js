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
      path: '/bpm',
      name: 'bpm',
      component: () => import('./visualizations/Bpm.vue'),
    },
    {
      path: '/bpm-2',
      name: 'bpm-2',
      component: () => import('./visualizations/Bpm2.vue'),
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
      path: '/dc-demographics',
      name: 'dc-demographics',
      component: () => import('./visualizations/DcDemographics.vue'),
    },
    {
      path: '/dc-snowfall',
      name: 'dc-snowfall',
      component: () => import('./visualizations/DcSnowfall.vue'),
    },
    {
      path: '/facebook-network',
      name: 'facebook-network',
      component: () => import('./visualizations/FacebookNetwork.vue'),
    },
    {
      path: '/fantasy-football-performance',
      name: 'fantasy-football-performance',
      component: () => import('./visualizations/FantasyFootballPerformance.vue'),
    },
    {
      path: '/income',
      name: 'income',
      component: () => import('./visualizations/IncomeThresholds.vue'),
    },
    {
      path: '/march-madness',
      name: 'march-madness',
      component: () => import('./visualizations/MarchMadness.vue'),
    },
  ],
});
