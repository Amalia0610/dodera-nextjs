"use client";

import { useState } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Globe, Mail, MapPin, Heart, Send, AlertCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COMPANY, FOOTER_LINK_GROUPS, SOCIAL_LINKS } from "@/config/site";

const EMAIL_RE =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function Footer() {
    const [nlEmail, setNlEmail] = useState("");
    const [nlStatus, setNlStatus] = useState<"idle" | "error" | "success" | "loading">("idle");
    const [nlError, setNlError] = useState("");

    async function handleNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const email = nlEmail.trim();
        if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
            setNlStatus("error");
            setNlError("Please enter a valid email address.");
            return;
        }

        setNlStatus("loading");
        setNlError("");

        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok || data.status === "error") {
                setNlStatus("error");
                setNlError(data.message ?? "Something went wrong. Please try again.");
                return;
            }

            setNlStatus("success");
            setNlError("");
        } catch {
            setNlStatus("error");
            setNlError("Network error. Please try again.");
        }
    }

    return (
        <footer role="contentinfo">
            <Separator />

            <div className="mx-auto max-w-7xl px-6 py-16">
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Brand */}
                    <div>
                        <div className="mb-4">
                            <Logo />
                        </div>
                        <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
                            {COMPANY.tagline}
                        </p>

                        {/* Social Media Icons */}
                        <div className="mb-6 flex gap-3">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/50 transition-all hover:bg-muted"
                                >
                                    <social.icon className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
                                </a>
                            ))}
                        </div>

                        <div className="space-y-3 text-sm">
                            <a
                                href={`mailto:${COMPANY.email}`}
                                aria-label={`Send us an email at ${COMPANY.email}`}
                                className="flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
                            >
                                <Mail className="size-4" />
                                {COMPANY.email}
                            </a>
                            <a
                                href={COMPANY.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Visit ${COMPANY.url}`}
                                className="flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
                            >
                                <Globe className="size-4" />
                                {COMPANY.url.replace("https://", "")}
                            </a>
                            <div className="flex items-center gap-2 text-foreground/70">
                                <MapPin className="size-4" />
                                {COMPANY.location}
                            </div>
                        </div>
                    </div>

                    {/* Link groups */}
                    {FOOTER_LINK_GROUPS.map((group) => (
                        <div key={group.heading}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                {group.heading}
                            </p>
                            <ul className="space-y-2.5">
                                {group.links.map((l) => (
                                    <li key={l.label}>
                                        {l.href.startsWith("/") || l.href.startsWith("/#") ? (
                                            <Link
                                                href={l.href}
                                                className="text-sm text-foreground/60 transition-colors hover:text-foreground"
                                            >
                                                {l.label}
                                            </Link>
                                        ) : (
                                            <a
                                                href={l.href}
                                                className="text-sm text-foreground/60 transition-colors hover:text-foreground"
                                            >
                                                {l.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Newsletter */}
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Newsletter
                        </p>
                        <p className="mb-4 text-sm text-foreground/60">
                            Updates &amp; insights, no spam.
                        </p>

                        {nlStatus === "success" ? (
                            <p className="flex items-center gap-2 text-sm text-emerald-600">
                                <Send className="size-3.5" />
                                Subscribed!
                            </p>
                        ) : (
                            <form onSubmit={handleNewsletterSubmit} noValidate className="space-y-2">
                                <Input
                                    type="email"
                                    name="newsletter-email"
                                    autoComplete="email"
                                    placeholder="Enter your email"
                                    maxLength={254}
                                    value={nlEmail}
                                    onChange={(e) => {
                                        setNlEmail(e.target.value);
                                        if (nlStatus === "error") setNlStatus("idle");
                                    }}
                                    aria-label="Email address for newsletter"
                                    aria-invalid={nlStatus === "error"}
                                    className="border-border"
                                />
                                {nlStatus === "error" && (
                                    <p className="flex items-center gap-1 text-xs text-red-600">
                                        <AlertCircle className="size-3 shrink-0" /> {nlError}
                                    </p>
                                )}
                                <Button type="submit" variant="default" size="sm" className="w-full" disabled={nlStatus === "loading"}>
                                    {nlStatus === "loading" ? "Subscribing…" : "Subscribe"}
                                    <Send className="ml-2 size-3" />
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <Separator />

            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    Made with <Heart className="size-3 animate-pulse fill-primary text-primary" /> by
                    {" "}{COMPANY.name}
                </p>
            </div>
        </footer>
    );
}
