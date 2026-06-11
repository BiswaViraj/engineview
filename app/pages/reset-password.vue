<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const route = useRoute();
const token = computed(() => (route.query.token as string) || "");
const invalid = computed(() => route.query.error === "INVALID_TOKEN" || !token.value);

const password = ref("");
const busy = ref(false);
const error = ref("");
const done = ref(false);

async function submit() {
  busy.value = true;
  error.value = "";
  const { error: err } = await authClient.resetPassword({
    newPassword: password.value,
    token: token.value,
  });
  busy.value = false;
  if (err) {
    error.value = err.message || "Could not reset the password.";
    return;
  }
  done.value = true;
}
</script>

<template>
  <div class="auth-wrap card stack">
    <template v-if="invalid">
      <h1>Link expired</h1>
      <p class="muted">This password reset link is invalid or has expired.</p>
      <NuxtLink to="/forgot-password">Request a new one</NuxtLink>
    </template>

    <template v-else-if="done">
      <h1>Password updated</h1>
      <p class="muted">Your password has been changed.</p>
      <NuxtLink to="/login">Sign in</NuxtLink>
    </template>

    <template v-else>
      <h1>Choose a new password</h1>
      <form class="stack" @submit.prevent="submit">
        <label>
          New password
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </label>
        <button type="submit" :disabled="busy">{{ busy ? "Saving…" : "Set password" }}</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </template>
  </div>
</template>
