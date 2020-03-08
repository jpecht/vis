<template>
  <div class="contentContainer">
    <div class="content">
      <div :class="['post', { wide }]">
        <span class="date">{{ date }}</span>
        <h3 class="title">{{ title }}</h3>
        <h4
          v-if="subtitle"
          class="subtitle"
        >
          {{ subtitle }}
        </h4>
        <div class="description">
          <slot name="description" />
        </div>
        <div class="vis">
          <slot />
        </div>
        <div class="description post-description">
          <slot name="post-description" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Post',
  props: {
    date: {
      type: String,
      default: '',
    },
    subtitle: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
    wide: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped lang="scss">
.contentContainer {
  background: url('~@/assets/images/blue_gradient.jpg') no-repeat center;
  background-size: cover;
  left: 0px;
  min-height: 100vh;
  padding: 80px 0 100px;
  position: relative;
  width: 100%;
  z-index: 10;
}

.content {
  margin-top: 50px;
  position: relative;
  text-align: center;
  width: 100%;
}

.post {
  background-color: #eee;
  border-radius: 10px;
  box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.6);
  display: inline-block;
  max-width: 700px;
  padding: 30px 40px;
  position: relative;
  text-align: left;
  width: 100%;
}

.post.wide { max-width: 900px; }

.title {
  font-size: 24px;
  font-weight: 400;
  margin: 0;
  position: relative;
}

.subtitle {
  font-size: 16px;
  font-weight: 300;
  margin: 0;
  padding-top: 10px;
  position: relative;
}

.date {
  font-size: 14px;
  font-weight: 300;
  position: absolute;
  right: 30px;
  top: 30px;
}

.title a {
  color: black;

  &:hover {
    color: #be4444;
    text-decoration: none;
  }
}

.description {
  font-size: 13px;
  font-weight: 400;
  margin: 0;
  padding: 20px 0;
  text-align: left;
}

.vis {
  font-size: 13px;
  position: relative;
  text-align: center;
}

.post-description { padding-bottom: 5px; }
</style>
