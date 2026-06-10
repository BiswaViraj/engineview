<script setup lang="ts">
import { authClient, signOut } from "~/lib/auth-client";

const { data: session } = await authClient.useSession(useFetch);

const route = useRoute();
const isActive = (path: string) =>
  path === "/" ? route.path === "/" : route.path.startsWith(path);

async function onSignOut() {
  await signOut();
  await navigateTo("/login");
}
</script>

<template>
  <div>
    <header class="app-header">
      <NuxtLink to="/" class="brand" aria-label="EngineView home">
        <span class="brand-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="0.5" y="8" width="3" height="5.5" rx="1" fill="var(--accent)" />
            <rect x="5.5" y="4" width="3" height="9.5" rx="1" fill="var(--accent)" />
            <rect x="10.5" y="0.5" width="3" height="13" rx="1" fill="var(--accent)" />
          </svg>
        </span>
        EngineView
      </NuxtLink>
      <nav v-if="session">
        <NuxtLink to="/" class="nav-link" :class="{ active: isActive('/') }">Query</NuxtLink>
        <NuxtLink to="/dashboards" class="nav-link" :class="{ active: isActive('/dashboards') }">
          Dashboards
        </NuxtLink>
        <NuxtLink to="/settings" class="nav-link" :class="{ active: isActive('/settings') }">
          Connections
        </NuxtLink>
        <span class="nav-user">{{ session.user.email }}</span>
        <button class="ghost" @click="onSignOut">Sign out</button>
      </nav>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
