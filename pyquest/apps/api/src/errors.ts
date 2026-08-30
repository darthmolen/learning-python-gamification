/**
 * One error shape, on every route.
 *
 * `ApiErrorSchema` in `@pyquest/contract` says what goes on the wire. This says how a handler
 * raises one and which HTTP status each code carries, which is deliberately *not* in the contract:
 * the status is a transport detail the SPA is not meant to branch on. `code` is what it branches
 * on, `retryable` is what it acts on, and a client that has to know both a status and a code to
 * make one decision has been given the decision twice.
 */

import { ApiErrorSchema, type ApiError, type ApiErrorCode } from '@pyquest/contract';

/**
 * Status and retryability per code, in one table.
 *
 * `retryable` is a property of the failure and not of the caller's mood. A timed-out runner is
 * worth another press — the machine was busy, or the code was slow, and neither is settled.
 * A failed verifier is not: pressing Submit on unchanged code fails again, and offering the
 * button would teach that the way through is to keep clicking.
 */
const CODE_TABLE: Record<ApiErrorCode, { status: number; retryable: boolean }> = {
  'not-found': { status: 404, retryable: false },
  'content-invalid': { status: 500, retryable: false },
  'verifier-failed': { status: 200, retryable: false },
  'runner-timeout': { status: 200, retryable: true },
  'runner-killed': { status: 200, retryable: true },
  'illegal-modifiers': { status: 422, retryable: false },
  'already-awarded': { status: 409, retryable: false },
  'signoff-denied': { status: 403, retryable: false },
  internal: { status: 500, retryable: true },
};

/**
 * A failure a handler raises rather than returns.
 *
 * Thrown, because the alternative is every handler threading an error union back through three
 * call sites, and the site that forgets is the one that returns a half-built payload with a 200.
 */
export class ApiFailure extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: { details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'ApiFailure';
    this.code = code;
    this.status = CODE_TABLE[code].status;
    this.retryable = CODE_TABLE[code].retryable;
    this.details = options?.details;
  }

  /** The wire body, parsed through the contract so a handler cannot invent a tenth code. */
  body(): ApiError {
    return ApiErrorSchema.parse({
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...(this.details === undefined ? {} : { details: this.details }),
    });
  }
}

/**
 * Turn anything thrown into the one shape.
 *
 * An unexpected throw becomes `internal` with a fixed message rather than with the error's own:
 * a stack trace or a driver message on the wire tells a browser about the parent's filesystem,
 * and the useful copy of it is the one in the server log.
 */
export function asFailure(error: unknown): ApiFailure {
  if (error instanceof ApiFailure) return error;
  return new ApiFailure('internal', 'something went wrong on the server', { cause: error });
}

export const notFound = (what: string): ApiFailure => new ApiFailure('not-found', `no such ${what}`);
