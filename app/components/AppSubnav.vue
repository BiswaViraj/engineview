<script setup lang="ts">
const props = defineProps<{ appId: string }>();

const route = useRoute();
const isActive = (path: string) => route.path.startsWith(path);

const queryTo = computed(() => `/apps/${props.appId}/query`);
const dashboardsTo = computed(() => `/apps/${props.appId}/dashboards`);
</script>

<template>
  <nav class="app-subnav" aria-label="App sections">
    <NuxtLink :to="queryTo" class="nav-link" :class="{ active: isActive(queryTo) }">Query</NuxtLink>
    <NuxtLink :to="dashboardsTo" class="nav-link" :class="{ active: isActive(dashboardsTo) }">
      Dashboards
    </NuxtLink>
  </nav>
</template>

<style scoped>
.app-subnav {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  margin-bottom: var(--space-lg);
  font-family: var(--font-body);
  font-weight: 500;
  font-size: var(--text-sm);
}
</style>
