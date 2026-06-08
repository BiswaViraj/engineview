<script setup lang="ts">
import { authClient } from "~/lib/auth-client";

definePageMeta({ middleware: "auth" });

const { data: session } = await authClient.useSession(useFetch);
</script>

<template>
  <div class="stack">
    <h2 style="margin: 0">
      Welcome<span v-if="session?.user?.name">, {{ session.user.name }}</span>
    </h2>
    <div class="card stack">
      <p class="muted">
        The query runner is set up next. First add a Cloudflare connection under
        <NuxtLink to="/settings">Connections</NuxtLink>, then write SQL against your Analytics
        Engine datasets here.
      </p>
    </div>
  </div>
</template>
