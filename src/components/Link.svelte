<script lang="ts" strictEvents>
  import type { Route } from "@app/lib/router/definitions";

  import { createEventDispatcher } from "svelte";
  import { push, routeToPath, useDefaultNavigation } from "@app/lib/router";

  export let route: Route;

  const dispatch = createEventDispatcher<{
    afterNavigate: never;
  }>();

  function navigateToRoute(event: MouseEvent): void {
    if (useDefaultNavigation(event)) {
      return;
    }

    event.preventDefault();
    push(route);
    dispatch("afterNavigate");
  }
</script>

<a on:click={navigateToRoute} href={routeToPath(route)}>
  <slot />
</a>
