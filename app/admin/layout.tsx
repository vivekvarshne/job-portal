"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    FileText,
    PlusCircle,
    LogOut,
    Loader2,
    Menu,
    X,
    Users,
    CreditCard,
    Speaker,
    Settings
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user && pathname !== "/admin/login") {
                router.push("/admin/login");
            } else {
                setUser(user);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router, pathname]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/admin/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    const navItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "All Jobs", href: "/admin/jobs", icon: FileText },
        { name: "Add New Job", href: "/admin/jobs/new", icon: PlusCircle },
        { name: "Employees Tracking", href: "/admin/vendors", icon: Users },
        { name: "Janseva Requests", href: "/admin/requests", icon: FileText },
        { name: "Plans & Pricing", href: "/admin/plans", icon: CreditCard },
        { name: "Advertisements", href: "/admin/ads", icon: Speaker },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex w-64 bg-blue-900 text-white flex-col">
                <div className="p-6 text-2xl font-bold border-b border-blue-800">
                    SR Admin
                </div>
                <nav className="flex-grow p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${pathname === item.href ? "bg-blue-700" : "hover:bg-blue-800"
                                }`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-blue-800">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 p-3 w-full text-left rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-blue-900 text-white p-4 flex items-center justify-between">
                    <span className="font-bold text-xl">SR Admin</span>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X /> : <Menu />}
                    </button>
                </header>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-blue-900 text-white flex flex-col p-6 animate-in slide-in-from-left">
                        <div className="flex justify-between items-center mb-10">
                            <span className="font-bold text-2xl">SR Admin</span>
                            <button onClick={() => setIsSidebarOpen(false)}><X className="h-8 w-8" /></button>
                        </div>
                        <nav className="space-y-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center space-x-4 p-4 text-xl border-b border-blue-800"
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <item.icon className="h-6 w-6" />
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                            <button
                                onClick={handleSignOut}
                                className="flex items-center space-x-4 p-4 text-xl text-red-400 w-full text-left"
                            >
                                <LogOut className="h-6 w-6" />
                                <span>Logout</span>
                            </button>
                        </nav>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
