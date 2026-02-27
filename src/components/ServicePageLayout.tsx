"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Bot, Workflow, Rocket, Building2, Cloud, BookOpen } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { fadeInUp, fadeInUpLg, viewportOnce, stagger } from "@/lib/animations";
import type { ServicePageData } from "@/types";
import { SERVICE_PAGES } from "@/config/services";
import { N8nIcon } from "@/components/icons/N8nIcon";

/** Map string names → icon components to keep config serialisable */
const ICON_MAP: Record<string, LucideIcon | React.ComponentType<{ className?: string }>> = {
    Bot,
    Workflow,
    Rocket,
    Building2,
    Cloud,
    BookOpen,
    N8nIcon,
};

function resolveIcon(name: string) {
    return ICON_MAP[name] ?? Bot;
}

interface ServicePageLayoutProps {
    data: ServicePageData;
}

/**
 * Shared layout for all service pages.
 *
 * Renders a semantic, SEO-optimised page structure:
 * - Single H1 (hero)
 * - H2 content sections
 * - FAQ section with Schema.org markup
 * - Related services
 * - CTA
 */
export function ServicePageLayout({ data }: ServicePageLayoutProps) {
    return (
        <>
            {/* ── Breadcrumb ──────────────────────────────────── */}
            <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 pt-24 pb-4">
                <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <li>
                        <Link href="/" className="transition-colors hover:text-foreground">
                            Home
                        </Link>
                    </li>
                    <ChevronRight className="size-3.5" />
                    <li>
                        <Link href="/#services" className="transition-colors hover:text-foreground">
                            Services
                        </Link>
                    </li>
                    {data.parentSlug &&
                        (() => {
                            const parent = SERVICE_PAGES[data.parentSlug!];
                            return parent ? (
                                <>
                                    <ChevronRight className="size-3.5" />
                                    <li>
                                        <Link
                                            href={`/services/${data.parentSlug}`}
                                            className="transition-colors hover:text-foreground"
                                        >
                                            {parent.heroLabel}
                                        </Link>
                                    </li>
                                </>
                            ) : null;
                        })()}
                    <ChevronRight className="size-3.5" />
                    <li aria-current="page" className="font-medium text-foreground">
                        {data.heroLabel}
                    </li>
                </ol>
            </nav>

            {/* ── Hero ────────────────────────────────────────── */}
            <section aria-label="Service overview" className="relative pb-20 pt-8">
                <div className="absolute inset-0 grid-bg" />

                <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
                    <motion.p
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.4 }}
                        className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                        {data.heroLabel}
                    </motion.p>
                    <motion.h1
                        variants={fadeInUpLg}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.4, delay: 0.06 }}
                        className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                    >
                        {data.heroTitle}{" "}
                        <span className="text-primary">{data.heroHighlight}</span>
                    </motion.h1>
                    <motion.p
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.4, delay: 0.12 }}
                        className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground"
                    >
                        {data.heroDescription}
                    </motion.p>
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.4, delay: 0.18 }}
                        className="mt-8 flex flex-wrap justify-center gap-3"
                    >
                        <Button size="lg" asChild>
                            <Link href="/#contact">
                                Get a Quote
                                <ArrowRight className="ml-1 size-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/#process">Our Process</Link>
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* ── Content Sections ────────────────────────────── */}
            {data.sections.map((section, i) => (
                <section
                    key={section.title}
                    aria-labelledby={`section-${i}`}
                    className={`relative py-20 ${i % 2 === 0 ? "" : "bg-card/30"}`}
                >
                    <div className="mx-auto max-w-4xl px-6">
                        <motion.div
                            variants={fadeInUpLg}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportOnce}
                            transition={stagger(0)}
                        >
                            <h2
                                id={`section-${i}`}
                                className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl"
                            >
                                {section.title}
                            </h2>
                            <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                                {section.content}
                            </p>
                            {section.bullets && (
                                <ul className="space-y-3">
                                    {section.bullets.map((bullet) => (
                                        <li
                                            key={bullet}
                                            className="flex items-start gap-3 text-sm text-muted-foreground"
                                        >
                                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                                            {bullet}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </motion.div>
                    </div>
                </section>
            ))}

            {/* ── Child Services Showcase ─────────────────────── */}
            {data.childServices && data.childServices.length > 0 && (
                <section aria-labelledby="subservices-heading" className="relative py-20 bg-card/30">
                    <div className="mx-auto max-w-5xl px-6">
                        <motion.div
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportOnce}
                            className="mb-12 text-center"
                        >
                            <h2
                                id="subservices-heading"
                                className="text-3xl font-bold tracking-tight sm:text-4xl"
                            >
                                Our {data.heroLabel} Services
                            </h2>
                        </motion.div>

                        <div
                            className={`grid gap-6 ${data.childServices.length === 1
                                    ? "max-w-lg mx-auto"
                                    : data.childServices.length === 2
                                        ? "sm:grid-cols-2"
                                        : "sm:grid-cols-3"
                                }`}
                        >
                            {data.childServices.map((child, i) => {
                                const Icon = resolveIcon(child.iconName);
                                return (
                                    <motion.div
                                        key={child.href}
                                        variants={fadeInUpLg}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={viewportOnce}
                                        transition={stagger(i)}
                                    >
                                        <Link
                                            href={child.href}
                                            className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                                        >
                                            <div className="mb-6 flex size-12 items-center justify-center rounded-lg border border-border bg-primary/10">
                                                <Icon className="size-6 text-primary" />
                                            </div>
                                            <h3 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">
                                                {child.label}
                                            </h3>
                                            <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                                                {child.description}
                                            </p>
                                            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                                Learn more
                                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                            </span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── FAQ Section ─────────────────────────────────── */}
            {data.faqs.length > 0 && (
                <section aria-labelledby="faq-heading" className="relative py-20">
                    <div className="absolute inset-0 grid-bg-sm" />
                    <div className="relative z-10 mx-auto max-w-3xl px-6">
                        <motion.div
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportOnce}
                            className="mb-12 text-center"
                        >
                            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                FAQ
                            </p>
                            <h2
                                id="faq-heading"
                                className="text-3xl font-bold tracking-tight sm:text-4xl"
                            >
                                Frequently Asked Questions
                            </h2>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportOnce}
                            transition={{ delay: 0.1 }}
                        >
                            <Accordion type="single" collapsible className="w-full">
                                {data.faqs.map((faq, i) => (
                                    <AccordionItem key={i} value={`faq-${i}`}>
                                        <AccordionTrigger className="text-left text-base font-medium">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* ── Related Services ────────────────────────────── */}
            {data.relatedServices.length > 0 && (
                <section aria-labelledby="related-heading" className="py-20 bg-card/30">
                    <div className="mx-auto max-w-4xl px-6">
                        <motion.div
                            variants={fadeInUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportOnce}
                            className="mb-10 text-center"
                        >
                            <h2
                                id="related-heading"
                                className="text-2xl font-bold tracking-tight sm:text-3xl"
                            >
                                Related Services
                            </h2>
                        </motion.div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {data.relatedServices.map((rs, i) => (
                                <motion.div
                                    key={rs.href}
                                    variants={fadeInUpLg}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={viewportOnce}
                                    transition={stagger(i)}
                                >
                                    <Link
                                        href={rs.href}
                                        className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/40"
                                    >
                                        <span className="text-sm font-medium">{rs.label}</span>
                                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CTA ─────────────────────────────────────────── */}
            <section aria-labelledby="cta-heading" className="relative py-24">
                <div className="absolute inset-0 grid-bg-sm" />
                <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
                    <motion.div
                        variants={fadeInUpLg}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportOnce}
                    >
                        <h2
                            id="cta-heading"
                            className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl"
                        >
                            Ready to get started?
                        </h2>
                        <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                            Book a free 30-minute architecture call. We&apos;ll audit your project
                            and tell you exactly what it takes to ship.
                        </p>
                        <Button size="lg" asChild>
                            <Link href="/#contact">
                                Start a Project
                                <ArrowRight className="ml-1 size-4" />
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
