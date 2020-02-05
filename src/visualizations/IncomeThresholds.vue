<template>
  <Post v-bind="info">
    <div>Test</div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'IncomeThresholds',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'income'),
  }),
};
</script>
