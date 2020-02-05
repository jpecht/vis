<template>
  <div id="app">
    <Header :collapsed="!isOnHomePage" />
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
  computed: {
    isOnHomePage() {
      return this.$router.currentRoute.hash === '';
    },
  },
};
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,800&display=swap');

body {
  margin: 0;
}

#app {
  color: #2c3e50;
  font-family: 'Open Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
