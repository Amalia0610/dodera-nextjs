import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { randomBytes, createHash } from "crypto";

function generateToken(): string {
    const random = randomBytes(48).toString("base64url");
    return `dod_${random}`;
}

function hashToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function GET() {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json(
            { status: "error", message: "Not authenticated." },
            { status: 401 },
        );
    }

    const { data, error } = await supabase
        .from("api_tokens")
        .select("id, name, created_at, expires_at, revoked_at, last_used_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching tokens:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to fetch tokens." },
            { status: 500 },
        );
    }

    return NextResponse.json({ status: "success", data });
}

export async function POST(request: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json(
            { status: "error", message: "Not authenticated." },
            { status: 401 },
        );
    }

    const body = await request.json();
    const { name, expiresDays } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
            { status: "error", message: "Token name is required." },
            { status: 400 },
        );
    }

    const plainToken = generateToken();
    const tokenHash = hashToken(plainToken);

    const expiresAt = expiresDays
        ? new Date(Date.now() + expiresDays * 86400000).toISOString()
        : null;

    const { data, error } = await supabase
        .from("api_tokens")
        .insert({
            token_hash: tokenHash,
            name: name.trim(),
            expires_at: expiresAt,
        })
        .select("id, name, created_at, expires_at")
        .single();

    if (error) {
        console.error("Error creating token:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to create token." },
            { status: 500 },
        );
    }

    return NextResponse.json({
        status: "success",
        message: "Token created. Copy it now — it won't be shown again.",
        plainToken,
        data,
    }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json(
            { status: "error", message: "Not authenticated." },
            { status: 401 },
        );
    }

    const { id, action } = await request.json();

    if (!id) {
        return NextResponse.json(
            { status: "error", message: "Token ID is required." },
            { status: 400 },
        );
    }

    if (action === "revoke") {
        const { error } = await supabase
            .from("api_tokens")
            .update({ revoked_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("Error revoking token:", error);
            return NextResponse.json(
                { status: "error", message: "Failed to revoke token." },
                { status: 500 },
            );
        }

        return NextResponse.json({ status: "success", message: "Token revoked." });
    }

    // Full delete
    const { error } = await supabase
        .from("api_tokens")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting token:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to delete token." },
            { status: 500 },
        );
    }

    return NextResponse.json({ status: "success", message: "Token deleted." });
}
