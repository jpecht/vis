<template>
  <div class="content">
    <Card
      v-for="v in visualizations"
      :key="v.url"
      :title="v.title"
      :subtitle="v.subtitle"
      :date="v.date"
      :url="v.url"
      :imageFilename="v.imageFilename"
    />
  </div>
</template>

<script>
import Card from '@/components/Card.vue';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'Home',
  components: {
    Card,
  },
  data: () => ({
    visualizations,
  }),
};
</script>

<style scoped lang="scss">
.content {
  background: url('~@/assets/images/blue_gradient.jpg') no-repeat center;
  background-size: cover;
  box-sizing: border-box;
  left: 0px;
  min-height: 100vh;
  padding-bottom: 100px;
  text-align: center;
  width: 100%;
  z-index: 10;
}
</style>
