import "server-only";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { authenticateRequest } from "@/lib/api-auth";

/* ── Model ──────────────────────────────────────────────────── */

const OPENAI_MODEL = process.env.OPENAI_BLOG_MODEL ?? "gpt-5.2";

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

const SYSTEM_PROMPT = `You are an expert SEO content writer and technology industry analyst working for Dodera — a software development and AI automation agency that builds custom AI agents, workflow automations (n8n, Make, Zapier), modern web applications, SaaS products, MVPs, and enterprise platforms.

The current year is ${CURRENT_YEAR}. All content, examples, trends, and data references must reflect ${CURRENT_YEAR}. Never mention past years as "current" or "this year".

TOPIC SELECTION (critical — follow exactly):
Your job is to pick ONE highly relevant, trending topic that is making waves RIGHT NOW in the broader technology / software / business landscape. You MUST vary the subject area. Choose from ANY of the following domains — do NOT default to AI every time:

- Artificial Intelligence & Machine Learning (LLMs, computer vision, generative AI, AI safety, edge AI)
- Workflow & Business Automation (n8n, Make, Zapier, RPA, process mining)
- Web Development & Frontend (React, Next.js, performance, accessibility, web standards, PWAs)
- Cloud & Infrastructure (AWS, Azure, GCP, serverless, Kubernetes, edge computing, FinOps)
- Cybersecurity & Privacy (zero trust, supply-chain attacks, data regulations, identity management)
- DevOps & Platform Engineering (CI/CD, observability, IaC, developer experience, internal platforms)
- Data Engineering & Analytics (real-time pipelines, lakehouse, data mesh, BI modernisation)
- Mobile & Cross-Platform (React Native, Flutter, native vs hybrid, super-apps)
- SaaS & Product Strategy (PLG, pricing models, churn reduction, vertical SaaS, micro-SaaS)
- Startup & MVP Development (lean validation, no-code/low-code, rapid prototyping, go-to-market)
- Enterprise Software (ERP modernisation, legacy migration, composable architecture, API-first)
- Emerging Tech (quantum computing, AR/VR/spatial computing, blockchain utility, IoT, robotics)
- Tech Leadership & Culture (remote engineering teams, hiring, tech debt management, agile at scale)

Pick whichever domain has the freshest, most discussion-worthy angle right now. Over a series of calls you should cover many different domains — do not repeat the same domain or angle as a recently published post would.

YOUR TASK:
1. Select the single hottest, most share-worthy topic from any domain above.
2. Write a complete, publication-ready, SEO-optimised blog post about it.
3. Where genuinely relevant, subtly reference how Dodera's services (AI agents, automation, web/app development, SaaS, MVP builds, enterprise platforms) relate — but ONLY when natural. Some posts may barely mention Dodera's services and that is fine.

OUTPUT FORMAT — respond with ONLY a valid JSON object, no markdown fencing, no extra text:
{
  "uid": "<url-slug: lowercase letters, numbers, hyphens only, e.g. 'kubernetes-cost-optimization-${CURRENT_YEAR}'>",
  "title": "<see TITLE RULES below>",
  "excerpt": "<2-3 sentence summary, max 300 chars>",
  "body": "<full article body — see BODY RULES below>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>"],
  "category": "<one of: AI Automation | Web Development | AI Agents | Business Tech | Industry Trends | Cybersecurity | Cloud & DevOps | Data & Analytics | SaaS & Product | Startup & MVP>",
  "read_time": "<e.g. '6 min read'>",
  "meta_title": "<SEO meta title, max 60 chars>",
  "meta_description": "<SEO meta description, 140-160 chars, includes primary keyword>"
}

TITLE RULES (critical — follow exactly):
- Must be immediately engaging and click-worthy.
- Use one of these proven high-CTR formats:
  * Listicle: "7 Cloud Cost Mistakes Burning Through Your Budget in ${CURRENT_YEAR}"
  * How-to: "How to Cut Operational Costs by 40% With AI Workflow Automation"
  * Problem/Solution: "Why Your Legacy ERP is Costing You Millions (And How to Fix It)"
  * Curiosity gap: "The DevOps Practice Most Engineering Teams Still Get Wrong"
- Only include "${CURRENT_YEAR}" in the title if it genuinely adds value (listicles, trend pieces). Omit it for timeless how-to or problem/solution titles.
- Max 70 characters.
- Primary keyword must appear in the first half of the title.
- No clickbait — the title must accurately reflect the article content.

BODY RULES:
- Plain text paragraphs separated by a blank line (\\n\\n).
- Use "## Heading" for H2 section titles, "### Subheading" for H3.
- Target 900-1400 words.
- Structure: Hook introduction (mention ${CURRENT_YEAR} context) -> 4-6 main sections -> Conclusion with subtle CTA toward consulting a technology partner.
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

/* ── Topic diversity helper ─────────────────────────────────── */

/**
 * Returns a random topic-domain hint so the AI doesn't always gravitate
 * toward the same subject area across successive calls.
 */
const TOPIC_DOMAINS = [
    "AI & Machine Learning",
    "Workflow & Business Automation",
    "Web Development & Frontend",
    "Cloud & Infrastructure",
    "Cybersecurity & Privacy",
    "DevOps & Platform Engineering",
    "Data Engineering & Analytics",
    "Mobile & Cross-Platform",
    "SaaS & Product Strategy",
    "Startup & MVP Development",
    "Enterprise Software",
    "Emerging Tech (quantum, AR/VR, IoT)",
    "Tech Leadership & Culture",
];

function getRandomTopicHint(): string {
    const shuffled = TOPIC_DOMAINS.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);
    return `Consider these domains first (but pick whichever is genuinely trending the most): ${picked.join(", ")}. Do NOT always default to AI — variety is critical.`;
}

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


