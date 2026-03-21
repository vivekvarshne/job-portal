"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2, Settings, Save, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface LinkItem {
    title: string;
    url: string;
}

interface FeaturedBox {
    title: string;
    url: string;
    color: string;
}

export default function AdminSettings() {
    const [importantLinks, setImportantLinks] = useState<LinkItem[]>([]);
    const [breakingNews, setBreakingNews] = useState<LinkItem[]>([]);
    const [featuredBoxes, setFeaturedBoxes] = useState<FeaturedBox[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Fetch site content (Links, News)
                const siteDoc = await getDoc(doc(db, "settings", "site"));
                if (siteDoc.exists()) {
                    setImportantLinks(siteDoc.data().importantLinks || []);
                    setBreakingNews(siteDoc.data().breakingNews || []);
                    setFeaturedBoxes(siteDoc.data().featuredBoxes || []);
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
            await setDoc(doc(db, "settings", "site"), {
                importantLinks,
                breakingNews,
                featuredBoxes,
                updatedAt: new Date()
            }, { merge: true });

            toast.success("Settings saved successfully!");
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const addLink = (setter: any) => {
        setter((prev: LinkItem[]) => [...prev, { title: "", url: "" }]);
    };

    const updateLink = (setter: any, index: number, field: keyof LinkItem, value: string) => {
        setter((prev: LinkItem[]) => {
            const newArray = [...prev];
            newArray[index] = { ...newArray[index], [field]: value };
            return newArray;
        });
    };

    const removeLink = (setter: any, index: number) => {
        setter((prev: LinkItem[]) => prev.filter((_, i) => i !== index));
    };

    if (loading) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-900" /></div>;

    const renderLinkList = (title: string, items: LinkItem[], setter: any) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                <button
                    onClick={() => addLink(setter)}
                    className="flex items-center text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 font-medium"
                >
                    <Plus className="w-4 h-4 mr-1" /> Add New
                </button>
            </div>
            
            {items.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No items added yet. Click "Add New" to add.</p>
            ) : (
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded border">
                            <input 
                                type="text"
                                placeholder="Title (e.g. UP Scholarship)"
                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm w-full"
                                value={item.title}
                                onChange={(e) => updateLink(setter, index, "title", e.target.value)}
                            />
                            <input 
                                type="url"
                                placeholder="URL (e.g. https://...)"
                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm w-full"
                                value={item.url}
                                onChange={(e) => updateLink(setter, index, "url", e.target.value)}
                            />
                            <button
                                onClick={() => removeLink(setter, index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded bg-white border border-red-100 self-end sm:self-auto"
                                title="Remove"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-blue-600" /> Admin Settings
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* Janseva Kendra setting removed - now per-job */}
                </div>

                <div className="space-y-6">
                    {renderLinkList("Breaking News", breakingNews, setBreakingNews)}
                    {renderLinkList("Important Links", importantLinks, setImportantLinks)}
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-lg font-bold text-gray-800">Featured Boxes (Home Page)</h2>
                            <button
                                onClick={() => setFeaturedBoxes([...featuredBoxes, { title: "", url: "", color: "#ff0000" }])}
                                className="flex items-center text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-200 font-medium"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Box
                            </button>
                        </div>
                        <div className="space-y-4">
                            {featuredBoxes.map((box, index) => (
                                <div key={index} className="space-y-2 p-3 bg-gray-50 rounded border">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            placeholder="Box Title"
                                            className="flex-1 p-2 border rounded text-sm"
                                            value={box.title}
                                            onChange={(e) => {
                                                const newBoxes = [...featuredBoxes];
                                                newBoxes[index].title = e.target.value;
                                                setFeaturedBoxes(newBoxes);
                                            }}
                                        />
                                        <input 
                                            type="color"
                                            className="w-10 h-10 p-1 border rounded cursor-pointer"
                                            value={box.color}
                                            onChange={(e) => {
                                                const newBoxes = [...featuredBoxes];
                                                newBoxes[index].color = e.target.value;
                                                setFeaturedBoxes(newBoxes);
                                            }}
                                        />
                                        <button
                                            onClick={() => setFeaturedBoxes(featuredBoxes.filter((_, i) => i !== index))}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <input 
                                        type="url"
                                        placeholder="Target URL"
                                        className="w-full p-2 border rounded text-sm"
                                        value={box.url}
                                        onChange={(e) => {
                                            const newBoxes = [...featuredBoxes];
                                            newBoxes[index].url = e.target.value;
                                            setFeaturedBoxes(newBoxes);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center disabled:opacity-50"
            >
                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="w-5 h-5 mr-2" /> Save Form Properties</>}
            </button>
        </div>
    );
}
