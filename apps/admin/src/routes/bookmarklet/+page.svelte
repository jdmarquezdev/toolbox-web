<script lang="ts">
  import { adminPath } from "$lib/paths";

  let { data } = $props();
  const captureBase = String((data as any).captureBase ?? "");
  const bookmarkletCode = `javascript:(()=>{window.location.href='${captureBase}?url='+encodeURIComponent(window.location.href);})();`;
  const bookmarkletHref = bookmarkletCode;
  let copied = $state(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1600);
    } catch {
      copied = false;
    }
  }
</script>

<section class="section-gap">
  <div class="row-between">
    <h1 class="page-title">Bookmarklet</h1>
    <a href={adminPath("/")} class="btn primary icon-only-btn" aria-label="Volver al panel" title="Volver al panel">
      <span class="icon-mask icon-back" aria-hidden="true"></span>
    </a>
  </div>
</section>

<section class="card form-block grid">
  <p class="muted" style="margin:0;">
    Arrastra el botón a tu barra de marcadores. Después, al usarlo desde cualquier web, guardará esa URL en inbox.
  </p>

  <div class="action-cluster bookmarklet-actions">
    <a class="btn primary" href={bookmarkletHref}>Guardar en Toolbox</a>
  </div>

  <p class="muted" style="margin:0;">Si prefieres crear el marcador manualmente, copia este código:</p>

  <div class="bookmarklet-code-wrap">
    <button
      class="btn primary icon-only-btn bookmarklet-copy-btn"
      type="button"
      aria-label="Copiar código"
      title="Copiar código"
      onclick={copyCode}
    >
      <span class="icon-mask icon-copy" aria-hidden="true"></span>
    </button>
    {#if copied}
      <p class="muted bookmarklet-copied">Copiado.</p>
    {/if}

    <label class="field-grid">
    <span class="field-label">Código bookmarklet</span>
    <textarea readonly rows="4">{bookmarkletCode}</textarea>
    </label>
  </div>
</section>
