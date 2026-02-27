/**
 * seed-admin.ts
 * -------------
 * CLI script to create (or update) the admin user in Supabase.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/seed-admin.ts
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "office@doderasoft.com";
const ADMIN_PASSWORD = "ParolaPulii2023@";
const ADMIN_NAME = "Dodera";

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error(
            "Error: SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env",
        );
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hash the password with bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // Upsert admin user
    const { data, error } = await supabase
        .from("admin_users")
        .upsert(
            {
                email: ADMIN_EMAIL,
                password_hash: passwordHash,
                name: ADMIN_NAME,
            },
            { onConflict: "email" },
        )
        .select("id, email, name")
        .single();

    if (error) {
        console.error("Error upserting admin user:", error.message);
        process.exit(1);
    }

    console.log("✓ Admin user seeded successfully:");
    console.log(`  ID:    ${data.id}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Name:  ${data.name}`);
}

main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
