<template>
  <div class="container">
    <div class="content">
      <div class="post">
        <h3 class="title">{{ title }}</h3>
        <h4
          v-if="subtitle"
          class="subtitle"
        >
          {{ subtitle }}
        </h4>
        <span class="date">{{ date }}</span>
        <div class="description-wrapper">
          <p
            v-if="description"
            class="description"
            v-html="description"
          />
        </div>
        <slot />
        <p
          v-if="postDescription"
          class="description post-description"
          v-html="postDescription"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Visualization',
  props: {
    date: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    postDescription: {
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
  },
};
</script>

<style scoped lang="scss">
.container {
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
  padding: 30px;
  position: relative;
  text-align: left;
  width: 700px;
}

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

.description-wrapper {
  font-size: 14px;
  font-weight: 300;
  padding-top: 20px;
  position: relative;
  text-align: center;
}

.description {
  margin: 0;
  padding-bottom: 20px;
  text-align: left;
}

.post-description {
  margin-top: 25px;
  padding-bottom: 5px;
}
</style>
