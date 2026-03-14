"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2, Settings, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettings() {
    const [formFillingCharge, setFormFillingCharge] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "settings", "charges");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormFillingCharge(docSnap.data().formFillingCharge || 0);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "settings", "charges"), {
                formFillingCharge: Number(formFillingCharge),
                updatedAt: new Date()
            }, { merge: true });
            toast.success("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;

    return (
        <div className="space-y-6 max-w-xl">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-blue-600" /> Admin Settings
            </h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Janseva Kendra Charges</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Form Filling Base Charge (₹)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            This amount will be added to each job's application fee when a student submits via Janseva Kendra.
                        </p>
                        <input
                            type="number"
                            min="0"
                            className="w-full p-3 border rounded-lg bg-gray-50 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formFillingCharge}
                            onChange={e => setFormFillingCharge(Number(e.target.value))}
                        />
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="w-5 h-5 mr-2" /> Save Settings</>}
                </button>
            </div>
        </div>
    );
}
