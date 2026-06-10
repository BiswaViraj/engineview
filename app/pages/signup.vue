<script setup lang="ts">
import { signUp } from "~/lib/auth-client";

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);
const sent = ref(false);

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
  // Email verification is required, so there is no session yet. Tell the user to
  // check their inbox rather than sending them to a gated page.
  sent.value = true;
}
</script>

<template>
  <div class="auth-wrap card stack">
    <template v-if="sent">
      <h1>Check your email</h1>
      <p class="muted">
        We sent a verification link to <strong>{{ email }}</strong
        >. Click it to activate your account, then sign in.
      </p>
      <NuxtLink to="/login">Back to sign in</NuxtLink>
    </template>

    <template v-else>
      <h1>Create your account</h1>
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
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
          />
        </label>
        <button type="submit" :disabled="busy">
          {{ busy ? "Creating..." : "Create account" }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <p class="muted">Already have an account? <NuxtLink to="/login">Sign in</NuxtLink></p>
    </template>
  </div>
</template>
