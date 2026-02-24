import "server-only";

import * as prismic from "@prismicio/client";
import { enableAutoPreviews } from "@prismicio/next";

/**
 * The name of your Prismic repository (from the dashboard URL).
 * e.g. if your repo is at https://your-repo-name.prismic.io
 *
 * Server-only — never exposed to the browser.
 */
export const repositoryName =
    process.env.PRISMIC_REPOSITORY_NAME || "your-repo-name";

/**
 * The base API endpoint for the Prismic repository.
 */
const endpoint = prismic.getRepositoryEndpoint(repositoryName);

/**
 * Route resolver — tells Prismic which URL each document type maps to.
 * This is used by `<PrismicLink>` and the preview system.
 */
const routes: prismic.ClientConfig["routes"] = [
    { type: "blog_post", path: "/blog/:uid" },
];

/**
 * Default ISR revalidation interval in seconds.
 * Pages are statically cached and revalidated in the background
 * every 60 s. On-demand revalidation via the /api/revalidate
 * webhook fires instantly when content is published.
 */
const DEFAULT_REVALIDATE_SECONDS = 60;

/**
 * Creates a Prismic client configured for the Dodera repo.
 *
 * This must only be called from Server Components, Route Handlers,
 * or other server-side code. The module is guarded by `server-only`.
 *
 * @param config  — Optional overrides (e.g. custom `fetchOptions`).
 */
export function createClient(
    config: prismic.ClientConfig = {},
): prismic.Client {
    const client = prismic.createClient(endpoint, {
        routes,
        accessToken: process.env.PRISMIC_ACCESS_TOKEN || undefined,
        fetchOptions: {
            // ISR: serve stale while revalidating in the background.
            // The "prismic" tag allows on-demand revalidation via /api/revalidate.
            next: {
                revalidate: DEFAULT_REVALIDATE_SECONDS,
                tags: ["prismic"],
            },
            ...config.fetchOptions,
        },
        ...config,
    });

    // Automatically query draft content when Next.js Draft Mode is active.
    // Under the hood this reads `draftMode()` and the Prismic preview cookie.
    enableAutoPreviews({ client });

    return client;
}
