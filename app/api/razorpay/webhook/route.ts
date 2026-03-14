import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.text(); // Read raw body for webhook verification
        const signature = req.headers.get("x-razorpay-signature");
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("Webhook signature mismatch.");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);

        if (event.event === "payment.captured") {
            const paymentEntity = event.payload.payment.entity;
            // The receipt field in our order creation holds our transactionId
            // However, payment.captured might not have receipt directly if it's tied to order.
            // Let's assume we pass transactionId in notes during order creation, OR extract it.
            // Razorpay payment entity has an `order_id`. We need to find the transaction by order_id.
            
            // Wait, we saved orderId in the transaction document during create-order!
            // We need to query Firestore. But we are using the client SDK, which requires fetching all or querying.
            // Let's use firebase-admin if available, or just standard firestore queries.
            
            // Fortunately, `notes` can be passed in Razorpay.
            // To make it foolproof without querying by orderId, we can pass transactionId in `notes` during order creation or checkout.
            // For now, let's assume `notes.transactionId` is present.
            const transactionId = paymentEntity.notes?.transactionId;

            if (!transactionId) {
                console.error("Webhook: Transaction ID not found in notes.");
                return NextResponse.json({ error: "Transaction ID missing" }, { status: 400 });
            }

            const txRef = doc(db, "transactions", transactionId);
            const txDoc = await getDoc(txRef);

            if (txDoc.exists()) {
                const txData = txDoc.data();

                if (txData.status !== "SUCCESS") {
                    await updateDoc(txRef, {
                        status: "SUCCESS",
                        razorpayPaymentId: paymentEntity.id,
                        updatedAt: new Date(),
                    });

                    // Compute Expiry (30 days from now)
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 30);

                    let formsAllowed = 0;
                    if (txData.plan === "500") formsAllowed = 50;
                    if (txData.plan === "999") formsAllowed = 100;
                    if (txData.plan === "1999") formsAllowed = -1;

                    if (txData.userId) {
                        const userRef = doc(db, "users", txData.userId);
                        await updateDoc(userRef, {
                            role: "vendor",
                            subscriptionPlan: txData.plan,
                            formsAllowed: formsAllowed,
                            formsFilled: 0,
                            planExpiryDate: expiryDate,
                            updatedAt: new Date(),
                        });
                    }
                    console.log(`Webhook: Transaction ${transactionId} marked as SUCCESS.`);
                } else {
                    console.log(`Webhook: Transaction ${transactionId} was already SUCCESS.`);
                }
            }
        }

        return NextResponse.json({ status: "ok" });

    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
    }
}
