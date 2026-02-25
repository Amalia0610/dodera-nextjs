/**
 * generate-api-token.ts
 * ---------------------
 * CLI script to generate a new API bearer token and store its hash in Supabase.
 *
 * Usage:
 *   npx tsx scripts/generate-api-token.ts --name "CI pipeline"
 *   npx tsx scripts/generate-api-token.ts --name "Mobile app" --expires 90
 *
 * Options:
 *   --name    <label>   Required. A label describing what the token is for.
 *   --expires <days>    Optional. Number of days until expiration (default: never).
 *
 * The plaintext token is printed ONCE to stdout — it cannot be retrieved later.
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "crypto";

/* ── Parse CLI args ─────────────────────────────────────────── */
function parseArgs(): { name: string; expiresDays: number | null } {
    const args = process.argv.slice(2);
    let name = "";
    let expiresDays: number | null = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--name" && args[i + 1]) {
            name = args[++i];
        } else if (args[i] === "--expires" && args[i + 1]) {
            expiresDays = parseInt(args[++i], 10);
            if (isNaN(expiresDays) || expiresDays <= 0) {
                console.error("Error: --expires must be a positive number of days.");
                process.exit(1);
            }
        }
    }

    if (!name) {
        console.error("Error: --name is required.");
        console.error(
            'Usage: npx tsx scripts/generate-api-token.ts --name "My token" [--expires 90]',
        );
        process.exit(1);
    }

    return { name, expiresDays };
}

/* ── Helpers ────────────────────────────────────────────────── */
function generateToken(): string {
    // Prefix makes tokens easy to identify/grep in logs; 48 random bytes = 64 url-safe chars
    const random = randomBytes(48).toString("base64url");
    return `dod_${random}`;
}

function hashToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
}

/* ── Main ───────────────────────────────────────────────────── */
async function main() {
    const { name, expiresDays } = parseArgs();

    // Validate env
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error(
            "Error: SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env",
        );
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const plainToken = generateToken();
    const tokenHash = hashToken(plainToken);

    const expiresAt = expiresDays
        ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { error } = await supabase.from("api_tokens").insert({
        token_hash: tokenHash,
        name,
        expires_at: expiresAt,
    });

    if (error) {
        console.error("Supabase insert error:", error.message);
        process.exit(1);
    }

    console.log("");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  API token generated successfully                      ║");
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log(`║  Name:     ${name}`);
    console.log(
        `║  Expires:  ${expiresAt ? new Date(expiresAt).toLocaleDateString() : "never"}`,
    );
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log(`║  Token:    ${plainToken}`);
    console.log("╠══════════════════════════════════════════════════════════╣");
    console.log("║  ⚠  Copy the token now — it will NOT be shown again.   ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("");
}

main();
