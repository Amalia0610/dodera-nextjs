import "server-only";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { authenticateRequest } from "@/lib/api-auth";

/* ── Model ──────────────────────────────────────────────────── */

const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3";

/* ── Route handler ──────────────────────────────────────────── */

/**
 * POST /api/generate-image
 *
 * Case 1 — Direct prompt:
 *   { "prompt": "A futuristic cityscape at night" }
 *
 * Case 2 — Blog post fields (same shape forwarded by /api/auto-post):
 *   { "title": "...", "excerpt": "...", "category": "...", "tags": [...], ... }
 *   A descriptive image prompt is derived from the provided fields.
 *
 * Both cases return the generated image as a binary response (image/png).
 */
export async function POST(request: NextRequest) {
    /* ── 1. Authentication ───────────────────────────────────── */
    const auth = await authenticateRequest(request);
    if (!auth.valid) return auth.errorResponse!;

    /* ── 2. Parse body ───────────────────────────────────────── */
    let body: Record<string, unknown>;
    try {
        body = (await request.json()) as Record<string, unknown>;
    } catch {
        return NextResponse.json(
            { status: "error", message: "Invalid JSON body." },
            { status: 400 },
        );
    }

    /* ── 3. Determine prompt ─────────────────────────────────── */
    let imagePrompt: string;

    if (typeof body.prompt === "string" && body.prompt.trim().length > 0) {
        /* Case 1: explicit prompt */
        imagePrompt = body.prompt.trim();
    } else if (typeof body.title === "string" && body.title.trim().length > 0) {
        /* Case 2: derive prompt from blog post fields */
        const title = (body.title as string).trim();
        const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
        const category = typeof body.category === "string" ? body.category.trim() : "";
        const tags = Array.isArray(body.tags)
            ? (body.tags as unknown[])
                .filter((t): t is string => typeof t === "string")
                .join(", ")
            : "";

        imagePrompt = [
            `Create a professional, modern featured image for a blog post titled: "${title}".`,
            excerpt ? `The article is about: ${excerpt}` : "",
            category ? `Category: ${category}.` : "",
            tags ? `Related topics: ${tags}.` : "",
            "Style: clean, corporate tech aesthetic with abstract digital elements. No text or letters in the image.",
        ]
            .filter(Boolean)
            .join(" ");
    } else {
        /* Neither prompt nor blog post fields provided */
        return NextResponse.json(
            {
                status: "error",
                message:
                    "Request must include either a 'prompt' string or blog post fields (at minimum 'title').",
            },
            { status: 400 },
        );
    }

    /* ── 4. Validate OpenAI key ──────────────────────────────── */
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey.startsWith("sk-your-")) {
        console.error("[generate-image] OPENAI_API_KEY is not configured.");
        return NextResponse.json(
            { status: "error", message: "Server misconfiguration: OpenAI API key not set." },
            { status: 500 },
        );
    }

    /* ── 5. Return URL vs binary ─────────────────────────────── */
    // When called server-side (e.g. from /api/auto-post) pass ?return_url=true
    // to receive JSON { url, prompt } instead of the raw binary stream.
    const returnUrl =
        request.nextUrl.searchParams.get("return_url")?.toLowerCase() === "true";

    /* ── 6. Generate image via OpenAI ────────────────────────── */
    try {
        const openai = new OpenAI({ apiKey: openaiKey });

        console.log(
            `[generate-image] Generating image — prompt: "${imagePrompt.slice(0, 120)}${imagePrompt.length > 120 ? "…" : ""}"`,
        );

        const imageResponse = await openai.images.generate({
            model: OPENAI_IMAGE_MODEL,
            prompt: imagePrompt,
            n: 1,
            size: "1792x1024",
            quality: "standard",
            response_format: "url",
        });

        const imageUrl = imageResponse.data?.[0]?.url;
        if (!imageUrl) {
            throw new Error("OpenAI returned no image URL.");
        }

        console.log(`[generate-image] Image generated successfully.`);

        /* Return the CDN URL as JSON (used by server-side callers) */
        if (returnUrl) {
            return NextResponse.json(
                { status: "success", url: imageUrl, prompt: imagePrompt },
                { status: 200 },
            );
        }

        /* Fetch the image from OpenAI's CDN and stream it back */
        const cdnResponse = await fetch(imageUrl);
        if (!cdnResponse.ok) {
            throw new Error(
                `Failed to fetch generated image from OpenAI CDN: ${cdnResponse.statusText}`,
            );
        }

        const imageBuffer = await cdnResponse.arrayBuffer();
        const contentType = cdnResponse.headers.get("content-type") ?? "image/png";

        console.log(`[generate-image] Streamed image (${imageBuffer.byteLength} bytes).`);

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("[generate-image] OpenAI error:", err);
        return NextResponse.json(
            {
                status: "error",
                message: "Failed to generate image via OpenAI.",
                details: err instanceof Error ? err.message : String(err),
            },
            { status: 502 },
        );
    }
}
