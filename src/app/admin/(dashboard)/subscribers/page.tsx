"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Users,
    RefreshCw,
} from "lucide-react";

interface Subscriber {
    id: number;
    email: string;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function SubscribersPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);

    const fetchSubscribers = useCallback(
        async (page = 1, searchQuery = search) => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(pagination.limit),
                });
                if (searchQuery) params.set("search", searchQuery);

                const res = await fetch(`/api/admin/subscribers?${params}`);
                const data = await res.json();

                if (data.status === "success") {
                    setSubscribers(data.data);
                    setPagination(data.pagination);
                }
            } catch {
                console.error("Failed to fetch subscribers");
            } finally {
                setLoading(false);
            }
        },
        [search, pagination.limit],
    );

    useEffect(() => {
        fetchSubscribers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleDelete(id: number, email: string) {
        if (!confirm(`Delete subscriber "${email}"? This cannot be undone.`)) return;

        setDeleting(id);
        try {
            const res = await fetch("/api/admin/subscribers", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                setSubscribers((prev) => prev.filter((s) => s.id !== id));
                setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
            }
        } catch {
            console.error("Failed to delete subscriber");
        } finally {
            setDeleting(null);
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        fetchSubscribers(1, search);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Subscribers
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {pagination.total} total newsletter subscriber{pagination.total !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={() => fetchSubscribers(pagination.page)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by email..."
                        className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    Search
                </button>
            </form>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-card">
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    ID
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Email
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Subscribed
                                </th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </td>
                                </tr>
                            ) : subscribers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No subscribers found.
                                    </td>
                                </tr>
                            ) : (
                                subscribers.map((sub) => (
                                    <tr
                                        key={sub.id}
                                        className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                            {sub.id}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {sub.email}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(sub.created_at).toLocaleDateString(
                                                "en-US",
                                                {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                },
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() =>
                                                    handleDelete(sub.id, sub.email)
                                                }
                                                disabled={deleting === sub.id}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                                            >
                                                {deleting === sub.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3 h-3" />
                                                )}
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchSubscribers(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <button
                            onClick={() => fetchSubscribers(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
