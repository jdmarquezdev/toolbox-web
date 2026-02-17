<script lang="ts">
  import { useSortable, type UseSortableInput } from "@dnd-kit-svelte/svelte/sortable";
  import type { Snippet } from "svelte";

  interface Props extends UseSortableInput {
    children: Snippet;
    class?: string;
  }

  let { children, class: className = "", ...rest }: Props = $props();

  const { isDragging, ref } = useSortable({
    ...rest,
    feedback: "move"
  });
</script>

<div use:ref class={className} data-dragging={isDragging.current}>
  {@render children()}
</div>
