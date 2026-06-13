<script setup lang="ts">
const props = defineProps<{ currentId: string }>();

interface AppSummary {
  id: string;
  name: string;
}

const { data: apps } = await useFetch<AppSummary[]>("/api/apps", { default: () => [] });

const route = useRoute();

function onChange(event: Event) {
  const id = (event.target as HTMLSelectElement).value;
  if (!id || id === props.currentId) return;
  const sub = route.path.includes("/dashboards") ? "dashboards" : "query";
  navigateTo(`/apps/${id}/${sub}`);
}
</script>

<template>
  <select
    v-if="apps && apps.length"
    class="app-switcher"
    aria-label="Switch app"
    :value="currentId"
    @change="onChange"
  >
    <option v-for="a in apps" :key="a.id" :value="a.id">{{ a.name }}</option>
  </select>
</template>

<style scoped>
.app-switcher {
  width: auto;
  max-width: 200px;
  font-size: var(--text-sm);
  padding-top: 6px;
  padding-bottom: 6px;
}
</style>
