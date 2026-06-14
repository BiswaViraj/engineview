<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface Dashboard {
  id: string;
  name: string;
  timeRange: string;
  createdAt: string;
}

const appId = useRoute().params.appId as string;

const { data: dashboards } = await useFetch<Dashboard[]>(`/api/dashboards?appId=${appId}`, {
  default: () => [],
});
const name = ref("");
const busy = ref(false);

async function create() {
  const trimmed = name.value.trim();
  if (!trimmed || busy.value) return;
  busy.value = true;
  try {
    const d = await $fetch<Dashboard>("/api/dashboards", {
      method: "POST",
      body: { name: trimmed, appId },
    });
    await navigateTo(`/apps/${appId}/dashboards/${d.id}`);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="stack">
    <AppSubnav :app-id="appId" />
    <h1 class="sr-only">Dashboards</h1>
    <div class="card">
      <div class="create-row">
        <input
          v-model="name"
          placeholder="New dashboard name"
          aria-label="Dashboard name"
          maxlength="120"
          @keyup.enter="create"
        />
        <button :disabled="busy" @click="create">{{ busy ? "Creating…" : "Create" }}</button>
      </div>
    </div>

    <div v-if="dashboards && dashboards.length" class="card stack">
      <div v-for="d in dashboards" :key="d.id" class="dash-row">
        <NuxtLink :to="`/apps/${appId}/dashboards/${d.id}`" class="dash-name">{{
          d.name
        }}</NuxtLink>
        <span class="muted dash-range">last {{ d.timeRange.toLowerCase() }}</span>
      </div>
    </div>
    <p v-else class="muted">No dashboards yet. Create one above.</p>
  </div>
</template>

<style scoped>
.create-row {
  display: flex;
  gap: var(--space-sm);
}
.create-row input {
  flex: 1;
  min-width: 0;
}
.dash-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}
.dash-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dash-range {
  flex-shrink: 0;
  margin-left: auto;
}
</style>
