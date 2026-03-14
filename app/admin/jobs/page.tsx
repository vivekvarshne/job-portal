"use client";

import { useEffect, useState } from "react";
import { getAllJobs, deleteJob, Job } from "@/lib/db/jobs";
import {
    FileText,
    Search,
    Edit3,
    Trash2,
    Eye,
    MoreVertical,
    ChevronRight,
    PlusCircle,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";

export default function AdminJobList() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refetch, setRefetch] = useState(0);

    useEffect(() => {
        const fetchJobs = async () => {
            const data = await getAllJobs();
            setJobs(data);
            setLoading(false);
        };
        fetchJobs();
    }, [refetch]);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this post?")) {
            try {
                await deleteJob(id);
                toast.success("Post deleted safely");
                setRefetch(p => p + 1);
            } catch (e) {
                toast.error("Deletion failed");
            }
        }
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Jobs</h1>
                    <p className="text-gray-500">Manage and edit your published notifications</p>
                </div>
                <Link
                    href="/admin/jobs/new"
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center space-x-2 transition-transform active:scale-95"
                >
                    <PlusCircle className="h-5 w-5" />
                    <span>New Post</span>
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex items-center space-x-3">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by title or category..."
                        className="flex-1 outline-none text-sm"
                    />
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="animate-spin h-10 w-10 mb-2" />
                        <p>Gathering your updates...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Job Title</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 max-w-sm">
                                            <p className="font-bold text-gray-900 line-clamp-1">{job.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{job.department}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold capitalize">
                                                {job.category.replace("-", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center space-x-1.5 ${job.status === "published" ? "text-green-600" : "text-yellow-600"
                                                }`}>
                                                <div className={`h-1.5 w-1.5 rounded-full ${job.status === "published" ? "bg-green-600" : "bg-yellow-600"
                                                    }`} />
                                                <span className="font-bold capitalize">{job.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    href={`/job/${job.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Live"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Link>
                                                <Link
                                                    href={`/admin/jobs/edit/${job.id}`}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit3 className="h-5 w-5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(job.id!)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {jobs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-gray-400">
                                            No jobs found. Start by creating your first post.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
