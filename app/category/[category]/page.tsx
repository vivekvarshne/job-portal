import { getJobsByCategory } from "@/lib/db/jobs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JobCard from "@/components/ui/JobCard";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";

interface Props {
    params: { category: string };
}

export default async function CategoryPage({ params }: Props) {
    const { category } = await params;
    const validCategories = ["latest-jobs", "admit-card", "result", "answer-key", "syllabus", "admission", "documents"];

    // Normalizing category slug to match DB if needed
    let dbCategory = category;
    if (category === "latest-jobs") dbCategory = "latest-jobs"; // Already matches

    const jobs = await getJobsByCategory(dbCategory);

    const displayTitle = category.split("-").map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-900">{displayTitle}</h1>
                        <p className="text-sm text-gray-500">Showing {jobs.length} latest updates</p>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder={`Search in ${displayTitle}...`}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                <div className="bg-white rounded-lg border shadow-sm divide-y">
                    {jobs.length > 0 ? (
                        jobs.map((job) => <JobCard key={job.id} job={job} />)
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-gray-400">No updates found in this category yet.</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
