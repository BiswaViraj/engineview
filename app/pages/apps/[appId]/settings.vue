<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface AppItem {
  id: string;
  name: string;
  connectionId: string;
  dataset: string | null;
  url: string | null;
  logoUrl: string | null;
}

interface Connection {
  id: string;
  label: string;
  accountId: string;
  defaultDataset: string | null;
}

const route = useRoute();
const appId = route.params.appId as string;

const { data: app } = await useFetch<AppItem>(`/api/apps/${appId}`);
const { data: connections } = await useFetch<Connection[]>("/api/connections", {
  default: () => [],
});

function errorMessage(e: unknown, fallback: string): string {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
  return err?.data?.statusMessage || err?.statusMessage || fallback;
}

const form = reactive({
  name: app.value?.name ?? "",
  connectionId: app.value?.connectionId ?? "",
  dataset: app.value?.dataset ?? "",
  url: app.value?.url ?? "",
  logoUrl: app.value?.logoUrl ?? "",
});

const saveError = ref("");
const saveBusy = ref(false);

async function save() {
  if (saveBusy.value) return;
  saveBusy.value = true;
  saveError.value = "";
  try {
    await $fetch(`/api/apps/${appId}`, {
      method: "PUT",
      body: {
        name: form.name,
        connectionId: form.connectionId,
        dataset: form.dataset || null,
        url: form.url || null,
        logoUrl: form.logoUrl || null,
      },
    });
    await navigateTo("/apps");
  } catch (e) {
    saveError.value = errorMessage(e, "Could not save changes.");
  } finally {
    saveBusy.value = false;
  }
}

async function remove() {
  await $fetch(`/api/apps/${appId}`, { method: "DELETE" });
  await navigateTo("/apps");
}
</script>

<template>
  <div class="stack">
    <div class="head">
      <div class="stack" style="gap: var(--space-2xs)">
        <span class="eyebrow">App settings</span>
        <h1>{{ app?.name }}</h1>
      </div>
      <span class="spacer" />
      <NuxtLink to="/apps" class="back-link">Back to apps</NuxtLink>
    </div>

    <div v-if="app" class="card stack edit-card">
      <form class="stack" @submit.prevent="save">
        <label>
          Name
          <input v-model="form.name" required placeholder="Marketing site" />
        </label>
        <label>
          Connection
          <select v-model="form.connectionId" required>
            <option v-for="c in connections" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </label>
        <label>
          Dataset (optional)
          <input v-model="form.dataset" placeholder="pageviews" />
        </label>
        <label>
          URL (optional)
          <input v-model="form.url" type="url" placeholder="https://example.com" />
        </label>
        <label>
          Logo URL (optional)
          <input v-model="form.logoUrl" type="url" placeholder="https://example.com/logo.png" />
        </label>
        <div class="row">
          <button type="submit" :disabled="saveBusy">
            {{ saveBusy ? "Saving…" : "Save changes" }}
          </button>
          <NuxtLink to="/apps"><button type="button" class="ghost">Cancel</button></NuxtLink>
        </div>
        <pre v-if="saveError" class="error" role="alert">{{ saveError }}</pre>
      </form>
    </div>

    <div v-if="app" class="card danger-zone">
      <div class="stack" style="gap: var(--space-2xs)">
        <strong>Delete this app</strong>
        <span class="muted">Removes the app and its saved queries and dashboards.</span>
      </div>
      <span class="spacer" />
      <ConfirmButton label="Delete app" confirm-label="Delete app?" @confirm="remove" />
    </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
}
.back-link {
  font-size: var(--text-sm);
  color: var(--text-2);
}
.back-link:hover {
  color: var(--text);
}
.edit-card {
  max-width: 520px;
}
.danger-zone {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
  max-width: 520px;
}
</style>
