import { getJobBySlug, getJobsByCategory } from "@/lib/db/jobs";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Building2, Download, ExternalLink, ChevronRight, FileCheck, List, Table as TableIcon, Type } from "lucide-react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
    params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const job = await getJobBySlug(slug);
    if (!job) return { title: "Job Not Found" };

    return {
        title: job.seoTitle || `${job.title} - Job Portal`,
        description: job.seoDescription || `Complete information about ${job.title}. Application dates, fee, eligibility, and apply link.`,
        openGraph: {
            title: job.title,
            description: job.seoDescription,
            type: "article",
        },
    };
}

export default async function JobDetail({ params }: Props) {
    const { slug } = await params;
    const job = await getJobBySlug(slug);

    if (!job) {
        notFound();
    }

    return (
        <>
            <Header />

            <main className="min-h-screen flex flex-col bg-gray-50 flex-grow container mx-auto px-4 py-6">
                <div className="mb-4">
                    <AdBanner position="job_top" />
                </div>
                {/* Breadcrumb */}
                <nav className="flex items-center text-xs text-gray-500 mb-6 font-medium">
                    <Link href="/" className="hover:text-primary">Home</Link>
                    <ChevronRight className="h-3 w-3 mx-2" />
                    <Link href={`/category/${job.category}`} className="hover:text-primary capitalize">
                        {job.category.replace("-", " ")}
                    </Link>
                    <ChevronRight className="h-3 w-3 mx-2" />
                    <span className="text-gray-900 truncate max-w-[200px]">{job.title}</span>
                </nav>

                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-primary text-white p-6">
                        <h1 className="text-xl md:text-2xl font-bold text-center uppercase">
                            {job.title}
                        </h1>
                        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm opacity-90">
                            <span className="flex items-center">
                                <Building2 className="h-4 w-4 mr-1" />
                                {job.department}
                            </span>
                            <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Published: {new Date(job.createdAt?.toDate()).toLocaleDateString('en-GB')}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 md:p-8 space-y-8">
                        {/* Quick Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Important Dates */}
                            <div className="border border-blue-100 rounded-lg p-4 bg-blue-50/50">
                                <h2 className="text-lg font-bold text-blue-900 mb-4 border-b border-blue-200 pb-2">
                                    Important Dates
                                </h2>
                                <ul className="space-y-3 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">Application Start:</span>
                                        <span className="font-bold text-gray-900">{job.importantDates.start}</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">Last Date to Apply:</span>
                                        <span className="font-bold text-red-600">{job.importantDates.end}</span>
                                    </li>
                                    {job.importantDates.examDate && (
                                        <li className="flex justify-between">
                                            <span className="text-gray-600">Exam Date:</span>
                                            <span className="font-bold text-gray-900">{job.importantDates.examDate}</span>
                                        </li>
                                    )}
                                    {job.importantDates.resultDate && (
                                        <li className="flex justify-between">
                                            <span className="text-gray-600">Result Date:</span>
                                            <span className="font-bold text-gray-900">{job.importantDates.resultDate}</span>
                                        </li>
                                    )}
                                    {job.importantDates.customDates && job.importantDates.customDates.length > 0 && (
                                        job.importantDates.customDates.map((cd: any, idx: number) => (
                                            <li key={idx} className="flex justify-between">
                                                <span className="text-gray-600">{cd.label}:</span>
                                                <span className="font-bold text-gray-900">{cd.date}</span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>

                            {/* Application Fee */}
                            <div className="border border-red-100 rounded-lg p-4 bg-red-50/50">
                                <h2 className="text-lg font-bold text-red-900 mb-4 border-b border-red-200 pb-2">
                                    Application Fee
                                </h2>
                                {job.categoryFees && job.categoryFees.length > 0 ? (
                                    <ul className="space-y-2">
                                        {job.categoryFees.map((cf: any, idx: number) => (
                                            <li key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600 font-medium">{cf.category}:</span>
                                                <span className="font-bold text-gray-900">₹{cf.fee}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-sm font-medium text-gray-700 whitespace-pre-line">
                                        {job.applicationFee}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Age Limit */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                                Age Limit
                            </h2>
                            <div className="text-sm text-gray-700 whitespace-pre-line">
                                {job.ageLimit}
                            </div>
                        </div>

                        {/* Dynamic Content Sections */}
                        {job.contentSections && job.contentSections.length > 0 && (
                            <div className="space-y-8">
                                {job.contentSections.map((section) => (
                                    <div key={section.id} className="border-t pt-8 first:border-t-0 first:pt-0">
                                        <div className="flex items-center space-x-2 text-blue-900 font-bold mb-4 bg-blue-900 text-white p-2 rounded justify-center uppercase">
                                            {section.type === 'table' && <TableIcon className="h-5 w-5" />}
                                            {section.type === 'bullets' && <List className="h-5 w-5" />}
                                            {section.type === 'rich-text' && <Type className="h-5 w-5" />}
                                            <h2>{section.title}</h2>
                                        </div>

                                        {section.type === 'table' && section.tableData && (
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider">
                                                        <tr>
                                                            {section.tableData.headers.map((h, i) => (
                                                                <th key={i} className="px-4 py-3 border-r last:border-r-0">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {section.tableData.rows.map((row, i) => (
                                                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                                {row.map((cell, j) => (
                                                                    <td key={j} className="px-4 py-3 border-r last:border-r-0">{cell}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {section.type === 'bullets' && section.listData && (
                                            <ul className="space-y-2 border rounded-lg p-4 bg-gray-50">
                                                {section.listData.map((item, i) => (
                                                    <li key={i} className="flex items-start">
                                                        <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                                        <span className="text-gray-700 font-medium">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        {section.type === 'rich-text' && section.textData && (
                                            <div className="text-sm text-gray-700 whitespace-pre-line border rounded-lg p-4 bg-gray-50 leading-relaxed font-medium">
                                                {section.textData}
                                            </div>
                                        )}
                                        
                                        {/* Jobs List Section will be handled as a separate component fetch if needed, 
                                            but since this is an async page, we could fetch here. 
                                            For now, let's focus on the custom content. */}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Vacancy Details Table */}
                        <div>
                            <h2 className="text-xl font-bold text-blue-900 mb-4">Total Vacancy: {job.vacancyDetails.reduce((acc, curr) => acc + (Number(curr.totalPost) || 0), 0)} Posts</h2>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-blue-900 text-white font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 border-r border-blue-800">Post Name</th>
                                            <th className="px-4 py-3 border-r border-blue-800 text-center">Total Post</th>
                                            <th className="px-4 py-3">Eligibility</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {job.vacancyDetails.map((v, i) => (
                                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="px-4 py-3 font-semibold text-blue-800 border-r">{v.postName}</td>
                                                <td className="px-4 py-3 text-center font-bold border-r">{v.totalPost}</td>
                                                <td className="px-4 py-3 text-gray-600">{v.eligibility}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Required Documents Section */}
                        {job.requiredDocuments && job.requiredDocuments.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                                <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                                    <FileCheck className="h-6 w-6 mr-2" />
                                    Required Documents (Mandatory)
                                </h2>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {job.requiredDocuments.map((doc: string, idx: number) => (
                                        <li key={idx} className="flex items-center text-amber-800 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2 flex-shrink-0" />
                                            {doc}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 text-xs text-amber-600 bg-white/50 p-2 rounded border border-amber-100 italic">
                                    Please ensure you have clear scanned copies of these documents before starting your application.
                                </p>
                            </div>
                        )}

                        {/* Ad Banner on Apply Page */}
                        <AdBanner position="apply_page" />

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(job.externalLinks && job.externalLinks.length > 0) ? (
                                    job.externalLinks.map((link: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-center flex items-center justify-center transition-transform hover:scale-[1.02] text-sm md:text-base uppercase"
                                        >
                                            {link.title || "Apply Online"} <ExternalLink className="h-5 w-5 ml-2 shrink-0" />
                                        </a>
                                    ))
                                ) : (
                                    <a
                                        href={job.applyLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-center flex items-center justify-center transition-transform hover:scale-[1.02] text-sm md:text-base uppercase"
                                    >
                                        APPLY ONLINE <ExternalLink className="h-5 w-5 ml-2 shrink-0" />
                                    </a>
                                )}
                                
                                {job.pdfUrl && (
                                    <a
                                        href={job.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-center flex items-center justify-center transition-transform hover:scale-[1.02] text-sm md:text-base uppercase"
                                    >
                                        DOWNLOAD NOTIFICATION <Download className="h-5 w-5 ml-2 shrink-0" />
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-center pt-2">
                            <Link
                                href={`/janseva-request/${job.slug}`}
                                className="w-full sm:w-auto bg-blue-900 border-2 border-blue-900 hover:bg-white hover:text-blue-900 text-white font-bold py-4 px-8 rounded-lg text-center flex items-center justify-center transition-all hover:scale-[1.02] uppercase tracking-wide"
                            >
                                FORM FILLING HELP (JANSEVA KENDRA) <ExternalLink className="h-5 w-5 ml-2" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <AdBanner position="job_bottom" />
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-100 p-6 rounded-lg">
                    <h2 className="font-bold text-blue-900 mb-2 uppercase">Official Notice:</h2>
                    <p className="text-sm text-blue-700 leading-relaxed italic">
                        Candidates are advised to read the full official notification before applying.
                        Job Portal is not responsible for any error in the information provided.
                        All links are provided for convenience only.
                    </p>
                </div>
            </main>

            <Footer />
        </>
    );
}
