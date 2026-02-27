import fs from "fs";
import path from "path";

// Loaded from image-prompt.txt so non-technical editors can adjust the image
// style/tone without touching TypeScript. Supported placeholders:
//   {{TITLE}}    — blog post title (always present)
//   {{EXCERPT}}  — short article summary (optional)
//   {{CATEGORY}} — post category (optional)
//   {{TAGS}}     — comma-separated tags (optional)
// Lines where an optional placeholder resolves to empty are automatically
// removed from the final prompt.

const IMAGE_PROMPT_TEMPLATE: string = fs.readFileSync(
    path.join(process.cwd(), "src/app/api/generate-image/image-prompt.txt"),
    "utf-8",
);

/**
 * Builds the DALL-E image prompt from either a raw prompt string or structured
 * blog post fields.
 *
 * Returns `null` when neither form of input is present (caller should 400).
 */
export function buildImagePrompt(body: Record<string, unknown>): string | null {
    if (typeof body.prompt === "string" && body.prompt.trim().length > 0) {
        return body.prompt.trim();
    }

    if (typeof body.title === "string" && body.title.trim().length > 0) {
        const title = body.title.trim();
        const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
        const category = typeof body.category === "string" ? body.category.trim() : "";
        const tags = Array.isArray(body.tags)
            ? (body.tags as unknown[])
                .filter((t): t is string => typeof t === "string")
                .join(", ")
            : "";

        return IMAGE_PROMPT_TEMPLATE
            .replaceAll("{{TITLE}}", title)
            .replaceAll("{{EXCERPT}}", excerpt)
            .replaceAll("{{CATEGORY}}", category)
            .replaceAll("{{TAGS}}", tags)
            .split("\n")
            // Drop lines where an optional placeholder was replaced with nothing
            // (they'll look like "Category: " or "Related topics: " — trailing colon)
            .filter((line) => line.trim() !== "" && !line.trim().endsWith(":"))
            .join(" ");
    }

    return null;
}
