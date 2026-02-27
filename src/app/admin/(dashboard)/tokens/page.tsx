"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
    Pencil,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface Token {
    id: number;
    name: string;
    created_at: string;
    expires_at: string | null;
    revoked_at: string | null;
    last_used_at: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function TokensPage() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Create token modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTokenName, setNewTokenName] = useState("");
    const [newTokenExpiry, setNewTokenExpiry] = useState("");
    const [creating, setCreating] = useState(false);

    // Dropdown menu state
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function toggleMenu(e: React.MouseEvent<HTMLButtonElement>, id: number) {
        if (openMenuId === id) {
            setOpenMenuId(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + window.scrollY + 4,
            right: window.innerWidth - rect.right,
        });
        setOpenMenuId(id);
    }

    // Rename state
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renameSaving, setRenameSaving] = useState(false);

    // Show token modal
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchTokens = useCallback(async (page = pagination.page) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(pagination.limit),
            });
            const res = await fetch(`/api/admin/tokens?${params}`);
            const data = await res.json();
            if (data.status === "success") {
                setTokens(data.data);
                setPagination(data.pagination);
            }
        } catch {
            console.error("Failed to fetch tokens");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.limit]);

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
                fetchTokens(1);
            }
        } catch {
            console.error("Failed to create token");
        } finally {
            setCreating(false);
        }
    }

    function startRename(token: Token) {
        setRenamingId(token.id);
        setRenameValue(token.name);
    }

    function cancelRename() {
        setRenamingId(null);
        setRenameValue("");
    }

    async function saveRename(id: number) {
        if (!renameValue.trim()) return;
        setRenameSaving(true);
        try {
            const res = await fetch("/api/admin/tokens", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name: renameValue }),
            });
            if (res.ok) {
                setTokens((prev) =>
                    prev.map((t) =>
                        t.id === id ? { ...t, name: renameValue.trim() } : t,
                    ),
                );
                cancelRename();
            }
        } catch {
            console.error("Failed to rename token");
        } finally {
            setRenameSaving(false);
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
            if (res.ok) fetchTokens(pagination.page);
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
                        {pagination.total} token{pagination.total !== 1 ? "s" : ""} &mdash; manage bearer tokens for API access
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchTokens(pagination.page)}>
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4" />
                        Generate Token
                    </Button>
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
                                                {renamingId === token.id ? (
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            saveRename(token.id);
                                                        }}
                                                        className="flex items-center gap-1.5"
                                                    >
                                                        <Input
                                                            autoFocus
                                                            type="text"
                                                            value={renameValue}
                                                            onChange={(e) => setRenameValue(e.target.value)}
                                                            onKeyDown={(e) => e.key === "Escape" && cancelRename()}
                                                            className="w-40 h-8"
                                                        />
                                                        <Button
                                                            type="submit"
                                                            size="icon"
                                                            variant="ghost"
                                                            disabled={renameSaving}
                                                            className="h-8 w-8 text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                                                        >
                                                            {renameSaving ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="w-3.5 h-3.5" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={cancelRename}
                                                            className="h-8 w-8"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </form>
                                                ) : (
                                                    token.name
                                                )}
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
                                                {actionLoading === token.id ? (
                                                    <span className="inline-flex justify-end w-full">
                                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                    </span>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => toggleMenu(e, token.id)}
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchTokens(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchTokens(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Token Dialog */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Generate New Token</DialogTitle>
                        <DialogDescription>
                            Tokens allow external services to authenticate with your API.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tokenName">Token Name</Label>
                            <Input
                                id="tokenName"
                                type="text"
                                value={newTokenName}
                                onChange={(e) => setNewTokenName(e.target.value)}
                                required
                                placeholder='e.g. "CI pipeline", "Mobile app"'
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tokenExpiry">Expires in (days)</Label>
                            <Input
                                id="tokenExpiry"
                                type="number"
                                value={newTokenExpiry}
                                onChange={(e) => setNewTokenExpiry(e.target.value)}
                                min={1}
                                placeholder="Leave blank for never"
                            />
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Optional — leave empty for a non-expiring token
                            </p>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={creating}>
                                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                {creating ? "Generating…" : "Generate"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Generated Token Dialog */}
            <Dialog open={!!generatedToken} onOpenChange={(open) => { if (!open) { setGeneratedToken(null); setCopied(false); } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                <Key className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <DialogTitle>Token Generated</DialogTitle>
                                <DialogDescription>
                                    Copy it now — it won&apos;t be shown again.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="relative">
                        <code className="block w-full px-4 py-3 rounded-lg bg-background border border-border text-xs font-mono break-all select-all">
                            {generatedToken}
                        </code>
                        <Button
                            size="icon"
                            variant="outline"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={copyToken}
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-500 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            Make sure to copy this token. For security reasons, you will not be able to see it again.
                        </span>
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full"
                            onClick={() => { setGeneratedToken(null); setCopied(false); }}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fixed dropdown — renders outside table overflow context */}
            {openMenuId !== null && (() => {
                const token = tokens.find((t) => t.id === openMenuId);
                if (!token) return null;
                return (
                    <div
                        ref={menuRef}
                        style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
                        className="z-[9999] w-44 rounded-lg border border-border bg-card shadow-xl py-1"
                    >
                        <button
                            onClick={() => { setOpenMenuId(null); startRename(token); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            Rename
                        </button>

                        {!token.revoked_at && (
                            <button
                                onClick={() => { setOpenMenuId(null); handleRevoke(token.id, token.name); }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-amber-500 hover:bg-amber-500/10 transition-colors"
                            >
                                <Ban className="w-3.5 h-3.5" />
                                Revoke
                            </button>
                        )}

                        <div className="my-1 border-t border-border" />

                        <button
                            onClick={() => { setOpenMenuId(null); handleDelete(token.id, token.name); }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                );
            })()}
        </div>
    );
}
