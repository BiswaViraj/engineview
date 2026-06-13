<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { GITHUB_URL } from "~/lib/site";

const { data: session } = await authClient.useSession(useFetch);
</script>

<template>
  <div class="marketing">
    <a href="#main" class="skip-link">Skip to content</a>
    <header class="m-header">
      <NuxtLink to="/" class="brand" aria-label="EngineView home">
        <span class="brand-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="0.5" y="8" width="3" height="5.5" rx="1" fill="var(--accent)" />
            <rect x="5.5" y="4" width="3" height="9.5" rx="1" fill="var(--accent)" />
            <rect x="10.5" y="0.5" width="3" height="13" rx="1" fill="var(--accent)" />
          </svg>
        </span>
        <span class="brand-label">EngineView</span>
      </NuxtLink>
      <nav class="m-nav">
        <a :href="GITHUB_URL" target="_blank" rel="noopener" class="m-link">GitHub</a>
        <template v-if="session">
          <NuxtLink to="/apps"><button>Open app</button></NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="m-link">Sign in</NuxtLink>
          <NuxtLink to="/signup"><button>Get started</button></NuxtLink>
        </template>
      </nav>
    </header>

    <slot />

    <footer class="m-footer">
      <div class="m-footer-inner">
        <NuxtLink to="/" class="brand" aria-label="EngineView home">
          <span class="brand-mark" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0.5" y="8" width="3" height="5.5" rx="1" fill="var(--accent)" />
              <rect x="5.5" y="4" width="3" height="9.5" rx="1" fill="var(--accent)" />
              <rect x="10.5" y="0.5" width="3" height="13" rx="1" fill="var(--accent)" />
            </svg>
          </span>
          <span class="brand-label">EngineView</span>
        </NuxtLink>
        <span class="muted"
          >A self-hosted dashboard for Cloudflare Analytics Engine. MIT licensed.</span
        >
        <span class="spacer" />
        <a :href="GITHUB_URL" target="_blank" rel="noopener" class="m-link">GitHub</a>
        <NuxtLink to="/login" class="m-link">Sign in</NuxtLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.m-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  height: 60px;
  padding: 0 clamp(var(--space-lg), 5vw, var(--space-3xl));
  background: color-mix(in oklch, var(--bg) 82%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line-soft);
}
.m-nav {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  font-size: var(--text-sm);
  font-weight: 500;
}
.m-link {
  color: var(--text-2);
}
.m-link:hover {
  color: var(--text);
  text-decoration: none;
}
.m-footer {
  border-top: 1px solid var(--line-soft);
  margin-top: var(--space-3xl);
}
.m-footer-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--space-xl) clamp(var(--space-lg), 5vw, var(--space-3xl));
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .m-footer-inner .spacer {
    display: none;
  }
}
</style>
