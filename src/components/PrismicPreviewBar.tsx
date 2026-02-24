import { PrismicPreview } from "@prismicio/next";
import { repositoryName } from "@/lib/prismic";

/**
 * Prismic toolbar — async Server Component.
 *
 * Renders the Prismic toolbar script and automatically enables
 * Draft Mode awareness so editors can preview unpublished content.
 *
 * Include this once in the root layout.
 */
export async function PrismicPreviewBar() {
    return <PrismicPreview repositoryName={repositoryName} />;
}
