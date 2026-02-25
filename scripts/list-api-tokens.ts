/**
 * list-api-tokens.ts
 * -------------------
 * CLI script to list all API tokens (without revealing the hash).
 *
 * Usage:
 *   npx tsx scripts/list-api-tokens.ts
 *   npx tsx scripts/list-api-tokens.ts --all    (include revoked)
 */

import { createClient } from "@supabase/supabase-js";

async function main() {
    const showAll = process.argv.includes("--all");

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
        .select("id, name, created_at, expires_at, revoked_at, last_used_at")
        .order("created_at", { ascending: false });

    if (!showAll) {
        query = query.is("revoked_at", null);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Supabase query error:", error.message);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log("No tokens found.");
        return;
    }

    console.log("");
    console.log(
        "ID".padEnd(6) +
        "Name".padEnd(25) +
        "Created".padEnd(14) +
        "Expires".padEnd(14) +
        "Revoked".padEnd(14) +
        "Last Used",
    );
    console.log("─".repeat(90));

    for (const t of data) {
        const created = t.created_at
            ? new Date(t.created_at).toLocaleDateString()
            : "–";
        const expires = t.expires_at
            ? new Date(t.expires_at).toLocaleDateString()
            : "never";
        const revoked = t.revoked_at
            ? new Date(t.revoked_at).toLocaleDateString()
            : "–";
        const lastUsed = t.last_used_at
            ? new Date(t.last_used_at).toLocaleDateString()
            : "never";

        const isExpired = t.expires_at && new Date(t.expires_at) < new Date();
        const status = t.revoked_at
            ? " [REVOKED]"
            : isExpired
                ? " [EXPIRED]"
                : "";

        console.log(
            String(t.id).padEnd(6) +
            (t.name + status).padEnd(25) +
            created.padEnd(14) +
            expires.padEnd(14) +
            revoked.padEnd(14) +
            lastUsed,
        );
    }

    console.log("");
}

main();
