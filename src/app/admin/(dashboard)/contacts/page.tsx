"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import {
    Search,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Contact {
    id: number;
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    message: string;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
    });
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [exporting, setExporting] = useState(false);

    const fetchContacts = useCallback(
        async (page = 1, searchQuery = search) => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(pagination.limit),
                });
                if (searchQuery) params.set("search", searchQuery);

                const res = await fetch(`/api/admin/contacts?${params}`);
                const data = await res.json();

                if (data.status === "success") {
                    setContacts(data.data);
                    setPagination(data.pagination);
                }
            } catch {
                console.error("Failed to fetch contacts");
            } finally {
                setLoading(false);
            }
        },
        [search, pagination.limit],
    );

    useEffect(() => {
        fetchContacts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleDelete(id: number, name: string) {
        if (!confirm(`Delete contact from "${name}"? This cannot be undone.`)) return;

        setDeleting(id);
        try {
            const res = await fetch("/api/admin/contacts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                setContacts((prev) => prev.filter((c) => c.id !== id));
                setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
                if (expanded === id) setExpanded(null);
            }
        } catch {
            console.error("Failed to delete contact");
        } finally {
            setDeleting(null);
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        fetchContacts(1, search);
    }

    async function handleExportCSV() {
        setExporting(true);
        try {
            const params = new URLSearchParams({ page: "1", limit: "10000" });
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/contacts?${params}`);
            const data = await res.json();
            if (data.status !== "success") return;

            const rows: Contact[] = data.data;
            const escape = (v: string | null | undefined) =>
                `"${(v ?? "").replace(/"/g, '""')}"`;

            const header = ["ID", "Name", "Email", "Company", "Phone", "Message", "Date"];
            const csv = [
                header.join(","),
                ...rows.map((c) =>
                    [
                        c.id,
                        escape(c.name),
                        escape(c.email),
                        escape(c.company),
                        escape(c.phone),
                        escape(c.message),
                        new Date(c.created_at).toISOString(),
                    ].join(","),
                ),
            ].join("\n");

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            console.error("Failed to export contacts");
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {pagination.total} total contact submission{pagination.total !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={exporting || pagination.total === 0}
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchContacts(pagination.page)}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email or company..."
                        className="pl-9"
                    />
                </div>
                <Button type="submit">Search</Button>
            </form>

            {/* Table */}
            <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-card">
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8" />
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                                    Email
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                                    Company
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                                    Phone
                                </th>
                                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                                    Date
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
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No contacts found.
                                    </td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <Fragment key={contact.id}>
                                        <tr
                                            className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer"
                                            onClick={() =>
                                                setExpanded(
                                                    expanded === contact.id ? null : contact.id,
                                                )
                                            }
                                        >
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {expanded === contact.id ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {contact.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="hover:text-foreground hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {contact.email}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                                {contact.company || (
                                                    <span className="opacity-40">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                                                {contact.phone || (
                                                    <span className="opacity-40">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                                                {new Date(contact.created_at).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    },
                                                )}
                                            </td>
                                            <td
                                                className="px-4 py-3 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(contact.id, contact.name)
                                                    }
                                                    disabled={deleting === contact.id}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    {deleting === contact.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-3 h-3" />
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                        {expanded === contact.id && (
                                            <tr

                                                className="border-b border-border bg-accent/30"
                                            >
                                                <td colSpan={7} className="px-6 py-4">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                                        Message
                                                    </p>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                        {contact.message}
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchContacts(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchContacts(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
