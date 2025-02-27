export type Route =
  | ProjectRoute
  | { resource: "home" }
  | {
      resource: "session";
      params: { id: string; signature: string; publicKey: string };
    }
  | { resource: "404"; params: { url: string } }
  | { resource: "seeds"; params: { hostnamePort: string } };

export interface ProjectsParams {
  id: string;
  view:
    | { resource: "tree" }
    | { resource: "commits" }
    | { resource: "history" }
    | { resource: "issue"; params: { issue: string } }
    | {
        resource: "issues";
        params?: {
          view: { resource: "new" };
        };
      }
    | {
        resource: "patches";
        params?: {
          view: { resource: "new" };
        };
      }
    | { resource: "patch"; params: { patch: string; revision?: string } };
  hostnamePort: string;
  hash?: string;
  line?: string;
  path?: string;
  peer?: string;
  revision?: string;
  route?: string;
  search?: string;
}

export type ProjectRoute = { resource: "projects"; params: ProjectsParams };
