"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { SERVICES, NAV_LINKS, SOCIAL_LINKS } from "@/config/site";

export function Navbar() {
    const [megaOpen, setMegaOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav aria-label="Main navigation" className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Logo />

                {/* Desktop Nav */}
                <div className="hidden items-center gap-8 md:flex">
                    <div
                        className="relative"
                        onMouseEnter={() => setMegaOpen(true)}
                        onMouseLeave={() => setMegaOpen(false)}
                    >
                        <button className="flex items-center gap-1 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
                            Services
                            <ChevronDown
                                className={`size-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        <AnimatePresence>
                            {megaOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full z-50 mt-2 w-[640px]"
                                >
                                    <div className="rounded-lg border border-border bg-background/95 p-6 shadow-xl backdrop-blur-xl">
                                        <div className="grid grid-cols-3 gap-6">
                                            {SERVICES.map((s) => (
                                                <div key={s.title}>
                                                    <Link
                                                        href={s.href}
                                                        className="mb-3 flex items-center gap-2 group"
                                                        onClick={() => setMegaOpen(false)}
                                                    >
                                                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                                                            <s.icon className="size-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold group-hover:text-primary transition-colors">{s.title}</p>
                                                            <p className="text-[11px] text-muted-foreground">{s.subtitle}</p>
                                                        </div>
                                                    </Link>
                                                    <ul className="space-y-1.5">
                                                        {s.highlights.map((item) => (
                                                            <li key={item.label}>
                                                                <Link
                                                                    href={item.href}
                                                                    onClick={() => setMegaOpen(false)}
                                                                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                                                                >
                                                                    {item.label}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Social Media Icons */}
                    <div className="flex items-center gap-2">
                        {SOCIAL_LINKS.map((social) => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={social.label}
                                className="flex size-8 items-center justify-center rounded-md border border-border bg-muted/50 transition-all hover:border-border hover:bg-muted"
                            >
                                <social.icon className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
                            </a>
                        ))}
                    </div>

                    <Button size="sm" asChild>
                        <Link href="/#contact">Get Started</Link>
                    </Button>
                </div>

                {/* Mobile toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileOpen}
                >
                    {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border/50 bg-card/95 backdrop-blur-xl md:hidden"
                    >
                        <div className="space-y-1 px-6 py-5">
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                Services
                            </p>
                            {SERVICES.map((s) => (
                                <Link
                                    key={s.title}
                                    href={s.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                >
                                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                                        <s.icon className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <span className="font-medium text-foreground">{s.title}</span>
                                        <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                                    </div>
                                </Link>
                            ))}

                            <div className="my-3 h-px bg-border" />

                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                >
                                    {link.label}
                                </Link>
                            ))}

                            <div className="pt-3">
                                <Button className="w-full" size="sm" asChild>
                                    <Link href="/#contact" onClick={() => setMobileOpen(false)}>Get Started</Link>
                                </Button>
                            </div>

                            {/* Social Media Icons - Mobile */}
                            <div className="flex justify-center gap-3 pt-4">
                                {SOCIAL_LINKS.map((social) => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/50 transition-all hover:bg-muted"
                                    >
                                        <social.icon className="size-4 text-muted-foreground" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
