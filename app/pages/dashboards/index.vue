<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface Dashboard {
  id: string;
  name: string;
  timeRange: string;
  createdAt: string;
}

const { data: dashboards } = await useFetch<Dashboard[]>("/api/dashboards", { default: () => [] });
const name = ref("");
const busy = ref(false);

async function create() {
  const trimmed = name.value.trim();
  if (!trimmed || busy.value) return;
  busy.value = true;
  try {
    const d = await $fetch<Dashboard>("/api/dashboards", {
      method: "POST",
      body: { name: trimmed },
    });
    await navigateTo(`/dashboards/${d.id}`);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="stack">
    <h2 style="margin: 0">Dashboards</h2>
    <div class="card">
      <div class="row">
        <input v-model="name" placeholder="New dashboard name" @keyup.enter="create" />
        <button :disabled="busy" @click="create">Create</button>
      </div>
    </div>

    <div v-if="dashboards && dashboards.length" class="card stack">
      <div v-for="d in dashboards" :key="d.id" class="row">
        <NuxtLink :to="`/dashboards/${d.id}`">{{ d.name }}</NuxtLink>
        <span class="spacer" />
        <span class="muted">last {{ d.timeRange.toLowerCase() }}</span>
      </div>
    </div>
    <p v-else class="muted">No dashboards yet. Create one above.</p>
  </div>
</template>
