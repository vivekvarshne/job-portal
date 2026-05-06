"use client";

import { useState } from "react";
import { addJob, Job } from "@/lib/db/jobs";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import {
    Plus,
    Trash2,
    Upload,
    Save,
    ArrowLeft,
    Loader2,
    Info,
    Calendar as CalendarIcon,
    Tag,
    Search as SeoIcon,
    FileText,
    Link as LinkIcon,
    ChevronUp,
    ChevronDown,
    Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

export default function NewJob() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [posterFile, setPosterFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "" as any,
        department: "",
        importantDates: {
            start: "",
            end: "",
            examDate: "",
            resultDate: "",
            customDates: [] as { label: string; date: string }[]
        },
        applicationFee: "",
        categoryFees: [
            { category: "General", fee: "0" },
            { category: "OBC", fee: "0" },
            { category: "SC/ST", fee: "0" },
        ] as { category: string; fee: string | number }[],
        ageLimit: "",
        totalPosts: "",
        vacancyDetails: [
            { postName: "", totalPost: 0, eligibility: "" }
        ],
        applyLink: "",
        pdfUrl: "",
        formFee: 0,
        originalFormFee: 0,
        seoTitle: "",
        seoDescription: "",
        shortDescription: "",
        requiredDocuments: [] as string[],
        externalLinks: [{ title: "Official Apply Link", url: "" }] as { title: string; url: string }[],
        sidebarLinks: [] as { title: string; url: string }[],
        status: "published" as "published" | "draft",
        contentSections: [] as Job["contentSections"],
        posterUrl: "",
        showFormFillingHelp: true
    });

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".") as [keyof typeof formData, string];
            setFormData(prev => ({
                ...prev,
                [parent]: { ...(prev[parent] as object), [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));

            // Auto-generate slug from title
            if (name === "title") {
                setFormData(prev => ({
                    ...prev,
                    slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
                }));
            }
        }
    };

    const addVacancyRow = () => {
        setFormData(prev => ({
            ...prev,
            vacancyDetails: [...prev.vacancyDetails, { postName: "", totalPost: 0, eligibility: "" }]
        }));
    };

    const removeVacancyRow = (index: number) => {
        setFormData(prev => ({
            ...prev,
            vacancyDetails: prev.vacancyDetails.filter((_, i) => i !== index)
        }));
    };

    const handleVacancyChange = (index: number, field: string, value: any) => {
        const updated = [...formData.vacancyDetails];
        (updated[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, vacancyDetails: updated }));
    };

    const addRequirement = () => {
        setFormData(prev => ({
            ...prev,
            requiredDocuments: [...prev.requiredDocuments, ""]
        }));
    };

    const removeRequirement = (index: number) => {
        setFormData(prev => ({
            ...prev,
            requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index)
        }));
    };

    const handleRequirementChange = (idx: number, value: string) => {
        const newReqs = [...formData.requiredDocuments];
        newReqs[idx] = value;
        setFormData({ ...formData, requiredDocuments: newReqs });
    };

    const handleAddLink = () => {
        setFormData({
            ...formData,
            externalLinks: [...formData.externalLinks, { title: "", url: "" }]
        });
    };

    const handleRemoveLink = (idx: number) => {
        const newLinks = formData.externalLinks.filter((_, i) => i !== idx);
        setFormData({ ...formData, externalLinks: newLinks });
    };

    const moveLinkUp = (idx: number) => {
        if (idx === 0) return;
        setFormData(prev => {
            const newLinks = [...prev.externalLinks];
            [newLinks[idx - 1], newLinks[idx]] = [newLinks[idx], newLinks[idx - 1]];
            return { ...prev, externalLinks: newLinks };
        });
    };

    const moveLinkDown = (idx: number) => {
        setFormData(prev => {
            if (idx === prev.externalLinks.length - 1) return prev;
            const newLinks = [...prev.externalLinks];
            [newLinks[idx + 1], newLinks[idx]] = [newLinks[idx], newLinks[idx + 1]];
            return { ...prev, externalLinks: newLinks };
        });
    };

    const handleLinkChange = (idx: number, field: 'title' | 'url', value: string) => {
        const newLinks = [...formData.externalLinks];
        newLinks[idx] = { ...newLinks[idx], [field]: value };
        setFormData({ ...formData, externalLinks: newLinks });
    };

    const handleAddSidebarLink = () => {
        setFormData({
            ...formData,
            sidebarLinks: [...formData.sidebarLinks, { title: "", url: "" }]
        });
    };

    const handleRemoveSidebarLink = (idx: number) => {
        const newLinks = formData.sidebarLinks.filter((_, i) => i !== idx);
        setFormData({ ...formData, sidebarLinks: newLinks });
    };

    const moveSidebarLinkUp = (idx: number) => {
        if (idx === 0) return;
        setFormData(prev => {
            const newLinks = [...prev.sidebarLinks];
            [newLinks[idx - 1], newLinks[idx]] = [newLinks[idx], newLinks[idx - 1]];
            return { ...prev, sidebarLinks: newLinks };
        });
    };

    const moveSidebarLinkDown = (idx: number) => {
        setFormData(prev => {
            if (idx === prev.sidebarLinks.length - 1) return prev;
            const newLinks = [...prev.sidebarLinks];
            [newLinks[idx + 1], newLinks[idx]] = [newLinks[idx], newLinks[idx + 1]];
            return { ...prev, sidebarLinks: newLinks };
        });
    };

    const handleSidebarLinkChange = (idx: number, field: 'title' | 'url', value: string) => {
        const newLinks = [...formData.sidebarLinks];
        newLinks[idx] = { ...newLinks[idx], [field]: value };
        setFormData({ ...formData, sidebarLinks: newLinks });
    };

    const addCustomDate = () => {
        setFormData(prev => ({
            ...prev,
            importantDates: {
                ...prev.importantDates,
                customDates: [...(prev.importantDates.customDates || []), { label: "", date: "" }]
            }
        }));
    };

    const removeCustomDate = (index: number) => {
        setFormData(prev => ({
            ...prev,
            importantDates: {
                ...prev.importantDates,
                customDates: prev.importantDates.customDates.filter((_, i) => i !== index)
            }
        }));
    };

    const handleCustomDateChange = (index: number, field: 'label' | 'date', value: string) => {
        const updated = [...formData.importantDates.customDates];
        updated[index][field] = value;
        setFormData(prev => ({
            ...prev,
            importantDates: {
                ...prev.importantDates,
                customDates: updated
            }
        }));
    };

    const addSection = (type: "table" | "bullets" | "rich-text") => {
        const newSection: any = {
            id: Date.now().toString(),
            title: "",
            type,
        };

        if (type === "table") {
            newSection.tableData = { headers: ["Column 1", "Column 2"], rows: [{ cells: ["", ""] }] };
        } else if (type === "bullets") {
            newSection.listData = [""];
        } else if (type === "rich-text") {
            newSection.textData = "";
        }

        setFormData(prev => ({
            ...prev,
            contentSections: [...(prev.contentSections || []), newSection]
        }));
    };

    const removeSection = (id: string) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.filter(s => s.id !== id)
        }));
    };

    const updateSection = (id: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const addTableRow = (sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.tableData) {
                    const newRow = new Array(s.tableData.headers.length).fill("");
                    return { ...s, tableData: { ...s.tableData, rows: [...s.tableData.rows, { cells: newRow }] } };
                }
                return s;
            })
        }));
    };

    const removeTableRow = (sectionId: string, rowIndex: number) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.tableData) {
                    return { ...s, tableData: { ...s.tableData, rows: s.tableData.rows.filter((_, i) => i !== rowIndex) } };
                }
                return s;
            })
        }));
    };

    const updateTableCell = (sectionId: string, rowIndex: number, colIndex: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.tableData) {
                    const newRows = [...s.tableData.rows];
                    newRows[rowIndex] = { cells: [...newRows[rowIndex].cells] };
                    newRows[rowIndex].cells[colIndex] = value;
                    return { ...s, tableData: { ...s.tableData, rows: newRows } };
                }
                return s;
            })
        }));
    };

    const addTableHeader = (sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.tableData) {
                    const newHeaders = [...s.tableData.headers, `Column ${s.tableData.headers.length + 1}`];
                    const newRows = s.tableData.rows.map(row => ({ cells: [...row.cells, ""] }));
                    return { ...s, tableData: { headers: newHeaders, rows: newRows } };
                }
                return s;
            })
        }));
    };

    const removeTableHeader = (sectionId: string, colIndex: number) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.tableData && s.tableData.headers.length > 1) {
                    const newHeaders = s.tableData.headers.filter((_, i) => i !== colIndex);
                    const newRows = s.tableData.rows.map(row => ({ cells: row.cells.filter((_, i) => i !== colIndex) }));
                    return { ...s, tableData: { headers: newHeaders, rows: newRows } };
                }
                return s;
            })
        }));
    };

    const updateTableHeader = (sectionId: string, colIndex: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.tableData) {
                    const newHeaders = [...s.tableData.headers];
                    newHeaders[colIndex] = value;
                    return { ...s, tableData: { ...s.tableData, headers: newHeaders } };
                }
                return s;
            })
        }));
    };

    const addListItem = (sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.listData) {
                    return { ...s, listData: [...s.listData, ""] };
                }
                return s;
            })
        }));
    };

    const removeListItem = (sectionId: string, index: number) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.listData) {
                    return { ...s, listData: s.listData.filter((_, i) => i !== index) };
                }
                return s;
            })
        }));
    };

    const updateListItem = (sectionId: string, index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            contentSections: prev.contentSections?.map(s => {
                if (s.id === sectionId && s.listData) {
                    const newList = [...s.listData];
                    newList[index] = value;
                    return { ...s, listData: newList };
                }
                return s;
            })
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.category) {
            toast.error("Please select a category!");
            return;
        }

        setLoading(true);

        try {
            // PDF upload logic removed as pdfUrl is now a direct input
            // let pdfUrl = "";
            // if (pdfFile) {
            //     const fileRef = ref(storage, `notifications/${Date.now()}_${pdfFile.name}`);
            //     const snapshot = await uploadBytes(fileRef, pdfFile);
            //     pdfUrl = await getDownloadURL(snapshot.ref);
            // }

            const jobData: any = { ...formData };

            // Upload Poster Image if selected
            if (posterFile) {
                const posterRef = ref(storage, `job-posters/${Date.now()}_${posterFile.name}`);
                await uploadBytes(posterRef, posterFile);
                jobData.posterUrl = await getDownloadURL(posterRef);
            }

            // Auto-generate applicationFee text from category fees
            jobData.applicationFee = formData.categoryFees
                .filter(cf => cf.category)
                .map(cf => `${cf.category}: ₹${cf.fee}`)
                .join('\n');

            await addJob(jobData);

            toast.success("Job Published Successfully!");
            router.push("/admin/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to add job.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <Toaster position="top-right" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/dashboard" className="p-2 bg-white rounded-lg border hover:bg-gray-50">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Job Notification</h1>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        className="bg-white border rounded-lg px-3 py-2 text-sm font-medium outline-none"
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-2 text-blue-900 font-bold border-b pb-2 mb-4">
                        <Info className="h-5 w-5" />
                        <h2 className="uppercase">General Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title / Heading</label>
                            <input
                                type="text"
                                required
                                name="title"
                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Post Name"
                                value={formData.title}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                            <input
                                type="text"
                                required
                                name="slug"
                                className="w-full p-2.5 border rounded-lg bg-gray-50"
                                value={formData.slug}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                required
                                className="w-full p-2.5 border rounded-lg outline-none"
                                value={formData.category}
                                onChange={handleInputChange}
                            >
                                <option value="" disabled>-- Select Category --</option>
                                <option value="latest-jobs">Latest Jobs</option>
                                <option value="admit-card">Admit Card</option>
                                <option value="result">Result</option>
                                <option value="answer-key">Answer Key</option>
                                <option value="syllabus">Syllabus</option>
                                <option value="admission">Admission</option>
                                <option value="documents">Documents</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department / Organization Name</label>
                            <input
                                type="text"
                                required
                                name="department"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="e.g. Staff Selection Commission (SSC)"
                                value={formData.department}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (Displays in a prominent box at the top of the post)</label>
                            <textarea
                                name="shortDescription"
                                rows={3}
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="Briefly describe the job or result (You can use basic HTML for links, e.g., <a href='url' class='text-blue-600 underline font-bold'>Link Text</a>)"
                                value={formData.shortDescription}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Official Notification PDF URL (Optional)</label>
                            <input
                                type="text"
                                name="pdfUrl"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="Download URL for PDF"
                                value={formData.pdfUrl}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </section>

                {/* Janseva Form Fee */}
                <section className="bg-green-50 p-6 rounded-2xl border border-green-100 space-y-4">
                    <h2 className="text-sm font-bold text-green-900 uppercase underline">Janseva Kendra Form Properties</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-green-700 mb-1 uppercase">Actual Price (₹) — What student pays</label>
                            <input
                                type="number"
                                min="0"
                                name="formFee"
                                className="w-full p-2.5 border rounded-lg font-bold text-green-900"
                                placeholder="e.g. 100"
                                value={formData.formFee}
                                onChange={(e) => setFormData(prev => ({ ...prev, formFee: Number(e.target.value) }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-red-700 mb-1 uppercase">Original Price (₹) — For strikethrough cut</label>
                            <input
                                type="number"
                                min="0"
                                name="originalFormFee"
                                className="w-full p-2.5 border rounded-lg text-gray-500"
                                placeholder="e.g. 200"
                                value={formData.originalFormFee}
                                onChange={(e) => setFormData(prev => ({ ...prev, originalFormFee: Number(e.target.value) }))}
                            />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-between mt-2 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1">Show Janseva Kendra Form Button</label>
                                <p className="text-xs text-gray-500">Toggle this to show or hide the "Form Filling Help" button on this job post.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.showFormFillingHelp !== false}
                                    onChange={(e) => setFormData(prev => ({ ...prev, showFormFillingHelp: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>
                    </div>
                    <p className="text-[10px] text-green-600 italic">This will show as <span className="line-through text-red-400">₹{formData.originalFormFee || 200}</span> ₹{formData.formFee || 100} on the application form.</p>
                </section>

                {/* Important Dates */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-2 text-red-700 font-bold border-b pb-2 mb-4">
                        <CalendarIcon className="h-5 w-5" />
                        <h2 className="uppercase">Important Dates</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Application Start Date</label>
                            <input
                                type="text"
                                name="importantDates.start"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="01/01/2026 or Notified Soon"
                                value={formData.importantDates.start}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Date to Apply</label>
                            <input
                                type="text"
                                name="importantDates.end"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="31/01/2026 or To Be Announced"
                                value={formData.importantDates.end}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date (Optional)</label>
                            <input
                                type="text"
                                name="importantDates.examDate"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="As per Schedule"
                                value={formData.importantDates.examDate}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Result Date (Optional)</label>
                            <input
                                type="text"
                                name="importantDates.resultDate"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="Notified Soon"
                                value={formData.importantDates.resultDate}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    {/* Custom Dates */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase">Other Important Dates</h3>
                            <button
                                type="button"
                                onClick={addCustomDate}
                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center font-bold hover:bg-blue-100 border border-blue-100"
                            >
                                <Plus className="h-4 w-4 mr-1" /> ADD DATE
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.importantDates.customDates.map((cd, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded-lg text-sm"
                                            placeholder="Label (e.g. Mains Exam Date)"
                                            value={cd.label}
                                            onChange={(e) => handleCustomDateChange(idx, 'label', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded-lg text-sm"
                                            placeholder="Date (e.g. 25/08/2026)"
                                            value={cd.date}
                                            onChange={(e) => handleCustomDateChange(idx, 'date', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeCustomDate(idx)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {formData.importantDates.customDates.length === 0 && (
                                <p className="text-xs text-gray-400 italic text-center">No additional dates added. Click "Add Date" to include more.</p>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-gray-900 uppercase">Application Fee (Category Wise)</h2>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                    ...prev, 
                                    categoryFees: [...prev.categoryFees, { category: "", fee: 0 }]
                                }))}
                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center font-bold hover:bg-blue-100 border border-blue-100"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add Category
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.categoryFees.map((cf, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                        placeholder="Category name (e.g. General)"
                                        value={cf.category}
                                        onChange={(e) => {
                                            const updated = [...formData.categoryFees];
                                            updated[idx].category = e.target.value;
                                            setFormData(prev => ({ ...prev, categoryFees: updated }));
                                        }}
                                    />
                                    <div className="flex items-center">
                                        <span className="text-gray-500 font-bold mr-1">₹</span>
                                        <input
                                            type="text"
                                            className="w-24 p-2 border rounded-lg text-sm text-center font-bold"
                                            placeholder="0"
                                            value={cf.fee}
                                            onChange={(e) => {
                                                const updated = [...formData.categoryFees];
                                                updated[idx].fee = e.target.value;
                                                setFormData(prev => ({ ...prev, categoryFees: updated }));
                                            }}
                                        />
                                    </div>
                                    {formData.categoryFees.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    categoryFees: prev.categoryFees.filter((_, i) => i !== idx)
                                                }));
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 uppercase mb-2">Age Limit</h2>
                                <textarea
                                    name="ageLimit"
                                    rows={3}
                                    className="w-full p-2.5 border rounded-lg"
                                    placeholder="Min Age: 18 Years&#10;Max Age: 27 Years"
                                    value={formData.ageLimit}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 uppercase mb-2">Total Post</h2>
                                <input
                                    type="text"
                                    name="totalPosts"
                                    className="w-full p-2.5 border rounded-lg"
                                    placeholder="e.g. 500 Posts"
                                    value={formData.totalPosts}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Vacancy Details */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6 border-b pb-2">
                        <div className="flex items-center space-x-2 text-primary font-bold">
                            <Tag className="h-5 w-5" />
                            <h2 className="uppercase">Vacancy Details</h2>
                        </div>
                        <button
                            type="button"
                            onClick={addVacancyRow}
                            className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg flex items-center font-bold"
                        >
                            <Plus className="h-4 w-4 mr-1" /> ADD POST
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.vacancyDetails.map((row, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-xl bg-gray-50 relative">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase px-1">Post Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-lg mt-1"
                                        value={row.postName}
                                        onChange={(e) => handleVacancyChange(index, "postName", e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase px-1">Total</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg mt-1 text-center"
                                        value={row.totalPost}
                                        onChange={(e) => handleVacancyChange(index, "totalPost", Number(e.target.value))}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase px-1">Eligibility</label>
                                        <textarea
                                            rows={2}
                                            className="w-full p-2 border rounded-lg mt-1"
                                            value={row.eligibility}
                                            onChange={(e) => handleVacancyChange(index, "eligibility", e.target.value)}
                                        />
                                    </div>
                                    {formData.vacancyDetails.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVacancyRow(index)}
                                            className="ml-2 mb-1 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* External Links Section */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center space-x-2 text-blue-900 font-bold">
                            <LinkIcon className="h-5 w-5" />
                            <h2 className="uppercase">Important Links (Apply online, etc.)</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddLink}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center font-bold hover:bg-blue-100 border border-blue-100"
                        >
                            <Plus className="h-4 w-4 mr-1" /> ADD MORE LINK
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.externalLinks.map((link, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-gray-50 relative group">
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        type="button"
                                        onClick={() => moveLinkUp(idx)}
                                        className="p-1 bg-white border rounded shadow-sm hover:text-blue-600 disabled:opacity-30"
                                        disabled={idx === 0}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveLinkDown(idx)}
                                        className="p-1 bg-white border rounded shadow-sm hover:text-blue-600 disabled:opacity-30"
                                        disabled={idx === formData.externalLinks.length - 1}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase px-1">Link Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Official Apply Link"
                                        className="w-full p-2 border rounded-lg mt-1"
                                        value={link.title}
                                        onChange={(e) => handleLinkChange(idx, 'title', e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase px-1">URL (Tip: Format "Label,URL | Label,URL" for multiple)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Register,https://... | Login,https://..."
                                        className="w-full p-2 border rounded-lg mt-1"
                                        value={link.url}
                                        onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                                    />
                                </div>
                                {formData.externalLinks.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLink(idx)}
                                        className="self-end md:mb-1 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sidebar Links Section */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <div className="flex items-center space-x-2 text-red-700 font-bold">
                            <LinkIcon className="h-5 w-5" />
                            <h2 className="uppercase">Sidebar Links (Today Job Highlights)</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddSidebarLink}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg flex items-center font-bold hover:bg-red-100 border border-red-100"
                        >
                            <Plus className="h-4 w-4 mr-1" /> ADD MORE HIGHLIGHT
                        </button>
                    </div>
                    <div className="space-y-4">
                        {formData.sidebarLinks.map((link, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-gray-50 relative group">
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        type="button"
                                        onClick={() => moveSidebarLinkUp(idx)}
                                        className="p-1 bg-white border rounded shadow-sm hover:text-red-600 disabled:opacity-30"
                                        disabled={idx === 0}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => moveSidebarLinkDown(idx)}
                                        className="p-1 bg-white border rounded shadow-sm hover:text-red-600 disabled:opacity-30"
                                        disabled={idx === formData.sidebarLinks.length - 1}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase px-1">Highlight Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., MP Police Constable Result"
                                        className="w-full p-2 border rounded-lg mt-1"
                                        value={link.title}
                                        onChange={(e) => handleSidebarLinkChange(idx, 'title', e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase px-1">Highlight URL</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. /job/mp-police-result"
                                        className="w-full p-2 border rounded-lg mt-1"
                                        value={link.url}
                                        onChange={(e) => handleSidebarLinkChange(idx, 'url', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSidebarLink(idx)}
                                    className="self-end md:mb-1 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                        {formData.sidebarLinks.length === 0 && (
                            <p className="text-sm text-gray-400 italic">No job highlights added. Click "Add More Highlight" to show links in the sidebar.</p>
                        )}
                    </div>
                </section>

                {/* Required Documents Section */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center space-x-2 text-blue-700 font-bold">
                            <FileText className="h-5 w-5" />
                            <h2 className="uppercase">Required Documents for Student</h2>
                        </div>
                        <button
                            type="button"
                            onClick={addRequirement}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center font-bold hover:bg-blue-200"
                        >
                            <Plus className="h-4 w-4 mr-1" /> ADD DOCUMENT
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.requiredDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    className="flex-1 p-2 border rounded-lg"
                                    placeholder="e.g. Aadhar Card"
                                    value={doc}
                                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeRequirement(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                        {formData.requiredDocuments.length === 0 && (
                            <p className="text-sm text-gray-400 italic col-span-2">No specific documents required yet. Add items like 'Aadhar Card', '10th Marksheet', etc.</p>
                        )}
                    </div>
                </section>

                {/* Custom Content Sections */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center space-x-2 text-purple-700 font-bold uppercase">
                            <Plus className="h-5 w-5" />
                            <h2>Custom Content Sections (Tables, Lists, etc.)</h2>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => addSection("table")}
                                className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold border border-purple-100"
                            >
                                <Plus className="h-4 w-4 mr-1 inline" /> TABLE
                            </button>
                            <button
                                type="button"
                                onClick={() => addSection("bullets")}
                                className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold border border-purple-100"
                            >
                                <Plus className="h-4 w-4 mr-1 inline" /> LIST
                            </button>
                            <button
                                type="button"
                                onClick={() => addSection("rich-text")}
                                className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold border border-purple-100"
                            >
                                <Plus className="h-4 w-4 mr-1 inline" /> TEXT
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {formData.contentSections?.map((section) => (
                            <div key={section.id} className="p-4 border rounded-xl bg-gray-50 space-y-4 relative">
                                <button
                                    type="button"
                                    onClick={() => removeSection(section.id)}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 border border-red-200"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase px-1 mb-1">Section Title/Heading</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border rounded-lg font-bold text-blue-900"
                                        placeholder="e.g. Mode of Selection or Vacancy Table"
                                        value={section.title}
                                        onChange={(e) => updateSection(section.id, "title", e.target.value)}
                                    />
                                </div>

                                {section.type === "table" && section.tableData && (
                                    <div className="space-y-4">
                                        <div className="flex overflow-x-auto pb-2 gap-2">
                                            {section.tableData.headers.map((h, hi) => (
                                                <div key={hi} className="min-w-[150px] relative group">
                                                    <input
                                                        type="text"
                                                        className="w-full p-2 border rounded bg-blue-900 text-white text-xs font-bold"
                                                        value={h}
                                                        onChange={(e) => updateTableHeader(section.id, hi, e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTableHeader(section.id, hi)}
                                                        className="hidden group-hover:block absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addTableHeader(section.id)}
                                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs font-bold shrink-0"
                                            >
                                                + COL
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {section.tableData.rows.map((row, ri) => (
                                                <div key={ri} className="flex gap-2">
                                                    {row.cells.map((cell: string, ci: number) => (
                                                        <textarea
                                                            key={ci}
                                                            rows={2}
                                                            className="flex-1 min-w-[150px] p-2 border rounded text-xs"
                                                            value={cell}
                                                            onChange={(e) => updateTableCell(section.id, ri, ci, e.target.value)}
                                                        />
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTableRow(section.id, ri)}
                                                        className="p-2 text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addTableRow(section.id)}
                                                className="w-full py-2 bg-gray-200 text-gray-700 rounded text-xs font-bold hover:bg-gray-300"
                                            >
                                                + ADD ROW
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {section.type === "bullets" && section.listData && (
                                    <div className="space-y-2">
                                        {section.listData.map((item, li) => (
                                            <div key={li} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 p-2 border rounded text-xs"
                                                    placeholder="Bullet Point Text"
                                                    value={item}
                                                    onChange={(e) => updateListItem(section.id, li, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeListItem(section.id, li)}
                                                    className="p-2 text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addListItem(section.id)}
                                            className="w-full py-2 bg-gray-200 text-gray-700 rounded text-xs font-bold"
                                        >
                                            + ADD ITEM
                                        </button>
                                    </div>
                                )}

                                {section.type === "rich-text" && (
                                    <textarea
                                        className="w-full p-2.5 border rounded-lg text-sm"
                                        rows={4}
                                        placeholder="Enter content text..."
                                        value={section.textData}
                                        onChange={(e) => updateSection(section.id, "textData", e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                        {(!formData.contentSections || formData.contentSections.length === 0) && (
                            <div className="text-center py-8 border-2 border-dashed rounded-xl text-gray-400">
                                <Plus className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No custom content sections added. Add tables or lists for detailed job info.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Poster Image Section */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-2 text-primary font-bold border-b pb-2 mb-4">
                        <ImageIcon className="h-5 w-5" />
                        <h2 className="uppercase">Bottom Poster Image</h2>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Poster/Banner (Shows at bottom of post)</label>
                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="poster-upload"
                                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                            />
                            <label
                                htmlFor="poster-upload"
                                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 border-gray-300"
                            >
                                <Upload className="h-8 w-8 mb-2 text-gray-400" />
                                <span className="text-sm text-gray-600 font-medium">
                                    {posterFile ? posterFile.name : "Select Image File"}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Recommended: Wide banner format</p>
                            </label>
                            {posterFile && (
                                <div className="mt-4 relative w-full h-40 rounded-lg overflow-hidden border">
                                    <img 
                                        src={URL.createObjectURL(posterFile)} 
                                        alt="Poster preview" 
                                        className="w-full h-full object-contain bg-gray-50"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setPosterFile(null)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* SEO Section */}
                <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
                    <div className="flex items-center space-x-2 text-blue-900 font-bold">
                        <SeoIcon className="h-5 w-5" />
                        <h2 className="uppercase">SEO Optimization</h2>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Meta Title</label>
                        <input
                            type="text"
                            name="seoTitle"
                            className="w-full p-2.5 border rounded-lg"
                            placeholder="Post Name"
                            value={formData.seoTitle}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Meta Description</label>
                        <textarea
                            name="seoDescription"
                            rows={2}
                            className="w-full p-2.5 border rounded-lg"
                            placeholder="Brief summary for Google search result..."
                            value={formData.seoDescription}
                            onChange={handleInputChange}
                        />
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                        <>
                            <Save className="h-6 w-6" />
                            <span>SAVE AND PUBLISH NOTIFICATION</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
