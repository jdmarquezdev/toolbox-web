<script lang="ts">
  import CustomSelect from "$lib/components/CustomSelect.svelte";

  let { data } = $props();

  let titleValue = $state(data.tool.title ?? "");
  let slugValue = $state(data.tool.slug ?? "");
  let slugTouched = $state(Boolean(data.tool.slug));

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function onTitleInput(value: string) {
    titleValue = value;
    if (!slugTouched) {
      slugValue = slugify(value);
    }
  }
</script>

<section class="section-gap">
  <div class="row-between">
    <h1 class="page-title">Editar herramienta</h1>
    <a href="/" class="btn primary icon-only-btn" aria-label="Volver al panel" title="Volver al panel">
      <span class="icon-mask icon-back" aria-hidden="true"></span>
    </a>
  </div>
</section>

<section class="edit-layout">
  <article class="card form-block edit-form-card">
    <h2 class="panel-title section-title-inline">Vista previa</h2>
    <a class="tool-media-link" href={data.tool.url} target="_blank" rel="noreferrer" title="Abrir fuente">
      <div class="tool-media">
        {#if data.tool.screenshotUrl || data.tool.ogImageUrl}
          <img src={data.tool.screenshotUrl ?? data.tool.ogImageUrl} alt={data.tool.title ?? "Preview"} loading="lazy" />
        {:else}
          <div class="tool-placeholder">{(data.tool.title ?? "AI").slice(0, 2)}</div>
        {/if}
      </div>
    </a>
    <div class="tool-content" style="padding:0.85rem 0 0 0;">
      <h3 class="tool-title">{data.tool.title ?? data.tool.url}</h3>
      <p class="tool-meta">{data.tool.sourceType}</p>
      <p class="tool-desc">{data.tool.description ?? "Sin descripción"}</p>
    </div>
  </article>

  <article class="card form-block edit-form-card">
    <h2 class="panel-title section-title-inline">Ficha editable</h2>

    <form class="grid edit-form" method="post" action="?/save">
      <label class="field-grid">
        <span class="field-label">URL fuente</span>
        <input value={data.tool.url} readonly />
      </label>

      <label class="field-grid">
        <span class="field-label">Título</span>
        <input name="title" bind:value={titleValue} oninput={(event) => onTitleInput((event.currentTarget as HTMLInputElement).value)} />
      </label>

      <label class="field-grid">
        <span class="field-label">Slug</span>
        <input name="slug" bind:value={slugValue} oninput={() => (slugTouched = true)} />
      </label>

      <label class="field-grid">
        <span class="field-label">Descripcion</span>
        <textarea name="description" rows="4">{data.tool.description ?? ""}</textarea>
      </label>

      <label class="field-grid">
        <span class="field-label">Fuente</span>
        <CustomSelect
          name="sourceType"
          value={data.tool.sourceType}
          options={[
            { value: "website", label: "Web" },
            { value: "github", label: "GitHub" },
            { value: "youtube", label: "Video" },
            { value: "article", label: "Artículo" },
            { value: "x", label: "X" },
            { value: "other", label: "Other" }
          ]}
        />
      </label>

      <label class="field-grid">
        <span class="field-label">Nota privada</span>
        <textarea name="notesPrivate" rows="3">{data.tool.notesPrivate ?? ""}</textarea>
      </label>

      <label class="field-grid">
        <span class="field-label">Nota pública</span>
        <textarea name="notesPublic" rows="3">{data.tool.notesPublic ?? ""}</textarea>
      </label>

      <label class="field-grid">
        <span class="field-label">Colecciones</span>
        <CustomSelect
          name="collectionIds"
          multiple={true}
          values={data.selectedCollectionIds}
          placeholder="Seleccionar colecciones"
          options={data.collections.map((collection: any) => ({ value: collection.id, label: collection.name }))}
        />
      </label>

      <div class="edit-actions-row">
        <div class="action-cluster edit-left-actions">
          <a href={`http://localhost:4321/tools/${data.tool.slug ?? data.tool.id}`} target="_blank" rel="noreferrer" class="btn primary btn-xs">Ver ficha pública</a>
        </div>
        <div class="action-cluster edit-action-group">
          <button class="btn btn-xs" type="submit" formaction="?/setState" name="state" value="relevant">Relevante</button>
          <button class="btn btn-xs" type="submit" formaction="?/setState" name="state" value="archived">Archivar</button>
          <button class="btn btn-xs" type="submit" formaction="?/setState" name="state" value="discarded">Descartar</button>
          <button
            class="btn danger icon-only-btn"
            type="submit"
            formaction="?/delete"
            formmethod="post"
            aria-label="Eliminar herramienta"
            title="Eliminar herramienta"
            onclick={(event) => {
              if (!confirm("Esta acción eliminará la herramienta. ¿Continuar?")) {
                event.preventDefault();
              }
            }}
          >
            <span class="icon-mask icon-delete" aria-hidden="true"></span>
          </button>
          <button class="btn primary icon-only-btn" type="submit" aria-label="Guardar cambios" title="Guardar cambios">
            <span class="icon-mask icon-save" aria-hidden="true"></span>
          </button>
        </div>
      </div>
    </form>
  </article>
</section>
