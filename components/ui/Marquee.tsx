"use client";

import { Bell } from "lucide-react";

interface MarqueeProps {
    news: string[];
}

const Marquee = ({ news }: MarqueeProps) => {
    return (
        <div className="bg-red-50 border-y border-red-200 py-1 overflow-hidden flex items-center">
            <div className="bg-red-600 text-white px-4 py-1 flex items-center text-sm font-bold z-10 whitespace-nowrap">
                <Bell className="h-4 w-4 mr-2 animate-bounce" />
                BREAKING NEWS
            </div>
            <div className="relative flex overflow-x-hidden">
                <div className="flex animate-marquee whitespace-nowrap py-1">
                    {news.map((item, index) => (
                        <span key={index} className="mx-8 text-sm font-medium text-red-700">
                            • {item}
                        </span>
                    ))}
                </div>
                <div className="flex absolute top-0 animate-marquee2 whitespace-nowrap py-1">
                    {news.map((item, index) => (
                        <span key={index} className="mx-8 text-sm font-medium text-red-700">
                            • {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Marquee;
