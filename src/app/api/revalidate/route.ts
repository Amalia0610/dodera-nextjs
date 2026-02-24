import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * Prismic webhook handler — triggers on-demand ISR revalidation.
 *
 * Set this URL as a webhook in the Prismic dashboard:
 *   https://your-domain.com/api/revalidate
 *
 * Add a `secret` query parameter that matches PRISMIC_WEBHOOK_SECRET
 * to authenticate the request:
 *   https://your-domain.com/api/revalidate?secret=YOUR_SECRET
 *
 * When content is published / unpublished in Prismic, this endpoint
 * invalidates the cached pages so the next visitor gets fresh content
 * without waiting for the ISR timer.
 */
export async function POST(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.PRISMIC_WEBHOOK_SECRET;

    /* ── Auth check ────────────────────────────────────── */
    if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json(
            { status: "error", message: "Invalid secret." },
            { status: 401 },
        );
    }

    try {
        /* Revalidate all Prismic-sourced content.
         * You can make this more granular later by parsing the
         * webhook body to determine which document changed,
         * then revalidating only that path. */
        revalidateTag("prismic", { expire: 0 });

        return NextResponse.json({
            status: "success",
            message: "Revalidation triggered.",
            now: Date.now(),
        });
    } catch (err) {
        console.error("[revalidate] Error:", err);
        return NextResponse.json(
            { status: "error", message: "Revalidation failed." },
            { status: 500 },
        );
    }
}
