<script lang="ts">
  type Option = {
    value: string;
    label: string;
  };

  let {
    name,
    options,
    value = "",
    values = [],
    multiple = false,
    placeholder = "Seleccionar"
  }: {
    name: string;
    options: Option[];
    value?: string;
    values?: string[];
    multiple?: boolean;
    placeholder?: string;
  } = $props();

  let isOpen = $state(false);
  let currentValue = $state(value);
  let currentValues = $state([...(values ?? [])]);

  $effect(() => {
    if (multiple) {
      currentValues = [...(values ?? [])];
    } else {
      currentValue = value;
    }
  });

  const currentLabel = $derived.by(() => {
    if (!multiple) {
      return options.find((option) => option.value === currentValue)?.label ?? options[0]?.label ?? placeholder;
    }

    const selected = options.filter((option) => currentValues.includes(option.value));
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0]?.label ?? placeholder;
    return `${selected.length} seleccionadas`;
  });

  function selectOption(optionValue: string) {
    if (multiple) {
      currentValues = currentValues.includes(optionValue)
        ? currentValues.filter((valueItem) => valueItem !== optionValue)
        : [...currentValues, optionValue];
      return;
    }

    currentValue = optionValue;
    isOpen = false;
  }
</script>

<div class="custom-select" class:is-open={isOpen} onfocusout={(event) => {
  const next = event.relatedTarget;
  if (!(next instanceof Node) || !event.currentTarget?.contains(next)) {
    isOpen = false;
  }
}}>
  {#if multiple}
    {#each currentValues as selectedValue}
      <input type="hidden" name={name} value={selectedValue} />
    {/each}
  {:else}
    <input type="hidden" name={name} value={currentValue} />
  {/if}
  <button
    type="button"
    class="custom-select-trigger"
    aria-expanded={isOpen}
    onclick={() => {
      isOpen = !isOpen;
    }}
  >
    <span>{currentLabel}</span>
    <span class="custom-select-caret" aria-hidden="true">▾</span>
  </button>

  {#if isOpen}
    <div class="custom-select-menu" role="listbox">
      {#each options as option}
        <button
          type="button"
          class={`custom-select-option ${(!multiple && option.value === currentValue) || (multiple && currentValues.includes(option.value)) ? "is-active" : ""}`}
          role="option"
          aria-selected={(!multiple && option.value === currentValue) || (multiple && currentValues.includes(option.value))}
          onmousedown={(event) => {
            if (multiple) {
              event.preventDefault();
            }
          }}
          onclick={() => selectOption(option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
