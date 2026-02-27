"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TERMINAL_LINES } from "@/config/site";
import type { TerminalLine } from "@/types";

export function Terminal() {
    const [visibleLines, setVisibleLines] = useState(0);

    useEffect(() => {
        if (visibleLines < TERMINAL_LINES.length) {
            const current = TERMINAL_LINES[visibleLines];
            const delay =
                visibleLines === 0
                    ? 800
                    : current?.type === "input"
                        ? 1000
                        : 350;

            const timeout = setTimeout(() => {
                setVisibleLines((v) => v + 1);
            }, delay);
            return () => clearTimeout(timeout);
        }
    }, [visibleLines]);

    return (
        <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <div className="flex gap-1.5">
                    <div className="size-3 rounded-full bg-red-500/70" />
                    <div className="size-3 rounded-full bg-yellow-500/70" />
                    <div className="size-3 rounded-full bg-green-500/70" />
                </div>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                    ~/dodera/project
                </span>
            </div>

            {/* Body */}
            <div className="space-y-1 p-4 font-mono text-[13px] leading-relaxed min-h-[260px]">
                {TERMINAL_LINES.slice(0, visibleLines).map((line: TerminalLine, i: number) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-start gap-2",
                            line.type === "success" && "text-emerald-600",
                            line.type === "error" && "text-red-600",
                            line.type === "input" && "text-foreground",
                            line.type === "output" && "text-muted-foreground"
                        )}
                    >
                        {line.type === "input" && (
                            <span className="shrink-0 select-none text-primary">$</span>
                        )}
                        <span>{line.text}</span>
                    </div>
                ))}

                {/* Cursor */}
                <div className="flex items-center gap-2">
                    <span className="select-none text-primary">$</span>
                    <span className="animate-pulse text-foreground">▌</span>
                </div>
            </div>
        </div>
    );
}
