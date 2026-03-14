"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Script from "next/script";

// Dynamic plans will be fetched from Firestore

export default function VendorSignup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [pan, setPan] = useState("");
    const [aadhar, setAadhar] = useState("");
    const [address, setAddress] = useState("");
    const [marksheetPhoto, setMarksheetPhoto] = useState<File | null>(null);
    const [password, setPassword] = useState("");
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Fetch active vendor plans
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { collection, query, where, getDocs } = await import("firebase/firestore");
                const q = query(collection(db, "plans"), where("role", "==", "vendor"), where("isActive", "==", true));
                const snapshot = await getDocs(q);
                const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => a.price - b.price);
                setPlans(fetchedPlans);
                if (fetchedPlans.length > 0) {
                    setSelectedPlan(fetchedPlans[0].id);
                }
            } catch (error) {
                console.error("Error fetching plans:", error);
            }
        };
        fetchPlans();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create or Login User
            let user;
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;

                await updateProfile(user, { displayName: name });

                let marksheetUrl = "";
                if (marksheetPhoto && user) {
                    const fileRef = ref(storage, `vendor_docs/${user.uid}/${Date.now()}_${marksheetPhoto.name}`);
                    await uploadBytes(fileRef, marksheetPhoto);
                    marksheetUrl = await getDownloadURL(fileRef);
                }

                // 2. Create Initial Firestore Doc
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    email: email,
                    phone: phone,
                    pan: pan,
                    aadhar: aadhar,
                    address: address,
                    marksheetPhoto: marksheetUrl,
                    role: "pending_vendor", // Will be updated to "vendor" after payment
                    createdAt: new Date(),
                });
            } catch (authError: any) {
                if (authError.code === 'auth/email-already-in-use') {
                    try {
                        toast.loading("Email found. Re-authenticating...", { id: "auth" });
                        const signInCredential = await signInWithEmailAndPassword(auth, email, password);
                        user = signInCredential.user;
                        toast.dismiss("auth");
                        
                        const userDoc = await getDoc(doc(db, "users", user.uid));
                        if (userDoc.exists() && userDoc.data().role === "vendor") {
                            toast.error("You are already an active vendor. Redirecting to login...");
                            setLoading(false);
                            setTimeout(() => router.push("/auth/vendor/login"), 2000);
                            return;
                        }
                    } catch (signInError: any) {
                        toast.dismiss("auth");
                        toast.error("Account exists. Please use correct password or login.");
                        setLoading(false);
                        return;
                    }
                } else {
                    throw authError;
                }
            }

            // 3. Initiate Razorpay Payment
            const plan = plans.find(p => p.id === selectedPlan);
            if (!plan) throw new Error("Invalid plan selected");

            const response = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: plan.price,
                    userId: user.uid,
                    plan: plan.id
                })
            });

            const orderData = await response.json();

            if (response.ok) {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "Janseva Kendra Portal",
                    description: `Subscription for ${plan.name}`,
                    order_id: orderData.id,
                    handler: async function (response: any) {
                        toast.loading("Verifying payment...", { id: "verify" });
                        try {
                            const verifyRes = await fetch("/api/razorpay/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    transactionId: orderData.transactionId
                                })
                            });
                            
                            const verifyData = await verifyRes.json();
                            
                            if (verifyData.success) {
                                toast.success("Payment successful!", { id: "verify" });
                                router.push("/vendor/dashboard?payment=success");
                            } else {
                                toast.error("Payment verification failed", { id: "verify" });
                            }
                        } catch (err: any) {
                            toast.error("Error verifying payment", { id: "verify" });
                        }
                    },
                    prefill: {
                        name: name,
                        email: email,
                        contact: phone
                    },
                    theme: {
                        color: "#1e3a8a" // Tailwind blue-900
                    }
                };
                
                const rzp1 = new (window as any).Razorpay(options);
                rzp1.on("payment.failed", function (response: any) {
                    toast.error(response.error.description || "Payment failed");
                });
                rzp1.open();
                setLoading(false); 
            } else {
                toast.error(orderData.error || "Could not initiate payment");
                setLoading(false);
            }

        } catch (error: any) {
            console.error("Full signup error:", error);
            toast.error(error.message || "Registration failed. Try again.");
            setLoading(false);
        }
    };

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-blue-900 uppercase">
                        Employee Registration
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Select a plan and register to start managing Janseva Kendra forms
                    </p>
                </div>

                <form className="mt-8 space-y-8" onSubmit={handleSignup}>
                    {/* Plans Grid */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Choose your Subscription Plan</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {plans.length === 0 ? (
                                <div className="col-span-3 text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                                    Loading subscription plans...
                                </div>
                            ) : plans.map((plan) => (
                                <div 
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all ${
                                        selectedPlan === plan.id 
                                            ? "border-blue-600 bg-blue-50/50 shadow-md" 
                                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {selectedPlan === plan.id && (
                                        <div className="absolute top-4 right-4 text-blue-600">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                    <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                                    <div className="mt-4 flex items-baseline text-3xl font-extrabold text-blue-900">
                                        ₹{plan.price}
                                        {plan.originalPrice > plan.price && (
                                            <span className="ml-2 text-lg text-gray-400 line-through font-medium">₹{plan.originalPrice}</span>
                                        )}
                                    </div>
                                    <ul className="mt-4 space-y-2">
                                        {plan.features?.map((feature: string, idx: number) => (
                                            <li key={idx} className="flex items-start">
                                                <span className="text-blue-500 mr-2">✓</span>
                                                <span className="text-sm text-gray-600 leading-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                        <div className="max-w-md mx-auto space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name (Kendra Name)</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email address</label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    pattern="[0-9]{10}"
                                    className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="10-digit mobile number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">PAN Card No</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase"
                                    value={pan}
                                    onChange={(e) => setPan(e.target.value)}
                                    placeholder="ABCDE1234F"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Aadhar Card No</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={aadhar}
                                    onChange={(e) => setAadhar(e.target.value)}
                                    placeholder="12-digit number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Address</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Your full address here"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">10th Marksheet Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setMarksheetPhoto(e.target.files[0]);
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || plans.length === 0 || !selectedPlan}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 transition-colors mt-6"
                            >
                                {loading ? "Processing..." : `Pay ₹${plans.find(p => p.id === selectedPlan)?.price || '0'} & Register`}
                            </button>
                            
                            <div className="text-center text-sm pt-4">
                                <span className="text-gray-600">Already a Vendor? </span>
                                <Link href="/auth/vendor/login" className="font-medium text-blue-900 hover:text-blue-800">
                                    Login Here
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        </>
    );
}
