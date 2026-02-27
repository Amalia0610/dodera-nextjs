"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/SectionHeading";
import { PROCESS_STEPS } from "@/config/site";
import { fadeInUpLg, viewportOnce, stagger } from "@/lib/animations";

export function ProcessSection() {
    return (
        <section id="process" aria-labelledby="process-heading" className="relative py-32">
            <div className="absolute inset-0 grid-bg" />

            <div className="relative z-10 mx-auto max-w-7xl px-6">
                <SectionHeading label="How We Work" id="process-heading">
                    From zero to <span className="text-primary">production</span>
                </SectionHeading>

                {/* Desktop: horizontal flow */}
                <div className="hidden md:block">
                    <div className="relative flex items-start">
                        {PROCESS_STEPS.map((step, i) => (
                            <div key={step.title} className="group relative flex flex-1 flex-col items-center">
                                {/* Glowing dot */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    viewport={viewportOnce}
                                    transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.12 }}
                                    className="relative z-10"
                                >
                                    <div className="size-3.5 rounded-full border-2 border-primary/40 bg-primary/20 transition-all duration-500 group-hover:border-primary group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(196,28,56,0.5)]" />
                                </motion.div>

                                {/* Arrow line to next dot */}
                                {i < PROCESS_STEPS.length - 1 && (
                                    <div className="absolute left-[50%] top-[6px] -z-0 h-px w-full">
                                        <div className="absolute inset-0 bg-gradient-to-r from-border via-border/70 to-border transition-all duration-500 group-hover:from-primary/20 group-hover:via-primary/40 group-hover:to-primary/20" />
                                        <div className="absolute inset-0 opacity-0 blur-[3px] transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                                        <motion.div
                                            className="absolute top-[-1px] h-[3px] w-8 rounded-full bg-primary/60 opacity-0 blur-[2px] group-hover:opacity-100"
                                            animate={{ x: [0, 200, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                                        />
                                        <div className="absolute -top-[4px] right-0 size-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-border/60 transition-all duration-500 group-hover:border-l-primary/50" />
                                    </div>
                                )}

                                {/* Text content */}
                                <motion.div
                                    variants={fadeInUpLg}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={viewportOnce}
                                    transition={stagger(i)}
                                    className="mt-8 text-center"
                                >
                                    <h3 className="text-base font-bold transition-colors duration-300 group-hover:text-primary">
                                        {step.title}
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-[200px] text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/80">
                                        {step.description}
                                    </p>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile: vertical flow */}
                <div className="flex flex-col md:hidden">
                    {PROCESS_STEPS.map((step, i) => (
                        <div key={step.title} className="group relative flex gap-5">
                            <div className="flex flex-col items-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={viewportOnce}
                                    transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.1 }}
                                    className="relative z-10 mt-1"
                                >
                                    <div className="size-3 rounded-full border-2 border-primary/40 bg-primary/20 transition-all duration-500 group-hover:border-primary group-hover:bg-primary group-hover:shadow-[0_0_16px_rgba(196,28,56,0.4)]" />
                                </motion.div>
                                {i < PROCESS_STEPS.length - 1 && (
                                    <div className="relative w-px flex-1 bg-border transition-colors duration-500 group-hover:bg-primary/30">
                                        <div className="absolute inset-0 w-px opacity-0 blur-[2px] transition-opacity duration-500 group-hover:opacity-100 bg-primary/40" />
                                    </div>
                                )}
                            </div>

                            <motion.div
                                variants={fadeInUpLg}
                                initial="hidden"
                                whileInView="visible"
                                viewport={viewportOnce}
                                transition={stagger(i)}
                                className="pb-10"
                            >
                                <h3 className="text-base font-bold transition-colors duration-300 group-hover:text-primary">
                                    {step.title}
                                </h3>
                                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                                    {step.description}
                                </p>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
