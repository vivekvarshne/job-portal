"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Loader2, Store, Users, FileText, Settings, XCircle, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function VendorsAdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");

    // Create Employee Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newEmployeeName, setNewEmployeeName] = useState("");
    const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
    const [newEmployeePassword, setNewEmployeePassword] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchUsersAndPlans = async () => {
        setLoading(true);
        try {
            // Fetch users
            const usersQ = query(collection(db, "users"));
            const usersSnapshot = await getDocs(usersQ);
            // Fetch requests to count how many forms each customer has applied for
            const reqQ = query(collection(db, "janseva_requests"));
            const reqSnap = await getDocs(reqQ);
            const customerCounts: Record<string, number> = {};
            reqSnap.docs.forEach(doc => {
                const data = doc.data();
                if (data.studentUid) {
                    customerCounts[data.studentUid] = (customerCounts[data.studentUid] || 0) + 1;
                }
            });

            const userData = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                if (data.role === 'customer') {
                    // Inject the aggregated count for customers
                    data.formsFilled = customerCounts[doc.id] || 0;
                }
                return { id: doc.id, ...data };
            });
            userData.sort((a: any, b: any) => (b.formsFilled || 0) - (a.formsFilled || 0));
            setUsers(userData);

            // Fetch plans
            const plansQ = query(collection(db, "plans"));
            const plansSnapshot = await getDocs(plansQ);
            setPlans(plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error loading data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersAndPlans();
    }, []);

    const handleAssignPlan = async () => {
        if (!selectedUserId || !selectedPlanId) return;
        const plan = plans.find(p => p.id === selectedPlanId);
        if (!plan) return;

        try {
            await updateDoc(doc(db, "users", selectedUserId), {
                subscriptionPlan: plan.price.toString(),
                formsAllowed: plan.formsAllowed,
                role: plan.role, // Upgrade potential
                formsFilled: 0,
                planExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // roughly 1 year
            });
            toast.success("Plan assigned successfully!");
            setAssignModalOpen(false);
            fetchUsersAndPlans();
        } catch (error) {
            console.error(error);
            toast.error("Failed to assign plan");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This removes their profile from the database.")) return;
        
        try {
            await deleteDoc(doc(db, "users", userId));
            toast.success("User deleted successfully!");
            fetchUsersAndPlans();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete user");
        }
    };

    const handleCreateEmployee = async () => {
        if (!newEmployeeName || !newEmployeeEmail || !newEmployeePassword) {
            toast.error("Please fill all fields");
            return;
        }
        setCreating(true);
        try {
            const res = await fetch("/api/admin/create-employee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newEmployeeName,
                    email: newEmployeeEmail,
                    password: newEmployeePassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Employee created successfully!");
                setCreateModalOpen(false);
                setNewEmployeeName("");
                setNewEmployeeEmail("");
                setNewEmployeePassword("");
                fetchUsersAndPlans();
            } else {
                toast.error(data.error || "Failed to create employee");
            }
        } catch (error: any) {
            toast.error("Error creating employee");
        } finally {
            setCreating(false);
        }
    };

    if (loading && users.length === 0) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;
    }

    // Stats
    const employeesOnly = users.filter(u => u.role === 'vendor');
    const totalEmployees = employeesOnly.length;
    const totalFormsFilled = employeesOnly.reduce((sum, v) => sum + (v.formsFilled || 0), 0);
    const totalStudents = users.filter(u => u.role === 'customer').length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-600">
                    User & Employee Management
                </h1>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" /> Create Employee
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm flex items-center">
                    <div className="rounded-full bg-blue-100 p-3 mr-4">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Registered Employees</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalEmployees}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm flex items-center">
                    <div className="rounded-full bg-green-100 p-3 mr-4">
                        <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Forms Processed</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalFormsFilled}</h3>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm flex items-center">
                    <div className="rounded-full bg-purple-100 p-3 mr-4">
                        <Store className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Registered Students</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalStudents}</h3>
                    </div>
                </div>
            </div>

            {/* Vendor List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800">All Users & Activity</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b">
                                <th className="px-6 py-4 font-medium">User Info & Type</th>
                                <th className="px-6 py-4 font-medium">Current Plan</th>
                                <th className="px-6 py-4 font-medium">Forms Limit</th>
                                <th className="px-6 py-4 font-medium">Usage Progress</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => {
                                const formsFilled = user.formsFilled || 0;
                                const formsAllowed = user.formsAllowed || 0;
                                const isUnlimited = formsAllowed === -1;
                                
                                // Calculate percentage
                                let percentage = 0;
                                if (!isUnlimited && formsAllowed > 0) {
                                    percentage = Math.min(100, Math.round((formsFilled / formsAllowed) * 100));
                                }

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="font-semibold text-gray-900">{user.name}</div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'vendor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {user.role === 'vendor' ? 'employee' : user.role}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                            {(user.phone || user.pan) && (
                                                <div className="text-xs text-gray-500 mt-2">
                                                    {user.phone && <><span className="font-semibold">Phone:</span> {user.phone} <br/></>}
                                                    {user.pan && <><span className="font-semibold">PAN:</span> {user.pan} <br/></>}
                                                    {user.aadhar && <><span className="font-semibold">Aadhar:</span> {user.aadhar} <br/></>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                ₹ {user.subscriptionPlan || "N/A"} Plan
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {isUnlimited ? "Unlimited" : formsAllowed} <br/>
                                            <span className="text-xs text-gray-500">Filled: {formsFilled}</span>
                                        </td>
                                        <td className="px-6 py-4 w-48">
                                            {isUnlimited ? (
                                                <span className="text-green-600 font-semibold text-sm flex items-center">
                                                    ∞ No Limits
                                                </span>
                                            ) : (
                                                <div className="w-full">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-500">{percentage}% Used</span>
                                                        <span className={formsAllowed - formsFilled <= 5 ? "text-red-500 font-bold" : "text-gray-500"}>
                                                            {formsAllowed - formsFilled} left
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedUserId(user.id);
                                                        setAssignModalOpen(true);
                                                    }}
                                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded text-xs font-semibold"
                                                >
                                                    Assign Plan
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Plan Modal */}
            {assignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Assign Plan to User</h3>
                            <button onClick={() => setAssignModalOpen(false)} className="text-gray-500 hover:text-gray-800"><XCircle className="w-6 h-6"/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Subscription Plan</label>
                                <select 
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2 border bg-gray-50"
                                    value={selectedPlanId}
                                    onChange={e => setSelectedPlanId(e.target.value)}
                                >
                                    <option value="" disabled>-- Select a Plan --</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (₹{p.price}) - {p.role}</option>
                                    ))}
                                </select>
                            </div>
                            <button 
                                onClick={handleAssignPlan}
                                className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
                            >
                                Apply Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Employee Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Create New Employee</h3>
                            <button onClick={() => setCreateModalOpen(false)} className="text-gray-500 hover:text-gray-800"><XCircle className="w-6 h-6"/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2 border bg-gray-50"
                                    placeholder="Employee name"
                                    value={newEmployeeName}
                                    onChange={e => setNewEmployeeName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2 border bg-gray-50"
                                    placeholder="employee@email.com"
                                    value={newEmployeeEmail}
                                    onChange={e => setNewEmployeeEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2 border bg-gray-50"
                                    placeholder="Min 6 characters"
                                    value={newEmployeePassword}
                                    onChange={e => setNewEmployeePassword(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleCreateEmployee}
                                disabled={creating}
                                className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {creating ? "Creating..." : "Create Employee"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
