<script lang="ts" strictEvents>
  import Authorship from "@app/components/Authorship.svelte";
  import Button from "@app/components/Button.svelte";
  import Icon from "@app/components/Icon.svelte";
  import Markdown from "@app/components/Markdown.svelte";
  import Textarea from "@app/components/Textarea.svelte";
  import { createEventDispatcher } from "svelte";

  export let id: string | undefined = undefined;
  export let authorId: string;
  export let timestamp: number;
  export let body: string;
  export let showReplyIcon: boolean = false;
  export let action: "create" | "view" = "view";
  export let caption = "commented";
  export let rawPath: string;

  const dispatch = createEventDispatcher<{ toggleReply: never }>();
</script>

<style>
  .comment {
    display: flex;
  }
  .card {
    flex: 1;
    border-radius: var(--border-radius);
    background-color: var(--color-foreground-1);
  }
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    height: 3rem;
  }
  .card-body {
    font-size: var(--font-size-small);
    padding: 0 1rem 1rem 1rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
  .action {
    display: flex;
    gap: 0.5rem;
  }
</style>

<div class="comment" {id}>
  <div class="card">
    <div class="card-header">
      <Authorship {caption} {authorId} {timestamp} />
      <div class="actions">
        {#if showReplyIcon}
          <Button
            variant="text"
            size="tiny"
            on:click={() => dispatch("toggleReply")}>
            <div class="action">
              <Icon name="chat" />
              <span>reply</span>
            </div>
          </Button>
        {/if}
      </div>
    </div>
    <div class="card-body">
      {#if action === "create"}
        <Textarea
          resizable
          bind:value={body}
          on:submit
          placeholder="Leave a comment" />
      {:else if body.trim() === ""}
        <span class="txt-missing">No description.</span>
      {:else}
        <Markdown {rawPath} content={body} />
      {/if}
    </div>
  </div>
</div>
