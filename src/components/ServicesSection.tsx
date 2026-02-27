"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/SectionHeading";
import { SERVICES } from "@/config/site";
import { fadeInUpLg, viewportOnce, stagger } from "@/lib/animations";

export function ServicesSection() {
    return (
        <section id="services" aria-labelledby="services-heading" className="relative py-32">
            <div className="absolute inset-0 grid-bg-sm" />

            <div className="relative z-10 mx-auto max-w-7xl px-6">
                <SectionHeading label="What We Build" id="services-heading">
                    Engineering that <span className="text-primary">ships</span>
                </SectionHeading>

                <div className="grid gap-6 md:grid-cols-3">
                    {SERVICES.map((s, i) => (
                        <motion.div
                            key={s.title}
                            variants={fadeInUpLg}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportOnce}
                            transition={stagger(i)}
                            className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                        >
                            {s.image ? (
                                <div className="relative h-44 w-full overflow-hidden">
                                    <Image
                                        src={s.image}
                                        alt={s.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                            ) : (
                                <div className="px-8 pt-8">
                                    <div className="mb-6 flex size-12 items-center justify-center rounded-lg border border-border bg-primary/10">
                                        <s.icon className="size-6 text-primary" />
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-1 flex-col p-8 pt-6">
                                <h3 className="mb-1 text-xl font-bold">{s.title}</h3>
                                <p className="mb-4 text-sm text-muted-foreground">{s.subtitle}</p>
                                <p className="mb-6 min-h-[5rem] text-sm leading-relaxed text-muted-foreground">
                                    {s.description}
                                </p>
                                <div className="mb-6 flex flex-wrap gap-2">
                                    {s.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="border-border bg-muted/50 text-[11px] text-muted-foreground"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                                <Link
                                    href={s.href}
                                    className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                                >
                                    Learn More
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA Button */}
                <motion.div
                    variants={fadeInUpLg}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-12 flex justify-center"
                >
                    <Button size="lg" asChild>
                        <Link href="/#contact">
                            Get a Quote
                            <ArrowRight className="ml-1 size-4" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
