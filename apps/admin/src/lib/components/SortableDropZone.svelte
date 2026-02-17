<script lang="ts">
  import { useDroppable, type UseDroppableInput } from "@dnd-kit-svelte/svelte";
  import type { Snippet } from "svelte";

  interface Props extends UseDroppableInput {
    children: Snippet;
    class?: string;
  }

  let { children, class: className = "", ...rest }: Props = $props();

  const { ref } = useDroppable({
    ...rest
  });
</script>

<div use:ref class={className}>
  {@render children()}
</div>
