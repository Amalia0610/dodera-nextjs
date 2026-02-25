/**
 * Protected API route prefixes.
 *
 * Any request whose pathname starts with one of these will
 * require a valid `Authorization: Bearer <token>` header.
 *
 * Add new prefixes here as you build more guarded endpoints.
 */
export const PROTECTED_API_ROUTES: string[] = [
    "/api/ping",
    // "/api/some-future-route",
];

/**
 * Public API routes that should NEVER require auth, even if they
 * sit under a protected prefix. Add explicit paths here to bypass.
 */
export const PUBLIC_API_ROUTES: string[] = [
    "/api/contact",
    "/api/newsletter",
    "/api/revalidate",
    "/api/preview",
    "/api/exit-preview",
];
