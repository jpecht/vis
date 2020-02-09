<template>
  <header :class="{ collapsed }">
    <div :class="{ 'header-text-wrapper': !collapsed }">
      <h1 class="header-text">
        <a href="./">
          visualizations
        </a>
      </h1>
      <h2
        v-if="!collapsed"
        class="subheader-text"
      >
        by
        <a
          href="//www.jpecht.com"
          class="author-link"
        >
          jefferson
        </a>
      </h2>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  props: {
    collapsed: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style scoped lang="scss">
header {
  background: url('~@/assets/images/triangles.jpg') no-repeat center top;
  background-attachment: fixed;
  background-size: cover;
  color: white;
  height: 50vh;
  text-align: center;
  transition: opacity 1s, background-position 10s;
  width: 100%;
  z-index: 5;

  &.collapsed {
    background-position: 50% 50%;
    font-size: 2em;
    font-weight: 800;
    height: auto;
    opacity: 0.95;
    padding: 15px 0px;
    position: fixed;
    top: 0px;
    z-index: 20;
  }

  &:hover {
    background-position: 0% 50%;
    opacity: 1;
  }

  a,
  a:hover {
    color: white;
    text-decoration: none;
  }
}

.header-text-wrapper {
  position: fixed;
  top: 20vh;
  width: 100%;
}

.header-text {
  font-size: 40px;
  font-weight: 800;
  margin: 0;
}

header.collapsed .header-text {
  font-size: 28px;
}

.subheader-text {
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  padding-top: 20px;
}

.author-link:hover { text-decoration: underline; }
</style>
