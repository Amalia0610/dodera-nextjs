import * as prismic from "@prismicio/client";
import { PrismicRichText as BasePrismicRichText } from "@prismicio/react";

/**
 * Re-export PrismicRichText with default serialiser.
 *
 * You can customise heading, paragraph, image rendering etc.
 * by passing a `components` prop or editing the defaults below.
 *
 * @see https://prismic.io/docs/rich-text
 */
export function PrismicRichText({
    field,
    ...props
}: {
    field: prismic.RichTextField | null | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}) {
    if (!field) return null;

    return <BasePrismicRichText field={field} {...props} />;
}
