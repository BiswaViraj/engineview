<script setup lang="ts">
import { signIn, authClient } from "~/lib/auth-client";

const route = useRoute();
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);
const needsVerification = ref(false);
const resendNote = ref("");

async function submit() {
  busy.value = true;
  error.value = "";
  needsVerification.value = false;
  const { error: err } = await signIn.email({ email: email.value, password: password.value });
  busy.value = false;
  if (err) {
    if (err.status === 403 || err.code === "EMAIL_NOT_VERIFIED") {
      needsVerification.value = true;
      error.value = "Please verify your email before signing in.";
    } else {
      error.value = err.message || "Could not sign in.";
    }
    return;
  }
  const redirect = (route.query.redirect as string) || "/apps";
  await navigateTo(redirect);
}

async function resend() {
  resendNote.value = "";
  await authClient.sendVerificationEmail({ email: email.value, callbackURL: "/" });
  resendNote.value = "Verification email sent. Check your inbox.";
}
</script>

<template>
  <div class="auth-wrap card stack">
    <h1>Sign in</h1>
    <form class="stack" @submit.prevent="submit">
      <label>
        Email
        <input v-model="email" type="email" required autocomplete="email" />
      </label>
      <label>
        Password
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>
      <button type="submit" :disabled="busy">{{ busy ? "Signing in…" : "Sign in" }}</button>
      <p v-if="error" class="error">{{ error }}</p>
      <button v-if="needsVerification" type="button" class="ghost" @click="resend">
        Resend verification email
      </button>
      <p v-if="resendNote" class="muted">{{ resendNote }}</p>
    </form>
    <p class="muted">
      <NuxtLink to="/forgot-password">Forgot password?</NuxtLink>
    </p>
    <p class="muted">No account? <NuxtLink to="/signup">Create one</NuxtLink></p>
  </div>
</template>
