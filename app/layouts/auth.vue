<script setup lang="ts">
// Minimal shell for the signed-out auth screens (sign in, sign up, password
// reset). No app nav — those pages have no session — and the logo goes to the
// landing page rather than the app.
</script>

<template>
  <div>
    <a href="#main" class="skip-link">Skip to content</a>
    <header class="app-header">
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
    </header>
    <main id="main" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
