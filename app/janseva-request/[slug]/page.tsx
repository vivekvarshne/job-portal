"use client";

import { useState, useEffect } from "react";
import { getJobBySlug } from "@/lib/db/jobs";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Script from "next/script";
import { Loader2, Plus, X, Upload, Camera, FileUp } from "lucide-react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function JansevaRequest({ params }: { params: { slug: string } }) {
    const [job, setJob] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formFillingCharge, setFormFillingCharge] = useState(0);
    const [guestEmail, setGuestEmail] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [paymentDone, setPaymentDone] = useState(false);
    const [paymentId, setPaymentId] = useState("");
    const router = useRouter();

    const [formData, setFormData] = useState({
        fullName: "",
        fatherName: "",
        motherName: "",
        dob: "",
        gender: "Male",
        category: "General",
        address: "",
        education: "",
        additionalInfo: ""
    });

    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        photo: null,
        signature: null,
        documentPdf: null
    });

    const [otherDocs, setOtherDocs] = useState<{name: string, file: File, preview: string}[]>([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [newDocName, setNewDocName] = useState("");
    const [newDocFile, setNewDocFile] = useState<File | null>(null);

    useEffect(() => {
        const checkAuthAndFetchJob = async () => {
            const { slug } = await params;
            
            // Fetch form filling charge from settings
            try {
                const settingsDoc = await getDoc(doc(db, "settings", "charges"));
                if (settingsDoc.exists()) {
                    setFormFillingCharge(settingsDoc.data().formFillingCharge || 0);
                }
            } catch (e) { console.error("Settings fetch error:", e); }

            auth.onAuthStateChanged(async (currentUser) => {
                if (currentUser) {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists() && userDoc.data().role === "customer") {
                        setUser({ uid: currentUser.uid, ...userDoc.data() } as any);
                        setFormData(prev => ({ ...prev, fullName: userDoc.data()?.name || "" }));
                    }
                }
                
                try {
                    const jobData = await getJobBySlug(slug);
                    if (jobData) {
                        setJob(jobData);
                    }
                } catch (error) {
                    console.error("Error fetching job", error);
                }
                
                setLoading(false);
            });
        };
        
        checkAuthAndFetchJob();
    }, [params]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName) {
            toast.error("Please enter your full name.");
            return;
        }
        if (!user && (!guestEmail || !guestPhone)) {
            toast.error("Please enter your email and phone number.");
            return;
        }

        if (!job) return;

        // Calculate total charge
        const selectedCatFee = job.categoryFees?.find((cf: any) => cf.category === formData.category);
        const applicationFeeAmount = selectedCatFee ? selectedCatFee.fee : 0;
        const totalAmount = formFillingCharge + applicationFeeAmount;

        // If payment not done and total > 0, initiate Razorpay
        if (!paymentDone && totalAmount > 0) {
            try {
                const orderRes = await fetch("/api/razorpay/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: totalAmount,
                        userId: user?.uid || "guest",
                        plan: "janseva_form"
                    }),
                });
                const orderData = await orderRes.json();

                if (!orderData.id) {
                    toast.error("Failed to create payment order");
                    return;
                }

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: totalAmount * 100,
                    currency: "INR",
                    name: "Janseva Kendra",
                    description: `Form Filling: ${job.title} (${formData.category})`,
                    order_id: orderData.id,
                    handler: async function (response: any) {
                        // Verify payment
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                transactionId: orderData.transactionId,
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            setPaymentDone(true);
                            setPaymentId(response.razorpay_payment_id);
                            toast.success("Payment successful! Submitting form...");
                            // Auto-submit after payment
                            submitFormData(response.razorpay_payment_id, totalAmount);
                        } else {
                            toast.error("Payment verification failed");
                        }
                    },
                    prefill: {
                        name: user?.name || formData.fullName,
                        email: user?.email || guestEmail,
                        contact: guestPhone || ""
                    },
                    theme: { color: "#1e3a8a" },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } catch (error: any) {
                toast.error("Payment error: " + (error.message || "Something went wrong"));
            }
            return;
        }

        // If no charge or payment already done, submit directly
        submitFormData(paymentId, totalAmount);
    };

    const submitFormData = async (rzpPaymentId: string, totalAmount: number) => {

        setSubmitting(true);
        const loadingToast = toast.loading("Uploading documents and submitting request...");

        try {
            // Upload files to Firebase Storage
            const fileUrls: { [key: string]: string } = {};
            
            for (const [key, file] of Object.entries(files)) {
                if (file) {
                    const uploadId = user ? user.uid : `guest_${Date.now()}`;
                    const fileRef = ref(storage, `janseva_requests/${uploadId}/${Date.now()}_${file.name}`);
                    await uploadBytes(fileRef, file);
                    fileUrls[key] = await getDownloadURL(fileRef);
                }
            }
            
            for (let i = 0; i < otherDocs.length; i++) {
                const docObj = otherDocs[i];
                if (docObj.file) {
                    const uploadId = user ? user.uid : `guest_${Date.now()}`;
                    const fileRef = ref(storage, `janseva_requests/${uploadId}/${Date.now()}_other_${i}_${docObj.file.name}`);
                    await uploadBytes(fileRef, docObj.file);
                    const url = await getDownloadURL(fileRef);
                    fileUrls[`Other_${docObj.name}`] = url;
                }
            }

            // Save to Firestore
            await addDoc(collection(db, "janseva_requests"), {
                studentId: user?.studentId || `GUEST${Date.now().toString().slice(-6)}`,
                studentUid: user?.uid || null,
                studentName: user?.name || formData.fullName,
                studentEmail: user?.email || guestEmail,
                studentPhone: guestPhone || user?.phone || "",
                jobId: job.id,
                jobTitle: job.title,
                jobSlug: job.slug,
                jobLink: job.applyLink || "",
                formData,
                documents: fileUrls,
                status: "Pending",
                vendorId: null,
                totalCharge: totalAmount,
                razorpayPaymentId: rzpPaymentId || null,
                paymentStatus: totalAmount > 0 ? "Paid" : "Free",
                createdAt: new Date(),
                updatedAt: new Date()
            });

            toast.success("Request submitted successfully to Janseva Kendra!", { id: loadingToast });
            router.push("/");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to submit request", { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;
    }

    if (!job) {
        return <div className="text-center py-20 text-2xl font-bold">Job Not Found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header info */}
                <div className="bg-blue-900 text-white p-6 rounded-xl shadow-md">
                    <h1 className="text-2xl font-bold">Janseva Kendra Request Form</h1>
                    <p className="mt-2 text-blue-100 opacity-90">
                        Applying for: <span className="font-bold underline">{job.title}</span>
                    </p>
                </div>

                {/* Charge Breakdown - dynamic based on selected category */}
                {(() => {
                    const selectedCatFee = job.categoryFees?.find((cf: any) => cf.category === formData.category);
                    const applicationFeeAmount = selectedCatFee ? selectedCatFee.fee : 0;
                    const totalAmount = formFillingCharge + applicationFeeAmount;
                    
                    return (formFillingCharge > 0 || applicationFeeAmount > 0) ? (
                        <div className="bg-green-50 border border-green-200 p-5 rounded-xl">
                            <h3 className="text-lg font-bold text-green-900 mb-3">Total Charge Breakdown</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Form Filling Charge:</span>
                                    <span className="font-bold text-gray-900">₹{formFillingCharge}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Application Fee ({formData.category}):</span>
                                    <span className="font-bold text-gray-900">₹{applicationFeeAmount}</span>
                                </div>
                                <div className="flex justify-between border-t border-green-300 pt-2 mt-2">
                                    <span className="text-green-900 font-bold text-base">Total Payable:</span>
                                    <span className="text-green-900 font-extrabold text-lg">₹{totalAmount}</span>
                                </div>
                            </div>
                            <p className="text-xs text-green-700 mt-2 italic">You will pay this amount online via Razorpay before form submission.</p>
                        </div>
                    ) : null;
                })()}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow border border-gray-100 space-y-8">
                        {/* Guest Contact Info */}
                        {!user && (
                            <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg space-y-4">
                                <h2 className="text-lg font-bold text-yellow-900">Your Contact Information</h2>
                                <p className="text-xs text-yellow-700">Since you are not logged in, please provide your contact details so we can reach you.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                                        <input 
                                            required type="email"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                            value={guestEmail}
                                            onChange={e => setGuestEmail(e.target.value)}
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                                        <input 
                                            required type="tel" pattern="[0-9]{10}"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                            value={guestPhone}
                                            onChange={e => setGuestPhone(e.target.value)}
                                            placeholder="10-digit number"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Personal Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input 
                                        required type="text" 
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={formData.fullName}
                                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <input 
                                        required type="date" 
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={formData.dob}
                                        onChange={e => setFormData({...formData, dob: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                                    <input 
                                        required type="text" 
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={formData.fatherName}
                                        onChange={e => setFormData({...formData, fatherName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
                                    <input 
                                        required type="text" 
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={formData.motherName}
                                        onChange={e => setFormData({...formData, motherName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select 
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={formData.gender}
                                        onChange={e => setFormData({...formData, gender: e.target.value})}
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    {job.categoryFees && job.categoryFees.length > 0 ? (
                                        <select 
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                            value={formData.category}
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                        >
                                            {job.categoryFees.map((cf: any) => (
                                                <option key={cf.category} value={cf.category}>
                                                    {cf.category} — ₹{cf.fee}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select 
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                            value={formData.category}
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                        >
                                            <option>General</option>
                                            <option>OBC</option>
                                            <option>SC</option>
                                            <option>ST</option>
                                            <option>EWS</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Address & Education</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Address with Pincode</label>
                                    <textarea 
                                        required rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Educational Qualification Details (10th/12th/Graduation passing year, board, marks)</label>
                                    <textarea 
                                        required rows={4}
                                        placeholder="e.g., 10th - UP Board - 2018 - 85%&#10;12th - UP Board - 2020 - 80%"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={formData.education}
                                        onChange={e => setFormData({...formData, education: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Any additional info required for this form?</label>
                                    <textarea 
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                        value={formData.additionalInfo}
                                        onChange={e => setFormData({...formData, additionalInfo: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Document Uploads</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Passport Size Photo (JPG/PNG)</label>
                                    <input 
                                        type="file" accept="image/*" required
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={e => handleFileChange(e, 'photo')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Signature Image (JPG/PNG)</label>
                                    <input 
                                        type="file" accept="image/*" required
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={e => handleFileChange(e, 'signature')}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">All marksheets/Certificates (Single PDF doc)</label>
                                    <input 
                                        type="file" accept=".pdf"
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={e => handleFileChange(e, 'documentPdf')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Other Documents */}
                        <div>
                            <div className="flex justify-between items-center mb-6 border-b pb-2">
                                <h2 className="text-xl font-bold text-gray-900">Other Documents (Optional)</h2>
                                <button 
                                    type="button" 
                                    onClick={() => setIsPopupOpen(true)}
                                    className="flex items-center bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Document
                                </button>
                            </div>
                            
                            {otherDocs.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {otherDocs.map((doc, idx) => (
                                        <div key={idx} className="border p-2 rounded-lg bg-gray-50 flex flex-col justify-between">
                                            <p className="font-bold text-xs text-gray-700 truncate mb-2" title={doc.name}>{doc.name}</p>
                                            <div className="relative w-full h-24 bg-white border flex items-center justify-center overflow-hidden rounded">
                                                {doc.preview.includes('pdf') || doc.file.type.includes('pdf') ? (
                                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">PDF Document</span>
                                                ) : (
                                                    <img src={doc.preview} className="max-h-full max-w-full object-contain" alt={doc.name}/>
                                                )}
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setOtherDocs(prev => prev.filter((_, i) => i !== idx));
                                                }} 
                                                className="mt-2 text-xs font-medium text-red-600 hover:text-red-800 self-end"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200 text-center">
                                    No additional documents added. Click "Add Document" if you need to upload more files like Caste Certificate, Domicile, etc.
                                </p>
                            )}
                        </div>

                        <div className="pt-6 border-t">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                            >
                                {submitting ? (
                                    <><Loader2 className="animate-spin h-6 w-6 mr-2" /> Submitting to Kendra...</>
                                ) : (
                                    "Submit Form Details to Janseva Kendra"
                                )}
                            </button>
                            <p className="mt-3 text-center text-sm text-gray-500">
                                Once submitted, a Janseva Kendra employee will process your form and update the status <br /> Contect us For Any issue on this number +917252930635 . 
                            </p>
                        </div>
                    </form>
            </div>

            {/* Upload Modal */}
            {isPopupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6 border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-900">Add Document</h3>
                            <button onClick={() => setIsPopupOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Document Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-gray-50"
                                    placeholder="e.g. Caste Certificate, Domicile..."
                                    value={newDocName}
                                    onChange={e => setNewDocName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Upload Method <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button" 
                                        onClick={() => document.getElementById('camera-upload')?.click()}
                                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                                    >
                                        <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                            <Camera className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-bold text-blue-700">Take Photo</span>
                                        <input 
                                            id="camera-upload"
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment"
                                            className="hidden" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) setNewDocFile(e.target.files[0]);
                                            }}
                                        />
                                    </button>
                                    <button
                                        type="button" 
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                                    >
                                        <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                            <FileUp className="w-6 h-6 text-gray-600" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">Upload File</span>
                                        <input 
                                            id="file-upload"
                                            type="file" 
                                            accept="image/*,.pdf" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) setNewDocFile(e.target.files[0]);
                                            }}
                                        />
                                    </button>
                                </div>
                                {newDocFile && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <p className="text-sm text-green-700 font-medium truncate flex-1" title={newDocFile.name}>
                                            {newDocFile.name}
                                        </p>
                                        <button onClick={() => setNewDocFile(null)} className="text-green-800 hover:text-green-900"><X className="w-4 h-4"/></button>
                                    </div>
                                )}
                            </div>
                            <div className="pt-2">
                                <button 
                                    onClick={() => {
                                        if (!newDocName.trim() || !newDocFile) { 
                                            toast.error("Please provide both document name and a file", { position: "top-center" }); 
                                            return; 
                                        }
                                        setOtherDocs(prev => [...prev, { name: newDocName.trim(), file: newDocFile, preview: URL.createObjectURL(newDocFile) }]);
                                        setNewDocName(""); 
                                        setNewDocFile(null); 
                                        setIsPopupOpen(false);
                                    }}
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"
                                >
                                    Add to Form
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
