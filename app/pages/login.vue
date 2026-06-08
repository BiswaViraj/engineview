<script setup lang="ts">
import { signIn } from "~/lib/auth-client";

const route = useRoute();
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

async function submit() {
  busy.value = true;
  error.value = "";
  const { error: err } = await signIn.email({ email: email.value, password: password.value });
  busy.value = false;
  if (err) {
    error.value = err.message || "Could not sign in.";
    return;
  }
  const redirect = (route.query.redirect as string) || "/";
  await navigateTo(redirect);
}
</script>

<template>
  <div class="auth-wrap card stack">
    <h2 style="margin: 0">Sign in</h2>
    <form class="stack" @submit.prevent="submit">
      <label>
        Email
        <input v-model="email" type="email" required autocomplete="email" />
      </label>
      <label>
        Password
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>
      <button type="submit" :disabled="busy">{{ busy ? "Signing in..." : "Sign in" }}</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <p class="muted">No account? <NuxtLink to="/signup">Create one</NuxtLink></p>
  </div>
</template>
