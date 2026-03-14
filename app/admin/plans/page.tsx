"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPlans() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [originalPrice, setOriginalPrice] = useState<number>(0);
    const [role, setRole] = useState("vendor");
    const [formsAllowed, setFormsAllowed] = useState<number>(-1);
    const [features, setFeatures] = useState("");
    const [isActive, setIsActive] = useState(true);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "plans"));
            const querySnapshot = await getDocs(q);
            const planData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            // Sort by price
            planData.sort((a: any, b: any) => a.price - b.price);
            setPlans(planData);
        } catch (error) {
            console.error("Error fetching plans:", error);
            toast.error("Failed to fetch plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const openModal = (plan: any = null) => {
        if (plan) {
            setEditingPlan(plan);
            setName(plan.name);
            setPrice(plan.price);
            setOriginalPrice(plan.originalPrice || 0);
            setRole(plan.role || "vendor");
            setFormsAllowed(plan.formsAllowed);
            setFeatures(plan.features?.join("\n") || "");
            setIsActive(plan.isActive !== false);
        } else {
            setEditingPlan(null);
            setName("");
            setPrice(0);
            setOriginalPrice(0);
            setRole("vendor");
            setFormsAllowed(50);
            setFeatures("");
            setIsActive(true);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const featuresArray = features.split("\n").filter(f => f.trim() !== "");
        
        const planData = {
            name,
            price: Number(price),
            originalPrice: Number(originalPrice),
            role,
            formsAllowed: Number(formsAllowed),
            features: featuresArray,
            isActive,
            updatedAt: new Date(),
        };

        try {
            if (editingPlan) {
                await updateDoc(doc(db, "plans", editingPlan.id), planData);
                toast.success("Plan updated successfully");
            } else {
                await addDoc(collection(db, "plans"), {
                    ...planData,
                    createdAt: new Date()
                });
                toast.success("Plan created successfully");
            }
            setIsModalOpen(false);
            fetchPlans();
        } catch (error) {
            console.error("Error saving plan:", error);
            toast.error("Failed to save plan");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this plan? This cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "plans", id));
                toast.success("Plan deleted successfully");
                fetchPlans();
            } catch (error) {
                console.error("Error deleting plan:", error);
                toast.error("Failed to delete plan");
            }
        }
    };

    if (loading && plans.length === 0) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" /> Create New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className={`bg-white rounded-xl border-t-4 shadow-sm p-6 relative ${plan.isActive ? (plan.role === 'vendor' ? 'border-blue-500' : 'border-purple-500') : 'border-gray-300 opacity-75'}`}>
                        <div className="absolute top-4 right-4 flex space-x-2">
                            <button onClick={() => openModal(plan)} className="text-gray-500 hover:text-blue-600"><Edit className="w-5 h-5" /></button>
                            <button onClick={() => handleDelete(plan.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        <div className="mb-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${plan.role === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                {plan.role === 'vendor' ? 'EMPLOYEE' : plan.role.toUpperCase()}
                            </span>
                            {!plan.isActive && <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">INACTIVE</span>}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <div className="flex items-baseline mb-4">
                            <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                            {plan.originalPrice > plan.price && (
                                <span className="ml-2 text-lg text-gray-500 line-through">₹{plan.originalPrice}</span>
                            )}
                        </div>
                        <div className="text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded">
                            <span className="font-semibold">Forms Allowed: </span> 
                            {plan.formsAllowed === -1 ? "Unlimited" : plan.formsAllowed}
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700">
                            {plan.features?.map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                {plans.length === 0 && (
                    <div className="col-span-12 text-center text-gray-500 py-10">No plans created yet.</div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 m-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" placeholder="e.g. Basic Vendor Plan" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Selling Price (₹)</label>
                                    <input type="number" required min="0" value={price} onChange={e => setPrice(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Original Price (₹)</label>
                                    <input type="number" min="0" value={originalPrice} onChange={e => setOriginalPrice(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. 999 (for strikethrough)" />
                                    <p className="text-xs text-gray-500 mt-1">Leave 0 if no discount</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                                    <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
                                        <option value="vendor">Employee (Janseva)</option>
                                        <option value="student">Student (Premium)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Forms Allowed</label>
                                    <input type="number" required min="-1" value={formsAllowed} onChange={e => setFormsAllowed(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. 50" />
                                    <p className="text-xs text-gray-500 mt-1">Use -1 for Unlimited</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Features List (One per line)</label>
                                <textarea rows={4} value={features} onChange={e => setFeatures(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="- Fast processing\n- Premium support\n..." />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Plan is Active (Visible to users)</label>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-200 flex justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium mr-2 hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Save Plan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
