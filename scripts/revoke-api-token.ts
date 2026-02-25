/**
 * revoke-api-token.ts
 * --------------------
 * CLI script to revoke an existing API token by its name or ID.
 *
 * Usage:
 *   npx tsx scripts/revoke-api-token.ts --name "CI pipeline"
 *   npx tsx scripts/revoke-api-token.ts --id 3
 */

import { createClient } from "@supabase/supabase-js";

/* ── Parse CLI args ─────────────────────────────────────────── */
function parseArgs(): { name: string | null; id: number | null } {
    const args = process.argv.slice(2);
    let name: string | null = null;
    let id: number | null = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--name" && args[i + 1]) {
            name = args[++i];
        } else if (args[i] === "--id" && args[i + 1]) {
            id = parseInt(args[++i], 10);
            if (isNaN(id)) {
                console.error("Error: --id must be a number.");
                process.exit(1);
            }
        }
    }

    if (!name && !id) {
        console.error("Error: --name or --id is required.");
        console.error(
            'Usage: npx tsx scripts/revoke-api-token.ts --name "My token"',
        );
        process.exit(1);
    }

    return { name, id };
}

/* ── Main ───────────────────────────────────────────────────── */
async function main() {
    const { name, id } = parseArgs();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error(
            "Error: SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env",
        );
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
        .from("api_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .is("revoked_at", null); // only revoke active tokens

    if (id) {
        query = query.eq("id", id);
    } else if (name) {
        query = query.eq("name", name);
    }

    const { data, error, count } = await query.select("id, name");

    if (error) {
        console.error("Supabase update error:", error.message);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log("No active token found matching that criteria.");
        process.exit(0);
    }

    for (const token of data) {
        console.log(`✓ Revoked token #${token.id} "${token.name}"`);
    }
}

main();
