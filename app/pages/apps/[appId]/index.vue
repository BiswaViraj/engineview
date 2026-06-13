<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const route = useRoute();
navigateTo(`/apps/${route.params.appId}/dashboards`, { replace: true });
</script>

<template>
  <div />
</template>
