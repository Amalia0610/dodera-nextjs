"use client";

import { motion } from "framer-motion";
import { TRUSTED_LOGOS, SOCIAL_LINKS } from "@/config/site";
import { fadeIn, viewportOnce } from "@/lib/animations";

export function TrustedBy() {
    return (
        <section aria-label="Trusted by" className="relative border-y border-border/50 py-16">
            <div className="mx-auto max-w-7xl px-6">
                <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Using globally trusted technologies like
                </p>

                {/* Social Media Icons - Absolutely positioned */}
                <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-2 lg:flex">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                        Find us on:
                    </p>
                    <div className="flex gap-3">
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
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
                    {TRUSTED_LOGOS.map((name, i) => (
                        <motion.span
                            key={name}
                            variants={fadeIn}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportOnce}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                            className="select-none text-lg font-bold tracking-tight text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
                        >
                            {name}
                        </motion.span>
                    ))}
                </div>

                {/* Social Media Icons - Mobile/Tablet */}
                <div className="mt-10 flex flex-col items-center gap-3 lg:hidden">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                        Find us on:
                    </p>
                    <div className="flex gap-3">
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
                </div>
            </div>
        </section>
    );
}
