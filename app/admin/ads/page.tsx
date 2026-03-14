"use client";

import { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminAds() {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<any | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [targetUrl, setTargetUrl] = useState("");
    const [adText, setAdText] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [position, setPosition] = useState("header"); // header, footer, sidebar, apply_page
    const [isActive, setIsActive] = useState(true);
    const [existingImageUrl, setExistingImageUrl] = useState("");

    const fetchAds = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "ads"));
            const querySnapshot = await getDocs(q);
            const adData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAds(adData);
        } catch (error) {
            console.error("Error fetching ads:", error);
            toast.error("Failed to fetch ads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const openModal = (ad: any = null) => {
        if (ad) {
            setEditingAd(ad);
            setTitle(ad.title || "");
            setTargetUrl(ad.targetUrl || "");
            setAdText(ad.adText || "");
            setPosition(ad.position || "header");
            setIsActive(ad.isActive !== false);
            setExistingImageUrl(ad.imageUrl || "");
            setImageFile(null);
        } else {
            setEditingAd(null);
            setTitle("");
            setTargetUrl("");
            setAdText("");
            setPosition("header");
            setIsActive(true);
            setExistingImageUrl("");
            setImageFile(null);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const toastId = toast.loading("Saving Ad...");
        try {
            let finalImageUrl = existingImageUrl;
            
            // Upload Image if new
            if (imageFile) {
                const fileRef = ref(storage, `ads/${Date.now()}_${imageFile.name}`);
                await uploadBytes(fileRef, imageFile);
                finalImageUrl = await getDownloadURL(fileRef);
            }

            if (!finalImageUrl) {
                toast.error("Image is required", { id: toastId });
                return;
            }

            const adData = {
                title,
                targetUrl,
                adText,
                imageUrl: finalImageUrl,
                position,
                isActive,
                updatedAt: new Date(),
            };

            if (editingAd) {
                await updateDoc(doc(db, "ads", editingAd.id), adData);
                toast.success("Ad updated successfully", { id: toastId });
            } else {
                await addDoc(collection(db, "ads"), {
                    ...adData,
                    createdAt: new Date()
                });
                toast.success("Ad created successfully", { id: toastId });
            }
            setIsModalOpen(false);
            fetchAds();
        } catch (error) {
            console.error("Error saving ad:", error);
            toast.error("Failed to save ad", { id: toastId });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this advertisement?")) {
            try {
                await deleteDoc(doc(db, "ads", id));
                toast.success("Ad deleted successfully");
                fetchAds();
            } catch (error) {
                console.error("Error deleting ad:", error);
                toast.error("Failed to delete ad");
            }
        }
    };

    if (loading && ads.length === 0) {
        return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Advertisement Management</h1>
                    <p className="text-gray-500 mt-1">These ads will be hidden from premium users.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add New Ad
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map((ad) => (
                    <div key={ad.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border relative ${ad.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-lg p-1 flex space-x-1 shadow-sm z-10">
                            <button onClick={() => openModal(ad)} className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(ad.id)} className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        
                        <div className="h-40 bg-gray-100 relative w-full border-b flex items-center justify-center overflow-hidden group">
                            {ad.imageUrl ? (
                                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <ImageIcon className="w-10 h-10 text-gray-400" />
                            )}
                            {!ad.isActive && (
                                <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">INACTIVE</span>
                                </div>
                            )}
                        </div>

                        <div className="p-4">
                            <h3 className="text-lg font-bold text-gray-900 truncate mb-1" title={ad.title}>{ad.title || "Untitled Ad"}</h3>
                            {ad.adText && <p className="text-xs text-gray-500 mb-2 truncate">{ad.adText}</p>}
                            <div className="flex justify-between items-center mb-3">
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 uppercase outline outline-1 outline-indigo-200">
                                    POS: {ad.position}
                                </span>
                            </div>
                            <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block w-full">
                                {ad.targetUrl || "No Link Set"}
                            </a>
                        </div>
                    </div>
                ))}
                {ads.length === 0 && (
                    <div className="col-span-12 text-center text-gray-500 py-10">No advertisements added yet.</div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 m-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{editingAd ? 'Edit Ad' : 'Add New Ad'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-800"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ad Title / Reference Name</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. Hostinger Summer Sale" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Target URL (Link when clicked)</label>
                                <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="https://" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Optional Ad Text (Shown above image)</label>
                                <input type="text" value={adText} onChange={e => setAdText(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. Sponsored by Hostinger" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Image/Banner</label>
                                {existingImageUrl && !imageFile && (
                                    <div className="mb-2 w-full h-32 relative rounded border overflow-hidden">
                                        <img src={existingImageUrl} className="w-full h-full object-cover" alt="Preview" />
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={e => { if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]) }} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Display Position</label>
                                <select value={position} onChange={e => setPosition(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
                                    <option value="header">Header Banner (Top)</option>
                                    <option value="sidebar">Sidebar Ad</option>
                                    <option value="footer">Footer Area</option>
                                    <option value="apply_page">Apply Page (Middle)</option>
                                    <option value="job_top">Job Page (Top)</option>
                                    <option value="job_bottom">Job Page (Bottom)</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-2">
                                <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium">Ad is Active (Visible on site)</label>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-200 flex justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium mr-2 hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">Save Ad</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
