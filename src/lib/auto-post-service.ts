import "server-only";
import OpenAI from "openai";
import * as prismic from "@prismicio/client";
import type { BlogPostDocumentData } from "../../prismicio-types";
import { repositoryName } from "@/lib/prismic";
import {
    SYSTEM_PROMPT,
    getRandomTopicHint,
    parseGeneratedPost,
    type GeneratedPost,
} from "@/app/api/auto-post/prompts";
import { generateImageUrl } from "@/lib/generate-image-service";
import { supabase } from "@/lib/supabase";

const OPENAI_MODEL = process.env.AUTO_POST_OPENAI_MODEL ?? "gpt-4o";

export interface AutoPostOptions {
    publish?: boolean;
    authorName?: string;
    lang?: string;
    saveToPrismic?: boolean;
}

export interface AutoPostResult {
    status: "success" | "error";
    message: string;
    uid?: string;
    generated_post?: GeneratedPost;
    featured_image_url?: string;
}

/* ── Prismic helpers (mirrors blog/route.ts) ─────────────────── */

const SITE_ORIGIN = "https://doderasoft.com";
const LINK_RE = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)]+)\)/g;

function extractHyperlinkSpans(raw: string) {
    let plainText = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spans: any[] = [];
    let lastIndex = 0;
    LINK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = LINK_RE.exec(raw)) !== null) {
        const [fullMatch, anchorText, url] = match;
        plainText += raw.slice(lastIndex, match.index);
        const spanStart = plainText.length;
        plainText += anchorText;
        const spanEnd = plainText.length;
        const absoluteUrl = url.startsWith("/") ? `${SITE_ORIGIN}${url}` : url;
        spans.push({ type: "hyperlink", start: spanStart, end: spanEnd, data: { link_type: "Web", url: absoluteUrl } });
        lastIndex = match.index + fullMatch.length;
    }
    plainText += raw.slice(lastIndex);
    return { plainText, spans };
}

function textToRichText(text: string): prismic.RichTextField {
    const blocks = text.split(/\n{2,}/);
    const nodes = blocks
        .filter((b) => b.trim().length > 0)
        .map((block): prismic.RTNode => {
            const trimmed = block.trim();
            if (trimmed.startsWith("### ")) return { type: prismic.RichTextNodeType.heading3, text: trimmed.slice(4), spans: [] };
            if (trimmed.startsWith("## ")) return { type: prismic.RichTextNodeType.heading2, text: trimmed.slice(3), spans: [] };
            if (trimmed.startsWith("# ")) return { type: prismic.RichTextNodeType.heading1, text: trimmed.slice(2), spans: [] };
            const { plainText, spans } = extractHyperlinkSpans(trimmed);
            return { type: prismic.RichTextNodeType.paragraph, text: plainText, spans };
        });
    return nodes as prismic.RichTextField;
}

/* ── Main service function ───────────────────────────────────── */

export async function autoPost(options: AutoPostOptions = {}): Promise<AutoPostResult> {
    const {
        publish = false,
        authorName = "Dodera Team",
        lang = "en-us",
        saveToPrismic = true,
    } = options;

    /* 1. Validate OpenAI key */
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey.startsWith("sk-your-")) {
        return { status: "error", message: "OpenAI API key is not configured." };
    }

    /* 1b. Fetch recent posts from Supabase for topic deduplication */
    let recentPostsContext = "";
    try {
        const { data: recentPosts, error: dbError } = await supabase
            .from("auto_generated_blog_posts")
            .select("title, category, uid")
            .order("created_at", { ascending: false })
            .limit(20);

        if (dbError) {
            console.warn("[auto-post-service] Supabase fetch error — proceeding without deduplication:", dbError.message);
        } else if (recentPosts && recentPosts.length > 0) {
            const list = recentPosts
                .map((p, i) => `${i + 1}. "${p.title}" (${p.category ?? "uncategorised"}) [uid: ${p.uid}]`)
                .join("\n");
            recentPostsContext = `\n\nRECENT POSTS — DO NOT repeat these topics, titles, or close variations of them:\n${list}`;
            console.log(`[auto-post-service] Loaded ${recentPosts.length} recent post(s) for deduplication.`);
        } else {
            console.log("[auto-post-service] No previous posts in Supabase — first generation.");
        }
    } catch (dbErr) {
        console.warn("[auto-post-service] Could not fetch recent posts — proceeding without deduplication:", dbErr);
    }

    /* 2. Generate post content */
    let generatedPost: GeneratedPost;
    try {
        const openai = new OpenAI({ apiKey: openaiKey });
        console.log(`[auto-post-service] Calling ${OPENAI_MODEL}…`);
        const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            response_format: { type: "json_object" },
            temperature: 0.9,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `${getRandomTopicHint()}\n\nPick the single most trending, share-worthy topic in the technology space right now and write the full blog post. Output only the JSON object.${recentPostsContext}`,
                },
            ],
        });
        const raw = completion.choices[0]?.message?.content ?? "";
        if (!raw) throw new Error("OpenAI returned an empty response.");
        generatedPost = parseGeneratedPost(raw);
        console.log(`[auto-post-service] Generated — uid="${generatedPost.uid}" title="${generatedPost.title}"`);
    } catch (err) {
        return {
            status: "error",
            message: "Failed to generate blog post via OpenAI.",
        };
    }

    /* 3. Generate featured image */
    let featuredImageUrl: string | undefined;
    try {
        const { url } = await generateImageUrl({
            title: generatedPost.title,
            excerpt: generatedPost.excerpt,
            category: generatedPost.category,
            tags: generatedPost.tags,
        });
        featuredImageUrl = url;
        console.log(`[auto-post-service] Image URL: ${url.slice(0, 80)}…`);
    } catch (imgErr) {
        console.warn("[auto-post-service] Image generation failed — continuing without image:", imgErr);
    }

    if (!saveToPrismic) {
        return {
            status: "success",
            message: "Blog post generated (not saved to Prismic).",
            uid: generatedPost.uid,
            generated_post: generatedPost,
            ...(featuredImageUrl && { featured_image_url: featuredImageUrl }),
        };
    }

    /* 4. Post to Prismic */
    try {
        const writeToken = process.env.PRISMIC_WRITE_TOKEN;
        if (!writeToken) throw new Error("PRISMIC_WRITE_TOKEN is not set.");

        const writeClient = prismic.createWriteClient(repositoryName, {
            writeToken,
            accessToken: process.env.PRISMIC_ACCESS_TOKEN || undefined,
        });

        const migration = prismic.createMigration();

        const fileCache = new Map<string, File>();
        async function fetchAsFile(url: string, filename: string): Promise<File> {
            if (fileCache.has(url)) return fileCache.get(url)!;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch asset: ${res.statusText}`);
            const buffer = await res.arrayBuffer();
            const contentType = res.headers.get("content-type") ?? "image/png";
            const ext = contentType.split("/")[1]?.split(";")[0] ?? "png";
            const safeFilename = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
            const file = new File([buffer], safeFilename, { type: contentType });
            fileCache.set(url, file);
            return file;
        }

        let featuredImage;
        let ogImage;
        if (featuredImageUrl) {
            const file = await fetchAsFile(featuredImageUrl, generatedPost.title);
            featuredImage = migration.createAsset(file, file.name, { alt: generatedPost.title });
            ogImage = featuredImage;
        }

        const bodyRichText = textToRichText(generatedPost.body);
        const tags = generatedPost.tags.map((tag) => ({ tag })) as BlogPostDocumentData["tags"];

        migration.createDocument(
            {
                type: "blog_post",
                uid: generatedPost.uid,
                lang,
                data: {
                    title: generatedPost.title,
                    excerpt: generatedPost.excerpt || null,
                    date: new Date().toISOString().slice(0, 10),
                    updated_at: null,
                    read_time: generatedPost.read_time || null,
                    category: generatedPost.category || null,
                    tags,
                    featured_image: featuredImage ?? undefined,
                    author_name: authorName,
                    author_avatar: undefined,
                    body: bodyRichText,
                    meta_title: generatedPost.meta_title || null,
                    meta_description: generatedPost.meta_description || null,
                    og_image: ogImage ?? undefined,
                },
            },
            generatedPost.title,
        );

        await writeClient.migrate(migration, {
            reporter: (event) => console.log(`[Prismic Migration] ${JSON.stringify(event)}`),
        });

        /* Record in Supabase for future deduplication */
        try {
            const { error: insertError } = await supabase.from("auto_generated_blog_posts").insert({
                uid: generatedPost.uid,
                title: generatedPost.title,
                category: generatedPost.category,
                tags: generatedPost.tags,
            });
            if (insertError) {
                console.warn("[auto-post-service] Supabase insert warning:", insertError.message);
            } else {
                console.log(`[auto-post-service] Post recorded in Supabase — uid="${generatedPost.uid}"`);
            }
        } catch (insertErr) {
            console.warn("[auto-post-service] Supabase insert failed — non-critical:", insertErr);
        }

        if (publish) {
            // Note: the Prismic Migration API creates documents as drafts.
            // Publishing requires the Documents API which is separate.
            console.log("[auto-post-service] Post created as draft. Manual publish required if needed.");
        }

        return {
            status: "success",
            message: `Blog post "${generatedPost.title}" generated and saved to Prismic.`,
            uid: generatedPost.uid,
            generated_post: generatedPost,
            ...(featuredImageUrl && { featured_image_url: featuredImageUrl }),
        };
    } catch (err) {
        console.error("[auto-post-service] Prismic error:", err);
        return {
            status: "error",
            message: "Post generated but failed to save to Prismic.",
            generated_post: generatedPost,
        };
    }
}
