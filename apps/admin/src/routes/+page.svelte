<script lang="ts">
  import { cubicInOut, cubicOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import { adminPath } from "$lib/paths";

  type ViewKey = "inbox" | "relevantes" | "archivadas" | "descartadas";
  type ModerationState = "inbox" | "relevant" | "archived" | "discarded";

  let { data } = $props();

  const VIEW_KEY = "toolbox-admin-view";

  let selectedView = $state<ViewKey>("inbox");
  const activeSection = $derived(data.section === "collections" ? "collections" : "tools");
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

  let draggedModerationTool: { id: string; from: ModerationState } | null = null;
  let draggedCollectionId: string | null = null;

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

  if (typeof window !== "undefined") {
    const hash = window.location.hash.replace("#", "");
    const hashView = hash === "relevantes" || hash === "archivadas" || hash === "descartadas" || hash === "inbox" ? hash : null;
    const stored = localStorage.getItem(VIEW_KEY);
    const storedView =
      stored === "relevantes" || stored === "archivadas" || stored === "descartadas" || stored === "inbox" ? stored : null;

    selectedView = (hashView as ViewKey) ?? (storedView as ViewKey) ?? "inbox";

  }

  $effect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(VIEW_KEY, selectedView);
    }
  });

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

  function moveModerationTool(targetState: ModerationState, targetId?: string) {
    if (!draggedModerationTool) return;

    const fromList = [...moderation[draggedModerationTool.from]];
    const index = fromList.findIndex((tool: any) => tool.id === draggedModerationTool?.id);
    if (index < 0) return;

    const [tool] = fromList.splice(index, 1);
    const toList = targetState === draggedModerationTool.from ? fromList : [...moderation[targetState]];

    if (targetId) {
      const targetIndex = toList.findIndex((item: any) => item.id === targetId);
      if (targetIndex >= 0) {
        toList.splice(targetIndex, 0, tool);
      } else {
        toList.push(tool);
      }
    } else {
      toList.push(tool);
    }

    moderation = {
      ...moderation,
      [draggedModerationTool.from]: draggedModerationTool.from === targetState ? toList : fromList,
      [targetState]: toList
    };
  }

  async function onDropOnTool(targetState: ModerationState, targetId: string) {
    moveModerationTool(targetState, targetId);
    draggedModerationTool = null;
    await persistModerationOrder();
  }

  async function onDropOnColumn(targetState: ModerationState) {
    moveModerationTool(targetState);
    draggedModerationTool = null;
    await persistModerationOrder();
  }

  function onDragStartCollection(collectionId: string) {
    draggedCollectionId = collectionId;
  }

  async function onDropCollection(targetCollectionId: string) {
    if (!draggedCollectionId || draggedCollectionId === targetCollectionId) {
      draggedCollectionId = null;
      return;
    }

    const list = [...collections];
    const from = list.findIndex((item: any) => item.id === draggedCollectionId);
    const to = list.findIndex((item: any) => item.id === targetCollectionId);
    if (from < 0 || to < 0) {
      draggedCollectionId = null;
      return;
    }

    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    collections = list;
    draggedCollectionId = null;

    await fetch(adminPath("/api/admin/collections/reorder"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: list.map((item: any) => item.id) })
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
</script>

{#if activeSection === "tools"}
<div class="admin-section" in:fade={{ duration: 220, delay: 140, easing: cubicOut }} out:fade={{ duration: 140, easing: cubicInOut }}>
<section class="grid section-gap">
  <div class="row-between">
    <h1 class="page-title">Panel de control</h1>
    {#if isSavingModeration}
      <p class="muted">Guardando orden...</p>
    {/if}
  </div>

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
    <button
      class={`switch-btn ${selectedView === "inbox" ? "is-active" : ""}`}
      type="button"
      role="tab"
      aria-selected={selectedView === "inbox"}
      onclick={() => (selectedView = "inbox")}
    >
      Nuevo ({moderation.inbox.length})
    </button>
    <button
      class={`switch-btn ${selectedView === "relevantes" ? "is-active" : ""}`}
      type="button"
      role="tab"
      aria-selected={selectedView === "relevantes"}
      onclick={() => (selectedView = "relevantes")}
    >
      Relevantes ({moderation.relevant.length})
    </button>
    <button
      class={`switch-btn ${selectedView === "archivadas" ? "is-active" : ""}`}
      type="button"
      role="tab"
      aria-selected={selectedView === "archivadas"}
      onclick={() => (selectedView = "archivadas")}
    >
      Archivadas ({moderation.archived.length})
    </button>
    <button
      class={`switch-btn ${selectedView === "descartadas" ? "is-active" : ""}`}
      type="button"
      role="tab"
      aria-selected={selectedView === "descartadas"}
      onclick={() => (selectedView = "descartadas")}
    >
      Descartadas ({moderation.discarded.length})
    </button>
  </div>
</section>

<section
  id={selectedView}
  class="section-gap"
  aria-label="Listado moderado"
  ondragover={(event) => event.preventDefault()}
  ondrop={() => onDropOnColumn(stateByView[selectedView])}
>
  <div class="admin-card-grid">
    {#if toolsForView(selectedView).length === 0}
      <article class="card form-block muted">No hay herramientas en {labelByState[stateByView[selectedView]].toLowerCase()}.</article>
    {:else}
      {#each toolsForView(selectedView) as tool (tool.id)}
        <article
          class="tool-card"
          in:fly={{ y: 4, duration: 280, easing: cubicOut, opacity: 0.25 }}
          draggable="true"
          ondragstart={() => (draggedModerationTool = { id: tool.id, from: stateByView[selectedView] })}
          ondragend={() => (draggedModerationTool = null)}
          ondragover={(event) => event.preventDefault()}
          ondrop={(event) => {
            event.preventDefault();
            onDropOnTool(stateByView[selectedView], tool.id);
          }}
        >
          <a class="tool-media-link" href={tool.url} target="_blank" rel="noreferrer" title="Abrir fuente">
            <div class="tool-media">
              {#if mediaUrl(tool)}
                <img src={mediaUrl(tool) ?? undefined} alt={tool.title ?? "Preview"} loading="lazy" />
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
                    <input type="hidden" name="id" value={tool.id} />
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
      {/each}
    {/if}
  </div>
</section>

 </div>
{:else}
<div class="admin-section" in:fade={{ duration: 220, delay: 140, easing: cubicOut }} out:fade={{ duration: 140, easing: cubicInOut }}>
<section class="section-gap">
  <div class="row-between">
    <h2 class="page-title">Colecciones</h2>
    <p class="muted">Arrastra para reordenar colecciones.</p>
  </div>
</section>

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

<section class="collection-admin-grid">
  {#if collections.length === 0}
    <article class="card form-block muted">No hay colecciones creadas.</article>
  {:else}
    {#each collections as collection (collection.id)}
      <article
        class="card form-block collection-admin-card"
        in:fly={{ y: 4, duration: 280, easing: cubicOut, opacity: 0.25 }}
        draggable="true"
        ondragstart={() => onDragStartCollection(collection.id)}
        ondragend={() => (draggedCollectionId = null)}
        ondragover={(event) => event.preventDefault()}
        ondrop={(event) => {
          event.preventDefault();
          onDropCollection(collection.id);
        }}
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
    {/each}
  {/if}
</section>
</div>
{/if}
