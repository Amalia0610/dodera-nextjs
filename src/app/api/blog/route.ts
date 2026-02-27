import "server-only";
import { NextRequest, NextResponse } from "next/server";
import * as prismic from "@prismicio/client";
import type { BlogPostDocumentData } from "../../../../prismicio-types";
import { z } from "zod";
import { repositoryName } from "@/lib/prismic";

/* ── Rich-text helpers ──────────────────────────────────────── */

/**
 * Minimal Prismic RichText node schema (paragraph, heading, etc.)
 * Used when the caller sends body_richtext directly.
 */
const richTextNodeSchema = z.object({
    type: z.string(),
    text: z.string().optional(),
    spans: z.array(z.any()).optional(),
    url: z.string().optional(),
    alt: z.string().optional(),
    dimensions: z.object({ width: z.number(), height: z.number() }).optional(),
}).passthrough();

/**
 * Parse markdown-style links [anchor](url) out of a raw string.
 * Returns the plain text (link syntax removed) and Prismic hyperlink spans.
 * Relative URLs (e.g. /services/ai-development) are expanded to absolute.
 */
const SITE_ORIGIN = "https://doderasoft.com";
const LINK_RE = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)/g;

function extractHyperlinkSpans(raw: string): {
    plainText: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spans: any[];
} {
    let plainText = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spans: any[] = [];
    let lastIndex = 0;

    LINK_RE.lastIndex = 0; // reset stateful regex
    let match: RegExpExecArray | null;

    while ((match = LINK_RE.exec(raw)) !== null) {
        const [fullMatch, anchorText, url] = match;
        plainText += raw.slice(lastIndex, match.index);

        const spanStart = plainText.length;
        plainText += anchorText;
        const spanEnd = plainText.length;

        const absoluteUrl = url.startsWith("/") ? `${SITE_ORIGIN}${url}` : url;

        spans.push({
            type: "hyperlink",
            start: spanStart,
            end: spanEnd,
            data: { link_type: "Web", url: absoluteUrl },
        });

        lastIndex = match.index + fullMatch.length;
    }

    plainText += raw.slice(lastIndex);
    return { plainText, spans };
}

/**
 * Convert a plain-text string to a Prismic RichText paragraph array.
 * Double newlines split into separate paragraphs.
 * Lines starting with `## ` become heading2, `### ` heading3.
 * Markdown links [text](url) inside paragraphs become Prismic hyperlink spans.
 */
function textToRichText(text: string): prismic.RichTextField {
    const blocks = text.split(/\n{2,}/);
    const nodes = blocks
        .filter((b) => b.trim().length > 0)
        .map((block): prismic.RTNode => {
            const trimmed = block.trim();

            if (trimmed.startsWith("### ")) {
                return {
                    type: prismic.RichTextNodeType.heading3,
                    text: trimmed.slice(4),
                    spans: [],
                };
            }
            if (trimmed.startsWith("## ")) {
                return {
                    type: prismic.RichTextNodeType.heading2,
                    text: trimmed.slice(3),
                    spans: [],
                };
            }
            if (trimmed.startsWith("# ")) {
                return {
                    type: prismic.RichTextNodeType.heading1,
                    text: trimmed.slice(2),
                    spans: [],
                };
            }

            // Paragraph — extract hyperlink spans from markdown links
            const { plainText, spans } = extractHyperlinkSpans(trimmed);
            return {
                type: prismic.RichTextNodeType.paragraph,
                text: plainText,
                spans,
            };
        });

    return nodes as prismic.RichTextField;
}

/* ── Request validation ─────────────────────────────────────── */

const blogPostPayloadSchema = z.object({
    /** URL slug — must be unique across all blog posts */
    uid: z
        .string()
        .trim()
        .min(1, "uid is required")
        .max(200)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "uid must be lowercase-alphanumeric with hyphens (e.g. 'my-blog-post')"),

    title: z.string().trim().min(1, "title is required").max(300),
    excerpt: z.string().trim().max(600).optional().default(""),
    date: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
        .optional(),
    read_time: z.string().trim().max(30).optional(),
    category: z.string().trim().max(100).optional(),
    tags: z.array(z.string().trim().max(50)).max(20).optional(),

    /** Plain text / simple markdown body (split by double newlines) */
    body: z.string().optional(),
    /** OR: full Prismic RichText array (takes precedence over body) */
    body_richtext: z.array(richTextNodeSchema).optional(),

    /** Featured image URL (will be uploaded as a Prismic asset) */
    featured_image_url: z.string().url().optional(),
    featured_image_alt: z.string().max(300).optional(),

    author_name: z.string().trim().max(100).optional(),
    /** Author avatar URL */
    author_avatar_url: z.string().url().optional(),

    meta_title: z.string().trim().max(300).optional(),
    meta_description: z.string().trim().max(500).optional(),
    /** OG image URL */
    og_image_url: z.string().url().optional(),

    /** Prismic locale (default: en-us) */
    lang: z.string().trim().default("en-us"),

    /** Whether to auto-publish (default: false → stays as draft) */
    publish: z.boolean().default(true),
});

export type BlogPostPayload = z.infer<typeof blogPostPayloadSchema>;

/* ── Route handler ──────────────────────────────────────────── */

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.json();

        /* Validate payload */
        const parsed = blogPostPayloadSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                { status: "error", errors: parsed.error.flatten().fieldErrors },
                { status: 400 },
            );
        }

        const payload = parsed.data;

        /* Verify Prismic write token is configured */
        const writeToken = process.env.PRISMIC_WRITE_TOKEN;
        if (!writeToken) {
            console.error("PRISMIC_WRITE_TOKEN is not set in environment variables.");
            return NextResponse.json(
                { status: "error", message: "Server misconfiguration: Prismic write token not set." },
                { status: 500 },
            );
        }

        /* Create Prismic write client & migration */
        const writeClient = prismic.createWriteClient(repositoryName, {
            writeToken,
            accessToken: process.env.PRISMIC_ACCESS_TOKEN || undefined,
        });

        const migration = prismic.createMigration();

        /* Handle image assets */
        let featuredImage;
        if (payload.featured_image_url) {
            featuredImage = migration.createAsset(
                payload.featured_image_url,
                payload.title, // asset filename label
                { alt: payload.featured_image_alt || payload.title },
            );
        }

        let authorAvatar;
        if (payload.author_avatar_url) {
            authorAvatar = migration.createAsset(
                payload.author_avatar_url,
                `${payload.author_name || "author"}-avatar`,
            );
        }

        let ogImage;
        if (payload.og_image_url) {
            ogImage = migration.createAsset(
                payload.og_image_url,
                `${payload.uid}-og`,
                { alt: payload.meta_title || payload.title },
            );
        }

        /* Build the body rich text */
        let bodyRichText: prismic.RichTextField;
        if (payload.body_richtext && payload.body_richtext.length > 0) {
            // Direct Prismic RichText
            bodyRichText = payload.body_richtext as prismic.RichTextField;
        } else if (payload.body) {
            // Convert plain text / simple markdown
            bodyRichText = textToRichText(payload.body);
        } else {
            bodyRichText = [];
        }

        /* Build tags group */
        const tags = (payload.tags?.map((tag) => ({ tag })) ?? []) as BlogPostDocumentData["tags"];

        /* Create the document */
        const document = migration.createDocument(
            {
                type: "blog_post",
                uid: payload.uid,
                lang: payload.lang,
                data: {
                    title: payload.title,
                    excerpt: payload.excerpt || null,
                    date: payload.date || new Date().toISOString().slice(0, 10),
                    updated_at: null,
                    read_time: payload.read_time || null,
                    category: payload.category || null,
                    tags,
                    featured_image: featuredImage ?? undefined,
                    author_name: payload.author_name || null,
                    author_avatar: authorAvatar ?? undefined,
                    body: bodyRichText,
                    meta_title: payload.meta_title || null,
                    meta_description: payload.meta_description || null,
                    og_image: ogImage ?? undefined,
                },
            },
            payload.title,
        );

        /* Run the migration (creates assets + document in Prismic) */
        await writeClient.migrate(migration, {
            reporter: (event) => {
                // Log progress server-side for debugging
                console.log(`[Prismic Migration] ${JSON.stringify(event)}`);
            },
        });

        return NextResponse.json(
            {
                status: "success",
                message: `Blog post "${payload.title}" created successfully.`,
                uid: payload.uid,
            },
            { status: 201 },
        );
    } catch (err) {
        console.error("Blog post creation error:", err);

        let message = "Unknown error occurred.";
        let details: string | undefined;

        if (err instanceof Error) {
            message = err.message;
            // Prismic errors often have a `cause` or response body
            if ("cause" in err && err.cause) {
                details = String(err.cause);
                console.error("Error cause:", err.cause);
            }
            if (err.stack) {
                console.error("Stack:", err.stack);
            }
        }

        return NextResponse.json(
            { status: "error", message, ...(details ? { details } : {}) },
            { status: 500 },
        );
    }
}
