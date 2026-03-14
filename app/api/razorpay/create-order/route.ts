import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, userId, plan } = body;

        if (!amount || !userId || !plan) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create transaction ID early to link with the order
        const transactionId = "TXN" + Date.now() + Math.floor(Math.random() * 1000);

        // Create Razorpay Order
        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: transactionId,
            notes: {
                transactionId: transactionId,
            }
        };

        const order = await razorpay.orders.create(options);

        // Save pending transaction to Firestore via Client SDK
        const txRef = doc(db, "transactions", transactionId);
        await setDoc(txRef, {
            transactionId,
            userId,
            plan,
            amount,
            status: "PENDING",
            orderId: order.id,
            createdAt: new Date(),
        });

        console.log("Initiated Razorpay order:", order.id, "Amount:", amount);

        return NextResponse.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            transactionId,
        });

    } catch (error: any) {
        console.error("Razorpay order creation error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
