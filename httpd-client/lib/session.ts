import type { Fetcher, RequestOptions } from "./fetcher.js";
import type { SuccessResponse } from "./shared.js";
import type { ZodSchema } from "zod";

import { number, strictObject, string } from "zod";

import { successResponseSchema } from "./shared.js";

interface Session {
  sessionId: string;
  status: string;
  publicKey: string;
  issuedAt: number;
  expiresAt: number;
}

const sessionSchema = strictObject({
  sessionId: string(),
  status: string(),
  publicKey: string(),
  issuedAt: number(),
  expiresAt: number(),
}) satisfies ZodSchema<Session>;

export class Client {
  #fetcher: Fetcher;

  public constructor(fetcher: Fetcher) {
    this.#fetcher = fetcher;
  }

  public async getById(id: string, options?: RequestOptions): Promise<Session> {
    return this.#fetcher.fetchOk(
      {
        method: "GET",
        path: `sessions/${id}`,
        options,
      },
      sessionSchema,
    );
  }

  public async update(
    id: string,
    body: {
      sig: string;
      pk: string;
    },
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this.#fetcher.fetchOk(
      {
        method: "PUT",
        path: `sessions/${id}`,
        body,
        options,
      },
      successResponseSchema,
    );
  }

  public async delete(
    id: string,
    options?: RequestOptions,
  ): Promise<SuccessResponse> {
    return this.#fetcher.fetchOk(
      {
        method: "DELETE",
        path: `sessions/${id}`,
        headers: { Authorization: `Bearer ${id}` },
        options,
      },
      successResponseSchema,
    );
  }
}
