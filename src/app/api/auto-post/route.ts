import "server-only";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { authenticateRequest } from "@/lib/api-auth";
import {
    SYSTEM_PROMPT,
    getRandomTopicHint,
    parseGeneratedPost,
    type GeneratedPost,
} from "./prompts";

/* ── Model ──────────────────────────────────────────────────── */

const OPENAI_MODEL = process.env.AUTO_POST_OPENAI_MODEL ?? "gpt-4o";

/* ── Route handler ──────────────────────────────────────────── */

/**
 * GET /api/auto-post
 *
 * No body required — the AI picks the trending topic and writes everything.
 *
 * Optional query params:
 *   save_to_prismic  "true" | "false"  default: true
 *   author_name      string             default: "Dodera Team"
 *   lang             string             default: "en-us"
 *   publish          "true" | "false"  default: false  (false = draft)
 */
export async function GET(request: NextRequest) {
    /* ── 1. Authentication ───────────────────────────────────── */
    const auth = await authenticateRequest(request);
    if (!auth.valid) return auth.errorResponse!;

    /* ── 2. Query params ─────────────────────────────────────── */
    const { searchParams } = request.nextUrl;

    const saveToPrismic = (searchParams.get("save_to_prismic") ?? "true").toLowerCase() !== "false";
    const authorName = searchParams.get("author_name") ?? "Dodera Team";
    const lang = searchParams.get("lang") ?? "en-us";
    const publish = (searchParams.get("publish") ?? "false").toLowerCase() === "true";

    /* ── 3. Validate OpenAI key ──────────────────────────────── */
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey.startsWith("sk-your-")) {
        console.error("[auto-post] OPENAI_API_KEY is not configured.");
        return NextResponse.json(
            { status: "error", message: "Server misconfiguration: OpenAI API key not set." },
            { status: 500 },
        );
    }

    /* ── 4. Call OpenAI ──────────────────────────────────────── */
    let generatedPost: GeneratedPost;

    try {
        const openai = new OpenAI({ apiKey: openaiKey });

        console.log(`[auto-post] Calling ${OPENAI_MODEL} — researching trending IT topic and generating post...`);

        const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            response_format: { type: "json_object" },
            temperature: 0.9,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `${getRandomTopicHint()}\n\nPick the single most trending, share-worthy topic in the technology space right now and write the full blog post. Output only the JSON object.`,
                },
            ],
        });

        const rawContent = completion.choices[0]?.message?.content ?? "";

        if (!rawContent) {
            throw new Error("OpenAI returned an empty response.");
        }

        generatedPost = parseGeneratedPost(rawContent);

        console.log(`[auto-post] Generated — uid="${generatedPost.uid}" title="${generatedPost.title}"`);
    } catch (err) {
        console.error("[auto-post] OpenAI error:", err);
        return NextResponse.json(
            {
                status: "error",
                message: "Failed to generate blog post via OpenAI.",
                details: err instanceof Error ? err.message : String(err),
            },
            { status: 502 },
        );
    }

    /* ── 5. Generate featured image ──────────────────────────── */
    const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const authHeader = request.headers.get("authorization") ?? "";

    let featuredImageUrl: string | undefined;

    try {
        const generateImageUrl = `${origin}/api/generate-image?return_url=true`;

        console.log(`[auto-post] Requesting featured image via ${generateImageUrl}`);

        const imageRes = await fetch(generateImageUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
            body: JSON.stringify({
                title: generatedPost.title,
                excerpt: generatedPost.excerpt,
                category: generatedPost.category,
                tags: generatedPost.tags,
            }),
        });

        if (imageRes.ok) {
            const imageJson = await imageRes.json() as { status: string; url?: string };
            featuredImageUrl = imageJson.url;
            console.log(`[auto-post] Featured image URL obtained: ${featuredImageUrl?.slice(0, 80)}…`);
        } else {
            console.warn(`[auto-post] Image generation returned ${imageRes.status} — continuing without image.`);
        }
    } catch (imgErr) {
        console.warn("[auto-post] Image generation failed — continuing without image:", imgErr);
    }

    /* ── 6. Return early if save_to_prismic=false ────────────── */
    if (!saveToPrismic) {
        return NextResponse.json(
            {
                status: "success",
                message: "Blog post generated (not saved to Prismic).",
                generated_post: generatedPost,
                ...(featuredImageUrl && { featured_image_url: featuredImageUrl }),
            },
            { status: 200 },
        );
    }

    /* ── 7. POST to /api/blog ────────────────────────────────── */
    try {
        const blogApiUrl = `${origin}/api/blog`;

        const blogPayload = {
            uid: generatedPost.uid,
            title: generatedPost.title,
            excerpt: generatedPost.excerpt,
            body: generatedPost.body,
            tags: generatedPost.tags,
            category: generatedPost.category,
            read_time: generatedPost.read_time,
            meta_title: generatedPost.meta_title,
            meta_description: generatedPost.meta_description,
            date: new Date().toISOString().slice(0, 10),
            author_name: authorName,
            lang,
            publish,
            ...(featuredImageUrl && {
                featured_image_url: featuredImageUrl,
                featured_image_alt: generatedPost.title,
                og_image_url: featuredImageUrl,
            }),
        };

        console.log(`[auto-post] Forwarding to Prismic via ${blogApiUrl}`);

        const blogResponse = await fetch(blogApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
            body: JSON.stringify(blogPayload),
        });

        const blogJson = await blogResponse.json() as Record<string, unknown>;

        if (!blogResponse.ok) {
            console.error("[auto-post] /api/blog error:", blogJson);
            return NextResponse.json(
                {
                    status: "error",
                    message: "Post generated but failed to save to Prismic.",
                    generated_post: generatedPost,
                    prismic_error: blogJson,
                },
                { status: blogResponse.status },
            );
        }

        return NextResponse.json(
            {
                status: "success",
                message: `Blog post "${generatedPost.title}" generated and saved to Prismic.`,
                uid: generatedPost.uid,
                generated_post: generatedPost,
                prismic_response: blogJson,
            },
            { status: 201 },
        );
    } catch (err) {
        console.error("[auto-post] Error calling /api/blog:", err);
        return NextResponse.json(
            {
                status: "error",
                message: "Post generated but an error occurred while saving to Prismic.",
                generated_post: generatedPost,
                details: err instanceof Error ? err.message : String(err),
            },
            { status: 502 },
        );
    }
}


