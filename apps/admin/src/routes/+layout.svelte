<script lang="ts">
  import "$lib/styles.css";
  import { ADMIN_BASE_PATH, adminPath } from "$lib/paths";
  let { children, data } = $props();
  let toastVisible = $state(false);
  let toastMessage = $state("");
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  const applyTheme = `
    (() => {
      const stored = localStorage.getItem("toolbox-theme");
      const dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", dark);
    })();
  `;

  $effect(() => {
    if (!data.toastMessage) return;

    toastMessage = data.toastMessage;
    toastVisible = true;

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
      toastVisible = false;
    }, 2400);

    if (typeof window !== "undefined") {
      const current = new URL(window.location.href);
      if (current.searchParams.has("toast")) {
        current.searchParams.delete("toast");
        const nextQuery = current.searchParams.toString();
        const nextUrl = `${current.pathname}${nextQuery ? `?${nextQuery}` : ""}${current.hash}`;
        window.history.replaceState({}, "", nextUrl);
      }
    }
  });

</script>

<svelte:head>
  <title>Toolbox Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap"
    rel="stylesheet"
  />
  <script>{@html applyTheme}</script>
</svelte:head>

<div class="shell">
  <header class="topbar">
    <div class="header-nav">
      <a href={ADMIN_BASE_PATH} class="header-brand">Toolbox Admin</a>
      {#if data.isAuthed}
        <a
          class={`header-link ${data.section === "tools" || data.pathname.startsWith("/tools/") ? "is-active" : ""}`}
          href={ADMIN_BASE_PATH}
        >
          Herramientas
        </a>
        <a class={`header-link ${data.section === "collections" ? "is-active" : ""}`} href={adminPath("/?section=collections")}>
          Colecciones
        </a>
      {/if}
      <a class="header-link" href="/" target="_blank" rel="noreferrer">PÚBLICO</a>
    </div>
    {#if data.isAuthed}
      <form method="post" action="/api/auth/logout">
        <button class="btn primary icon-only-btn" type="submit" aria-label="Cerrar sesión" title="Salir">
          <span class="icon-mask icon-logout" aria-hidden="true"></span>
        </button>
      </form>
    {/if}
  </header>
  {@render children()}
</div>

{#if toastVisible}
  <div class="save-toast" role="status" aria-live="polite">{toastMessage}</div>
{/if}
