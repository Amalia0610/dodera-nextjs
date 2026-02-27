import fs from "fs";
import path from "path";

/* ── Output shape ───────────────────────────────────────────── */

export interface GeneratedPost {
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

/* ── System prompt ──────────────────────────────────────────── */
// Loaded from system-prompt.txt so non-technical editors can update the prompt
// without touching TypeScript. Use {{YEAR}} in the txt file as a placeholder.

const CURRENT_YEAR = new Date().getFullYear();

export const SYSTEM_PROMPT: string = fs
    .readFileSync(path.join(process.cwd(), "src/app/api/auto-post/system-prompt.txt"), "utf-8")
    .replaceAll("{{YEAR}}", String(CURRENT_YEAR));

/* ── Topic diversity helper ─────────────────────────────────── */

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

/**
 * Returns a randomised topic-domain hint injected into the user message so the
 * model doesn't gravitate toward the same subject area on successive calls.
 */
export function getRandomTopicHint(): string {
    const shuffled = [...TOPIC_DOMAINS].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);
    return `Consider these domains first (but pick whichever is genuinely trending the most): ${picked.join(", ")}. Do NOT always default to AI — variety is critical.`;
}

/* ── Response parser ────────────────────────────────────────── */

export function parseGeneratedPost(raw: string): GeneratedPost {
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
