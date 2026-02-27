import "server-only";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { authenticateRequest } from "@/lib/api-auth";

/* ── Model ──────────────────────────────────────────────────── */

const OPENAI_MODEL = process.env.OPENAI_BLOG_MODEL ?? "gpt-4o";

/* ── Output shape ───────────────────────────────────────────── */

interface GeneratedPost {
    uid: string;
    title: string;
    excerpt: string;
    body: string;
    tags: string[];
    category: string;
    read_time: string;
    meta_title: string;
    meta_description: string;
}

/* ── Prompts ────────────────────────────────────────────────── */

// Injected at runtime so content is always year-accurate
const CURRENT_YEAR = new Date().getFullYear();

const SYSTEM_PROMPT = `You are an expert SEO content writer and IT industry analyst working for Dodera — a web and AI automation agency that builds custom AI agents, workflow automations (n8n, Make, Zapier), and modern websites for businesses.

The current year is ${CURRENT_YEAR}. All content, examples, trends, and data references must reflect ${CURRENT_YEAR}. Never mention 2024 or any past year as "current" or "this year".

Your job is to:
1. Identify the single most relevant and trending topic RIGHT NOW (${CURRENT_YEAR}) in the IT / AI / automation / web development industry that would interest Dodera's target audience (business owners, ops managers, CTOs, and tech-forward SMEs).
2. Write a complete, publication-ready, SEO-optimised blog post about that topic.
3. Naturally and subtly weave in Dodera's services (AI automation, AI agents, workflow automation, modern web development) as relevant solutions — never forced, always helpful.

OUTPUT FORMAT — respond with ONLY a valid JSON object, no markdown fencing, no extra text:
{
  "uid": "<url-slug: lowercase letters, numbers, hyphens only, e.g. 'ai-agents-transforming-business-${CURRENT_YEAR}'>",
  "title": "<see TITLE RULES below>",
  "excerpt": "<2-3 sentence summary, max 300 chars>",
  "body": "<full article body — see BODY RULES below>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],
  "category": "<one of: AI Automation | Web Development | AI Agents | Business Tech | Industry Trends>",
  "read_time": "<e.g. '6 min read'>",
  "meta_title": "<SEO meta title, max 60 chars>",
  "meta_description": "<SEO meta description, 140-160 chars, includes primary keyword>"
}

TITLE RULES (critical — follow exactly):
- Must be immediately engaging and click-worthy.
- Use one of these proven high-CTR formats:
  * Listicle: "7 AI Automation Tools That Will Transform Your Business in ${CURRENT_YEAR}"
  * How-to: "How to Cut Operational Costs by 40% With AI Workflow Automation"
  * Problem/Solution: "Why Your Business Is Falling Behind Without AI Agents (And How to Fix It)"
  * Curiosity gap: "The Automation Strategy Most CEOs Are Ignoring in ${CURRENT_YEAR}"
- Only include "${CURRENT_YEAR}" in the title if it genuinely adds value (listicles, trend pieces). Omit it for timeless how-to or problem/solution titles.
- Max 70 characters.
- Primary keyword must appear in the first half of the title.
- No clickbait — the title must accurately reflect the article content.

BODY RULES:
- Plain text paragraphs separated by a blank line (\\n\\n).
- Use "## Heading" for H2 section titles, "### Subheading" for H3.
- Target 900-1400 words.
- Structure: Hook introduction (mention ${CURRENT_YEAR} context) -> 4-6 main sections -> Conclusion with subtle CTA toward consulting an automation partner.
- All statistics, trends, and tool references must be relevant to ${CURRENT_YEAR}.
- Do NOT use markdown bold (**), italic (*), or bullet lists inside the body string.

INTERNAL LINKING RULES (important for SEO):
- Include 2-4 internal links throughout the body using standard markdown link syntax: [anchor text](/path)
- Use descriptive, keyword-rich anchor text — never "click here" or "read more".
- Link only to pages that are genuinely relevant to the surrounding sentence.
- Available internal pages to link to:
  * Homepage: /
  * Blog: /blog
  * AI Development (overview): /services/ai-development
  * Custom AI Agents: /services/custom-ai-agents
  * AI-Powered Automations: /services/ai-powered-automations
  * Software Development (overview): /services/software-development
  * MVP to Market: /services/mvp-to-market
  * Enterprise Platforms: /services/enterprise-platforms
  * SaaS Products: /services/saas-products
  * Technical Documentation: /services/technical-documentation
  * Documentation Systems: /services/documentation-systems
- Spread links naturally across different sections — do not cluster them together.
- Do NOT invent URLs. Use only the paths listed above.

SEO RULES:
- Primary keyword in title, first paragraph, at least two H2 headings, and meta fields.
- Engaging introduction within the first 100 words — open with a striking stat or question.
- Naturally include LSI/secondary keywords throughout.`;

/* ── Parse + validate OpenAI response ──────────────────────── */

function parseGeneratedPost(raw: string): GeneratedPost {
    const cleaned = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const required: (keyof GeneratedPost)[] = [
        "uid", "title", "excerpt", "body", "tags",
        "category", "read_time", "meta_title", "meta_description",
    ];

    for (const key of required) {
        if (!(key in parsed)) {
            throw new Error(`OpenAI response is missing required field: "${key}"`);
        }
    }

    if (!Array.isArray(parsed.tags)) {
        parsed.tags = [];
    }

    return parsed as unknown as GeneratedPost;
}

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
            temperature: 0.75,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: "Pick the most relevant trending topic in IT / AI / automation right now and write the full blog post. Output only the JSON object.",
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

    /* ── 5. Return early if save_to_prismic=false ────────────── */
    if (!saveToPrismic) {
        return NextResponse.json(
            {
                status: "success",
                message: "Blog post generated (not saved to Prismic).",
                generated_post: generatedPost,
            },
            { status: 200 },
        );
    }

    /* ── 6. POST to /api/blog ────────────────────────────────── */
    try {
        const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
        const blogApiUrl = `${origin}/api/blog`;
        const authHeader = request.headers.get("authorization") ?? "";

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


