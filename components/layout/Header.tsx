"use client";

import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import AuthButtons from "../auth/AuthButtons";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Latest Jobs", href: "/category/latest-jobs" },
        { name: "Admit Card", href: "/category/admit-card" },
        { name: "Result", href: "/category/result" },
        { name: "Answer Key", href: "/category/answer-key" },
        { name: "Syllabus", href: "/category/syllabus" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-white shadow-md">
            <div className="bg-blue-800 text-white py-2 px-4 text-center text-sm font-semibold">
                Job Portal: All Govt Jobs, Admit Card, Results 2026
            </div>
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <img 
                        src="https://hariharsonline.wordpress.com/wp-content/uploads/2024/12/graphic1-1.png" 
                        alt="Job Portal Logo" 
                        className="h-12 w-auto object-contain rounded"
                    />
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-blue-900 leading-none">JOB PORTAL</span>
                        <span className="text-xs text-red-600 font-semibold uppercase">Official Website</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-gray-700 hover:text-blue-700 font-medium transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            className="pl-8 pr-4 py-1 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-gray-400" />
                    </div>
                    <AuthButtons />
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-gray-600"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Nav */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t py-4 px-4 space-y-4 shadow-lg absolute w-full left-0">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="block text-gray-700 hover:text-blue-700 font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            className="w-full pl-8 pr-4 py-2 border rounded-full text-sm"
                        />
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
