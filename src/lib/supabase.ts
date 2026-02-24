import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client (uses the secret key).
 *
 * This module is guarded by the `server-only` package — importing it
 * from a Client Component will throw a build-time error, ensuring
 * credentials never leak to the browser.
 */
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
