<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { GITHUB_URL } from "~/lib/site";

definePageMeta({ layout: "marketing" });

useHead({
  title: "EngineView — a dashboard for Cloudflare Analytics Engine",
});

const { data: session } = await authClient.useSession(useFetch);

// A few bar heights for the product-frame chart mock (top referrers shape).
const bars = [92, 64, 47, 38, 29, 22, 16, 11];
</script>

<template>
  <main class="landing">
    <!-- Hero ----------------------------------------------------------------->
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Open source · Self-hosted</span>
        <h1 class="hero-title">The dashboard Cloudflare Analytics Engine never shipped.</h1>
        <p class="hero-sub">
          Connect your Cloudflare account, write SQL against your Analytics Engine datasets, save
          the queries you reuse, and build charts and dashboards. Runs entirely on your own
          infrastructure.
        </p>
        <div class="hero-cta">
          <NuxtLink v-if="session" to="/query"><button>Open app</button></NuxtLink>
          <NuxtLink v-else to="/signup"><button>Get started</button></NuxtLink>
          <a :href="GITHUB_URL" target="_blank" rel="noopener"
            ><button class="ghost">View on GitHub</button></a
          >
        </div>
        <p class="hero-meta mono">MIT licensed · Deploys on Cloudflare or any Node host</p>
      </div>

      <!-- Bespoke product frame (not a screenshot) -->
      <div class="frame" aria-hidden="true">
        <div class="frame-bar">
          <span class="frame-chip">production</span>
          <span class="mono frame-path">pageviews</span>
        </div>
        <pre
          class="frame-code"
        ><span class="k">SELECT</span> blob2 <span class="k">AS</span> referrer,
       <span class="fn">SUM</span>(_sample_interval) <span class="k">AS</span> views
<span class="k">FROM</span> pageviews
<span class="k">WHERE</span> timestamp &gt; <span class="mac">$SINCE</span>
<span class="k">GROUP BY</span> referrer
<span class="k">ORDER BY</span> views <span class="k">DESC</span></pre>
        <div class="frame-chart">
          <div v-for="(h, i) in bars" :key="i" class="frame-bar-col" :style="{ height: `${h}%` }" />
        </div>
      </div>
    </section>

    <!-- Problem / positioning ----------------------------------------------->
    <section class="band">
      <p class="band-text">
        Cloudflare Analytics Engine is a fast time-series store, but it ships no UI and no way to
        save a query. EngineView is the missing layer on top.
      </p>
    </section>

    <!-- Features ------------------------------------------------------------>
    <section class="features">
      <div class="feature feature-wide">
        <div class="feature-copy">
          <span class="eyebrow">Query</span>
          <h2>Write SQL, get answers</h2>
          <p>
            A real editor with syntax highlighting and Cmd+Enter to run. Results land in a fast,
            sortable table you can export to CSV, or flip to a chart in one click.
          </p>
        </div>
        <div class="mini-editor mono">
          <span
            ><span class="k">SELECT</span> colo, <span class="fn">count</span>()
            <span class="k">AS</span> n</span
          >
          <span><span class="k">FROM</span> requests</span>
          <span
            ><span class="k">GROUP BY</span> colo <span class="k">ORDER BY</span> n
            <span class="k">DESC</span></span
          >
        </div>
      </div>

      <div class="feature">
        <span class="eyebrow">Visualize</span>
        <h2>Charts and dashboards</h2>
        <p>
          Turn any result into a line, area, or bar chart. Pin saved queries as panels on a
          dashboard with a shared time range, driven by a simple <code>$SINCE</code> macro.
        </p>
        <div class="chart-mini">
          <div v-for="(h, i) in bars.slice(0, 6)" :key="i" :style="{ height: `${h}%` }" />
        </div>
      </div>

      <div class="feature">
        <span class="eyebrow">Secure</span>
        <h2>Bring your own Cloudflare</h2>
        <p>
          Each user connects their own account. API tokens are encrypted at rest with AES-256-GCM
          and only ever decrypted on the server to run a query — never sent to the browser.
        </p>
        <div class="token-mock mono">
          <span class="lock" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke="var(--positive)" />
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="var(--positive)" />
            </svg>
          </span>
          cf_token ••••••••••••••••
        </div>
      </div>
    </section>

    <!-- Capability strip ---------------------------------------------------->
    <section class="caps">
      <span class="cap">Saved queries</span>
      <span class="cap">CSV export</span>
      <span class="cap">Multi-user accounts</span>
      <span class="cap">Email verification</span>
      <span class="cap">Shared time ranges</span>
      <span class="cap">Postgres-backed</span>
    </section>

    <!-- Self-host ----------------------------------------------------------->
    <section class="selfhost">
      <div class="selfhost-copy">
        <span class="eyebrow">Self-host</span>
        <h2>Yours, end to end</h2>
        <p>
          No SaaS in the middle. Run it with Docker Compose or any Node host, point it at a Postgres
          database, and you own every byte. It is open source under the MIT license.
        </p>
      </div>
      <div class="terminal" aria-hidden="true">
        <div class="term-bar"><span class="mono muted">bash</span></div>
        <pre class="term-body"><span class="prompt">$</span> git clone engineview && cd engineview
<span class="prompt">$</span> docker compose up --build
<span class="cmt"># EngineView is live at http://localhost:3000</span></pre>
      </div>
    </section>

    <!-- Final CTA ----------------------------------------------------------->
    <section class="final">
      <h2 class="final-title">Deploy it on your own account.</h2>
      <div class="hero-cta">
        <NuxtLink v-if="session" to="/query"><button>Open app</button></NuxtLink>
        <NuxtLink v-else to="/signup"><button>Get started</button></NuxtLink>
        <a :href="GITHUB_URL" target="_blank" rel="noopener"
          ><button class="ghost">View on GitHub</button></a
        >
      </div>
    </section>
  </main>
</template>

<style scoped>
.landing {
  display: block;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 clamp(var(--space-lg), 5vw, var(--space-3xl));
}

/* Hero ----------------------------------------------------------------------*/
.hero {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(var(--space-xl), 5vw, var(--space-3xl));
  align-items: center;
  padding: clamp(var(--space-2xl), 7vw, 96px) 0 var(--space-3xl);
  position: relative;
}
.hero::before {
  content: "";
  position: absolute;
  inset: -10% -40% 30% -10%;
  z-index: -1;
  background-image: radial-gradient(var(--line-soft) 1px, transparent 1px);
  background-size: 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 30% 30%, #000 0%, transparent 70%);
  mask-image: radial-gradient(ellipse 70% 60% at 30% 30%, #000 0%, transparent 70%);
  opacity: 0.6;
}
.hero-copy {
  display: grid;
  gap: var(--space-md);
  align-content: start;
}
.hero-title {
  font-size: clamp(2.2rem, 5.2vw, 3.6rem);
  line-height: 1.04;
  letter-spacing: -0.03em;
  max-width: 14ch;
  font-weight: 700;
}
.hero-sub {
  font-size: var(--text-md);
  color: var(--text-2);
  line-height: 1.6;
  max-width: 52ch;
}
.hero-cta {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-2xs);
}
.hero-cta button {
  padding: 10px 18px;
  font-size: var(--text-base);
}
.hero-meta {
  font-size: var(--text-xs);
  color: var(--text-3);
  margin-top: var(--space-2xs);
}

/* Product frame -------------------------------------------------------------*/
.frame {
  background: var(--surface-1);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
  overflow: hidden;
  transform: rotate(0.6deg);
}
.frame-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 14px;
  border-bottom: 1px solid var(--line-soft);
  background: var(--surface-2);
}
.frame-chip {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  color: var(--accent);
  background: var(--accent-quiet);
}
.frame-path {
  font-size: var(--text-xs);
  color: var(--text-3);
}
.frame-code {
  margin: 0;
  padding: var(--space-md) var(--space-lg);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--text-2);
  white-space: pre;
  overflow-x: auto;
}
.frame-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 96px;
  padding: 0 var(--space-lg) var(--space-lg);
}
.frame-bar-col {
  flex: 1;
  background: var(--accent);
  border-radius: 3px 3px 0 0;
  opacity: 0.9;
}
.frame-bar-col:nth-child(2) {
  background: #e3b341;
}

.k {
  color: #7aa2ff;
}
.fn {
  color: #43c4c0;
}
.mac {
  color: #e3b341;
  font-weight: 600;
}

/* Positioning band ----------------------------------------------------------*/
.band {
  padding: var(--space-2xl) 0;
  border-top: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
}
.band-text {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2.6vw, 1.75rem);
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.35;
  max-width: 36ch;
  color: var(--text);
}

/* Features ------------------------------------------------------------------*/
.features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  padding: var(--space-2xl) 0;
}
.feature {
  display: grid;
  gap: var(--space-sm);
  align-content: start;
  padding: var(--space-xl);
  background: var(--surface-1);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
}
.feature h2 {
  font-size: var(--text-lg);
}
.feature p {
  color: var(--text-2);
  line-height: 1.6;
  max-width: 46ch;
}
.feature-wide {
  grid-column: 1 / -1;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: var(--space-2xl);
}
.feature-copy {
  display: grid;
  gap: var(--space-sm);
}
.mini-editor {
  display: grid;
  gap: 4px;
  padding: var(--space-lg);
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--text-2);
}
.chart-mini {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  height: 72px;
  margin-top: var(--space-2xs);
}
.chart-mini > div {
  flex: 1;
  background: var(--accent);
  border-radius: 3px 3px 0 0;
  opacity: 0.85;
}
.chart-mini > div:nth-child(3) {
  background: #43c4c0;
}
.token-mock {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-2xs);
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-3);
}
.lock {
  display: inline-flex;
}

/* Capability strip ----------------------------------------------------------*/
.caps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding-bottom: var(--space-2xl);
}
.cap {
  font-size: var(--text-sm);
  color: var(--text-2);
  padding: 6px 13px;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
}

/* Self-host -----------------------------------------------------------------*/
.selfhost {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(var(--space-xl), 5vw, var(--space-2xl));
  align-items: center;
  padding: var(--space-2xl) 0;
  border-top: 1px solid var(--line-soft);
}
.selfhost-copy {
  display: grid;
  gap: var(--space-sm);
}
.selfhost-copy h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: -0.02em;
}
.selfhost-copy p {
  color: var(--text-2);
  line-height: 1.6;
  max-width: 44ch;
}
.terminal {
  background: var(--surface-1);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-1);
}
.term-bar {
  padding: 9px 14px;
  border-bottom: 1px solid var(--line-soft);
  background: var(--surface-2);
}
.term-body {
  margin: 0;
  padding: var(--space-lg);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.9;
  color: var(--text);
  white-space: pre-wrap;
  overflow-x: auto;
}
.prompt {
  color: var(--accent);
  user-select: none;
  margin-right: 8px;
}
.cmt {
  color: var(--text-3);
}

/* Final CTA -----------------------------------------------------------------*/
.final {
  display: grid;
  gap: var(--space-lg);
  place-items: center;
  text-align: center;
  padding: clamp(var(--space-2xl), 6vw, 88px) 0;
  border-top: 1px solid var(--line-soft);
}
.final-title {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  letter-spacing: -0.025em;
  max-width: 18ch;
}

/* Responsive ----------------------------------------------------------------*/
@media (max-width: 860px) {
  .hero,
  .features,
  .feature-wide,
  .selfhost {
    grid-template-columns: 1fr;
  }
  .frame {
    transform: none;
  }
  .selfhost {
    gap: var(--space-xl);
  }
}
</style>
