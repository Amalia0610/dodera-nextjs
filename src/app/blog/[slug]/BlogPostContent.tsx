"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/types";
import { fadeInUp, fadeInUpLg } from "@/lib/animations";

interface BlogPostContentProps {
    post: BlogPost;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
    return (
        <>
            {/* ── Header ──────────────────────────────────── */}
            <section aria-label="Article header" className="relative pb-12 pt-32">
                <div className="absolute inset-0 grid-bg" />

                <div className="relative z-10 mx-auto max-w-3xl px-6">
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.4 }}
                    >
                        <Link
                            href="/blog"
                            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            Back to Blog
                        </Link>
                    </motion.div>

                    <motion.div
                        variants={fadeInUpLg}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.4, delay: 0.06 }}
                        className="mb-6 flex flex-wrap items-center gap-3"
                    >
                        <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/5 text-xs text-primary"
                        >
                            {post.category}
                        </Badge>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {post.readTime}
                        </span>
                        <time
                            dateTime={post.date}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                            <Calendar className="size-3" />
                            {new Date(post.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </time>
                    </motion.div>

                    <motion.h1
                        variants={fadeInUpLg}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
                    >
                        {post.title}
                    </motion.h1>

                    <motion.p
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.4, delay: 0.16 }}
                        className="text-lg leading-relaxed text-muted-foreground"
                    >
                        {post.excerpt}
                    </motion.p>

                    {post.tags.length > 0 && (
                        <motion.div
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.22 }}
                            className="mt-6 flex flex-wrap gap-2"
                        >
                            {post.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className="border-input text-xs text-muted-foreground"
                                >
                                    <Tag className="mr-1 size-3" />
                                    {tag}
                                </Badge>
                            ))}
                        </motion.div>
                    )}

                    {/* Author */}
                    {post.author && (
                        <motion.div
                            variants={fadeInUp}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.4, delay: 0.28 }}
                            className="mt-8 flex items-center gap-3"
                        >
                            {post.author.avatar ? (
                                <Image
                                    src={post.author.avatar}
                                    alt={post.author.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                            ) : (
                                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                    <User className="size-5 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium">{post.author.name}</p>
                                {post.author.bio && (
                                    <p className="text-xs text-muted-foreground">{post.author.bio}</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ── Featured Image ───────────────────────────── */}
            {post.image && (
                <section aria-label="Featured image" className="relative">
                    <div className="mx-auto max-w-4xl px-6">
                        <motion.div
                            variants={fadeInUpLg}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border"
                        >
                            <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                priority
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 896px"
                            />
                        </motion.div>
                    </div>
                </section>
            )}

            {/* ── Body ────────────────────────────────────── */}
            <section aria-label="Article body" className="relative py-16">
                <div className="mx-auto max-w-3xl px-6">
                    {post.body ? (
                        <article
                            className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                prose-p:text-foreground/80 prose-p:leading-relaxed
                prose-strong:text-foreground prose-strong:font-semibold
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-li:text-foreground/80
                prose-blockquote:border-l-primary prose-blockquote:text-foreground/70
                prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-code:font-normal
                prose-pre:bg-muted prose-pre:border prose-pre:border-border
                prose-img:rounded-xl
                prose-hr:border-border"
                            dangerouslySetInnerHTML={{ __html: post.body }}
                        />
                    ) : (
                        <div className="rounded-xl border border-border bg-card p-12 text-center">
                            <p className="text-lg text-muted-foreground">
                                Full article content coming soon.
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground/60">
                                This post will be available once our CMS is connected.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────── */}
            <section aria-labelledby="post-cta" className="relative py-24">
                <div className="absolute inset-0 grid-bg-sm" />
                <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
                    <h2
                        id="post-cta"
                        className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl"
                    >
                        Want us to build{" "}
                        <span className="text-primary">your next project?</span>
                    </h2>
                    <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
                        We write about engineering because we live it every day. If you like
                        how we think, you&apos;ll love how we build.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/#contact">
                            Start a Project
                        </Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
