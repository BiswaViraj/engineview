<script setup lang="ts">
import { signUp } from "~/lib/auth-client";

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

async function submit() {
  busy.value = true;
  error.value = "";
  const { error: err } = await signUp.email({
    name: name.value,
    email: email.value,
    password: password.value,
  });
  busy.value = false;
  if (err) {
    error.value = err.message || "Could not create the account.";
    return;
  }
  await navigateTo("/");
}
</script>

<template>
  <div class="auth-wrap card stack">
    <h2 style="margin: 0">Create your account</h2>
    <form class="stack" @submit.prevent="submit">
      <label>
        Name
        <input v-model="name" type="text" required autocomplete="name" />
      </label>
      <label>
        Email
        <input v-model="email" type="email" required autocomplete="email" />
      </label>
      <label>
        Password
        <input v-model="password" type="password" required minlength="8" autocomplete="new-password" />
      </label>
      <button type="submit" :disabled="busy">{{ busy ? "Creating..." : "Create account" }}</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
    <p class="muted">Already have an account? <NuxtLink to="/login">Sign in</NuxtLink></p>
  </div>
</template>
