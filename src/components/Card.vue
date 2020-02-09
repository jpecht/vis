<template>
  <div class="container">
    <router-link :to="url">
      <div
        class="card"
        :style="{
          background: `url(${require(`@/assets/images/screenshots/${imageFilename}`)}) no-repeat`,
        }"
        @mouseover="contentVisible = true"
        @mouseout="contentVisible = false"
      >
        <div
          v-show="isMobile || contentVisible"
          class="content"
        >
          <div>
            <h3 class="title">{{ title }}</h3>
            <h4 class="subtitle">{{ subtitle }}</h4>
          </div>
          <span class="date">{{ date }}</span>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    date: {
      type: String,
      default: '',
    },
    imageFilename: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '/',
    },
  },
  data: () => ({
    contentVisible: false,
  }),
  computed: {
    isMobile() {
      return (typeof window.orientation !== 'undefined')
        || (navigator.userAgent.indexOf('IEMobile') !== -1);
    },
  },
};
</script>

<style scoped lang="scss">
.container {
  display: inline-block;
  height: 420px;
  margin: 20px 10px 0;
  position: relative;
  width: 420px;
}

.card {
  background-position: center;
  background-size: contain;
  border-radius: 15px;
  box-shadow: 2px 2px 10px 0px rgba(0,0,0,0.6);
  color: white;
  cursor: pointer;
  left: 10px;
  height: 400px;
  padding: 30px;
  position: absolute;
  text-align: left;
  top: 10px;
  transition: all 0.4s;
  width: 400px;

  &:hover {
    height: 420px;
    left: 0px;
    top: 0px;
    width: 420px;
  }
}

.content {
  align-items: center;
  background-color: rgba(0, 0, 0, 0.75);
  border-radius: 15px;
  display: flex;
  height: 100%;
  left: 0px;
  padding: 30px;
  position: absolute;
  top: 0px;
  width: 100%;
}

.title {
  font-size: 24px;
  font-weight: 400;
  margin: 0;
  position: relative;
}

.subtitle {
  font-size: 17px;
  font-weight: 300;
  margin: 5px 0 0;
  position: relative;
}

.date {
  font-size: 14px;
  font-weight: 300;
  position: absolute;
  right: 30px;
  top: 30px;
}
</style>
