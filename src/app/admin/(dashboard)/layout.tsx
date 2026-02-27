"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    Users,
    Key,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    Loader2,
} from "lucide-react";

interface AdminSession {
    id: number;
    email: string;
    name: string;
}

const NAV_ITEMS = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/subscribers", label: "Subscribers", icon: Users },
    { href: "/admin/tokens", label: "API Tokens", icon: Key },
];

export default function AdminDashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [session, setSession] = useState<AdminSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetch("/api/admin/session")
            .then((res) => {
                if (!res.ok) {
                    router.replace("/admin/login");
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (data?.user) {
                    setSession(data.user);
                }
            })
            .catch(() => router.replace("/admin/login"))
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = useCallback(async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Logo area */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm">Admin Panel</span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/admin" &&
                                pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User / Logout */}
                <div className="p-3 border-t border-border space-y-2">
                    <div className="px-3 py-2">
                        <p className="text-sm font-medium truncate">
                            {session.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {session.email}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-16 border-b border-border flex items-center px-4 lg:px-6 gap-4 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-muted-foreground hover:text-foreground"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h2 className="text-sm font-medium text-muted-foreground">
                        {NAV_ITEMS.find(
                            (item) =>
                                pathname === item.href ||
                                (item.href !== "/admin" &&
                                    pathname.startsWith(item.href)),
                        )?.label || "Dashboard"}
                    </h2>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
