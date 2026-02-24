import { redirectToPreviewURL } from "@prismicio/next";
import { createClient } from "@/lib/prismic";
import type { NextRequest } from "next/server";

/**
 * Prismic preview resolver.
 *
 * When an editor clicks "Preview" in the Prismic dashboard,
 * Prismic redirects to /api/preview with a token. This handler
 * resolves the token to the correct page URL and redirects there.
 */
export async function GET(request: NextRequest) {
    const client = createClient();
    return await redirectToPreviewURL({ client, request });
}
