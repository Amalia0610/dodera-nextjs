import { exitPreview } from "@prismicio/next";

/**
 * Exit Prismic preview mode.
 *
 * Clears the preview cookie and redirects the editor back to the page.
 */
export async function GET() {
    return await exitPreview();
}
