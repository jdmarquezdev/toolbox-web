import { sql } from "./db";
import { fetchUrlMetadata } from "./metadata";
import type { CreatedVia, ModerationState, PublicFilters, ToolRow } from "./types";
import { detectSourceType, normalizeUrl } from "./url";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureUniqueToolSlug(raw: string, excludeId?: string) {
  const base = slugify(raw) || "tool";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const [existing] = await sql<{ id: string }[]>`
      select id
      from tools
      where lower(slug) = lower(${candidate})
        and (${excludeId ?? null}::uuid is null or id <> ${excludeId ?? null})
      limit 1
    `;

    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function getPublicTools(filters: PublicFilters): Promise<ToolRow[]> {
  const sortBy = filters.sort === "reviewedAt" ? "reviewedAt" : "createdAt";
  const query = filters.query ? `%${filters.query.toLowerCase()}%` : null;

  return sql<ToolRow[]>`
    select t.*
    from tools t
    left join categories c on c.id = t."categoryId"
    where t."moderationState" = 'relevant'
      and (${query}::text is null or lower(coalesce(t.title, '')) like ${query} or lower(coalesce(t.description, '')) like ${query})
      and (${filters.category ?? null}::text is null or c.slug = ${filters.category ?? null})
      and (${filters.sourceType ?? null}::text is null or t."sourceType" = ${filters.sourceType ?? null})
      and (${filters.oss ?? null}::text is null or t.oss = (${filters.oss ?? null})::boolean)
    order by
      case when ${sortBy} = 'reviewedAt' then t."reviewedAt" end desc,
      case when ${sortBy} = 'createdAt' then t."createdAt" end desc,
      t."createdAt" desc
    limit 200
  `;
}

export async function getToolByIdOrSlug(idOrSlug: string): Promise<ToolRow | null> {
  const [tool] = await sql<ToolRow[]>`
    select t.*
    from tools t
    where lower(coalesce(t.slug, '')) = lower(${idOrSlug})
       or t.id = ${idOrSlug}
    limit 1
  `;

  return tool ?? null;
}

export async function getAdminTools(state?: ModerationState) {
  if (state) {
    return sql<ToolRow[]>`
      select *
      from tools
      where "moderationState" = ${state}
      order by "moderationPosition" asc, "createdAt" desc
      limit 300
    `;
  }

  return sql<ToolRow[]>`
    select *
    from tools
    order by "moderationState" asc, "moderationPosition" asc, "createdAt" desc
    limit 300
  `;
}

export async function createOrBumpTool(input: {
  url: string;
  notesPrivate?: string | null;
  createdVia?: CreatedVia;
}) {
  const normalized = normalizeUrl(input.url);
  const [existing] = await sql<{ id: string }[]>`select id from tools where url = ${normalized} limit 1`;

  if (existing) {
    await sql`
      update tools
      set "seenCount" = "seenCount" + 1,
          "lastSeenAt" = now(),
          "updatedAt" = now()
      where id = ${existing.id}
    `;

    return { toolId: existing.id, created: false, deduped: true };
  }

  const metadata = await fetchUrlMetadata(normalized);
  const sourceType = detectSourceType(normalized);
  let slugBase = metadata.title ?? "";

  if (!slugBase) {
    try {
      const host = new URL(normalized).hostname.replace(/^www\./, "");
      slugBase = host.split(".")[0] ?? "tool";
    } catch {
      slugBase = "tool";
    }
  }

  const slug = await ensureUniqueToolSlug(slugBase);

  const [inserted] = await sql<{ id: string }[]>`
    insert into tools (
      id,
      slug,
      url,
      "originalUrl",
      "createdVia",
      "sourceType",
      title,
      description,
      "faviconUrl",
      "ogImageUrl",
      "previewStatus",
      pricing,
      oss,
      status,
      relevant,
      "moderationState",
      "moderationPosition",
      "notesPrivate",
      "createdAt",
      "updatedAt",
      "lastSeenAt",
      "seenCount"
    )
    values (
      gen_random_uuid(),
      ${slug},
      ${normalized},
      ${input.url},
      ${input.createdVia ?? "api"},
      ${sourceType},
      ${metadata.title},
      ${metadata.description},
      ${metadata.faviconUrl},
      ${metadata.ogImageUrl},
      'pending',
      'unknown',
      false,
      'inbox',
      null,
      'inbox',
      (select coalesce(max("moderationPosition"), -1) + 1 from tools where "moderationState" = 'inbox'),
      ${input.notesPrivate ?? null},
      now(),
      now(),
      now(),
      1
    )
    returning id
  `;

  return { toolId: inserted.id, created: true, deduped: false };
}

export async function setToolModerationState(id: string, state: Exclude<ModerationState, "inbox">) {
  const relevant = state === "relevant";

  await sql`
    update tools
    set
      status = 'reviewed',
      relevant = ${relevant},
      "moderationState" = ${state},
      "moderationPosition" = (
        select coalesce(max("moderationPosition"), -1) + 1
        from tools t2
        where t2."moderationState" = ${state}
          and t2.id <> ${id}
      ),
      "reviewedAt" = coalesce("reviewedAt", now()),
      "updatedAt" = now()
    where id = ${id}
  `;
}

export async function reorderModerationTools(items: Array<{ id: string; moderationState: Exclude<ModerationState, "inbox"> | "inbox"; moderationPosition: number }>) {
  await sql.begin(async (trx) => {
    for (const item of items) {
      await trx`
        update tools
        set
          "moderationState" = ${item.moderationState},
          status = (case when ${item.moderationState} = 'inbox' then 'inbox' else 'reviewed' end)::tool_status,
          relevant = case
            when ${item.moderationState} = 'relevant' then true
            when ${item.moderationState} = 'archived' then false
            when ${item.moderationState} = 'discarded' then false
            else null
          end,
          "reviewedAt" = case when ${item.moderationState} = 'inbox' then "reviewedAt" else coalesce("reviewedAt", now()) end,
          "moderationPosition" = ${item.moderationPosition},
          "updatedAt" = now()
        where id = ${item.id}
      `;
    }
  });
}

export async function patchTool(id: string, patch: Record<string, unknown>) {
  const nextSlug =
    typeof patch.slug === "string" && patch.slug.trim().length > 0
      ? await ensureUniqueToolSlug(patch.slug.trim(), id)
      : null;

  await sql`
    update tools
    set
      title = coalesce(${typeof patch.title === "string" ? patch.title : null}, title),
      slug = coalesce(${nextSlug}, slug),
      description = coalesce(${typeof patch.description === "string" ? patch.description : null}, description),
      pricing = coalesce(${typeof patch.pricing === "string" ? patch.pricing : null}, pricing),
      "sourceType" = coalesce(${typeof patch.sourceType === "string" ? patch.sourceType : null}, "sourceType"),
      "notesPrivate" = coalesce(${typeof patch.notesPrivate === "string" ? patch.notesPrivate : null}, "notesPrivate"),
      "notesPublic" = coalesce(${typeof patch.notesPublic === "string" ? patch.notesPublic : null}, "notesPublic"),
      oss = coalesce(${typeof patch.oss === "boolean" ? patch.oss : null}, oss),
      "updatedAt" = now()
    where id = ${id}
  `;
}

export async function deleteTool(id: string) {
  await sql`
    delete from tools
    where id = ${id}
  `;
}

export async function getPublicCollections() {
  return sql`
    select id, name, slug, description, "createdAt", position
    from collections
    where "isPublic" = true
    order by position asc, "createdAt" desc
  `;
}

export async function getPublicCollectionsWithTools() {
  const collections = await getPublicCollections();
  if (collections.length === 0) return [];

  const rows = await sql<Array<{ collectionId: string; position: number } & ToolRow>>`
    select ct."collectionId", ct.position, t.*
    from collection_tools ct
    join collections c on c.id = ct."collectionId"
    join tools t on t.id = ct."toolId"
    where c."isPublic" = true
      and t."moderationState" = 'relevant'
    order by c.position asc, ct.position asc
  `;

  const byCollection = new Map<string, ToolRow[]>();
  for (const row of rows) {
    const { collectionId, ...tool } = row;
    const list = byCollection.get(collectionId) ?? [];
    list.push(tool as ToolRow);
    byCollection.set(collectionId, list);
  }

  return collections.map((collection: any) => ({
    ...collection,
    tools: byCollection.get(collection.id) ?? []
  }));
}

export async function getCollectionBySlug(slug: string) {
  const [collection] = await sql`
    select id, name, slug, description, "createdAt"
    from collections
    where slug = ${slug}
      and "isPublic" = true
    limit 1
  `;

  if (!collection) return null;

  const tools = await sql`
    select t.*
    from collection_tools ct
    join tools t on t.id = ct."toolId"
    where ct."collectionId" = ${collection.id}
      and t."moderationState" = 'relevant'
    order by ct.position asc
  `;

  return { ...collection, tools };
}

export async function getPublicFeedJson() {
  const tools = await getPublicTools({ sort: "reviewedAt" });
  return tools.map((tool) => ({
    id: tool.id,
    slug: tool.slug,
    url: tool.url,
    title: tool.title,
    description: tool.description,
    reviewedAt: tool.reviewedAt,
    pricing: tool.pricing,
    sourceType: tool.sourceType
  }));
}

export async function listTags() {
  return sql`select id, name, "createdAt" from tags order by name asc`;
}

export async function createTag(name: string) {
  const [tag] = await sql`
    insert into tags (id, name, "createdAt")
    values (gen_random_uuid(), ${name}, now())
    on conflict (name) do update set name = excluded.name
    returning id, name, "createdAt"
  `;
  return tag;
}

export async function listCategories() {
  return sql`select id, name, slug from categories order by name asc`;
}

export async function createCategory(name: string, slug: string) {
  const [category] = await sql`
    insert into categories (id, name, slug)
    values (gen_random_uuid(), ${name}, ${slug})
    on conflict (slug) do update set name = excluded.name
    returning id, name, slug
  `;
  return category;
}

export async function listCollections() {
  return sql`
    select id, name, slug, description, "isPublic", position, "createdAt"
    from collections
    order by position asc, "createdAt" desc
  `;
}

export async function createCollection(input: { name: string; slug: string; description?: string | null; isPublic?: boolean }) {
  const [collection] = await sql`
    insert into collections (id, name, slug, description, "isPublic", position, "createdAt")
    values (
      gen_random_uuid(),
      ${input.name},
      ${input.slug},
      ${input.description ?? null},
      ${input.isPublic ?? true},
      (select coalesce(max(position), -1) + 1 from collections),
      now()
    )
    returning id, name, slug, description, "isPublic", position, "createdAt"
  `;
  return collection;
}

export async function reorderCollections(orderedIds: string[]) {
  await sql.begin(async (trx) => {
    for (let index = 0; index < orderedIds.length; index += 1) {
      await trx`
        update collections
        set position = ${index}
        where id = ${orderedIds[index]}
      `;
    }
  });
}

export async function updateCollection(id: string, input: { name?: string; slug?: string; description?: string | null; isPublic?: boolean }) {
  const [collection] = await sql`
    update collections
    set
      name = coalesce(${input.name ?? null}, name),
      slug = coalesce(${input.slug ?? null}, slug),
      description = coalesce(${input.description ?? null}, description),
      "isPublic" = coalesce(${input.isPublic ?? null}, "isPublic")
    where id = ${id}
    returning id, name, slug, description, "isPublic", position, "createdAt"
  `;

  return collection ?? null;
}

export async function deleteCollection(id: string) {
  await sql`
    delete from collections
    where id = ${id}
  `;
}

export async function getCollectionById(id: string) {
  const [collection] = await sql`
    select id, name, slug, description, "isPublic", position, "createdAt"
    from collections
    where id = ${id}
    limit 1
  `;

  return collection ?? null;
}

export async function getToolsByCollectionId(id: string) {
  return sql<ToolRow[]>`
    select t.*
    from collection_tools ct
    join tools t on t.id = ct."toolId"
    where ct."collectionId" = ${id}
    order by ct.position asc
  `;
}

export async function getCollectionsWithTools() {
  const collections = await listCollections();
  const rows = await sql<Array<{ collectionId: string; position: number } & ToolRow>>`
    select ct."collectionId", ct.position, t.*
    from collection_tools ct
    join tools t on t.id = ct."toolId"
    order by ct."collectionId" asc, ct.position asc
  `;

  const grouped = new Map<string, ToolRow[]>();
  for (const row of rows) {
    const { collectionId, ...tool } = row;
    const list = grouped.get(collectionId) ?? [];
    list.push(tool as ToolRow);
    grouped.set(collectionId, list);
  }

  return collections.map((collection: any) => ({
    ...collection,
    tools: grouped.get(collection.id) ?? []
  }));
}

export async function getCollectionIdsForTool(toolId: string): Promise<string[]> {
  const rows = await sql<Array<{ collectionId: string }>>`
    select "collectionId" as "collectionId"
    from collection_tools
    where "toolId" = ${toolId}
    order by position asc
  `;

  return rows.map((row) => row.collectionId);
}

export async function setToolCollections(toolId: string, collectionIds: string[]) {
  await sql.begin(async (trx) => {
    await trx`
      delete from collection_tools
      where "toolId" = ${toolId}
    `;

    for (const collectionId of collectionIds) {
      await trx`
        insert into collection_tools ("collectionId", "toolId", position)
        values (
          ${collectionId},
          ${toolId},
          (select coalesce(max(position), -1) + 1 from collection_tools where "collectionId" = ${collectionId})
        )
        on conflict ("collectionId", "toolId") do nothing
      `;
    }
  });
}

export async function reorderCollectionTools(collectionId: string, orderedToolIds: string[]) {
  await sql.begin(async (trx) => {
    for (let index = 0; index < orderedToolIds.length; index += 1) {
      const toolId = orderedToolIds[index];
      await trx`
        update collection_tools
        set position = ${index}
        where "collectionId" = ${collectionId}
          and "toolId" = ${toolId}
      `;
    }
  });
}

export async function addToolToCollection(collectionId: string, toolId: string) {
  await sql`
    insert into collection_tools ("collectionId", "toolId", position)
    values (
      ${collectionId},
      ${toolId},
      (select coalesce(max(position), -1) + 1 from collection_tools where "collectionId" = ${collectionId})
    )
    on conflict ("collectionId", "toolId") do nothing
  `;
}

export async function removeToolFromCollection(collectionId: string, toolId: string) {
  await sql`
    delete from collection_tools
    where "collectionId" = ${collectionId}
      and "toolId" = ${toolId}
  `;
}
