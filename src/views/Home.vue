<template>
  <div class="content">
    <Card
      title="Income Thresholds"
      subtitle="class division in the u.s."
      date="Aug 19, 2014"
      url="income"
      imageFilename="income_ss.png"
    />
  </div>
</template>

<script>
import Card from '@/components/Card.vue';

export default {
  name: 'Home',
  components: {
    Card,
  },
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
