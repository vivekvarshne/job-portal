import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = body;

        const secret = process.env.RAZORPAY_KEY_SECRET;

        // Verify Signature
        const generated_signature = crypto
            .createHmac("sha256", secret!)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        // Proceed to update Firestore
        const txRef = doc(db, "transactions", transactionId);
        const txDoc = await getDoc(txRef);

        if (!txDoc.exists()) {
             return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        const txData = txDoc.data();

        // Check if already SUCCESS (maybe webhook beat us to it)
        if (txData.status === "SUCCESS") {
             return NextResponse.json({ success: true, message: "Already successful" });
        }

        // Update transaction status
        await updateDoc(txRef, {
            status: "SUCCESS",
            razorpayPaymentId: razorpay_payment_id,
            updatedAt: new Date(),
        });

        // If it's a vendor or student plan purchase, update the user's role and plan details
        if (txData.plan && txData.plan !== "janseva_form") {
            // Fetch plan details from Firestore
            let formsAllowed = 0;
            let planRole = "vendor";
            const planDoc = await getDoc(doc(db, "plans", txData.plan));
            if (planDoc.exists()) {
                formsAllowed = planDoc.data().formsAllowed || 0;
                planRole = planDoc.data().role || "vendor";
            }

            // Compute Expiry (30 days from now for vendors, maybe 1 year for students)
            const expiryDate = new Date();
            if (planRole === "student") {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Student plans are usually yearly
            } else {
                expiryDate.setDate(expiryDate.getDate() + 30); // Vendor plans are monthly
            }

            if (txData.userId && txData.userId !== "guest") {
                const userRef = doc(db, "users", txData.userId);
                await updateDoc(userRef, {
                    role: planRole === "student" ? "customer" : "vendor",
                    subscriptionPlan: txData.plan,
                    formsAllowed: formsAllowed,
                    // Forms filled stays 0 if new, but we might want to preserve it if it's an upgrade
                    // For now, let's keep it simple
                    planExpiryDate: expiryDate,
                    updatedAt: new Date(),
                });
            }
        }

        return NextResponse.json({ success: true, message: "Payment verified successfully" });

    } catch (error: any) {
        console.error("Verification error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
