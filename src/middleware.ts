import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    PROTECTED_API_ROUTES,
    PUBLIC_API_ROUTES,
} from "@/config/api-auth";

/* ── Helpers (Edge-compatible — no Node crypto) ─────────────── */

async function sha256(input: string): Promise<string> {
    const encoded = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonError(message: string, status: number) {
    return NextResponse.json(
        { status: "error", message },
        { status },
    );
}

/* ── Route matching ─────────────────────────────────────────── */

function isProtectedRoute(pathname: string): boolean {
    // Explicitly public routes always bypass
    if (PUBLIC_API_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
        return false;
    }
    // Check if the pathname matches any protected prefix
    return PROTECTED_API_ROUTES.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
    );
}

/* ── Middleware ──────────────────────────────────────────────── */

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only intercept protected API routes
    if (!isProtectedRoute(pathname)) {
        return NextResponse.next();
    }

    // --- Bearer token extraction ---
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return jsonError(
            "Missing or malformed Authorization header. Expected: Bearer <token>",
            401,
        );
    }

    const plainToken = authHeader.slice(7);

    if (!plainToken || plainToken.length < 10) {
        return jsonError("Invalid token format.", 401);
    }

    // --- Token verification ---
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Middleware: SUPABASE_URL or SUPABASE_SECRET_KEY is not set.");
        return jsonError("Internal server configuration error.", 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const tokenHash = await sha256(plainToken);

    const { data, error } = await supabase
        .from("api_tokens")
        .select("id, name, expires_at, revoked_at")
        .eq("token_hash", tokenHash)
        .single();

    if (error || !data) {
        return jsonError("Invalid API token.", 401);
    }

    if (data.revoked_at) {
        return jsonError("This API token has been revoked.", 401);
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return jsonError("This API token has expired.", 401);
    }

    // Update last_used_at (fire-and-forget)
    supabase
        .from("api_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", data.id)
        .then();

    // Forward token metadata in headers so route handlers can access it
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-api-token-id", String(data.id));
    requestHeaders.set("x-api-token-name", data.name);

    return NextResponse.next({
        request: { headers: requestHeaders },
    });
}

/* ── Matcher: only run on API routes ────────────────────────── */
export const config = {
    matcher: "/api/:path*",
};
