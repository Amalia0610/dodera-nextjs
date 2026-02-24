/**
 * CMS abstraction layer — powered by Prismic.
 *
 * This module fetches blog content from the Prismic headless CMS
 * and maps it into the app's internal BlogPost type so the rest of
 * the codebase stays decoupled from any specific CMS API.
 *
 * Fallback: if no Prismic repository is configured (env var missing)
 * or the fetch fails, the placeholder data from config/blog.ts is
 * returned so the site still builds during local development.
 */

import * as prismic from "@prismicio/client";
import { createClient } from "@/lib/prismic";
import type { BlogPost } from "@/types";
import type { BlogPostDocument } from "@/types/prismic";
import { BLOG_POSTS } from "@/config/blog";

/* ── Helpers ───────────────────────────────────────────── */

/** Check whether Prismic is configured via environment variable. */
function isPrismicConfigured(): boolean {
    return (
        !!process.env.PRISMIC_REPOSITORY_NAME &&
        process.env.PRISMIC_REPOSITORY_NAME !== "your-repo-name"
    );
}

/**
 * Convert a Prismic blog_post document into the internal BlogPost shape.
 */
function mapPrismicPost(doc: BlogPostDocument): BlogPost {
    const d = doc.data;

    return {
        slug: doc.uid ?? doc.id,
        title: d.title ?? "Untitled",
        excerpt: d.excerpt ?? "",
        date: d.date ?? doc.first_publication_date ?? "",
        updatedAt: d.updated_at ?? doc.last_publication_date ?? undefined,
        readTime: d.read_time ?? "5 min read",
        category: d.category ?? "Uncategorized",
        tags: (d.tags ?? []).map((t) => t.tag ?? "").filter(Boolean),
        author: d.author_name
            ? {
                name: d.author_name,
                avatar: d.author_avatar?.url ?? undefined,
            }
            : undefined,
        image: d.featured_image?.url ?? undefined,
        body: prismic.asHTML(d.body) ?? undefined,
        seo: {
            metaTitle: d.meta_title ?? undefined,
            metaDescription: d.meta_description ?? undefined,
            ogImage: d.og_image?.url ?? undefined,
        },
    };
}

/* ── All posts (listing page) ──────────────────────────── */
export async function getAllPosts(): Promise<BlogPost[]> {
    if (!isPrismicConfigured()) return BLOG_POSTS;

    try {
        const client = createClient();
        const docs = await client.getAllByType<BlogPostDocument>("blog_post", {
            orderings: [
                { field: "my.blog_post.date", direction: "desc" },
            ],
        });

        if (docs.length === 0) return BLOG_POSTS;

        return docs.map(mapPrismicPost);
    } catch (err) {
        console.error("[cms] Failed to fetch posts from Prismic:", err);
        return BLOG_POSTS;
    }
}

/* ── Single post by slug ───────────────────────────────── */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!isPrismicConfigured()) {
        return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
    }

    try {
        const client = createClient();
        const doc = await client.getByUID<BlogPostDocument>("blog_post", slug);
        return mapPrismicPost(doc);
    } catch (err) {
        // Document not found — fall back to static data
        if (
            err instanceof prismic.NotFoundError ||
            (err instanceof prismic.PrismicError && err.message.includes("not found"))
        ) {
            return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
        }
        console.error("[cms] Failed to fetch post by slug:", err);
        return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
    }
}

/* ── All slugs (for generateStaticParams) ──────────────── */
export async function getAllPostSlugs(): Promise<string[]> {
    if (!isPrismicConfigured()) {
        return BLOG_POSTS.map((p) => p.slug);
    }

    try {
        const client = createClient();
        const docs = await client.getAllByType<BlogPostDocument>("blog_post");
        const prismicSlugs = docs.map((d) => d.uid).filter(Boolean) as string[];
        return prismicSlugs.length > 0 ? prismicSlugs : BLOG_POSTS.map((p) => p.slug);
    } catch (err) {
        console.error("[cms] Failed to fetch slugs from Prismic:", err);
        return BLOG_POSTS.map((p) => p.slug);
    }
}

/* ── Posts by category ─────────────────────────────────── */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
    const posts = await getAllPosts();
    return posts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase(),
    );
}

/* ── Posts by tag ──────────────────────────────────────── */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
    const posts = await getAllPosts();
    return posts.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
    );
}
