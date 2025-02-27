<script lang="ts" context="module">
  import type { Comment, Review, Revision, Merge } from "@httpd-client";

  interface Thread {
    root: Comment;
    replies: Comment[];
  }

  interface TimelineReview {
    inner: [string, string, Review];
    type: "review";
    timestamp: number;
  }

  interface TimelineRevision {
    inner: Revision;
    type: "revision";
    timestamp: number;
  }

  interface TimelineMerge {
    inner: Merge;
    type: "merge";
    timestamp: number;
  }

  interface TimelineThread {
    inner: Thread;
    type: "thread";
    timestamp: number;
  }

  export type Timeline =
    | TimelineMerge
    | TimelineReview
    | TimelineRevision
    | TimelineThread;
</script>

<script lang="ts">
  import type { BaseUrl, Patch } from "@httpd-client";
  import type { Variant } from "@app/components/Badge.svelte";

  import * as utils from "@app/lib/utils";
  import * as router from "@app/lib/router";
  import { capitalize } from "lodash";
  import { HttpdClient } from "@httpd-client";
  import { sessionStore } from "@app/lib/session";

  import Authorship from "@app/components/Authorship.svelte";
  import Badge from "@app/components/Badge.svelte";
  import Changeset from "@app/views/projects/SourceBrowser/Changeset.svelte";
  import CobHeader from "@app/views/projects/Cob/CobHeader.svelte";
  import CommitTeaser from "@app/views/projects/Commit/CommitTeaser.svelte";
  import Dropdown from "@app/components/Dropdown.svelte";
  import ErrorMessage from "@app/components/ErrorMessage.svelte";
  import Floating from "@app/components/Floating.svelte";
  import Markdown from "@app/components/Markdown.svelte";
  import Placeholder from "@app/components/Placeholder.svelte";
  import ProjectLink from "@app/components/ProjectLink.svelte";
  import RevisionComponent from "@app/views/projects/Cob/Revision.svelte";
  import SquareButton from "@app/components/SquareButton.svelte";
  import TagInput from "@app/views/projects/Cob/TagInput.svelte";

  export let projectId: string;
  export let baseUrl: BaseUrl;
  export let patch: Patch;
  export let projectHead: string;
  export let revision: string;
  export let currentTab: "activity" | "commits" | "files";

  const api = new HttpdClient(baseUrl);

  async function createReply({
    detail: reply,
  }: CustomEvent<{ id: string; body: string }>) {
    if ($sessionStore && reply.body.trim().length > 0) {
      await api.project.updatePatch(
        projectId,
        patch.id,
        {
          type: "thread",
          revision: currentRevision.id,
          action: {
            type: "comment",
            body: reply.body,
            replyTo: reply.id,
          },
        },
        $sessionStore.id,
      );
      patch = await api.project.getPatchById(projectId, patch.id);
    }
  }
  function badgeColor(status: string): Variant {
    if (status === "draft") {
      return "foreground";
    } else if (status === "open") {
      return "positive";
    } else if (status === "archived") {
      return "caution";
    } else if (status === "merged") {
      return "primary";
    } else {
      return "foreground";
    }
  }

  async function saveTags({ detail: tags }: CustomEvent<string[]>) {
    if ($sessionStore) {
      const { add, remove } = utils.createAddRemoveArrays(patch.tags, tags);
      if (add.length === 0 && remove.length === 0) {
        return;
      }
      await api.project.updatePatch(
        projectId,
        currentRevision.id,
        { type: "tag", add, remove },
        $sessionStore.id,
      );
      patch = await api.project.getPatchById(projectId, patch.id);
    }
  }

  const action: "create" | "edit" | "view" =
    $sessionStore && utils.isLocal(baseUrl.hostname) ? "edit" : "view";
  const options = ["activity", "commits", "files"].map(o => ({
    value: o,
    title: capitalize(o),
    disabled: false,
  }));

  const currentRevision =
    patch.revisions.find(r => r.id === revision) || patch.revisions[0];
  $: timelineTuple = patch.revisions.map<
    [
      {
        revisionId: string;
        revisionTimestamp: number;
        revisionBase: string;
        revisionOid: string;
      },
      Timeline[],
    ]
  >(rev => [
    {
      revisionId: rev.id,
      revisionTimestamp: rev.timestamp,
      revisionBase: rev.base,
      revisionOid: rev.oid,
    },
    [
      ...rev.reviews.map<TimelineReview>(([author, review]) => ({
        timestamp: review.timestamp,
        type: "review",
        inner: [rev.id, author, review],
      })),
      ...rev.merges.map<TimelineMerge>(inner => ({
        timestamp: inner.timestamp,
        type: "merge",
        inner,
      })),
      ...rev.discussions
        .filter(comment => !comment.replyTo)
        .map<TimelineThread>(thread => ({
          timestamp: thread.timestamp,
          type: "thread",
          inner: {
            root: thread,
            replies: rev.discussions
              .filter(comment => comment.replyTo === thread.id)
              .sort((a, b) => a.timestamp - b.timestamp),
          },
        })),
      {
        type: "revision",
        timestamp: rev.timestamp,
        inner: rev,
      } as TimelineRevision,
    ].sort((a, b) => a.timestamp - b.timestamp),
  ]);
</script>

<style>
  .patch {
    display: grid;
    grid-template-columns: minmax(0, 3fr) 1fr;
    padding: 0 2rem 0 8rem;
    margin-bottom: 4.5rem;
  }
  .metadata {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    border-radius: var(--border-radius);
    font-size: var(--font-size-small);
    padding-left: 1rem;
    margin-left: 1rem;
  }
  .commit-list {
    border-radius: var(--border-radius);
    overflow: hidden;
    margin-top: 1rem;
  }
  .tab-line {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 1rem 0;
  }
  .author {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 0.5rem;
  }

  @media (max-width: 1092px) {
    .patch {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
    }
    .metadata {
      display: none;
    }
  }
  @media (max-width: 960px) {
    .patch {
      padding-left: 2rem;
    }
  }
</style>

<div class="patch">
  <div>
    <CobHeader id={patch.id} title={patch.title}>
      <svelte:fragment slot="state">
        <Badge variant={badgeColor(patch.state.status)}>
          {patch.state.status}
        </Badge>
      </svelte:fragment>
      <svelte:fragment slot="description">
        {#if patch.description}
          <Markdown
            content={patch.description}
            rawPath={utils.getRawBasePath(
              projectId,
              baseUrl,
              currentRevision.oid,
            )} />
        {:else}
          <span class="txt-missing">No description available</span>
        {/if}
      </svelte:fragment>
      <div class="author" slot="author">
        opened by <Authorship authorId={patch.author.id} />
        {utils.formatTimestamp(patch.revisions[0].timestamp)}
      </div>
    </CobHeader>

    <div class="tab-line">
      <div style="display: flex; gap: 0.5rem;">
        {#each options as option}
          {#if !option.disabled}
            <ProjectLink
              projectParams={{
                search: `tab=${option.value}`,
              }}>
              <SquareButton
                size="small"
                clickable={option.disabled}
                active={option.value === currentTab}
                disabled={option.disabled}>
                {option.title}
              </SquareButton>
            </ProjectLink>
          {:else}
            <SquareButton
              size="small"
              clickable={option.disabled}
              active={option.value === currentTab}
              disabled={option.disabled}>
              {option.title}
            </SquareButton>
          {/if}
        {/each}
      </div>

      {#if currentTab !== "activity"}
        <Floating disabled={patch.revisions.length === 1}>
          <svelte:fragment slot="toggle">
            <SquareButton
              size="small"
              clickable={patch.revisions.length > 1}
              disabled={patch.revisions.length === 1}>
              Revision {utils.formatObjectId(currentRevision.id)}
            </SquareButton>
          </svelte:fragment>
          <svelte:fragment slot="modal">
            <Dropdown
              items={patch.revisions.map(r => {
                return {
                  title: `Revision ${utils.formatObjectId(r.id)}`,
                  value: r.id,
                  badge: null,
                };
              })}
              selected={currentRevision.id}
              on:select={({ detail: item }) => {
                router.updateProjectRoute({
                  view: {
                    resource: "patch",
                    params: { patch: patch.id, revision: item.value },
                  },
                });
              }}>
              <span slot="item" let:item>
                {item.title}
              </span>
            </Dropdown>
          </svelte:fragment>
        </Floating>
      {/if}
    </div>
    {#if currentTab === "activity"}
      {#each timelineTuple as [revision, timelines], index}
        <RevisionComponent
          {baseUrl}
          {projectId}
          {timelines}
          {projectHead}
          {...revision}
          on:reply={createReply}
          patchId={patch.id}
          authorId={patch.author.id}
          expanded={index === patch.revisions.length - 1} />
      {:else}
        <Placeholder emoji="🍂">
          <div slot="title">No activity</div>
          <div slot="body">No activity on this patch yet</div>
        </Placeholder>
      {/each}
    {:else if currentTab === "commits"}
      {#await api.project.getDiff(projectId, currentRevision.base, currentRevision.oid) then diff}
        <div class="commit-list">
          {#each diff.commits as commit}
            <CommitTeaser {commit} />
          {/each}
        </div>
      {:catch e}
        <ErrorMessage message="Not able to load commits." stackTrace={e} />
      {/await}
    {:else if currentTab === "files"}
      {#await api.project.getDiff(projectId, currentRevision.base, currentRevision.oid) then diff}
        <div style:margin-top="1rem">
          <Changeset revision={currentRevision.oid} diff={diff.diff} />
        </div>
      {:catch e}
        <ErrorMessage message="Not able to load files diff." stackTrace={e} />
      {/await}
    {/if}
  </div>
  <div class="metadata">
    <TagInput {action} tags={patch.tags} on:save={saveTags} />
  </div>
</div>
