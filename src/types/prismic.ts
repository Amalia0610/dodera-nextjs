/**
 * Prismic custom type definitions.
 *
 * These TypeScript interfaces mirror the fields you configure in
 * the Prismic dashboard (or Slice Machine) for each custom type.
 *
 * ┌───────────────────────────────────────────────┐
 * │  Update these if you add / rename fields in   │
 * │  the Prismic type editor.                     │
 * └───────────────────────────────────────────────┘
 */

import type * as prismic from "@prismicio/client";

// ── blog_post custom type ───────────────────────────────

export type BlogPostDocumentData = {
    /** Post title (plain text) */
    title: prismic.KeyTextField;
    /** URL-safe identifier – auto-generated from title in Prismic */
    // uid is on the document itself, not in `data`
    /** Short summary / teaser */
    excerpt: prismic.KeyTextField;
    /** Publication date */
    date: prismic.DateField;
    /** Last-updated date (optional) */
    updated_at: prismic.DateField;
    /** Estimated read time, e.g. "8 min read" */
    read_time: prismic.KeyTextField;
    /** Category label */
    category: prismic.KeyTextField;
    /** Comma-separated or group of tags */
    tags: prismic.GroupField<{ tag: prismic.KeyTextField }>;
    /** Featured / hero image */
    featured_image: prismic.ImageField;
    /** Author name */
    author_name: prismic.KeyTextField;
    /** Author avatar image */
    author_avatar: prismic.ImageField;
    /** Rich text body content */
    body: prismic.RichTextField;
    /** SEO: meta title override */
    meta_title: prismic.KeyTextField;
    /** SEO: meta description override */
    meta_description: prismic.KeyTextField;
    /** SEO: Open Graph image override */
    og_image: prismic.ImageField;
    /** Index signature for Prismic document compatibility */
    [key: string]: prismic.AnyRegularField | prismic.GroupField | prismic.SliceZone;
};

export type BlogPostDocument = prismic.PrismicDocument<
    BlogPostDocumentData,
    "blog_post"
>;

// ── page custom type (generic pages) ────────────────────

export type PageDocumentData = {
    title: prismic.KeyTextField;
    body: prismic.RichTextField;
    meta_title: prismic.KeyTextField;
    meta_description: prismic.KeyTextField;
    og_image: prismic.ImageField;
    /** Index signature for Prismic document compatibility */
    [key: string]: prismic.AnyRegularField | prismic.GroupField | prismic.SliceZone;
};

export type PageDocument = prismic.PrismicDocument<
    PageDocumentData,
    "page"
>;

// ── Union of all document types ─────────────────────────

export type AllDocumentTypes = BlogPostDocument | PageDocument;
