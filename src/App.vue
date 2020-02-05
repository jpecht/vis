<template>
  <div id="app">
    <Header :collapsed="$router.currentRoute.name !== 'home'" />
    <router-view/>
  </div>
</template>

<script>
import Header from '@/components/Header.vue';

export default {
  name: 'App',
  components: {
    Header,
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,800&display=swap');

body { margin: 0; }

#app {
  color: #222;
  display: flex;
  flex-direction: column;
  font-family: 'Open Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* { box-sizing: border-box; }
</style>
