"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
    Sparkles,
    Loader2,
    Download,
    Send,
    AlertTriangle,
    RectangleHorizontal,
    Square,
    RectangleVertical,
} from "lucide-react";
import { IMAGE_SIZES, type ImageSize } from "@/lib/image-sizes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface HistoryItem {
    id: number;
    prompt: string;
    size: string;
    url?: string;
    error?: string;
    loading: boolean;
}

const SIZE_META: Record<string, { icon: React.ElementType; short: string }> = {
    "1792x1024": { icon: RectangleHorizontal, short: "Landscape" },
    "1024x1024": { icon: Square, short: "Square" },
    "1024x1792": { icon: RectangleVertical, short: "Portrait" },
};

const PROMPT_SUGGESTIONS = [
    "Laptop in a modern office with an automation workflow displayed on the screen",
    "Futuristic AI dashboard with holographic charts and glowing interface elements",
    "Robot and human hands reaching toward each other over a glowing circuit board",
    "Cloud infrastructure floating above a server room with streaming data connections",
];

let nextId = 1;

export default function GenerateImagePage() {
    const [prompt, setPrompt] = useState("");
    const [size, setSize] = useState<ImageSize>("1792x1024");
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history]);

    async function handleSubmit(e?: FormEvent) {
        e?.preventDefault();
        if (!prompt.trim() || submitting) return;

        const id = nextId++;
        const userPrompt = prompt.trim();
        const userSize = size;

        setHistory((prev) => [
            ...prev,
            { id, prompt: userPrompt, size: userSize, loading: true },
        ]);
        setPrompt("");
        setSubmitting(true);

        try {
            const res = await fetch("/api/admin/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userPrompt, size: userSize }),
            });

            const data = await res.json();

            if (!res.ok || data.status !== "success") {
                setHistory((prev) =>
                    prev.map((item) =>
                        item.id === id
                            ? { ...item, loading: false, error: data.message || "Generation failed." }
                            : item,
                    ),
                );
                return;
            }

            setHistory((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? { ...item, loading: false, url: data.url, prompt: data.prompt || userPrompt, size: data.size || userSize }
                        : item,
                ),
            );
        } catch {
            setHistory((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? { ...item, loading: false, error: "Request failed. Check the server logs." }
                        : item,
                ),
            );
        } finally {
            setSubmitting(false);
            textareaRef.current?.focus();
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Generate Image</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Use DALL·E 3 to generate images from a text prompt
                </p>
            </div>

            {/* Main card */}
            <div className={`rounded-xl border border-border bg-card overflow-hidden flex flex-col ${history.length > 0 ? "min-h-[calc(100vh-12rem)]" : ""}`}>

                {/* History — only shown when there's content */}
                {history.length > 0 && (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
                        {history.map((item) => {
                            const meta = SIZE_META[item.size];
                            const Icon = meta?.icon;
                            return (
                                <div key={item.id} className="space-y-3 max-w-2xl mx-auto w-full">
                                    {/* Prompt bubble */}
                                    <div className="flex justify-end">
                                        <div className="max-w-sm sm:max-w-lg rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/15 px-4 py-2.5">
                                            <p className="text-sm text-foreground leading-relaxed">{item.prompt}</p>
                                            {Icon && (
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    <Icon className="w-3 h-3 text-muted-foreground" />
                                                    <p className="text-[10px] text-muted-foreground font-mono">{item.size}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Response */}
                                    <div className="flex justify-start">
                                        {item.loading ? (
                                            <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-5 py-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Generating…</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Usually 10–20 seconds</p>
                                                </div>
                                            </div>
                                        ) : item.error ? (
                                            <div className="rounded-2xl rounded-tl-sm bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-start gap-2.5 max-w-sm">
                                                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-destructive">Generation failed</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{item.error}</p>
                                                </div>
                                            </div>
                                        ) : item.url ? (
                                            <div className="space-y-2 w-full">
                                                <div className="rounded-2xl rounded-tl-sm overflow-hidden border border-border shadow-sm">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={item.url}
                                                        alt={item.prompt}
                                                        className="w-full h-auto object-contain"
                                                    />
                                                </div>
                                                <Button asChild size="sm" variant="outline" className="rounded-full">
                                                    <a
                                                        href={item.url}
                                                        download="generated-image.png"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        Download
                                                    </a>
                                                </Button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>
                )}

                {/* Empty state — only shown when no history */}
                {history.length === 0 && (
                    <div className="flex flex-col items-center text-center px-6 pt-10 pb-6 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                            <Sparkles className="w-7 h-7 text-primary opacity-80" />
                        </div>

                        <div className="space-y-1">
                            <p className="text-base font-semibold tracking-tight">Describe your image</p>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                Pick a size, write a prompt, and let DALL·E 3 bring it to life.
                            </p>
                        </div>

                        {/* Size pills */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {IMAGE_SIZES.map((s) => {
                                const meta = SIZE_META[s.value];
                                const Icon = meta.icon;
                                const active = s.value === size;
                                return (
                                    <button
                                        key={s.value}
                                        onClick={() => setSize(s.value as ImageSize)}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
                                            ${active
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {meta.short}
                                        <span className="opacity-60 font-normal">{s.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Suggestions */}
                        <div className="w-full max-w-xl space-y-2 pb-2">
                            <p className="text-xs text-muted-foreground">Need inspiration?</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {PROMPT_SUGGESTIONS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setPrompt(s);
                                            textareaRef.current?.focus();
                                        }}
                                        className="rounded-lg px-3 py-2.5 text-xs border border-dashed border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/50 transition-colors text-left leading-relaxed"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Input bar */}
                <div className="border-t border-border p-3 sm:p-4 bg-muted/20">
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <Textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe the image you want to generate…"
                            rows={2}
                            disabled={submitting}
                            className="w-full resize-none text-sm"
                        />
                        <div className="flex items-center justify-end">
                            <Button
                                type="submit"
                                size="sm"
                                className="gap-2 rounded-full px-4"
                                disabled={submitting || !prompt.trim()}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span className="hidden sm:inline">Generating…</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Generate</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
