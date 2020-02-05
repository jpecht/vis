<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        The graph below shows the income level "cut-offs" in the United States.
        After adjusting for inflation, it's interesting to see the steady increase in the top 5%.
      </p>
    </template>
    <div ref="table" />
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
