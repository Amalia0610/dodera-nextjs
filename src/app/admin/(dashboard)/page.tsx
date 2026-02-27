"use client";

import { useEffect, useState } from "react";
import { Users, Key, LayoutDashboard } from "lucide-react";

interface Stats {
    subscribers: number;
    tokens: number;
    activeTokens: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [subsRes, tokensRes] = await Promise.all([
                    fetch("/api/admin/subscribers?limit=1"),
                    fetch("/api/admin/tokens"),
                ]);

                const subsData = await subsRes.json();
                const tokensData = await tokensRes.json();

                const tokens = tokensData.data || [];
                const activeTokens = tokens.filter(
                    (t: { revoked_at: string | null; expires_at: string | null }) =>
                        !t.revoked_at &&
                        (!t.expires_at || new Date(t.expires_at) > new Date()),
                );

                setStats({
                    subscribers: subsData.pagination?.total || 0,
                    tokens: tokens.length,
                    activeTokens: activeTokens.length,
                });
            } catch {
                console.error("Failed to load dashboard stats");
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const cards = [
        {
            label: "Total Subscribers",
            value: stats?.subscribers ?? "—",
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
        },
        {
            label: "Total API Tokens",
            value: stats?.tokens ?? "—",
            icon: Key,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
        },
        {
            label: "Active Tokens",
            value: stats?.activeTokens ?? "—",
            icon: LayoutDashboard,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Overview of your website data
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-xl border border-border bg-card p-5 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {card.label}
                            </p>
                            <div
                                className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}
                            >
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold">
                            {loading ? (
                                <span className="inline-block w-12 h-8 rounded bg-muted animate-pulse" />
                            ) : (
                                card.value
                            )}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
