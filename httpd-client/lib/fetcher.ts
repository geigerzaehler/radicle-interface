// This module provides low-level capabilities to interact with a typed
// JSON HTTP API.

import type { ZodIssue, ZodType, TypeOf } from "zod";

export interface BaseUrl {
  hostname: string;
  port: number;
  scheme: string;
}

// Error that is thrown by `Fetcher` methods.
export class ResponseError extends Error {
  public method: string;
  public url: string;
  public status: number;
  public body: unknown;

  public constructor(method: string, response: Response, body_: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = body_;
    if (
      typeof body === "object" &&
      body !== null &&
      typeof body.message === "string"
    ) {
      super(body.message);
    } else {
      super("Response error");
    }

    this.method = method;
    this.body = body_;
    this.status = response.status;
    this.url = response.url;
  }
}

// Error that is thrown by `Fetcher` methods when parsing the response
// body fails.
export class ResponseParseError extends Error {
  public method: string;
  public path: string;
  public body: unknown;
  public zodIssues: ZodIssue[];

  public constructor(
    method: string,
    path: string,
    body: unknown,
    zodIssues: ZodIssue[],
  ) {
    super("Failed to parse response body");
    this.method = method;
    this.path = path;
    this.body = body;
    this.zodIssues = zodIssues;
  }
}

export interface RequestOptions {
  abort?: AbortSignal;
}

export interface FetchParams {
  method: Method;
  // Path to append to the `Fetcher`s base URL to get the final URL.
  path: string;
  // Object that is serialized into JSON and sent as the data.
  body?: unknown;
  // Query parameters to be serialized with URLSearchParams.
  query?: Record<string, string | number | boolean>;
  options?: RequestOptions;
  headers?: Record<string, string>;
}

export type Method = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export class Fetcher {
  #baseUrl: BaseUrl;

  public constructor(baseUrl: BaseUrl) {
    this.#baseUrl = baseUrl;
  }

  // Execute a fetch and parse the result with the provided schema.
  // Return the parsed payload.
  //
  // Throws `ResponseError` if the response status code is not `200`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async fetchOk<T extends ZodType<any>>(
    params: FetchParams,
    schema: T,
  ): Promise<TypeOf<T>> {
    const response = await this.fetch(params);

    const responseBody = await response.json();

    if (!response.ok) {
      throw new ResponseError(params.method, response, responseBody);
    }

    const result = schema.safeParse(responseBody);
    if (result.success) {
      return result.data;
    } else {
      throw new ResponseParseError(
        params.method,
        params.path,
        responseBody,
        result.error.errors,
      );
    }
  }

  // Execute a fetch and ignore the response body.
  //
  // Throws `ResponseError` if the response status code is not `200`.
  public async fetchOkNoContent(params: FetchParams): Promise<void> {
    const response = await this.fetch(params);

    if (!response.ok) {
      let responseBody = await response.text();
      try {
        responseBody = JSON.parse(responseBody);
      } catch (_e: unknown) {
        // We keep the original text response body.
      }
      throw new ResponseError(params.method, response, responseBody);
    }
  }

  private async fetch({
    method,
    path,
    body,
    options = {},
    query,
    headers = {},
  }: FetchParams): Promise<Response> {
    if (body !== undefined && headers["content-type"] === undefined) {
      headers["content-type"] = "application/json";
    }

    let url = `${this.#baseUrl.scheme}://${this.#baseUrl.hostname}:${
      this.#baseUrl.port
    }/api/v1/${path}`;
    if (query) {
      const searchparams = new URLSearchParams(query as Record<string, string>);
      url = `${url}?${searchparams.toString()}`;
    }
    return globalThis.fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.abort,
    });
  }
}
