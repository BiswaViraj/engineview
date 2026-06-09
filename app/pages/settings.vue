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

const form = reactive({ id: "", label: "", accountId: "", apiToken: "", defaultDataset: "" });
const error = ref("");
const busy = ref(false);
const editing = computed(() => Boolean(form.id));

function reset() {
  form.id = "";
  form.label = "";
  form.accountId = "";
  form.apiToken = "";
  form.defaultDataset = "";
  error.value = "";
}

async function submit() {
  busy.value = true;
  error.value = "";
  try {
    if (editing.value) {
      await $fetch(`/api/connections/${form.id}`, {
        method: "PUT",
        body: {
          label: form.label,
          accountId: form.accountId,
          defaultDataset: form.defaultDataset,
          ...(form.apiToken ? { apiToken: form.apiToken } : {}),
        },
      });
    } else {
      await $fetch("/api/connections", {
        method: "POST",
        body: {
          label: form.label,
          accountId: form.accountId,
          apiToken: form.apiToken,
          defaultDataset: form.defaultDataset,
        },
      });
    }
    reset();
    await refresh();
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }; statusMessage?: string };
    error.value =
      err?.data?.statusMessage || err?.statusMessage || "Could not save the connection.";
  } finally {
    busy.value = false;
  }
}

function edit(c: Connection) {
  form.id = c.id;
  form.label = c.label;
  form.accountId = c.accountId;
  form.defaultDataset = c.defaultDataset ?? "";
  form.apiToken = "";
  error.value = "";
}

async function remove(id: string) {
  await $fetch(`/api/connections/${id}`, { method: "DELETE" });
  if (form.id === id) reset();
  await refresh();
}
</script>

<template>
  <div class="stack">
    <h2 style="margin: 0">Cloudflare connections</h2>
    <p class="muted">
      Connect a Cloudflare account so you can query its Analytics Engine datasets. The API token is
      encrypted before it is stored and is never shown again. Create one in the Cloudflare dashboard
      with the "Account Analytics: Read" permission.
    </p>

    <div class="card stack">
      <h3 style="margin: 0">{{ editing ? "Edit connection" : "Add a connection" }}</h3>
      <form class="stack" @submit.prevent="submit">
        <label>
          Label
          <input v-model="form.label" required placeholder="Production account" />
        </label>
        <label>
          Cloudflare account id
          <input v-model="form.accountId" required placeholder="023e105f4ecef8ad9ca31a8372d0c353" />
        </label>
        <label>
          API token
          <input
            v-model="form.apiToken"
            type="password"
            :required="!editing"
            :placeholder="
              editing ? 'Leave blank to keep the current token' : 'Analytics Engine read token'
            "
          />
        </label>
        <label>
          Default dataset (optional)
          <input v-model="form.defaultDataset" placeholder="my_dataset" />
        </label>
        <div class="row">
          <button type="submit" :disabled="busy">
            {{ busy ? "Saving..." : editing ? "Save changes" : "Add connection" }}
          </button>
          <button v-if="editing" type="button" class="ghost" @click="reset">Cancel</button>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>

    <div v-if="connections && connections.length" class="card">
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Account id</th>
            <th>Default dataset</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in connections" :key="c.id">
            <td>{{ c.label }}</td>
            <td>{{ c.accountId }}</td>
            <td>{{ c.defaultDataset || "none" }}</td>
            <td class="row" style="border: 0; justify-content: flex-end">
              <button class="ghost" @click="edit(c)">Edit</button>
              <button class="ghost" @click="remove(c.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="muted">No connections yet. Add one above to get started.</p>
  </div>
</template>
