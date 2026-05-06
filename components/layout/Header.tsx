"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import AuthButtons from "../auth/AuthButtons";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Latest Jobs", href: "/latest-jobs" },
        { name: "Admit Card", href: "/admit-card" },
        { name: "Result", href: "/result" },
        { name: "Answer Key", href: "/answer-key" },
        { name: "Syllabus", href: "/syllabus" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-white shadow-md">
            <div className="bg-blue-800 text-white py-2 px-4 text-center text-sm font-semibold">
                Job Portal: All Govt Jobs, Admit Card, Results 2026
            </div>
            <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Image 
                        src="/logo.jpeg" 
                        alt="Job Portal Logo" 
                        width={200}
                        height={48}
                        className="h-12 w-auto object-contain rounded"
                        priority
                        unoptimized
                    />
                    <div className="flex flex-col">
                        <span className="text-lg lg:text-xl font-bold text-blue-900 leading-none">JOB PORTAL</span>
                        <span className="text-[10px] lg:text-xs text-red-600 font-semibold uppercase">Official Website</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center space-x-2 lg:space-x-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-gray-700 hover:text-blue-700 font-medium transition-colors text-[11px] lg:text-sm whitespace-nowrap"
                        >
                            {link.name}
                        </Link>
                    ))}
                    <div className="relative group hidden sm:block">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-8 pr-2 py-1 border rounded-full text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 lg:w-40"
                        />
                        <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <div className="scale-90 lg:scale-100 origin-right">
                        <AuthButtons />
                    </div>
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
