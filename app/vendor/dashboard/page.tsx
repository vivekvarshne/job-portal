"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, FileText, CheckCircle, Clock, Printer } from "lucide-react";
import Header from "@/components/layout/Header";

export default function VendorDashboard() {
    const [vendor, setVendor] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchDashboardData = async () => {
            auth.onAuthStateChanged(async (currentUser) => {
                if (!currentUser) {
                    router.push("/auth/vendor/login");
                    return;
                }

                try {
                    // Get Employee Document
                    const vendorDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (!vendorDoc.exists() || vendorDoc.data().role !== "vendor") {
                        toast.error("Unauthorized access.");
                        router.push("/");
                        return;
                    }
                    const vData: any = { uid: currentUser.uid, ...vendorDoc.data() };
                    setVendor(vData);

                    // Fetch only requests assigned to this employee
                    const reqsRef = collection(db, "janseva_requests");
                    const assignedQuery = query(reqsRef, where("vendorId", "==", currentUser.uid));
                    const snapshot = await getDocs(assignedQuery);
                    const assignedReqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                    
                    assignedReqs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

                    setRequests(assignedReqs);
                } catch (error) {
                    console.error("Dashboard error:", error);
                } finally {
                    setLoading(false);
                }
            });
        };
        fetchDashboardData();
    }, [router]);

    const handleMarkDone = async (requestId: string) => {
        try {
            const reqRef = doc(db, "janseva_requests", requestId);
            await updateDoc(reqRef, {
                status: "Completed",
                updatedAt: new Date()
            });

            // Update customer's formCompleted flag
            const req = requests.find(r => r.id === requestId);
            if (req?.studentUid) {
                const customerRef = doc(db, "users", req.studentUid);
                await updateDoc(customerRef, {
                    formCompleted: true
                });
            }

            toast.success("Request marked as Completed!");
            
            // Update local state
            setRequests((prev: any) => prev.map((r: any) => r.id === requestId ? { ...r, status: "Completed" } : r));
            
        } catch (error: any) {
            toast.error("Error updating status.");
            console.error(error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;

    const completedCount = requests.filter(r => r.status === "Completed").length;
    const inProgressCount = requests.filter(r => r.status === "In Progress").length;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">

                {/* Dashboard Header */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 shrink-0">Welcome, {vendor.name} (Employee)</h1>
                        <p className="text-gray-500 mt-1">Manage your assigned job applications here.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-4">
                        <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg border border-blue-100">
                            In Progress: <span className="font-bold">{inProgressCount}</span>
                        </div>
                        <div className="bg-green-50 text-green-800 px-4 py-2 rounded-lg border border-green-100">
                            Completed: <span className="font-bold">{completedCount}</span>
                        </div>
                    </div>
                </div>

                {/* Request List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">Your Assigned Requests</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4">Student ID</th>
                                    <th className="px-6 py-4">Student Name</th>
                                    <th className="px-6 py-4">Applying For</th>
                                    <th className="px-6 py-4">Date Submitted</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No requests assigned to you yet. Admin will assign form requests.</td></tr>
                                ) : (
                                    requests.map(req => (
                                        <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-gray-700">
                                                {req.studentId || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {req.formData?.fullName || req.studentName}
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.jobTitle}
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(req.createdAt.toDate()).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.status === "Completed" ? (
                                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center w-max">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Completed
                                                    </span>
                                                ) : (
                                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center w-max">
                                                        <Clock className="w-3 h-3 mr-1" /> {req.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center space-x-2">
                                                {req.status === "In Progress" ? (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <Link 
                                                            href={`/vendor/request/${req.id}`}
                                                            className="inline-flex items-center text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-xs px-3 py-2"
                                                        >
                                                            <Printer className="w-3 h-3 mr-1" /> View/Print
                                                        </Link>
                                                        <button 
                                                            onClick={() => handleMarkDone(req.id)}
                                                            className="text-white bg-green-700 hover:bg-green-800 font-bold rounded-lg text-xs px-4 py-2"
                                                        >
                                                            Mark Done
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Link 
                                                        href={`/vendor/request/${req.id}`}
                                                        className="inline-flex items-center text-white bg-gray-600 hover:bg-gray-700 font-medium rounded-lg text-xs px-4 py-2 mx-auto"
                                                    >
                                                        <FileText className="w-3 h-3 mr-1" /> View Details
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
