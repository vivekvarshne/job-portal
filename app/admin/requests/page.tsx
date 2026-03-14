"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import { Loader2, FileText, CheckCircle2, Trash2, Download, User as UserIcon, Calendar, Briefcase, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
    const [assigning, setAssigning] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "janseva_requests"));
            const querySnapshot = await getDocs(q);
            const reqData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort by date descending
            reqData.sort((a: any, b: any) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateB.getTime() - dateA.getTime();
            });

            setRequests(reqData);

            // Fetch employees (users with role vendor)
            const usersQ = query(collection(db, "users"), where("role", "==", "vendor"));
            const usersSnapshot = await getDocs(usersQ);
            const empData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(empData);
        } catch (error) {
            console.error("Error fetching requests:", error);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const toggleSelect = (id: string) => {
        setSelectedRequests(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedRequests.size === requests.filter(r => r.status === "Pending").length) {
            setSelectedRequests(new Set());
        } else {
            setSelectedRequests(new Set(requests.filter(r => r.status === "Pending").map(r => r.id)));
        }
    };

    const handleAssignToEmployee = async () => {
        if (!selectedEmployeeId) {
            toast.error("Please select an employee first");
            return;
        }
        if (selectedRequests.size === 0) {
            toast.error("Please select at least one request");
            return;
        }

        setAssigning(true);
        try {
            const promises = Array.from(selectedRequests).map(reqId => {
                const reqRef = doc(db, "janseva_requests", reqId);
                return updateDoc(reqRef, {
                    status: "In Progress",
                    vendorId: selectedEmployeeId,
                    updatedAt: new Date()
                });
            });
            await Promise.all(promises);
            toast.success(`${selectedRequests.size} request(s) assigned successfully!`);
            setSelectedRequests(new Set());
            setSelectedEmployeeId("");
            fetchRequests();
        } catch (error) {
            console.error("Error assigning requests:", error);
            toast.error("Failed to assign requests");
        } finally {
            setAssigning(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this request?")) return;

        try {
            await deleteDoc(doc(db, "janseva_requests", id));
            toast.success("Request deleted!");
            fetchRequests();
        } catch (error) {
            console.error("Error deleting request:", error);
            toast.error("Failed to delete request");
        }
    };

    if (loading && requests.length === 0) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;
    }

    const pendingCount = requests.filter(r => r.status === "Pending").length;
    const inProgressCount = requests.filter(r => r.status === "In Progress").length;
    const completedCount = requests.filter(r => r.status === "Completed").length;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">All Janseva Kendra Requests</h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-yellow-700 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-200">
                        Pending: {pendingCount}
                    </span>
                    <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                        In Progress: {inProgressCount}
                    </span>
                    <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200">
                        Completed: {completedCount}
                    </span>
                </div>
            </div>

            {/* Assign to Employee Bar */}
            {pendingCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-800 font-semibold">
                        <Users className="w-5 h-5" />
                        <span>Assign Selected Forms to Employee:</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                        <select
                            className="flex-1 md:max-w-xs rounded-lg border-gray-300 shadow-sm p-2 border bg-white text-sm"
                            value={selectedEmployeeId}
                            onChange={e => setSelectedEmployeeId(e.target.value)}
                        >
                            <option value="" disabled>-- Select Employee --</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAssignToEmployee}
                            disabled={assigning || selectedRequests.size === 0 || !selectedEmployeeId}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm whitespace-nowrap"
                        >
                            {assigning ? "Assigning..." : `Assign ${selectedRequests.size} Selected`}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {requests.map((req) => (
                    <div key={req.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:border-blue-300 transition-colors ${selectedRequests.has(req.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-start space-x-4">
                                    {req.status === "Pending" && (
                                        <input
                                            type="checkbox"
                                            className="mt-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={selectedRequests.has(req.id)}
                                            onChange={() => toggleSelect(req.id)}
                                        />
                                    )}
                                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="text-xl font-bold text-gray-900 leading-tight">{req.jobTitle}</h3>
                                            {req.status === "Completed" ? (
                                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                                                </span>
                                            ) : req.status === "In Progress" ? (
                                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                    Working
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <span className="flex items-center"><UserIcon className="w-4 h-4 mr-1" /> {req.studentName} ({req.studentId})</span>
                                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {req.createdAt?.toDate?.() ? req.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        {req.vendorId && (
                                            <div className="mt-1 text-xs text-blue-600 font-medium">
                                                Assigned to: {employees.find(e => e.id === req.vendorId)?.name || req.vendorId}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={() => handleDelete(req.id)}
                                        className="flex items-center px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-semibold text-sm"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Student Info</h4>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-700"><span className="font-semibold">Email:</span> {req.studentEmail}</p>
                                        {req.formData && Object.entries(req.formData).map(([k, v]: [string, any]) => (
                                            <p key={k} className="text-sm text-gray-700 capitalize"><span className="font-semibold">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v)}</p>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Uploaded Documents</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {req.documents && Object.entries(req.documents).map(([name, url]: [string, any]) => (
                                            <a 
                                                key={name} 
                                                href={url} 
                                                target="_blank" 
                                                className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
                                            >
                                                <div className="p-2 bg-white rounded mr-3 border border-gray-200 group-hover:bg-blue-50">
                                                    <Download className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-gray-800 truncate mb-0.5">{name.replace('Other_', '')}</p>
                                                    <p className="text-[10px] text-gray-400">Click to view/download</p>
                                                </div>
                                            </a>
                                        ))}
                                        {(!req.documents || Object.keys(req.documents).length === 0) && (
                                            <p className="text-sm text-gray-400 italic">No documents uploaded.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {requests.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-600">No active Janseva Requests</h2>
                        <p className="text-gray-400 mt-2">When students apply for jobs through employees, they will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
