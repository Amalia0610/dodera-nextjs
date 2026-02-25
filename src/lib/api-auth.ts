import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";

export interface AuthResult {
    /** Whether the token is valid */
    valid: boolean;
    /** Token metadata (only set when valid) */
    token?: { id: number; name: string };
    /** Error response ready to return (only set when invalid) */
    errorResponse?: NextResponse;
}

/**
 * Verify an API bearer token from the `Authorization` header.
 *
 * Usage in a route handler:
 * ```ts
 * import { authenticateRequest } from "@/lib/api-auth";
 *
 * export async function GET(request: NextRequest) {
 *   const auth = await authenticateRequest(request);
 *   if (!auth.valid) return auth.errorResponse!;
 *
 *   // auth.token.id / auth.token.name available
 *   return NextResponse.json({ data: "protected" });
 * }
 * ```
 */
export async function authenticateRequest(
    request: NextRequest,
): Promise<AuthResult> {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
            valid: false,
            errorResponse: NextResponse.json(
                { status: "error", message: "Missing or malformed Authorization header. Expected: Bearer <token>" },
                { status: 401 },
            ),
        };
    }

    const plainToken = authHeader.slice(7); // strip "Bearer "

    if (!plainToken || plainToken.length < 10) {
        return {
            valid: false,
            errorResponse: NextResponse.json(
                { status: "error", message: "Invalid token format." },
                { status: 401 },
            ),
        };
    }

    const tokenHash = createHash("sha256")
        .update(plainToken, "utf8")
        .digest("hex");

    // Look up the hash
    const { data, error } = await supabase
        .from("api_tokens")
        .select("id, name, expires_at, revoked_at")
        .eq("token_hash", tokenHash)
        .single();

    if (error || !data) {
        return {
            valid: false,
            errorResponse: NextResponse.json(
                { status: "error", message: "Invalid API token." },
                { status: 401 },
            ),
        };
    }

    // Check revocation
    if (data.revoked_at) {
        return {
            valid: false,
            errorResponse: NextResponse.json(
                { status: "error", message: "This API token has been revoked." },
                { status: 401 },
            ),
        };
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return {
            valid: false,
            errorResponse: NextResponse.json(
                { status: "error", message: "This API token has expired." },
                { status: 401 },
            ),
        };
    }

    // Update last_used_at (fire-and-forget, don't block the response)
    supabase
        .from("api_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", data.id)
        .then();

    return {
        valid: true,
        token: { id: data.id, name: data.name },
    };
}
