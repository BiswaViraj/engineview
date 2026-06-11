<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface Connection {
  id: string;
  label: string;
  accountId: string;
  defaultDataset: string | null;
  createdAt: string;
}

const { data: connections, refresh } = await useFetch<Connection[]>("/api/connections");

const blank = () => ({ label: "", accountId: "", apiToken: "", defaultDataset: "" });

function errorMessage(e: unknown, fallback: string): string {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
  return err?.data?.statusMessage || err?.statusMessage || fallback;
}

// --- Create (a form you open on demand, never the default state) -----------
const adding = ref(false);
const createForm = reactive(blank());
const createError = ref("");
const createBusy = ref(false);
const createLabelInput = ref<HTMLInputElement | null>(null);

async function openAdd() {
  Object.assign(createForm, blank());
  createError.value = "";
  editingId.value = null;
  adding.value = true;
  await nextTick();
  createLabelInput.value?.focus();
}
function cancelAdd() {
  adding.value = false;
}
async function create() {
  if (createBusy.value) return;
  createBusy.value = true;
  createError.value = "";
  try {
    await $fetch("/api/connections", { method: "POST", body: { ...createForm } });
    adding.value = false;
    await refresh();
  } catch (e) {
    createError.value = errorMessage(e, "Could not add the connection.");
  } finally {
    createBusy.value = false;
  }
}

// --- Edit (inline on the row, with its own separate state) ------------------
const editingId = ref<string | null>(null);
const editForm = reactive(blank());
const editError = ref("");
const editBusy = ref(false);

async function openEdit(c: Connection) {
  editingId.value = c.id;
  editForm.label = c.label;
  editForm.accountId = c.accountId;
  editForm.apiToken = "";
  editForm.defaultDataset = c.defaultDataset ?? "";
  editError.value = "";
  adding.value = false;
  await nextTick();
  // The edit form lives inside a v-for, so query the single open one directly.
  document.querySelector<HTMLInputElement>(".edit-form input")?.focus();
}
function cancelEdit() {
  editingId.value = null;
}
async function saveEdit() {
  if (!editingId.value || editBusy.value) return;
  editBusy.value = true;
  editError.value = "";
  try {
    await $fetch(`/api/connections/${editingId.value}`, {
      method: "PUT",
      body: {
        label: editForm.label,
        accountId: editForm.accountId,
        defaultDataset: editForm.defaultDataset,
        ...(editForm.apiToken ? { apiToken: editForm.apiToken } : {}),
      },
    });
    editingId.value = null;
    await refresh();
  } catch (e) {
    editError.value = errorMessage(e, "Could not save changes.");
  } finally {
    editBusy.value = false;
  }
}

async function remove(id: string) {
  await $fetch(`/api/connections/${id}`, { method: "DELETE" });
  if (editingId.value === id) editingId.value = null;
  await refresh();
}
</script>

<template>
  <div class="stack">
    <div class="head">
      <div class="stack" style="gap: var(--space-2xs)">
        <span class="eyebrow">Connections</span>
        <h1>Cloudflare accounts</h1>
      </div>
      <span class="spacer" />
      <button v-if="!adding" @click="openAdd">Add connection</button>
    </div>
    <p class="lead">
      Connect a Cloudflare account to query its Analytics Engine datasets. The API token is
      encrypted before it is stored and never shown again. Create one in the Cloudflare dashboard
      with the "Account Analytics: Read" permission.
    </p>

    <!-- Add form: only present when you choose to add -->
    <div v-if="adding" class="card stack">
      <h2 class="form-title">Add a connection</h2>
      <form class="stack" @submit.prevent="create">
        <label>
          Label
          <input
            ref="createLabelInput"
            v-model="createForm.label"
            required
            placeholder="Production account"
          />
        </label>
        <label>
          Cloudflare account id
          <input
            v-model="createForm.accountId"
            required
            placeholder="023e105f4ecef8ad9ca31a8372d0c353"
          />
        </label>
        <label>
          API token
          <input
            v-model="createForm.apiToken"
            type="password"
            required
            placeholder="Analytics Engine read token"
          />
        </label>
        <label>
          Default dataset (optional)
          <input v-model="createForm.defaultDataset" placeholder="my_dataset" />
        </label>
        <div class="row">
          <button type="submit" :disabled="createBusy">
            {{ createBusy ? "Saving…" : "Add connection" }}
          </button>
          <button type="button" class="ghost" @click="cancelAdd">Cancel</button>
        </div>
        <pre v-if="createError" class="error" role="alert">{{ createError }}</pre>
      </form>
    </div>

    <!-- Connection list -->
    <div v-if="connections && connections.length" class="card">
      <ul class="conn-list">
        <li v-for="c in connections" :key="c.id" class="conn-item">
          <!-- Inline edit for this row -->
          <form v-if="editingId === c.id" class="stack edit-form" @submit.prevent="saveEdit">
            <label>
              Label
              <input v-model="editForm.label" required />
            </label>
            <label>
              Cloudflare account id
              <input v-model="editForm.accountId" required />
            </label>
            <label>
              API token (optional)
              <input
                v-model="editForm.apiToken"
                type="password"
                placeholder="Leave blank to keep the current token"
              />
            </label>
            <label>
              Default dataset (optional)
              <input v-model="editForm.defaultDataset" placeholder="my_dataset" />
            </label>
            <div class="row">
              <button type="submit" :disabled="editBusy">
                {{ editBusy ? "Saving…" : "Save changes" }}
              </button>
              <button type="button" class="ghost" @click="cancelEdit">Cancel</button>
            </div>
            <pre v-if="editError" class="error" role="alert">{{ editError }}</pre>
          </form>

          <!-- Row view -->
          <div v-else class="conn-row">
            <div class="conn-info">
              <strong class="conn-label">{{ c.label }}</strong>
              <span class="mono conn-acct">{{ c.accountId }}</span>
              <span class="muted conn-ds">{{
                c.defaultDataset ? `dataset: ${c.defaultDataset}` : "no default dataset"
              }}</span>
            </div>
            <div class="conn-actions">
              <button class="ghost" @click="openEdit(c)">Edit</button>
              <ConfirmButton @confirm="remove(c.id)" />
            </div>
          </div>
        </li>
      </ul>
    </div>
    <p v-else-if="!adding" class="muted">No connections yet. Add one to get started.</p>
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

.conn-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
}
.conn-item {
  padding: var(--space-md) 0;
  border-top: 1px solid var(--line-soft);
  min-width: 0;
}
.conn-item:first-child {
  border-top: none;
}
.conn-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}
.conn-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.conn-acct {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conn-ds {
  font-size: var(--text-xs);
}
.conn-actions {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
  margin-left: auto;
}
.edit-form {
  max-width: 520px;
}

@media (max-width: 560px) {
  .conn-row {
    flex-direction: column;
    align-items: stretch;
  }
  .conn-actions {
    margin-left: 0;
  }
}
</style>
