<template>
  <div class="content">
    <Card
      title="Title"
      subtitle="Subtitle"
      date="Date"
      url="about"
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
  position: relative;
  text-align: center;
  top: 50vh;
  width: 100%;
  z-index: 10;
}
</style>
