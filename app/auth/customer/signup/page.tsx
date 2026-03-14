"use client";

import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import Script from "next/script";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CustomerSignup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [plansLoading, setPlansLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const q = query(
                    collection(db, "plans"), 
                    where("role", "==", "student"),
                    where("isActive", "==", true)
                );
                const querySnapshot = await getDocs(q);
                const planData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort by price
                planData.sort((a: any, b: any) => a.price - b.price);
                setPlans(planData);
                
                // Select first plan by default
                if (planData.length > 0) {
                    setSelectedPlanId(planData[0].id);
                }
            } catch (error) {
                console.error("Error fetching student plans:", error);
            } finally {
                setPlansLoading(false);
            }
        };

        fetchPlans();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const selectedPlan = plans.find(p => p.id === selectedPlanId);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile
            await updateProfile(user, { displayName: name });

            const studentId = `STU${Math.floor(1000000 + Math.random() * 9000000)}`;

            // Create user document in Firestore - initial state
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                studentId: studentId,
                name: name,
                email: email,
                role: "pending_customer", // Becomes "customer" after payment
                createdAt: new Date(),
            });

            // If a plan is selected and it has a price, initiate Razorpay
            if (selectedPlan && selectedPlan.price > 0) {
                const response = await fetch("/api/razorpay/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: selectedPlan.price,
                        userId: user.uid,
                        plan: selectedPlan.id
                    })
                });

                const orderData = await response.json();

                if (response.ok) {
                    const options = {
                        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                        amount: orderData.amount,
                        currency: orderData.currency,
                        name: "Janseva Kendra Portal",
                        description: `Student Subscription: ${selectedPlan.name}`,
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
                                    toast.success("Payment successful! Welcome aboard.", { id: "verify" });
                                    router.push("/customer/dashboard?payment=success");
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
                        },
                        theme: { color: "#1e3a8a" }
                    };
                    
                    const rzp = new window.Razorpay(options);
                    rzp.open();
                    setLoading(false);
                    return;
                } else {
                    toast.error(orderData.error || "Could not initiate payment");
                }
            } else {
                // If free plan or no plan selected, update to active customer directly
                const { updateDoc } = await import("firebase/firestore");
                await updateDoc(doc(db, "users", user.uid), {
                    role: "customer",
                    subscriptionPlan: selectedPlan?.price?.toString() || "0",
                    formsAllowed: selectedPlan?.formsAllowed || 0,
                    planExpiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                });
                toast.success("Registration successful!");
                router.push("/");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-start justify-center">
                {/* Registration Form */}
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100 shrink-0">
                    <div>
                        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 uppercase">
                            Student Registration
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Create an account to apply for jobs easily
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="name" className="sr-only">Full Name</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Password (Min 6 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || (plans.length > 0 && !selectedPlanId)}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                                {loading ? "Registering..." : `Create Account ${selectedPlanId ? `& Subscribe` : ''}`}
                            </button>
                        </div>
                        
                        <div className="text-center text-sm">
                            <span className="text-gray-600">Already have an account? </span>
                            <Link href="/auth/customer/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Login Here
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Plans Section */}
                <div className="flex-1 space-y-6 w-full lg:max-w-xl">
                    <div className="text-left">
                        <h2 className="text-2xl font-bold text-gray-900 uppercase">Premium Member Plans</h2>
                        <p className="text-gray-600 mt-1">Unlock exclusive benefits and direct form filling assistance.</p>
                    </div>

                    {plansLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                        </div>
                    ) : plans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map((plan) => (
                                <div 
                                    key={plan.id} 
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`bg-white p-5 rounded-xl shadow-sm border-2 cursor-pointer transition-all ${
                                        selectedPlanId === plan.id 
                                            ? "border-blue-600 ring-2 ring-blue-100" 
                                            : "border-gray-100 hover:border-blue-200"
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                            selectedPlanId === plan.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {selectedPlanId === plan.id ? 'Selected' : 'Student Plan'}
                                        </div>
                                    </div>
                                    <div className="flex items-baseline mb-4">
                                        <span className="text-2xl font-extrabold text-blue-700">₹{plan.price}</span>
                                        {plan.originalPrice > plan.price && (
                                            <span className="ml-2 text-sm text-gray-400 line-through">₹{plan.originalPrice}</span>
                                        )}
                                    </div>
                                    <ul className="space-y-2 mb-2">
                                        {plan.features?.slice(0, 4).map((f: string, i: number) => (
                                            <li key={i} className="flex items-start text-xs text-gray-600">
                                                <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-2 shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
                            <p className="text-gray-500">More premium student plans coming soon!</p>
                        </div>
                    )}

                    <div className="bg-blue-900 p-6 rounded-xl text-white shadow-lg overflow-hidden relative">
                        <div className="relative z-10">
                            <h4 className="font-bold text-lg mb-2">Why join as a Premium Member?</h4>
                            <ul className="space-y-2 text-sm opacity-90">
                                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2" /> Direct assistance via WhatsApp/Call</li>
                                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2" /> Guaranteed error-free form filling</li>
                                <li className="flex items-center"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2" /> Instant notification on your mobile</li>
                            </ul>
                        </div>
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
