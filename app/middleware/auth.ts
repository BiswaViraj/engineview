// Protects a page: redirects to /login (remembering where you were headed) when
// there is no valid session. Uses a direct, uncached $fetch to the session
// endpoint (forwarding cookies during SSR) so it reflects a just-completed
// login or signup rather than a stale cached result.
export default defineNuxtRouteMiddleware(async (to) => {
  const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
  const session = await $fetch("/api/auth/get-session", { headers }).catch(() => null);
  if (!session) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
