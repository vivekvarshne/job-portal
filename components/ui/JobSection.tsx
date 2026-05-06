import Link from "next/link";
import { Job } from "@/lib/db/jobs";
import JobCard from "./JobCard";
import { ArrowRight } from "lucide-react";

interface JobSectionProps {
    title: string;
    category: string;
    jobs: Job[];
}

const JobSection = ({ title, category, jobs }: JobSectionProps) => {
    return (
        <div className="bg-white border-2 border-primary rounded-lg overflow-hidden shadow-sm">
            <div className="bg-primary text-white px-4 py-2 flex items-center justify-between">
                <h2 className="font-bold uppercase tracking-wide">{title}</h2>
                <Link
                    href={`/${category}`}
                    className="text-xs bg-white text-primary px-2 py-1 rounded font-bold hover:bg-blue-50 transition-colors flex items-center"
                >
                    VIEW ALL <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
            </div>
            <div className="divide-y">
                {jobs.length > 0 ? (
                    <>
                        {jobs.map((job) => <JobCard key={job.id} job={job} />)}
                        <Link href={`/${category}`} className="block text-center py-3 bg-gray-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors text-sm border-t">
                            View All <ArrowRight className="inline-block h-4 w-4 ml-1 mb-0.5" />
                        </Link>
                    </>
                ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No active {title} available.
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobSection;
