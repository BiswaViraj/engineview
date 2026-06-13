<script setup lang="ts">
import { type authClient, signOut } from "~/lib/auth-client";

type Session = typeof authClient.$Infer.Session;

// Source the session from a payload-backed useFetch (not better-auth's
// useSession, whose client store re-initialises empty and syncs only after
// mount) so session-gated chrome hydrates identically server and client.
const { data: session } = await useFetch<Session>("/api/auth/get-session", {
  headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
});

const route = useRoute();
const isActive = (path: string) =>
  path === "/" ? route.path === "/" : route.path.startsWith(path);

const currentAppId = computed(() => route.params.appId as string | undefined);

async function onSignOut() {
  await signOut();
  await navigateTo("/login");
}
</script>

<template>
  <div>
    <a href="#main" class="skip-link">Skip to content</a>
    <header class="app-header">
      <NuxtLink to="/apps" class="brand" aria-label="EngineView home">
        <span class="brand-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="0.5" y="8" width="3" height="5.5" rx="1" fill="var(--accent)" />
            <rect x="5.5" y="4" width="3" height="9.5" rx="1" fill="var(--accent)" />
            <rect x="10.5" y="0.5" width="3" height="13" rx="1" fill="var(--accent)" />
          </svg>
        </span>
        <span class="brand-label">EngineView</span>
      </NuxtLink>
      <nav v-if="session">
        <NuxtLink to="/apps" class="nav-link" :class="{ active: isActive('/apps') }">Apps</NuxtLink>
        <AppSwitcher v-if="currentAppId" :current-id="currentAppId" />
        <NuxtLink to="/settings" class="nav-link" :class="{ active: isActive('/settings') }">
          Connections
        </NuxtLink>
        <span class="nav-user">{{ session.user.email }}</span>
        <button class="ghost" @click="onSignOut">Sign out</button>
      </nav>
    </header>
    <main id="main" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
