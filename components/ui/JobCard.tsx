import Link from "next/link";
import { Job } from "@/lib/db/jobs";
import { Calendar, Building2, ChevronRight } from "lucide-react";

interface JobCardProps {
    job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
    return (
        <Link
            href={`/job/${job.slug}`}
            className="block bg-white p-4 border-b hover:bg-blue-50 transition-colors group"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-blue-800 group-hover:text-blue-900 group-hover:underline line-clamp-2">
                        {job.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {job.department}
                        </span>
                        <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Last Date: {job.importantDates.end}
                        </span>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500" />
            </div>
        </Link>
    );
};

export default JobCard;
