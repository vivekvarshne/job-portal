"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, FileText, CheckCircle, Clock, ExternalLink } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdBanner from "@/components/AdBanner";

export default function CustomerDashboard() {
    const [user, setUser] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formCompleted, setFormCompleted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            auth.onAuthStateChanged(async (currentUser) => {
                if (!currentUser) {
                    router.push("/auth/customer/login");
                    return;
                }

                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (!userDoc.exists() || userDoc.data().role !== "customer") {
                        router.push("/");
                        return;
                    }

                    const userData: any = { uid: currentUser.uid, ...userDoc.data() };
                    setUser(userData);
                    setFormCompleted(userDoc.data().formCompleted === true);

                    // Generate student ID if missing
                    if (!userDoc.data().studentId) {
                        const { updateDoc } = await import("firebase/firestore");
                        const studentId = "STU" + currentUser.uid.substring(0, 6).toUpperCase();
                        await updateDoc(doc(db, "users", currentUser.uid), { studentId });
                        userData.studentId = studentId;
                    }

                    // Fetch applications
                    const q = query(
                        collection(db, "janseva_requests"),
                        where("studentUid", "==", currentUser.uid)
                    );
                    const snapshot = await getDocs(q);
                    const apps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    apps.sort((a: any, b: any) => b.createdAt.toMillis() - a.createdAt.toMillis());
                    setApplications(apps);
                } catch (error) {
                    console.error("Error loading dashboard:", error);
                } finally {
                    setLoading(false);
                }
            });
        };
        fetchData();
    }, [router]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 space-y-8">

                {/* Welcome */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || "Student"}</h1>
                    <p className="text-gray-500 mt-1">Student ID: <span className="font-mono font-bold text-blue-800">{user?.studentId}</span></p>
                </div>

                {/* Ads - hide if form completed */}
                {!formCompleted && <AdBanner position="dashboard_top" />}

                {/* Completed Banner */}
                {formCompleted && (
                    <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-start space-x-4">
                        <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-lg font-bold text-green-900">Your Form Has Been Processed!</h2>
                            <p className="text-green-700 mt-1">Your Janseva Kendra application has been completed by our employee. You can view details below.</p>
                        </div>
                    </div>
                )}

                {/* Applications List */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">Your Applications</h2>
                    </div>

                    {applications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">No applications yet.</p>
                            <p className="text-sm mt-1">Browse jobs and apply through Janseva Kendra to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Job Title</th>
                                        <th className="px-6 py-4">Date Applied</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Total Charge</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => (
                                        <tr key={app.id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{app.jobTitle}</td>
                                            <td className="px-6 py-4 text-center">{app.createdAt?.toDate?.() ? app.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-4 text-center">
                                                {app.status === "Completed" ? (
                                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded inline-flex items-center">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Completed
                                                    </span>
                                                ) : app.status === "In Progress" ? (
                                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded inline-flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" /> In Progress
                                                    </span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded inline-flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-900">₹{app.totalCharge || 0}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Link 
                                                    href={`/job/${app.jobSlug}`}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center"
                                                >
                                                    View Job <ExternalLink className="w-3 h-3 ml-1" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Ads at bottom - hide if completed */}
                {!formCompleted && <AdBanner position="dashboard_bottom" />}
            </main>
            <Footer />
        </div>
    );
}
