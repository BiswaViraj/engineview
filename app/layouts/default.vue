<script setup lang="ts">
import { authClient, signOut, useSession } from "~/lib/auth-client";

const { data: session } = await authClient.useSession(useFetch);

async function onSignOut() {
  await signOut();
  await navigateTo("/login");
}
</script>

<template>
  <div>
    <header class="app-header">
      <NuxtLink to="/" class="brand">EngineView</NuxtLink>
      <nav v-if="session">
        <NuxtLink to="/">Query</NuxtLink>
        <NuxtLink to="/dashboards">Dashboards</NuxtLink>
        <NuxtLink to="/settings">Connections</NuxtLink>
        <span class="muted">{{ session.user.email }}</span>
        <button class="ghost" @click="onSignOut">Sign out</button>
      </nav>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
