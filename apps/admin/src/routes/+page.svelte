<script lang="ts">
  import { DragDropProvider, KeyboardSensor, PointerSensor } from "@dnd-kit-svelte/svelte";
  import { move } from "@dnd-kit/helpers";
  import { cubicInOut, cubicOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import SortableDropZone from "$lib/components/SortableDropZone.svelte";
  import SortableItem from "$lib/components/SortableItem.svelte";
  import { adminPath } from "$lib/paths";

  type ViewKey = "inbox" | "relevantes" | "archivadas" | "descartadas";
  type ModerationState = "inbox" | "relevant" | "archived" | "discarded";

  let { data } = $props();

  let selectedView = $state<ViewKey>(((data as any).selectedView as ViewKey) ?? "inbox");
  const activeSection = $derived(data.section === "collections" || data.section === "bookmarklet" ? data.section : "tools");
  let moderation = $state({
    inbox: [...data.inbox],
    relevant: [...data.relevant],
    archived: [...data.archived],
    discarded: [...data.discarded]
  });
  let collections = $state(data.collections.map((collection: any) => ({ ...collection })));
  let createCollectionName = $state("");
  let createCollectionSlug = $state("");
  let createCollectionSlugTouched = $state(false);
  let collectionSlugTouched = $state<Record<string, boolean>>({});
  let isSavingModeration = $state(false);
  const captureBase = String((data as any).captureBase ?? "");
  const bookmarkletCode = `javascript:(()=>{window.location.href='${captureBase}?url='+encodeURIComponent(window.location.href);})();`;
  const bookmarkletHref = bookmarkletCode;
  let copied = $state(false);
  const sensors = [
    PointerSensor,
    KeyboardSensor,
  ];

  const stateByView: Record<ViewKey, ModerationState> = {
    inbox: "inbox",
    relevantes: "relevant",
    archivadas: "archived",
    descartadas: "discarded"
  };

  const labelByState: Record<ModerationState, string> = {
    inbox: "Nuevo",
    relevant: "Relevantes",
    archived: "Archivadas",
    discarded: "Descartadas"
  };

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function mediaUrl(tool: { screenshotUrl?: string | null; ogImageUrl?: string | null; url: string }) {
    const candidate = tool.screenshotUrl ?? tool.ogImageUrl;
    if (!candidate) return null;

    try {
      return new URL(candidate, tool.url).toString();
    } catch {
      return null;
    }
  }

  function toolsForView(view: ViewKey) {
    return moderation[stateByView[view]];
  }

  function stateActionTargets(state: ModerationState): Array<{ value: "relevant" | "archived" | "discarded"; label: string }> {
    if (state === "inbox") return [{ value: "relevant", label: "Relevante" }, { value: "archived", label: "Archivar" }, { value: "discarded", label: "Descartar" }];
    if (state === "relevant") return [{ value: "archived", label: "Archivar" }, { value: "discarded", label: "Descartar" }];
    if (state === "archived") return [{ value: "relevant", label: "Relevante" }, { value: "discarded", label: "Descartar" }];
    return [{ value: "relevant", label: "Relevante" }, { value: "archived", label: "Archivar" }];
  }

  async function persistModerationOrder() {
    const items = (["inbox", "relevant", "archived", "discarded"] as const).flatMap((state) =>
      moderation[state].map((tool: any, index: number) => ({
        id: tool.id,
        moderationState: state,
        moderationPosition: index
      }))
    );

    isSavingModeration = true;
    try {
      await fetch(adminPath("/api/admin/tools/reorder"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items })
      });
    } finally {
      isSavingModeration = false;
    }
  }

  function onToolsDragOver(event: any) {
    const state = stateByView[selectedView];
    const updated = move(moderation[state], event);
    if (updated !== moderation[state]) {
      moderation[state] = updated;
    }
  }

  async function onToolsDragEnd(event: any) {
    const state = stateByView[selectedView];
    const updated = move(moderation[state], event);
    if (updated !== moderation[state]) {
      moderation[state] = updated;
    }
    await persistModerationOrder();
  }

  function onCollectionsDragOver(event: any) {
    const updated = move(collections, event);
    if (updated !== collections) {
      collections = updated;
    }
  }

  async function onCollectionsDragEnd(event: any) {
    const updated = move(collections, event);
    if (updated !== collections) {
      collections = updated;
    }
    await fetch(adminPath("/api/admin/collections/reorder"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: collections.map((item: any) => item.id) })
    });
  }

  function updateCreateCollectionName(value: string) {
    createCollectionName = value;
    if (!createCollectionSlugTouched) {
      createCollectionSlug = slugify(value);
    }
  }

  function updateCollectionName(collectionId: string, value: string, event: Event) {
    if (collectionSlugTouched[collectionId]) return;
    const form = (event.currentTarget as HTMLInputElement).form;
    const slugInput = form?.querySelector('input[name="slug"]') as HTMLInputElement | null;
    if (slugInput) {
      slugInput.value = slugify(value);
    }
  }

  function markCollectionSlugTouched(collectionId: string) {
    collectionSlugTouched = { ...collectionSlugTouched, [collectionId]: true };
  }

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

  $effect(() => {
    selectedView = (((data as any).selectedView as ViewKey) ?? "inbox");
  });
</script>

{#if activeSection === "tools"}
<div class="admin-section" in:fade={{ duration: 220, delay: 140, easing: cubicOut }} out:fade={{ duration: 140, easing: cubicInOut }}>
<section class="grid section-gap">
  {#if isSavingModeration}
    <p class="muted">Guardando orden...</p>
  {/if}

  <form method="post" action="?/addTool" class="card tool-form form-block">
    <input name="url" required placeholder="https://..." />
    <input name="notesPrivate" placeholder="Nota privada opcional" />
    <button class="btn primary icon-only-btn" type="submit" aria-label="Guardar URL" title="Guardar URL">
      <span class="icon-mask icon-save" aria-hidden="true"></span>
    </button>
  </form>

</section>

<section class="section-gap">
  <div class="view-switcher" role="tablist" aria-label="Vista de moderación">
    <a
      class={`switch-btn ${selectedView === "inbox" ? "is-active" : ""}`}
      href={adminPath("/?view=inbox")}
      role="tab"
      aria-selected={selectedView === "inbox"}
    >
      Nuevo ({moderation.inbox.length})
    </a>
    <a
      class={`switch-btn ${selectedView === "relevantes" ? "is-active" : ""}`}
      href={adminPath("/?view=relevantes")}
      role="tab"
      aria-selected={selectedView === "relevantes"}
    >
      Relevantes ({moderation.relevant.length})
    </a>
    <a
      class={`switch-btn ${selectedView === "archivadas" ? "is-active" : ""}`}
      href={adminPath("/?view=archivadas")}
      role="tab"
      aria-selected={selectedView === "archivadas"}
    >
      Archivadas ({moderation.archived.length})
    </a>
    <a
      class={`switch-btn ${selectedView === "descartadas" ? "is-active" : ""}`}
      href={adminPath("/?view=descartadas")}
      role="tab"
      aria-selected={selectedView === "descartadas"}
    >
      Descartadas ({moderation.discarded.length})
    </a>
  </div>
</section>

{#key selectedView}
  <section
    id={selectedView}
    class="section-gap"
    aria-label="Listado moderado"
    in:fly={{ x: 18, duration: 220, easing: cubicOut, opacity: 0.2 }}
    out:fly={{ x: -18, duration: 180, easing: cubicInOut, opacity: 0.2 }}
  >
    <DragDropProvider {sensors} onDragOver={onToolsDragOver} onDragEnd={onToolsDragEnd}>
    <SortableDropZone id={`tools-${selectedView}`} type="column" accept="item" class="admin-card-grid">
      {#if toolsForView(selectedView).length === 0}
        <article class="card form-block muted">No hay herramientas en {labelByState[stateByView[selectedView]].toLowerCase()}.</article>
      {:else}
      {#each toolsForView(selectedView) as tool, index (tool.id)}
        <SortableItem
          class="sortable-grid-item"
          id={tool.id}
          index={() => index}
          group={`tools-${selectedView}`}
          type="item"
          data={{ group: `tools-${selectedView}` }}
        >
        <article
          class="tool-card"
          in:fly={{ y: 4, duration: 280, easing: cubicOut, opacity: 0.25 }}
        >
          <a class="tool-media-link" href={tool.url} target="_blank" rel="noreferrer" title="Abrir fuente" draggable="false">
            <div class="tool-media">
                {#if mediaUrl(tool)}
                  <img src={mediaUrl(tool) ?? undefined} alt={tool.title ?? "Preview"} loading="lazy" draggable="false" />
                {:else}
                  <div class="tool-placeholder">{(tool.title ?? "AI").slice(0, 2)}</div>
                {/if}
              </div>
            </a>

            <div class="tool-content">
              <h3 class="tool-name">{tool.title ?? tool.url}</h3>
              <p class="tool-meta">{tool.sourceType}</p>
              <p class="tool-desc">{tool.description ?? "Sin descripción"}</p>
              <div class="tool-footer">
                <div class="state-actions">
                  {#each stateActionTargets(stateByView[selectedView]) as action}
                    <form method="post" action="?/setState">
                      <input type="hidden" name="id" value={tool.slug ?? tool.id} />
                      <input type="hidden" name="state" value={action.value} />
                      <input type="hidden" name="view" value={selectedView} />
                      <button class="btn btn-xs" type="submit">{action.label}</button>
                    </form>
                  {/each}
                </div>
                <a
                  href={adminPath(`/tools/${tool.slug ?? tool.id}`)}
                  class="btn primary icon-only-btn"
                  aria-label="Editar ficha"
                  title="Editar ficha"
                >
                  <span class="icon-mask icon-edit" aria-hidden="true"></span>
                </a>
              </div>
            </div>
          </article>
        </SortableItem>
        {/each}
      {/if}
    </SortableDropZone>
    </DragDropProvider>
  </section>
{/key}

 </div>
{:else if activeSection === "collections"}
<div class="admin-section" in:fade={{ duration: 220, delay: 140, easing: cubicOut }} out:fade={{ duration: 140, easing: cubicInOut }}>
<section class="section-gap">
  <form method="post" action="?/createCollection" class="card form-block collection-create-form">
    <input
      name="name"
      required
      placeholder="Nombre de colección"
      bind:value={createCollectionName}
      oninput={(event) => updateCreateCollectionName((event.currentTarget as HTMLInputElement).value)}
    />
    <input
      name="slug"
      placeholder="slug-opcional"
      bind:value={createCollectionSlug}
      oninput={() => (createCollectionSlugTouched = true)}
    />
    <input name="description" placeholder="Descripción" />
    <label class="check-inline"><input type="checkbox" name="isPublic" checked /> Pública</label>
    <button class="btn primary icon-only-btn" type="submit" aria-label="Crear colección" title="Crear colección">
      <span class="icon-mask icon-add" aria-hidden="true"></span>
    </button>
  </form>
</section>

<section class="section-gap">
  <DragDropProvider {sensors} onDragOver={onCollectionsDragOver} onDragEnd={onCollectionsDragEnd}>
  <SortableDropZone id="collections-list" type="column" accept="item" class="collection-admin-grid">
  {#if collections.length === 0}
    <article class="card form-block muted">No hay colecciones creadas.</article>
  {:else}
    {#each collections as collection, index (collection.id)}
      <SortableItem
        class="sortable-grid-item"
        id={collection.id}
        index={() => index}
        group="collections-list"
        type="item"
        data={{ group: "collections-list" }}
      >
      <article
        class="card form-block collection-admin-card"
        in:fly={{ y: 4, duration: 280, easing: cubicOut, opacity: 0.25 }}
      >
        <form method="post" action="?/updateCollection" class="grid">
          <input type="hidden" name="id" value={collection.id} />
          <label class="field-grid">
            <span class="field-label">Nombre</span>
            <input
              name="name"
              value={collection.name}
              oninput={(event) => updateCollectionName(collection.id, (event.currentTarget as HTMLInputElement).value, event)}
            />
          </label>
          <label class="field-grid">
            <span class="field-label">Slug</span>
            <input name="slug" value={collection.slug} oninput={() => markCollectionSlugTouched(collection.id)} />
          </label>
          <label class="field-grid">
            <span class="field-label">Descripción</span>
            <textarea name="description" rows="2">{collection.description ?? ""}</textarea>
          </label>
          <div class="edit-actions-row collection-edit-actions-row">
            <label class="check-inline"><input type="checkbox" name="isPublic" checked={collection.isPublic} /> Pública</label>
            <div class="action-cluster collection-icon-actions">
              <button
                class="btn danger icon-only-btn"
                type="submit"
                formaction="?/deleteCollection"
                formmethod="post"
                aria-label="Eliminar colección"
                title="Eliminar colección"
                onclick={(event) => {
                  if (!confirm("Esta acción eliminará la colección. ¿Continuar?")) {
                    event.preventDefault();
                  }
                }}
              >
                <span class="icon-mask icon-delete" aria-hidden="true"></span>
              </button>
              <button class="btn primary icon-only-btn" type="submit" aria-label="Guardar colección" title="Guardar colección">
                <span class="icon-mask icon-save" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        </form>
      </article>
      </SortableItem>
    {/each}
  {/if}
  </SortableDropZone>
  </DragDropProvider>
</section>
</div>
{:else}
<div class="admin-section" in:fade={{ duration: 220, delay: 140, easing: cubicOut }} out:fade={{ duration: 140, easing: cubicInOut }}>
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
</div>
{/if}
