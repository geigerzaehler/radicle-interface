<script lang="ts">
  import type { BaseUrl, CommitHeader } from "@httpd-client";

  import { HttpdClient } from "@httpd-client";
  import { groupCommits } from "@app/lib/commit";

  import Button from "@app/components/Button.svelte";
  import CommitTeaser from "./Commit/CommitTeaser.svelte";
  import ErrorMessage from "@app/components/ErrorMessage.svelte";
  import Loading from "@app/components/Loading.svelte";

  export let projectId: string;
  export let baseUrl: BaseUrl;
  export let parentCommit: string;

  const perPage = 30;

  let page = 0;
  let error: any;
  let loading = false;
  let totalCommitCount: number | undefined = undefined;
  let history: CommitHeader[] = [];

  const api = new HttpdClient(baseUrl);

  async function loadHistory(): Promise<void> {
    loading = true;
    try {
      const response = await api.project.getAllCommits(projectId, {
        parent: parentCommit,
        page,
        perPage,
      });
      history = [...history, ...response.commits.map(c => c.commit)];
      totalCommitCount = response.stats.commits;
      page += 1;
    } catch (e) {
      error = e;
    } finally {
      loading = false;
    }
  }

  $: showMoreButton =
    !loading && !error && totalCommitCount && history.length < totalCommitCount;

  loadHistory();
</script>

<style>
  .history {
    padding: 0 2rem 0 8rem;
    font-size: var(--font-size-small);
  }
  .group {
    margin-bottom: 2rem;
    border-radius: var(--border-radius);
    overflow: hidden;
  }
  .teaser-wrapper:not(:last-child) {
    border-bottom: 1px solid var(--color-background);
  }
  .more {
    margin-top: 2rem;
    text-align: center;
    min-height: 3rem;
  }
  @media (max-width: 960px) {
    .history {
      padding-left: 2rem;
    }
  }
</style>

{#if history}
  <div class="history">
    {#each groupCommits(history) as group (group.time)}
      <p style:color="var(--color-foreground-6)">{group.date}</p>
      <div class="group">
        {#each group.commits as commit (commit.id)}
          <div class="teaser-wrapper">
            <CommitTeaser {commit} />
          </div>
        {/each}
      </div>
    {/each}
    <div class="more">
      {#if loading}
        <Loading small={page !== 0} center />
      {/if}

      {#if showMoreButton}
        <Button variant="foreground" on:click={loadHistory}>More</Button>
      {/if}
    </div>
  </div>
{/if}

{#if error}
  <div class="message">
    <ErrorMessage message="Couldn't load commits." stackTrace={error} />
  </div>
{/if}
