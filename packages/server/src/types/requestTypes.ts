// src/types.ts

/**
 * An extension of the standard Web Request that includes
 * the URL parameters extracted by the Bun FileSystemRouter.
 */
export type BunRequest = Request & {
    params: Record<string, string>;
};

/**
 * A standard handler signature for the Bun backend.
 * Arity is strictly 1: the request object itself.
 */
export type RouteHandler = (
    req: BunRequest
) => Response | Promise<Response>;