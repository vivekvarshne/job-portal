"use client";

import { useEffect, useState } from "react";
import { getAllJobs, Job } from "@/lib/db/jobs";
import {
    FileText,
    CheckCircle,
    Clock,
    Eye,
    TrendingUp,
    PlusCircle
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            const data = await getAllJobs();
            setJobs(data);
            setLoading(false);
        };
        fetchJobs();
    }, []);

    const stats = [
        {
            label: "Total Posts",
            value: jobs.length,
            icon: FileText,
            color: "bg-blue-100 text-blue-600"
        },
        {
            label: "Published",
            value: jobs.filter(j => j.status === "published").length,
            icon: CheckCircle,
            color: "bg-green-100 text-green-600"
        },
        {
            label: "Drafts",
            value: jobs.filter(j => j.status === "draft").length,
            icon: Clock,
            color: "bg-yellow-100 text-yellow-600"
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">Overview of your job portal</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${stat.color}`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Recent Updates</h2>
                        <Link href="/admin/jobs" className="text-sm text-blue-600 font-medium hover:underline">View All</Link>
                    </div>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg" />)}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {jobs.slice(0, 5).map((job) => (
                                <div key={job.id} className="py-3 flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                                        <p className="text-xs text-gray-500 capitalize">{job.category.replace("-", " ")}</p>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${job.status === "published" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                                        }`}>
                                        {job.status}
                                    </div>
                                </div>
                            ))}
                            {jobs.length === 0 && (
                                <p className="p-8 text-center text-gray-400 text-sm">No jobs added yet.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-2xl text-white flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Grow your Portal</h2>
                        <p className="text-blue-100">Add new job notifications to keep your visitors engaged.</p>
                    </div>
                    <Link
                        href="/admin/jobs/new"
                        className="mt-8 bg-white text-blue-800 font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 w-max hover:bg-blue-50 transition-colors"
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span>Create New Post</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
