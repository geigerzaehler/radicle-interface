<script lang="ts">
  import Loading from "@app/components/Loading.svelte";

  export let active: boolean;
  export let loading: boolean;
  export let name: string;
</script>

<style>
  .file {
    color: var(--color-foreground-6);
    border-radius: var(--border-radius-small);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    line-height: 1.5em;
    margin: 0.125rem 0;
    padding: 0.25rem;
    width: 100%;
  }

  .file:hover {
    background-color: var(--color-foreground-1);
  }

  .file.active {
    color: var(--color-foreground) !important;
    background-color: var(--color-foreground-1);
  }

  .spinner {
    align-items: center;
    display: flex;
    justify-content: center;
    height: 24px;
    width: 24px;
  }

  .name {
    margin-left: 0.25rem;
    user-select: none;
    white-space: nowrap;
    text-overflow: ellipsis !important;
    overflow: hidden;
    max-width: 24ch;
  }
</style>

<div class="file" class:active>
  <span class="name">{name}</span>
  <div class="spinner">
    {#if loading}
      <Loading noDelay small condensed />
    {/if}
  </div>
</div>
