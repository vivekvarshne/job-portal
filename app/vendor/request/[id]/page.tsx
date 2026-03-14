"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Printer, ArrowLeft, ExternalLink, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function RequestDetailsView({ params }: { params: { id: string } }) {
    const [request, setRequest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchRequest = async () => {
            const { id } = await params;
            
            auth.onAuthStateChanged(async (currentUser) => {
                if (!currentUser) {
                    router.push("/auth/vendor/login");
                    return;
                }

                try {
                    // Check if current user is vendor
                    const vendorDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (!vendorDoc.exists() || vendorDoc.data().role !== "vendor") {
                        router.push("/");
                        return;
                    }

                    // Fetch the request
                    const reqDoc = await getDoc(doc(db, "janseva_requests", id));
                    if (!reqDoc.exists()) {
                        toast.error("Request not found!");
                        router.push("/vendor/dashboard");
                        return;
                    }

                    const reqData = reqDoc.data();
                    // Ensure the vendor owns this request
                    if (reqData.vendorId !== currentUser.uid) {
                        toast.error("You are not authorized to view this request.");
                        router.push("/vendor/dashboard");
                        return;
                    }

                    setRequest(reqData);

                } catch (error) {
                    console.error("Error fetching request details:", error);
                } finally {
                    setLoading(false);
                }
            });
        };
        fetchRequest();
    }, [params, router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;
    if (!request) return null;

    const { formData, documents } = request;

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Non-printable action bar */}
                <div className="print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <Link 
                        href="/vendor/dashboard"
                        className="flex items-center text-gray-600 hover:text-blue-600 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Link>
                    <div className="flex space-x-4">
                        <Link
                            href={`/job/${request.jobSlug}`}
                            target="_blank"
                            className="flex items-center bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium px-4 py-2 rounded-lg text-sm"
                        >
                            View Job Details <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                        {request.jobLink && (
                            <a 
                                href={request.jobLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center bg-green-600 text-white hover:bg-green-700 font-medium px-4 py-2 rounded-lg text-sm"
                            >
                                APPLY ONLINE <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                        )}
                        <button 
                            onClick={() => window.print()}
                            className="flex items-center bg-blue-600 text-white hover:bg-blue-700 font-medium px-4 py-2 rounded-lg text-sm"
                        >
                            <Printer className="w-4 h-4 mr-2" /> Print Form Details
                        </button>
                    </div>
                </div>

                {/* Printable Form Sheet */}
                <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-300 print:shadow-none print:border-none print:p-0">
                    
                    {/* Header */}
                    <div className="border-b-4 border-blue-900 pb-6 mb-8 text-center">
                        <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-wide">Janseva Kendra Form Application</h1>
                        <p className="mt-2 text-xl font-medium text-blue-800">Applying For: {request.jobTitle}</p>
                        <p className="text-sm text-gray-500 mt-1">Submitted on: {new Date(request.createdAt.toDate()).toLocaleString()}</p>
                        <p className="text-sm text-gray-500 font-mono">Reference No: {request.id}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        
                        {/* Left Column: Details */}
                        <div className="md:col-span-3 space-y-8">
                            
                            {/* Personal Details */}
                            <section>
                                <h2 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-gray-800 uppercase">Personal Details</h2>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="text-lg font-bold text-gray-900">{formData.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Father's Name</p>
                                        <p className="text-base font-semibold text-gray-900">{formData.fatherName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Mother's Name</p>
                                        <p className="text-base font-semibold text-gray-900">{formData.motherName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date of Birth</p>
                                        <p className="text-base font-semibold text-gray-900">{formData.dob}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Gender</p>
                                        <p className="text-base font-semibold text-gray-900">{formData.gender}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Category</p>
                                        <p className="text-base font-semibold text-gray-900">{formData.category}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Contact & Address */}
                            <section>
                                <h2 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-gray-800 uppercase">Contact & Address</h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Student Email (System)</p>
                                        <p className="text-base font-semibold text-gray-900">{request.studentEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Student ID</p>
                                        <p className="text-base font-mono font-semibold text-blue-900">{request.studentId || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Full Postal Address</p>
                                        <p className="text-base font-semibold text-gray-900 whitespace-pre-wrap">{formData.address}</p>
                                    </div>
                                </div>
                            </section>

                            {/* Education */}
                            <section>
                                <h2 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-gray-800 uppercase">Educational Qualifications</h2>
                                <div>
                                    <p className="text-base font-semibold text-gray-900 whitespace-pre-wrap border border-gray-200 p-4 bg-gray-50 rounded-lg">{formData.education}</p>
                                </div>
                            </section>

                            {/* Additional Info */}
                            {formData.additionalInfo && (
                                <section>
                                    <h2 className="text-xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-gray-800 uppercase">Additional Information</h2>
                                    <div>
                                        <p className="text-base font-semibold text-gray-900 whitespace-pre-wrap">{formData.additionalInfo}</p>
                                    </div>
                                </section>
                            )}

                        </div>

                        {/* Right Column: Photos & Docs */}
                        <div className="md:col-span-1 space-y-6">
                            
                            {/* Photo */}
                            {documents?.photo && (
                                <div className="border p-2 rounded-lg text-center bg-gray-50 break-inside-avoid">
                                    <p className="text-xs text-gray-500 font-bold mb-2 uppercase">Passport Photo</p>
                                    <div className="relative w-full h-48">
                                        <Image 
                                            src={documents.photo} 
                                            alt="Student Photo" 
                                            fill 
                                            className="object-contain"
                                        />
                                    </div>
                                    <a href={documents.photo} target="_blank" className="print:hidden text-blue-600 text-xs mt-2 block hover:underline">Download</a>
                                </div>
                            )}

                            {/* Signature */}
                            {documents?.signature && (
                                <div className="border p-2 rounded-lg text-center bg-gray-50 break-inside-avoid">
                                    <p className="text-xs text-gray-500 font-bold mb-2 uppercase">Signature</p>
                                    <div className="relative w-full h-24 bg-white border">
                                        <Image 
                                            src={documents.signature} 
                                            alt="Student Signature" 
                                            fill 
                                            className="object-contain p-2"
                                        />
                                    </div>
                                    <a href={documents.signature} target="_blank" className="print:hidden text-blue-600 text-xs mt-2 block hover:underline">Download</a>
                                </div>
                            )}

                            {/* PDF Doc */}
                            {documents?.documentPdf && (
                                <div className="border p-4 rounded-lg text-center bg-blue-50 border-blue-200 print:hidden">
                                    <h3 className="text-sm font-bold text-blue-900 mb-2">Marksheets / Certs PDF</h3>
                                    <a 
                                        href={documents.documentPdf} 
                                        target="_blank" 
                                        className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm w-full justify-center"
                                    >
                                        <Download className="w-4 h-4 mr-2" /> View Document
                                    </a>
                                </div>
                            )}

                            {/* Dynamic Other Documents */}
                            {documents && Object.keys(documents).filter(k => k.startsWith('Other_')).length > 0 && (
                                <div className="border border-indigo-200 rounded-lg bg-indigo-50 p-3 break-inside-avoid shadow-sm mt-4">
                                    <h3 className="text-sm font-bold text-indigo-900 mb-3 border-b border-indigo-200 pb-2 uppercase tracking-wide">Additional Documents</h3>
                                    <div className="space-y-3">
                                        {Object.entries(documents)
                                            .filter(([k, _]) => k.startsWith('Other_'))
                                            .map(([key, url]: [string, any], idx) => {
                                                const docName = key.replace('Other_', '');
                                                return (
                                                    <div key={idx} className="bg-white p-3 rounded border border-indigo-100 flex flex-col shadow-sm">
                                                        <span className="text-sm font-bold text-gray-800 truncate block mb-2" title={docName}>{docName}</span>
                                                        <a 
                                                            href={url} 
                                                            target="_blank" 
                                                            className="print:hidden inline-flex items-center justify-center text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 px-3 py-2 rounded text-xs w-full transition-colors font-semibold"
                                                        >
                                                            <Download className="w-4 h-4 mr-1.5" /> View / Download
                                                        </a>
                                                        <span className="hidden print:block text-[10px] text-gray-500 italic mt-1">(Document available via portal online)</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                    
                    <div className="mt-12 pt-8 border-t-2 border-gray-200 text-center text-sm text-gray-500">
                        <p>This document is generated by Job Portal Janseva Kendra Portal for processing the student's application.</p>
                        <p>Employee Declaration: I will process this application accurately solely for {request.jobTitle}.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
