"use client";

import { useState, useEffect } from "react";
import { getJobById, updateJob, Job } from "@/lib/db/jobs";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter, useParams } from "next/navigation";
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

export default function EditJob() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [posterFile, setPosterFile] = useState<File | null>(null);

    const [formData, setFormData] = useState<any>({
        title: "",
        slug: "",
        category: "",
        department: "",
        importantDates: {
            start: "",
            end: "",
            examDate: "",
            resultDate: "",
            customDates: [] as { label: string; date: string }[]
        },
        applicationFee: "",
        categoryFees: [] as { category: string; fee: number | string }[],
        ageLimit: "",
        totalPosts: "",
        vacancyDetails: [
            { postName: "", totalPost: 0, eligibility: "" }
        ],
        applyLink: "",
        pdfUrl: "",
        externalLinks: [],
        seoTitle: "",
        seoDescription: "",
        requiredDocuments: [],
        status: "published",
        posterUrl: ""
    });

    useEffect(() => {
        const fetchJob = async () => {
            // Let's create `getJobById` in the lib if not there, or use getDoc directly. We will implement `getJobById` shortly.
            try {
                const { getDoc, doc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                const docRef = doc(db, "jobs", jobId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData({ 
                        id: docSnap.id, 
                        ...data,
                        importantDates: {
                            ...data.importantDates,
                            customDates: data.importantDates?.customDates || []
                        },
                        externalLinks: data.externalLinks || [{ title: "Official Apply Link", url: data.applyLink || "" }],
                        categoryFees: data.categoryFees || [],
                        contentSections: data.contentSections || [],
                        formFee: data.formFee || 0,
                        originalFormFee: data.originalFormFee || 0,
                        totalPosts: data.totalPosts || ""
                    });
                } else {
                    toast.error("Job not found!");
                    router.push("/admin/jobs");
                }
            } catch (error) {
                toast.error("Error loading job");
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJob();
        }
    }, [jobId, router]);

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".") as [keyof typeof formData, string];
            setFormData((prev: any) => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: value }));

            // Auto-generate slug from title
            if (name === "title") {
                setFormData((prev: any) => ({
                    ...prev,
                    slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
                }));
            }
        }
    };

    const addVacancyRow = () => {
        setFormData((prev: any) => ({
            ...prev,
            vacancyDetails: [...prev.vacancyDetails, { postName: "", totalPost: 0, eligibility: "" }]
        }));
    };

    const removeVacancyRow = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            vacancyDetails: prev.vacancyDetails.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleVacancyChange = (index: number, field: string, value: any) => {
        const updated = [...formData.vacancyDetails];
        updated[index][field] = value;
        setFormData((prev: any) => ({ ...prev, vacancyDetails: updated }));
    };

    const addRequirement = () => {
        setFormData((prev: any) => ({
            ...prev,
            requiredDocuments: [...(prev.requiredDocuments || []), ""]
        }));
    };

    const removeRequirement = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            requiredDocuments: prev.requiredDocuments.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleRequirementChange = (index: number, value: string) => {
        const updated = [...formData.requiredDocuments];
        updated[index] = value;
        setFormData((prev: any) => ({ ...prev, requiredDocuments: updated }));
    };

    const handleAddLink = () => {
        setFormData((prev: any) => ({
            ...prev,
            externalLinks: [...(prev.externalLinks || []), { title: "", url: "" }]
        }));
    };

    const handleRemoveLink = (idx: number) => {
        const newLinks = formData.externalLinks.filter((_: any, i: number) => i !== idx);
        setFormData((prev: any) => ({ ...prev, externalLinks: newLinks }));
    };

    const moveLinkUp = (idx: number) => {
        if (idx === 0) return;
        setFormData((prev: any) => {
            const newLinks = [...prev.externalLinks];
            [newLinks[idx - 1], newLinks[idx]] = [newLinks[idx], newLinks[idx - 1]];
            return { ...prev, externalLinks: newLinks };
        });
    };

    const moveLinkDown = (idx: number) => {
        setFormData((prev: any) => {
            if (idx === prev.externalLinks.length - 1) return prev;
            const newLinks = [...prev.externalLinks];
            [newLinks[idx + 1], newLinks[idx]] = [newLinks[idx], newLinks[idx + 1]];
            return { ...prev, externalLinks: newLinks };
        });
    };

    const handleLinkChange = (idx: number, field: 'title' | 'url', value: string) => {
        const newLinks = [...formData.externalLinks];
        newLinks[idx] = { ...newLinks[idx], [field]: value };
        setFormData((prev: any) => ({ ...prev, externalLinks: newLinks }));
    };

    const addCustomDate = () => {
        setFormData((prev: any) => ({
            ...prev,
            importantDates: {
                ...prev.importantDates,
                customDates: [...(prev.importantDates.customDates || []), { label: "", date: "" }]
            }
        }));
    };

    const removeCustomDate = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            importantDates: {
                ...prev.importantDates,
                customDates: prev.importantDates.customDates.filter((_: any, i: number) => i !== index)
            }
        }));
    };

    const handleCustomDateChange = (index: number, field: 'label' | 'date', value: string) => {
        const updated = [...formData.importantDates.customDates];
        updated[index][field] = value;
        setFormData((prev: any) => ({
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

        setFormData((prev: any) => ({
            ...prev,
            contentSections: [...(prev.contentSections || []), newSection]
        }));
    };

    const removeSection = (id: string) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.filter((s: any) => s.id !== id)
        }));
    };

    const updateSection = (id: string, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const addTableRow = (sectionId: string) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
                if (s.id === sectionId && s.tableData) {
                    const newRow = new Array(s.tableData.headers.length).fill("");
                    return { ...s, tableData: { ...s.tableData, rows: [...s.tableData.rows, { cells: newRow }] } };
                }
                return s;
            })
        }));
    };

    const removeTableRow = (sectionId: string, rowIndex: number) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
                if (s.id === sectionId && s.tableData) {
                    return { ...s, tableData: { ...s.tableData, rows: s.tableData.rows.filter((_: any, i: number) => i !== rowIndex) } };
                }
                return s;
            })
        }));
    };

    const updateTableCell = (sectionId: string, rowIndex: number, colIndex: number, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
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
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
                if (s.id === sectionId && s.tableData) {
                    const newHeaders = [...s.tableData.headers, `Column ${s.tableData.headers.length + 1}`];
                    const newRows = s.tableData.rows.map((row: any) => ({ cells: [...row.cells, ""] }));
                    return { ...s, tableData: { headers: newHeaders, rows: newRows } };
                }
                return s;
            })
        }));
    };

    const removeTableHeader = (sectionId: string, colIndex: number) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
                if (s.id === sectionId && s.tableData && s.tableData.headers.length > 1) {
                    const newHeaders = s.tableData.headers.filter((_: any, i: number) => i !== colIndex);
                    const newRows = s.tableData.rows.map((row: any) => ({ cells: row.cells.filter((_: any, i: number) => i !== colIndex) }));
                    return { ...s, tableData: { headers: newHeaders, rows: newRows } };
                }
                return s;
            })
        }));
    };

    const updateTableHeader = (sectionId: string, colIndex: number, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
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
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
                if (s.id === sectionId && s.listData) {
                    return { ...s, listData: [...s.listData, ""] };
                }
                return s;
            })
        }));
    };

    const removeListItem = (sectionId: string, index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
                if (s.id === sectionId && s.listData) {
                    return { ...s, listData: s.listData.filter((_: any, i: number) => i !== index) };
                }
                return s;
            })
        }));
    };

    const updateListItem = (sectionId: string, index: number, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            contentSections: prev.contentSections?.map((s: any) => {
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

        setSaving(true);

        try {
            const jobUpdateData = { ...formData };

            // Upload Poster Image if selected
            if (posterFile) {
                const posterRef = ref(storage, `job-posters/${Date.now()}_${posterFile.name}`);
                await uploadBytes(posterRef, posterFile);
                jobUpdateData.posterUrl = await getDownloadURL(posterRef);
            }

            // Using direct pdfUrl input now, but keeping storage logic as fallback if file is picked
            if (pdfFile) {
                const fileRef = ref(storage, `notifications/${Date.now()}_${pdfFile.name}`);
                const snapshot = await uploadBytes(fileRef, pdfFile);
                jobUpdateData.pdfUrl = await getDownloadURL(snapshot.ref);
            }

            // Auto-generate applicationFee text from category fees
            if (jobUpdateData.categoryFees && jobUpdateData.categoryFees.length > 0) {
                jobUpdateData.applicationFee = jobUpdateData.categoryFees
                    .filter((cf: any) => cf.category)
                    .map((cf: any) => `${cf.category}: ₹${cf.fee}`)
                    .join('\n');
            }

            // Remove id property before updating since it's the doc id
            const { id, createdAt, ...updatePayload } = jobUpdateData;

            await updateJob(jobId, updatePayload);

            toast.success("Job Updated Successfully!");
            router.push("/admin/jobs");
        } catch (error: any) {
            toast.error(error.message || "Failed to update job.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <Toaster position="top-right" />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/jobs" className="p-2 bg-white rounded-lg border hover:bg-gray-50">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Job Notification</h1>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        className="bg-white border rounded-lg px-3 py-2 text-sm font-medium outline-none"
                        value={formData.status}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, status: e.target.value }))}
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
                    </div>
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
                            {(formData.importantDates.customDates || []).map((cd: any, idx: number) => (
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
                            {(!formData.importantDates.customDates || formData.importantDates.customDates.length === 0) && (
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
                                onClick={() => setFormData((prev: any) => ({
                                    ...prev, 
                                    categoryFees: [...(prev.categoryFees || []), { category: "", fee: 0 }]
                                }))}
                                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center font-bold hover:bg-blue-100 border border-blue-100"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Add Category
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(formData.categoryFees || []).map((cf: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 p-2 border rounded-lg text-sm"
                                        placeholder="Category name (e.g. General)"
                                        value={cf.category}
                                        onChange={(e) => {
                                            const updated = [...formData.categoryFees];
                                            updated[idx].category = e.target.value;
                                            setFormData((prev: any) => ({ ...prev, categoryFees: updated }));
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
                                                setFormData((prev: any) => ({ ...prev, categoryFees: updated }));
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                categoryFees: prev.categoryFees.filter((_: any, i: number) => i !== idx)
                                            }));
                                        }}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {(!formData.categoryFees || formData.categoryFees.length === 0) && (
                                <p className="text-sm text-gray-400 italic">No category-wise fees added. Using the general Application Fee text below if any.</p>
                            )}
                        </div>
                        <div className="mt-6 border-t pt-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">General Fee Text (Auto-generated on save)</label>
                            <textarea
                                name="applicationFee"
                                rows={3}
                                className="w-full p-2.5 border rounded-lg bg-gray-50 text-gray-600 text-sm"
                                placeholder="Gen/OBC: ₹100&#10;SC/ST: ₹0"
                                value={formData.applicationFee}
                                onChange={handleInputChange}
                            />
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
                                    value={formData.totalPosts || ""}
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
                        {formData.vacancyDetails?.map((row: any, index: number) => (
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
                                        <input
                                            type="text"
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
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center font-bold hover:bg-blue-200"
                        >
                            <Plus className="h-4 w-4 mr-1" /> ADD MORE LINK
                        </button>
                    </div>
                    <div className="space-y-4">
                        {(formData.externalLinks || []).map((link: any, idx: number) => (
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
                                        disabled={idx === (formData.externalLinks?.length || 0) - 1}
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
                                    <label className="text-xs font-bold text-gray-500 uppercase px-1">URL</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        className="w-full p-2 border rounded-lg mt-1"
                                        value={link.url}
                                        onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                                    />
                                </div>
                                {formData.externalLinks?.length > 1 && (
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

                {/* PDF & Documents */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Official Notification PDF URL (Direct Link)</label>
                            <input
                                type="text"
                                name="pdfUrl"
                                className="w-full p-2.5 border rounded-lg"
                                placeholder="Download URL for PDF"
                                value={formData.pdfUrl || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload Notification PDF (Replaces current link)</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    id="pdf-upload"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                />
                                <label
                                    htmlFor="pdf-upload"
                                    className="w-full flex items-center justify-center p-2.5 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 border-gray-300"
                                >
                                    <Upload className="h-5 w-5 mr-2 text-gray-400" />
                                    <span className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
                                        {pdfFile ? pdfFile.name : (formData.pdfUrl ? "Replace Current PDF" : "Upload Notification PDF")}
                                    </span>
                                </label>
                                {formData.pdfUrl && !pdfFile && (
                                    <p className="text-xs text-green-600 mt-2 font-medium">Notification PDF is currently set.</p>
                                )}
                            </div>
                        </div>
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
                        {(formData.requiredDocuments || []).map((doc: string, index: number) => (
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
                        {(!formData.requiredDocuments || formData.requiredDocuments.length === 0) && (
                            <p className="text-sm text-gray-400 italic col-span-2">No specific documents required yet. Add items like 'Aadhar Card', '10th Marksheet', etc.</p>
                        )}
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
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, formFee: Number(e.target.value) }))}
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
                                onChange={(e) => setFormData((prev: any) => ({ ...prev, originalFormFee: Number(e.target.value) }))}
                            />
                        </div>
                    </div>
                </section>
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
                        {formData.contentSections?.map((section: any) => (
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
                                            {section.tableData.headers.map((h: string, hi: number) => (
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
                                            {section.tableData.rows.map((row: any, ri: number) => (
                                                <div key={ri} className="flex gap-2">
                                                    {row.cells.map((cell: string, ci: number) => (
                                                        <input
                                                            key={ci}
                                                            type="text"
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
                                        {section.listData.map((item: string, li: number) => (
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
                                id="edit-poster-upload"
                                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                            />
                            <label
                                htmlFor="edit-poster-upload"
                                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 border-gray-300"
                            >
                                <Upload className="h-8 w-8 mb-2 text-gray-400" />
                                <span className="text-sm text-gray-600 font-medium">
                                    {posterFile ? posterFile.name : (formData.posterUrl ? "Change Image" : "Select Image File")}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">Recommended: Wide banner format</p>
                            </label>
                            
                            {(posterFile || formData.posterUrl) && (
                                <div className="mt-4 relative w-full h-40 rounded-lg overflow-hidden border">
                                    <img 
                                        src={posterFile ? URL.createObjectURL(posterFile) : formData.posterUrl} 
                                        alt="Poster preview" 
                                        className="w-full h-full object-contain bg-gray-50"
                                    />
                                    {posterFile && (
                                        <button 
                                            type="button"
                                            onClick={() => setPosterFile(null)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                    {!posterFile && formData.posterUrl && (
                                        <button 
                                            type="button"
                                            onClick={() => setFormData({...formData, posterUrl: ""})}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
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
                    disabled={saving}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin h-6 w-6" /> : (
                        <>
                            <Save className="h-6 w-6" />
                            <span>UPDATE JOB NOTIFICATION</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
