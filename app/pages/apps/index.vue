<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface AppItem {
  id: string;
  name: string;
  connectionId: string;
  dataset: string | null;
  url: string | null;
  logoUrl: string | null;
  createdAt: string;
  dashboardCount: number;
  queryCount: number;
}

interface Connection {
  id: string;
  label: string;
  accountId: string;
  defaultDataset: string | null;
}

const { data: apps, refresh } = await useFetch<AppItem[]>("/api/apps", { default: () => [] });
const { data: connections } = await useFetch<Connection[]>("/api/connections", {
  default: () => [],
});

const connectionLabel = (id: string) => connections.value?.find((c) => c.id === id)?.label ?? id;

function errorMessage(e: unknown, fallback: string): string {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
  return err?.data?.statusMessage || err?.statusMessage || fallback;
}

const blank = () => ({ name: "", connectionId: "", dataset: "", url: "", logoUrl: "" });

const adding = ref(false);
const form = reactive(blank());
const createError = ref("");
const createBusy = ref(false);
const nameInput = ref<HTMLInputElement | null>(null);

async function openAdd() {
  Object.assign(form, blank());
  form.connectionId = connections.value?.[0]?.id ?? "";
  createError.value = "";
  adding.value = true;
  await nextTick();
  nameInput.value?.focus();
}
function cancelAdd() {
  adding.value = false;
}
async function create() {
  if (createBusy.value) return;
  createBusy.value = true;
  createError.value = "";
  try {
    await $fetch("/api/apps", {
      method: "POST",
      body: {
        name: form.name,
        connectionId: form.connectionId,
        ...(form.dataset ? { dataset: form.dataset } : {}),
        ...(form.url ? { url: form.url } : {}),
        ...(form.logoUrl ? { logoUrl: form.logoUrl } : {}),
      },
    });
    adding.value = false;
    await refresh();
  } catch (e) {
    createError.value = errorMessage(e, "Could not create the app.");
  } finally {
    createBusy.value = false;
  }
}

async function remove(id: string) {
  await $fetch(`/api/apps/${id}`, { method: "DELETE" });
  await refresh();
}

const hasConnections = computed(() => (connections.value?.length ?? 0) > 0);
const hasApps = computed(() => (apps.value?.length ?? 0) > 0);
</script>

<template>
  <div class="stack">
    <div class="head">
      <div class="stack" style="gap: var(--space-2xs)">
        <span class="eyebrow">Apps</span>
        <h1>Apps</h1>
      </div>
      <span class="spacer" />
      <button v-if="hasConnections && !adding" @click="openAdd">Add app</button>
    </div>
    <p class="lead">
      An app pairs a connection and a dataset with its own saved queries and dashboards. Group your
      work by the product or service it measures.
    </p>

    <!-- Create form -->
    <div v-if="adding" class="card stack">
      <h2 class="form-title">Add an app</h2>
      <form class="stack" @submit.prevent="create">
        <label>
          Name
          <input ref="nameInput" v-model="form.name" required placeholder="Marketing site" />
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
          <button type="submit" :disabled="createBusy">
            {{ createBusy ? "Saving…" : "Add app" }}
          </button>
          <button type="button" class="ghost" @click="cancelAdd">Cancel</button>
        </div>
        <pre v-if="createError" class="error" role="alert">{{ createError }}</pre>
      </form>
    </div>

    <!-- No connections: must add one first -->
    <div v-if="!hasConnections" class="empty">
      <span class="brand-mark empty-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
          <rect x="0.5" y="8" width="3" height="5.5" rx="1" fill="var(--accent)" />
          <rect x="5.5" y="4" width="3" height="9.5" rx="1" fill="var(--accent)" />
          <rect x="10.5" y="0.5" width="3" height="13" rx="1" fill="var(--accent)" />
        </svg>
      </span>
      <p class="empty-title">Add a connection first</p>
      <p class="muted">An app needs a Cloudflare connection before it can query anything.</p>
      <button @click="navigateTo('/settings')">Add a connection</button>
    </div>

    <!-- Connections but no apps -->
    <div v-else-if="!hasApps && !adding" class="empty">
      <span class="brand-mark empty-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
          <rect x="0.5" y="8" width="3" height="5.5" rx="1" fill="var(--accent)" />
          <rect x="5.5" y="4" width="3" height="9.5" rx="1" fill="var(--accent)" />
          <rect x="10.5" y="0.5" width="3" height="13" rx="1" fill="var(--accent)" />
        </svg>
      </span>
      <p class="empty-title">Create your first app</p>
      <p class="muted">Pair a connection with a dataset to start saving queries and dashboards.</p>
      <button @click="openAdd">Add app</button>
    </div>

    <!-- App cards -->
    <ul v-else-if="hasApps" class="app-grid">
      <li v-for="a in apps" :key="a.id" class="app-card">
        <div class="app-top">
          <img v-if="a.logoUrl" :src="a.logoUrl" alt="" class="app-logo" />
          <span v-else class="brand-mark app-logo-fallback" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <rect x="0.5" y="8" width="3" height="5.5" rx="1" fill="var(--accent)" />
              <rect x="5.5" y="4" width="3" height="9.5" rx="1" fill="var(--accent)" />
              <rect x="10.5" y="0.5" width="3" height="13" rx="1" fill="var(--accent)" />
            </svg>
          </span>
          <div class="app-id-block">
            <NuxtLink :to="`/apps/${a.id}/dashboards`" class="app-name">{{ a.name }}</NuxtLink>
            <span class="muted app-conn">
              {{ connectionLabel(a.connectionId)
              }}<template v-if="a.dataset"> · {{ a.dataset }}</template>
            </span>
          </div>
          <a
            v-if="a.url"
            :href="a.url"
            target="_blank"
            rel="noopener"
            class="app-ext"
            :aria-label="`Open ${a.name} site`"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M5 3.5H3.5A1.5 1.5 0 0 0 2 5v5.5A1.5 1.5 0 0 0 3.5 12H9a1.5 1.5 0 0 0 1.5-1.5V9M8 2h4v4M6 8l6-6"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        </div>

        <dl class="app-stats">
          <div class="stat">
            <dt>Dashboards</dt>
            <dd class="stat-num">{{ a.dashboardCount }}</dd>
          </div>
          <div class="stat">
            <dt>Queries</dt>
            <dd class="stat-num">{{ a.queryCount }}</dd>
          </div>
        </dl>

        <div class="app-actions">
          <NuxtLink :to="`/apps/${a.id}/settings`" class="app-edit">Edit</NuxtLink>
          <ConfirmButton @confirm="remove(a.id)" />
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
}
.form-title {
  font-size: var(--text-lg);
  margin: 0;
}

.empty {
  display: grid;
  gap: var(--space-xs);
  place-items: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
}
.empty-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  margin-bottom: var(--space-xs);
}
.empty-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-md);
  margin: 0;
}
.empty button {
  margin-top: var(--space-sm);
}

.app-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}
.app-card {
  display: grid;
  gap: var(--space-md);
  align-content: start;
  padding: var(--space-lg);
  background: var(--surface-1);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  min-width: 0;
}
.app-top {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}
.app-logo {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
  background: var(--surface-2);
}
.app-logo-fallback {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.app-id-block {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.app-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-md);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-name:hover {
  color: var(--link);
}
.app-conn {
  font-size: var(--text-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-ext {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--text-3);
  flex-shrink: 0;
  margin-left: auto;
  transition:
    color var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease);
}
.app-ext:hover {
  color: var(--text);
  background: var(--surface-2);
  text-decoration: none;
}

.app-stats {
  display: flex;
  gap: var(--space-xl);
  margin: 0;
}
.stat {
  display: grid;
  gap: 2px;
}
.stat dt {
  font-size: var(--text-xs);
  color: var(--text-3);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.stat-num {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-lg);
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.app-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--line-soft);
}
.app-edit {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2xs) var(--space-sm);
  border-radius: var(--radius-md);
  color: var(--text-2);
  font-size: var(--text-sm);
  font-weight: 500;
}
.app-edit:hover {
  color: var(--text);
  background: var(--surface-2);
  text-decoration: none;
}
.app-actions :deep(.confirm-btn) {
  margin-left: auto;
}
</style>
