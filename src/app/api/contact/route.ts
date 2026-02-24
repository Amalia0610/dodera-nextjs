import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

/* ── Validation schema (mirrors client-side rules) ────────── */
const contactSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters.")
        .max(80, "Name must be at most 80 characters."),
    email: z
        .string()
        .trim()
        .email("Enter a valid email address.")
        .max(254),
    company: z
        .string()
        .trim()
        .max(120, "Company must be at most 120 characters.")
        .optional()
        .default(""),
    phone: z
        .string()
        .trim()
        .max(20, "Phone must be at most 20 characters.")
        .optional()
        .default(""),
    message: z
        .string()
        .trim()
        .min(10, "Message must be at least 10 characters.")
        .max(2000, "Message must be at most 2000 characters."),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        /* Validate */
        const parsed = contactSchema.safeParse(body);
        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            return NextResponse.json(
                { status: "error", errors: fieldErrors },
                { status: 400 },
            );
        }

        /* Insert into Supabase */
        const { error } = await supabase.from("contacts").insert({
            name: parsed.data.name,
            email: parsed.data.email,
            company: parsed.data.company || null,
            phone: parsed.data.phone || null,
            message: parsed.data.message,
        });

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json(
                { status: "error", message: "Failed to save your message. Please try again." },
                { status: 500 },
            );
        }

        return NextResponse.json({ status: "success", message: "Message received!" });
    } catch {
        return NextResponse.json(
            { status: "error", message: "Invalid request." },
            { status: 400 },
        );
    }
}
