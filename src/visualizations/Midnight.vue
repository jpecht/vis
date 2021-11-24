<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>A brute force simulation of the dice game, Midnight</p>
      <p>
        Test
      </p>
    </template>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'Drought',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'midnight'),
  }),
  mounted() {
    this.createVis();
  },
};
</script>

<style lang="scss">
</style>
