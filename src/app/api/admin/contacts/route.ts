import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json(
            { status: "error", message: "Not authenticated." },
            { status: 401 },
        );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let query = supabase
        .from("contacts")
        .select("id, name, email, company, phone, message, created_at", {
            count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (search) {
        query = query.or(
            `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`,
        );
    }

    const { data, error, count } = await query;

    if (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to fetch contacts." },
            { status: 500 },
        );
    }

    return NextResponse.json({
        status: "success",
        data,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    });
}

export async function DELETE(request: NextRequest) {
    const session = await verifyAdminSession();
    if (!session) {
        return NextResponse.json(
            { status: "error", message: "Not authenticated." },
            { status: 401 },
        );
    }

    const { id } = await request.json();
    if (!id) {
        return NextResponse.json(
            { status: "error", message: "Contact ID is required." },
            { status: 400 },
        );
    }

    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (error) {
        console.error("Error deleting contact:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to delete contact." },
            { status: 500 },
        );
    }

    return NextResponse.json({ status: "success" });
}
