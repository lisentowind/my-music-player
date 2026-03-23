<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__header">
      <div class="brand">
        <span class="brand__dot" />
        <div class="brand__text">
          <span class="brand__title">My Player</span>
          <span class="brand__subtitle">Desktop Starter</span>
        </div>
      </div>

      <nav class="nav">
        <RouterLink to="/" class="nav__link" exact-active-class="is-active">Home</RouterLink>
        <RouterLink to="/about" class="nav__link" exact-active-class="is-active">About</RouterLink>
      </nav>
    </header>

    <main class="app-shell__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="less">
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(1200px 600px at 120% -10%, rgba(59, 130, 246, 0.16), transparent 50%),
    radial-gradient(900px 500px at -20% 100%, rgba(14, 165, 233, 0.12), transparent 50%),
    var(--color-bg);
}

.app-shell__header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background-color: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.brand__text {
  display: grid;
  gap: 1px;
}

.brand__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7, #0ea5e9);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.18);
}

.brand__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.brand__subtitle {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.nav {
  display: inline-flex;
  gap: var(--space-2);
}

.nav__link {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all 180ms ease;
}

.nav__link:hover {
  background-color: rgba(2, 132, 199, 0.1);
  color: var(--color-text);
}

.nav__link.is-active {
  background: linear-gradient(135deg, #0284c7, #0ea5e9);
  color: #fff;
}

.app-shell__main {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  width: min(1120px, 100%);
  margin: 0 auto;
}

@media (max-width: 640px) {
  .app-shell__header {
    padding: var(--space-4);
  }

  .app-shell__main {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
