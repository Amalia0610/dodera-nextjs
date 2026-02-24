"use client";

import { useState } from "react";
import { Send, User, Mail, MessageSquare, Building, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ── Validation constants ─────────────────────────────────── */
const LIMITS = {
    name: { min: 2, max: 80 },
    email: { max: 254 },
    company: { max: 120 },
    phone: { max: 20 },
    message: { min: 10, max: 2000 },
} as const;

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const NAME_RE = /^[\p{L}\s'\-]+$/u;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;
const DANGEROUS_RE = /<[^>]*>|javascript:|on\w+\s*=|<script|<\/script|&#|%3C|%3E/i;

/* ── Sanitiser ────────────────────────────────────────────── */
function sanitise(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .trim();
}

/* ── Per-field validation ─────────────────────────────────── */
interface FieldErrors {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
    message?: string;
}

function validate(data: Record<string, string>): FieldErrors {
    const errors: FieldErrors = {};

    const name = data.name?.trim() ?? "";
    if (!name) errors.name = "Name is required.";
    else if (name.length < LIMITS.name.min) errors.name = `At least ${LIMITS.name.min} characters.`;
    else if (name.length > LIMITS.name.max) errors.name = `Max ${LIMITS.name.max} characters.`;
    else if (!NAME_RE.test(name)) errors.name = "Only letters, spaces, hyphens, and apostrophes allowed.";

    const email = data.email?.trim() ?? "";
    if (!email) errors.email = "Email is required.";
    else if (email.length > LIMITS.email.max) errors.email = `Max ${LIMITS.email.max} characters.`;
    else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";

    const company = data.company?.trim() ?? "";
    if (company && company.length > LIMITS.company.max) errors.company = `Max ${LIMITS.company.max} characters.`;
    else if (company && DANGEROUS_RE.test(company)) errors.company = "Invalid characters detected.";

    const phone = data.phone?.trim() ?? "";
    if (phone && !PHONE_RE.test(phone)) errors.phone = "Enter a valid phone number.";
    else if (phone && phone.length > LIMITS.phone.max) errors.phone = `Max ${LIMITS.phone.max} characters.`;

    const message = data.message?.trim() ?? "";
    if (!message) errors.message = "Project details are required.";
    else if (message.length < LIMITS.message.min) errors.message = `At least ${LIMITS.message.min} characters.`;
    else if (message.length > LIMITS.message.max) errors.message = `Max ${LIMITS.message.max} characters.`;
    else if (DANGEROUS_RE.test(message)) errors.message = "Invalid characters detected.";

    return errors;
}

const HONEYPOT_FIELD = "website_url";

/* ── Component ────────────────────────────────────────────── */
export function ContactForm() {
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [submitCount, setSubmitCount] = useState(0);
    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const now = Date.now();
        if (submitCount >= 3 && now - lastSubmitTime < 60_000) return;

        const form = e.currentTarget;
        const fd = new FormData(form);

        if (fd.get(HONEYPOT_FIELD)) return;

        const raw: Record<string, string> = {};
        for (const [key, val] of fd.entries()) {
            if (key === HONEYPOT_FIELD) continue;
            raw[key] = typeof val === "string" ? val : "";
        }

        const fieldErrors = validate(raw);
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            return;
        }

        const safe: Record<string, string> = {};
        for (const [key, val] of Object.entries(raw)) {
            safe[key] = sanitise(val);
        }

        setErrors({});
        setServerError(null);
        setSubmitting(true);
        setSubmitCount((c) => c + 1);
        setLastSubmitTime(now);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(safe),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    setServerError(data.message ?? "Something went wrong. Please try again.");
                }
                return;
            }

            setSubmitted(true);
        } catch {
            setServerError("Network error. Please check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="mx-auto max-w-lg rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center backdrop-blur-sm">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                    <Send className="size-6 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Message Sent</h3>
                <p className="text-sm text-muted-foreground">
                    Thank you! We&apos;ll get back to you within 24 hours.
                </p>
            </div>
        );
    }

    const fieldErr = (msg?: string) =>
        msg ? (
            <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                <AlertCircle className="size-3 shrink-0" /> {msg}
            </p>
        ) : null;

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            aria-label="Contact form to get in touch with Dodera Software for project inquiries"
            className="mx-auto max-w-lg space-y-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm"
        >
            {/* Honeypot */}
            <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
                <label htmlFor="website_url">Do not fill this</label>
                <input type="text" id="website_url" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="contact-name" className="flex items-center gap-2 text-sm font-medium">
                        <User className="size-3.5 text-muted-foreground" />
                        Name
                    </label>
                    <Input
                        id="contact-name"
                        required
                        name="name"
                        autoComplete="name"
                        placeholder="Your name"
                        maxLength={LIMITS.name.max}
                        minLength={LIMITS.name.min}
                        aria-invalid={!!errors.name}
                        className="border-white/[0.08] bg-white/[0.03]"
                    />
                    {fieldErr(errors.name)}
                </div>
                <div className="space-y-2">
                    <label htmlFor="contact-email" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="size-3.5 text-muted-foreground" />
                        Email
                    </label>
                    <Input
                        id="contact-email"
                        required
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        maxLength={LIMITS.email.max}
                        aria-invalid={!!errors.email}
                        className="border-white/[0.08] bg-white/[0.03]"
                    />
                    {fieldErr(errors.email)}
                </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="contact-company" className="flex items-center gap-2 text-sm font-medium">
                        <Building className="size-3.5 text-muted-foreground" />
                        Company <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                        id="contact-company"
                        name="company"
                        autoComplete="organization"
                        placeholder="Company name"
                        maxLength={LIMITS.company.max}
                        aria-invalid={!!errors.company}
                        className="border-white/[0.08] bg-white/[0.03]"
                    />
                    {fieldErr(errors.company)}
                </div>
                <div className="space-y-2">
                    <label htmlFor="contact-phone" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="size-3.5 text-muted-foreground" />
                        Phone <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                        id="contact-phone"
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        placeholder="+1 (555) 000-0000"
                        maxLength={LIMITS.phone.max}
                        pattern="[+]?[\d\s()\-]{7,20}"
                        aria-invalid={!!errors.phone}
                        className="border-white/[0.08] bg-white/[0.03]"
                    />
                    {fieldErr(errors.phone)}
                </div>
            </div>

            {serverError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    {serverError}
                </div>
            )}

            <div className="space-y-2">
                <label htmlFor="contact-message" className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="size-3.5 text-muted-foreground" />
                    Project Details
                </label>
                <Textarea
                    id="contact-message"
                    required
                    name="message"
                    rows={4}
                    placeholder="Tell us about your project, timeline, and budget..."
                    maxLength={LIMITS.message.max}
                    minLength={LIMITS.message.min}
                    aria-invalid={!!errors.message}
                    className="resize-none border-white/[0.08] bg-white/[0.03]"
                />
                {fieldErr(errors.message)}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send Message"}
                {!submitting && <Send className="ml-2 size-4" />}
            </Button>
        </form>
    );
}
