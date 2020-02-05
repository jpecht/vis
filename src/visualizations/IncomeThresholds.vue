<template>
  <Visualization
    title="Income Thresholds"
    subtitle="class division in the u.s."
    date="Aug 19, 2014"
    :description="description"
  >
    <div>Test</div>
  </Visualization>
</template>

<script>
import Visualization from '@/components/Visualization.vue';

export default {
  name: 'IncomeThresholds',
  components: {
    Visualization,
  },
  data: () => ({
    description: 'The graph below shows the income level "cut-offs" in the United States. After adjusting for inflation, it\'s interesting to see the steady increase in the top 5%.',
  }),
};
</script>
