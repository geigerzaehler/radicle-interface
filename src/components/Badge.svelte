<script lang="ts" context="module">
  export type Variant =
    | "caution"
    | "foreground"
    | "negative"
    | "positive"
    | "primary"
    | "secondary"
    | "tertiary";
</script>

<script lang="ts">
  export let variant: Variant;
  export let style: string | undefined = undefined;
</script>

<style>
  .badge {
    border-radius: var(--border-radius);
    padding: 0.125rem 0.5rem;
    font-size: var(--font-size-tiny);
    line-height: 1.6;
    height: var(--button-tiny-height);
    display: flex;
    white-space: nowrap;
  }
  .foreground {
    color: var(--color-foreground-6);
    background: var(--color-foreground-2);
  }
  .positive {
    color: var(--color-positive-6);
    background-color: var(--color-positive-3);
  }
  .secondary {
    color: var(--color-secondary);
    background-color: var(--color-secondary-3);
  }
  .negative {
    color: var(--color-negative);
    background-color: var(--color-negative-4);
  }
  .primary {
    color: var(--color-primary);
    background: linear-gradient(var(--color-primary-3), var(--color-primary-3)),
      linear-gradient(var(--color-background), var(--color-background));
  }
  .tertiary {
    color: var(--color-tertiary-6);
    background: var(--color-tertiary-1);
  }
  .caution {
    color: var(--color-caution);
    background: var(--color-caution-2);
  }
</style>

<span
  on:mouseenter
  on:mouseleave
  class="badge"
  {style}
  class:caution={variant === "caution"}
  class:foreground={variant === "foreground"}
  class:negative={variant === "negative"}
  class:positive={variant === "positive"}
  class:primary={variant === "primary"}
  class:secondary={variant === "secondary"}
  class:tertiary={variant === "tertiary"}>
  <slot />
</span>
