<template>
  <header>
    <div class="header-text-wrapper">
      <h1 class="header-text">
        <a href="./">
          visualizations
        </a>
      </h1>
      <h2 class="subheader-text">
        by
        <a
          href="//www.jpecht.com"
          class="jefferson-link"
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
  position: absolute;
  text-align: center;
  width: 100%;
  z-index: 5;

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

.subheader-text {
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  padding-top: 20px;
}

.jefferson-link:hover { text-decoration: underline; }


/*** Collapsed styles - need to go over ***/
.postpage-header {
  position: fixed;
  top: 0px;
  padding: 15px 0px;
  text-align: center;
  font-weight: 800;
  font-size: 2em;
  color: white;
  background-position: 50% 50%;
  opacity: 0.95;
  transition: opacity 1s, background-position 10s;
  z-index: 20;
}
.postpage-header:hover {
  background-position: 0% 50%;
  opacity: 1;
}
</style>
