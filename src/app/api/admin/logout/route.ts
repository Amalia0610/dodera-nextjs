import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/admin-auth";

export async function POST() {
    await destroyAdminSession();
    return NextResponse.json({ status: "success", message: "Logged out." });
}
