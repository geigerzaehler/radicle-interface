<script lang="ts" context="module">
  import type { IssueState } from "@httpd-client";

  export type IssueStatus = IssueState["status"];
</script>

<script lang="ts">
  import type { Issue } from "@httpd-client";
  import type { BaseUrl } from "@httpd-client";

  import * as utils from "@app/lib/utils";
  import capitalize from "lodash/capitalize";
  import { HttpdClient } from "@httpd-client";
  import { sessionStore } from "@app/lib/session";

  import Button from "@app/components/Button.svelte";
  import ErrorMessage from "@app/components/ErrorMessage.svelte";
  import IssueTeaser from "@app/views/projects/Issue/IssueTeaser.svelte";
  import Loading from "@app/components/Loading.svelte";
  import Placeholder from "@app/components/Placeholder.svelte";
  import ProjectLink from "@app/components/ProjectLink.svelte";
  import SquareButton from "@app/components/SquareButton.svelte";

  export let projectId: string;
  export let state: IssueStatus;
  export let baseUrl: BaseUrl;
  export let issueCounters: { open: number; closed: number };

  const perPage = 10;

  let loading = false;
  let page = 0;
  let error: any;
  let issues: Issue[] = [];

  const api = new HttpdClient(baseUrl);

  async function loadIssues(state: IssueStatus): Promise<void> {
    loading = true;
    try {
      const response = await api.project.getAllIssues(projectId, {
        state,
        page,
        perPage,
      });
      issues = [...issues, ...response];
      page += 1;
    } catch (e) {
      error = e;
    } finally {
      loading = false;
    }
  }

  interface Tab {
    value: IssueStatus;
    title: string;
    disabled: boolean;
  }

  const stateOptions: IssueStatus[] = ["open", "closed"];
  const options = stateOptions.map<Tab>(s => ({
    value: s,
    title: `${issueCounters[s]} ${s}`,
    disabled: issueCounters[s] === 0,
  }));

  $: showMoreButton =
    !loading &&
    !error &&
    issueCounters[state] &&
    issues.length < issueCounters[state];

  $: {
    page = 0;
    issues = [];
    loadIssues(state);
  }
</script>

<style>
  .issues {
    padding: 0 2rem 0 8rem;
    font-size: var(--font-size-small);
  }
  .issues-list {
    border-radius: var(--border-radius);
    overflow: hidden;
  }
  .teaser:not(:last-child) {
    border-bottom: 1px solid var(--color-background);
  }
  .section-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  .more {
    margin-top: 2rem;
    text-align: center;
    min-height: 3rem;
  }

  @media (max-width: 960px) {
    .issues {
      padding-left: 2rem;
    }
  }
</style>

<div class="issues">
  <div class="section-header">
    <div style="margin-bottom: 1rem;">
      <div style="display: flex; gap: 0.5rem;">
        {#each options as option}
          {#if !option.disabled}
            <ProjectLink
              projectParams={{
                search: `state=${option.value}`,
              }}>
              <SquareButton
                size="small"
                clickable={option.disabled}
                active={option.value === state}
                disabled={option.disabled}>
                {option.title}
              </SquareButton>
            </ProjectLink>
          {:else}
            <SquareButton
              size="small"
              clickable={option.disabled}
              active={option.value === state}
              disabled={option.disabled}>
              {option.title}
            </SquareButton>
          {/if}
        {/each}
      </div>
    </div>
    {#if $sessionStore && utils.isLocal(baseUrl.hostname)}
      <ProjectLink
        projectParams={{
          view: {
            resource: "issues",
            params: { view: { resource: "new" } },
          },
        }}>
        <SquareButton size="small">New issue</SquareButton>
      </ProjectLink>
    {/if}
  </div>
  <div class="issues-list">
    {#each issues as issue}
      <div class="teaser">
        <IssueTeaser {issue} />
      </div>
    {:else}
      {#if error}
        <ErrorMessage message="Couldn't load issues." stackTrace={error} />
      {:else if loading}
        <!-- We already show a loader below. -->
      {:else}
        <Placeholder emoji="🍂">
          <div slot="title">{capitalize(state)} issues</div>
          <div slot="body">No issues matched the current filter</div>
        </Placeholder>
      {/if}
    {/each}
  </div>
  <div class="more">
    {#if loading}
      <Loading small={page !== 0} center />
    {/if}

    {#if showMoreButton}
      <Button variant="foreground" on:click={() => loadIssues(state)}>
        More
      </Button>
    {/if}
  </div>
</div>
