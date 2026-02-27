"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Key,
    Plus,
    Trash2,
    Ban,
    Loader2,
    Copy,
    Check,
    RefreshCw,
    X,
    Clock,
    Shield,
    AlertTriangle,
} from "lucide-react";

interface Token {
    id: number;
    name: string;
    created_at: string;
    expires_at: string | null;
    revoked_at: string | null;
    last_used_at: string | null;
}

export default function TokensPage() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Create token modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTokenName, setNewTokenName] = useState("");
    const [newTokenExpiry, setNewTokenExpiry] = useState("");
    const [creating, setCreating] = useState(false);

    // Show token modal
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchTokens = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/tokens");
            const data = await res.json();
            if (data.status === "success") {
                setTokens(data.data);
            }
        } catch {
            console.error("Failed to fetch tokens");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTokens();
    }, [fetchTokens]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setCreating(true);

        try {
            const res = await fetch("/api/admin/tokens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTokenName,
                    expiresDays: newTokenExpiry ? parseInt(newTokenExpiry) : null,
                }),
            });

            const data = await res.json();

            if (res.ok && data.plainToken) {
                setGeneratedToken(data.plainToken);
                setShowCreateModal(false);
                setNewTokenName("");
                setNewTokenExpiry("");
                fetchTokens();
            }
        } catch {
            console.error("Failed to create token");
        } finally {
            setCreating(false);
        }
    }

    async function handleRevoke(id: number, name: string) {
        if (!confirm(`Revoke token "${name}"? It will no longer be usable.`)) return;
        setActionLoading(id);
        try {
            const res = await fetch("/api/admin/tokens", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "revoke" }),
            });
            if (res.ok) fetchTokens();
        } catch {
            console.error("Failed to revoke token");
        } finally {
            setActionLoading(null);
        }
    }

    async function handleDelete(id: number, name: string) {
        if (!confirm(`Permanently delete token "${name}"? This cannot be undone.`))
            return;
        setActionLoading(id);
        try {
            const res = await fetch("/api/admin/tokens", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setTokens((prev) => prev.filter((t) => t.id !== id));
            }
        } catch {
            console.error("Failed to delete token");
        } finally {
            setActionLoading(null);
        }
    }

    function copyToken() {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    function getTokenStatus(token: Token) {
        if (token.revoked_at) {
            return {
                label: "Revoked",
                className: "bg-destructive/10 text-destructive",
                icon: Ban,
            };
        }
        if (token.expires_at && new Date(token.expires_at) < new Date()) {
            return {
                label: "Expired",
                className: "bg-amber-500/10 text-amber-500",
                icon: AlertTriangle,
            };
        }
        return {
            label: "Active",
            className: "bg-emerald-500/10 text-emerald-500",
            icon: Shield,
        };
    }

    function formatDate(dateStr: string | null) {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        API Tokens
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage bearer tokens for API access
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchTokens}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Generate Token
                    </button>
                </div>
            </div>

            {/* Tokens Table */}
            <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-card">
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    ID
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Created
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Expires
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Last Used
                                </th>
                                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </td>
                                </tr>
                            ) : tokens.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No API tokens yet. Generate your first one.
                                    </td>
                                </tr>
                            ) : (
                                tokens.map((token) => {
                                    const status = getTokenStatus(token);
                                    const StatusIcon = status.icon;
                                    return (
                                        <tr
                                            key={token.id}
                                            className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                                {token.id}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {token.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                                                >
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                {formatDate(token.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                {formatDate(token.expires_at)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                {formatDate(token.last_used_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {!token.revoked_at && (
                                                        <button
                                                            onClick={() =>
                                                                handleRevoke(
                                                                    token.id,
                                                                    token.name,
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading ===
                                                                token.id
                                                            }
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-amber-500 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
                                                            title="Revoke token"
                                                        >
                                                            {actionLoading ===
                                                                token.id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Ban className="w-3 h-3" />
                                                            )}
                                                            Revoke
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                token.id,
                                                                token.name,
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading === token.id
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                                                        title="Delete token"
                                                    >
                                                        {actionLoading === token.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3 h-3" />
                                                        )}
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Token Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Generate New Token
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Token Name
                                </label>
                                <input
                                    type="text"
                                    value={newTokenName}
                                    onChange={(e) =>
                                        setNewTokenName(e.target.value)
                                    }
                                    required
                                    placeholder='e.g. "CI pipeline", "Mobile app"'
                                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Expires in (days)
                                </label>
                                <input
                                    type="number"
                                    value={newTokenExpiry}
                                    onChange={(e) =>
                                        setNewTokenExpiry(e.target.value)
                                    }
                                    min={1}
                                    placeholder="Leave blank for never"
                                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Optional — leave empty for a non-expiring token
                                </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generated Token Modal */}
            {generatedToken && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg mx-4 rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Key className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Token Generated
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Copy it now — it won&apos;t be shown again.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <code className="block w-full px-4 py-3 rounded-lg bg-background border border-border text-xs font-mono break-all select-all">
                                {generatedToken}
                            </code>
                            <button
                                onClick={copyToken}
                                className="absolute top-2 right-2 p-1.5 rounded-md bg-card border border-border hover:bg-accent transition-colors"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>
                        </div>

                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-500 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>
                                Make sure to copy this token. For security
                                reasons, you will not be able to see it again.
                            </span>
                        </div>

                        <button
                            onClick={() => {
                                setGeneratedToken(null);
                                setCopied(false);
                            }}
                            className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
