<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

const email = ref("");
const busy = ref(false);
const sent = ref(false);
const error = ref("");

async function submit() {
  busy.value = true;
  error.value = "";
  const { error: err } = await authClient.requestPasswordReset({
    email: email.value,
    redirectTo: "/reset-password",
  });
  busy.value = false;
  if (err) {
    error.value = err.message || "Could not send the reset email.";
    return;
  }
  sent.value = true;
}
</script>

<template>
  <div class="auth-wrap card stack">
    <template v-if="sent">
      <h1>Check your email</h1>
      <p class="muted">
        If an account exists for <strong>{{ email }}</strong
        >, a password reset link is on its way.
      </p>
      <NuxtLink to="/login">Back to sign in</NuxtLink>
    </template>

    <template v-else>
      <h1>Reset your password</h1>
      <form class="stack" @submit.prevent="submit">
        <label>
          Email
          <input v-model="email" type="email" required autocomplete="email" />
        </label>
        <button type="submit" :disabled="busy">
          {{ busy ? "Sending…" : "Send reset link" }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <p class="muted"><NuxtLink to="/login">Back to sign in</NuxtLink></p>
    </template>
  </div>
</template>
