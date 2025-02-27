import type { ProjectsParams, Route, ProjectRoute } from "./router/definitions";
import type { Readable } from "svelte/store";

import { get, writable, derived } from "svelte/store";
import { unreachable } from "@app/lib/utils";

// This is only respected by Safari.
const documentTitle = "Radicle Interface";

export const historyStore = writable<Route[]>([{ resource: "home" }]);

export const activeRouteStore: Readable<Route> = derived(
  historyStore,
  store => {
    return store.slice(-1)[0];
  },
);

export function useDefaultNavigation(event: MouseEvent) {
  return (
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}

export const base = import.meta.env.VITE_HASH_ROUTING ? "./" : "/";

// Gets triggered when clicking on an anchor hash tag e.g. <a href="#header"/>
// Allows the jump to a anchor hash
window.addEventListener("hashchange", e => {
  const route = pathToRoute(e.newURL);
  if (route?.resource === "projects" && route.params.hash) {
    if (route.params.hash.match(/^L\d+$/)) {
      updateProjectRoute({ line: route.params.hash });
    } else {
      updateProjectRoute({ hash: route.params.hash });
    }
  }
});

// Replaces history on any user interaction with forward and backwards buttons
// with the current window.history.state
window.addEventListener("popstate", e => {
  if (e.state) replace(e.state);
});

export function createProjectRoute(
  activeRoute: ProjectRoute,
  projectRouteParams: Partial<ProjectsParams>,
): ProjectRoute {
  return {
    resource: "projects",
    params: {
      ...activeRoute.params,
      line: undefined,
      hash: undefined,
      ...projectRouteParams,
    },
  };
}

export function projectLinkHref(
  projectRouteParams: Partial<ProjectsParams>,
): string | undefined {
  const activeRoute = get(activeRouteStore);

  if (activeRoute.resource === "projects") {
    return routeToPath(createProjectRoute(activeRoute, projectRouteParams));
  } else {
    throw new Error(
      "Don't use project specific navigation outside of project views",
    );
  }
}

function sanitizeQueryString(queryString: string): string {
  return queryString.startsWith("?") ? queryString.substring(1) : queryString;
}

export function updateProjectRoute(
  projectRouteParams: Partial<ProjectsParams>,
  opts: { replace: boolean } = { replace: false },
) {
  const activeRoute = get(activeRouteStore);

  if (activeRoute.resource === "projects") {
    const updatedRoute = createProjectRoute(activeRoute, projectRouteParams);
    if (opts.replace) {
      replace(updatedRoute);
    } else {
      push(updatedRoute);
    }
  } else {
    throw new Error(
      "Don't use project specific navigation outside of project views",
    );
  }
}

export const push = (newRoute: Route): void => {
  const history = get(historyStore);

  // Limit history to a maximum of 10 steps. We shouldn't be doing more than
  // one subsequent pop() anyway.
  historyStore.set([...history, newRoute].slice(-10));

  const path = import.meta.env.VITE_HASH_ROUTING
    ? "#" + routeToPath(newRoute)
    : routeToPath(newRoute);

  window.history.pushState(newRoute, documentTitle, path);
};

export const pop = (): void => {
  const history = get(historyStore);
  const newRoute = history.pop();
  if (newRoute) {
    historyStore.set(history);
    window.history.back();
  }
};

export function replace(newRoute: Route): void {
  historyStore.set([newRoute]);

  const path = import.meta.env.VITE_HASH_ROUTING
    ? "#" + routeToPath(newRoute)
    : routeToPath(newRoute);

  window.history.replaceState(newRoute, documentTitle, path);
}

export const initialize = () => {
  const { pathname, search, hash } = window.location;
  const url = pathname + search + hash;
  const route = pathToRoute(url);

  if (route) {
    replace(route);
  } else {
    replace({ resource: "404", params: { url } });
  }
};

function pathToRoute(path: string): Route | null {
  // This matches e.g. an empty string
  if (!path) {
    return null;
  }

  const url = new URL(path, window.origin);
  const segments = import.meta.env.VITE_HASH_ROUTING
    ? url.hash.substring(2).split("#")[0].split("/") // Try to remove any additional hashes at the end of the URL.
    : url.pathname.substring(1).split("/");

  const resource = segments.shift();
  switch (resource) {
    case "seeds": {
      const hostnamePort = segments.shift();
      if (hostnamePort) {
        const id = segments.shift();
        if (id) {
          // Allows project paths with or without trailing slash
          if (
            segments.length === 0 ||
            (segments.length === 1 && segments[0] === "")
          ) {
            return {
              resource: "projects",
              params: {
                view: { resource: "tree" },
                id,
                peer: undefined,
                hostnamePort,
              },
            };
          }
          const params = resolveProjectRoute(url, hostnamePort, id, segments);
          if (params) {
            return {
              resource: "projects",
              params: {
                ...params,
                hostnamePort,
                id,
              },
            };
          }
          return null;
        }
        return { resource: "seeds", params: { hostnamePort } };
      }
      return null;
    }
    case "session": {
      const id = segments.shift();
      if (id) {
        return {
          resource: "session",
          params: {
            id,
            signature: url.searchParams.get("sig") ?? "",
            publicKey: url.searchParams.get("pk") ?? "",
          },
        };
      }
      return { resource: "home" };
    }
    case "": {
      return { resource: "home" };
    }
    default: {
      return null;
    }
  }
}

export function routeToPath(route: Route) {
  if (route.resource === "home") {
    return "/";
  } else if (route.resource === "session") {
    return `/session?id=${route.params.id}&sig=${route.params.signature}&pk=${route.params.publicKey}`;
  } else if (route.resource === "seeds") {
    return `/seeds/${route.params.hostnamePort}`;
  } else if (route.resource === "projects") {
    const hostnamePortPrefix = `/seeds/${route.params.hostnamePort}`;
    const content = `/${route.params.view.resource}`;

    let peer = "";
    if (route.params.peer) {
      peer = `/remotes/${route.params.peer}`;
    }

    let suffix = "";
    if (route.params.route) {
      suffix = `/${route.params.route}`;
    } else {
      if (
        (route.params.view.resource === "tree" ||
          route.params.view.resource === "commits" ||
          route.params.view.resource === "history") &&
        route.params.revision
      ) {
        suffix = `/${route.params.revision}`;
      }
      if (route.params.path && route.params.path !== "/") {
        suffix += `/${route.params.path}`;
      }
    }

    if (route.params.search) {
      suffix += `?${route.params.search}`;
    }
    if (route.params.line) {
      suffix += `#${route.params.line}`;
    } else if (route.params.hash) {
      suffix += `#${route.params.hash}`;
    }

    if (route.params.view.resource === "tree") {
      if (suffix) {
        return `${hostnamePortPrefix}/${route.params.id}${peer}/tree${suffix}`;
      }
      return `${hostnamePortPrefix}/${route.params.id}${peer}`;
    } else if (route.params.view.resource === "commits") {
      return `${hostnamePortPrefix}/${route.params.id}${peer}/commits${suffix}`;
    } else if (route.params.view.resource === "history") {
      return `${hostnamePortPrefix}/${route.params.id}${peer}/history${suffix}`;
    } else if (
      route.params.view.resource === "issues" &&
      route.params.view.params?.view.resource === "new"
    ) {
      return `${hostnamePortPrefix}/${route.params.id}${peer}/issues/new${suffix}`;
    } else if (route.params.view.resource === "issues") {
      return `${hostnamePortPrefix}/${route.params.id}${peer}/issues${suffix}`;
    } else if (route.params.view.resource === "issue") {
      return `${hostnamePortPrefix}/${route.params.id}${peer}/issues/${route.params.view.params.issue}`;
    } else if (route.params.view.resource === "patches") {
      return `${hostnamePortPrefix}/${route.params.id}${peer}/patches${suffix}`;
    } else if (route.params.view.resource === "patch") {
      if (route.params.view.params.revision) {
        return `${hostnamePortPrefix}/${route.params.id}${peer}/patches/${route.params.view.params.patch}/${route.params.view.params.revision}${suffix}`;
      }
      return `${hostnamePortPrefix}/${route.params.id}${peer}/patches/${route.params.view.params.patch}${suffix}`;
    } else {
      return `${hostnamePortPrefix}/${route.params.id}${peer}${content}`;
    }
  } else if (route.resource === "404") {
    return route.params.url;
  } else {
    unreachable(route);
  }
}

function resolveProjectRoute(
  url: URL,
  hostnamePort: string,
  id: string,
  segments: string[],
): ProjectsParams | null {
  let content = segments.shift();
  let peer;
  if (content === "remotes") {
    peer = segments.shift();
    content = segments.shift();
  }

  if (!content || content === "tree") {
    const line = url.href.match(/#L\d+$/)?.pop();
    const hash = url.href.match(/#{1}[^#.]+$/)?.pop();
    return {
      view: { resource: "tree" },
      id,
      hostnamePort,
      peer,
      path: undefined,
      revision: undefined,
      search: undefined,
      line: line?.substring(1),
      hash: hash?.substring(1),
      route: segments.join("/"),
    };
  } else if (content === "history") {
    return {
      view: { resource: "history" },
      id,
      hostnamePort,
      peer,
      path: undefined,
      revision: undefined,
      search: undefined,
      route: segments.join("/"),
    };
  } else if (content === "commits") {
    return {
      view: { resource: "commits" },
      id,
      hostnamePort,
      peer,
      path: undefined,
      revision: undefined,
      search: undefined,
      route: segments.join("/"),
    };
  } else if (content === "issues") {
    const issueOrAction = segments.shift();
    if (issueOrAction === "new") {
      return {
        view: { resource: "issues", params: { view: { resource: "new" } } },
        id,
        hostnamePort,
        peer,
        search: sanitizeQueryString(url.search),
        path: undefined,
        revision: undefined,
      };
    } else if (issueOrAction) {
      return {
        view: { resource: "issue", params: { issue: issueOrAction } },
        id,
        hostnamePort,
        peer,
        path: undefined,
        revision: undefined,
        search: undefined,
      };
    } else {
      return {
        view: { resource: "issues" },
        id,
        hostnamePort,
        peer,
        search: sanitizeQueryString(url.search),
        path: undefined,
        revision: undefined,
      };
    }
  } else if (content === "patches") {
    const patch = segments.shift();
    const revision = segments.shift();
    if (patch) {
      return {
        view: { resource: "patch", params: { patch, revision } },
        id,
        hostnamePort,
        peer,
        path: undefined,
        revision: undefined,
        search: sanitizeQueryString(url.search),
      };
    } else {
      return {
        view: { resource: "patches" },
        id,
        hostnamePort,
        peer,
        search: sanitizeQueryString(url.search),
        path: undefined,
        revision: undefined,
      };
    }
  }

  return null;
}

export const testExports = { pathToRoute };
