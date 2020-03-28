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
      component: () => import('./visualizations/Bpm.vue'),
    },
    {
      path: '/bpm-2',
      component: () => import('./visualizations/Bpm2.vue'),
    },
    {
      path: '/bpm-3',
      component: () => import('./visualizations/Bpm3.vue'),
    },
    {
      path: '/bball-ranks',
      component: () => import('./visualizations/FantasyBasketball.vue'),
    },
    {
      path: '/bball-ranks-2',
      component: () => import('./visualizations/FantasyBasketball2.vue'),
    },
    {
      path: '/covid',
      component: () => import('./visualizations/Covid.vue'),
    },
    {
      path: '/dc-demographics',
      component: () => import('./visualizations/DcDemographics.vue'),
    },
    {
      path: '/dc-snowfall',
      component: () => import('./visualizations/DcSnowfall.vue'),
    },
    {
      path: '/drought',
      component: () => import('./visualizations/Drought.vue'),
    },
    {
      path: '/education-spending',
      component: () => import('./visualizations/EducationSpending.vue'),
    },
    {
      path: '/facebook-network',
      component: () => import('./visualizations/FacebookNetwork.vue'),
    },
    {
      path: '/fantasy-draft',
      component: () => import('./visualizations/FantasyDraft.vue'),
    },
    {
      path: '/fantasy-draft-2',
      component: () => import('./visualizations/FantasyDraft2.vue'),
    },
    {
      path: '/fantasy-football-performance',
      component: () => import('./visualizations/FantasyFootballPerformance.vue'),
    },
    {
      path: '/income',
      component: () => import('./visualizations/IncomeThresholds.vue'),
    },
    {
      path: '/march-madness',
      component: () => import('./visualizations/MarchMadness.vue'),
    },
    {
      path: '/population',
      component: () => import('./visualizations/Population.vue'),
    },
    {
      path: '/poverty',
      component: () => import('./visualizations/Poverty.vue'),
    },
    {
      path: '/tv-show-viewership',
      component: () => import('./visualizations/TvShowViewership.vue'),
    },
    {
      path: '/weather',
      component: () => import('./visualizations/Weather.vue'),
    },
    {
      // Manually redirect absolute URLs (so <router-link> can still be used)
      path: '//*',
      beforeEnter: (to) => {
        window.location.assign(to.fullPath);
      },
    },
  ],
});
