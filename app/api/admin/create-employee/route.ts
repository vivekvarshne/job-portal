import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
        }

        // Create user via Firebase Admin
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        // Create Firestore user doc with employee (vendor) role
        await setDoc(doc(db, "users", userRecord.uid), {
            uid: userRecord.uid,
            name: name,
            email: email,
            role: "vendor",
            formsFilled: 0,
            formsAllowed: -1,
            subscriptionPlan: "Admin Assigned",
            createdAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: "Employee created successfully",
            uid: userRecord.uid,
        });

    } catch (error: any) {
        console.error("Create employee error:", error);

        if (error.code === "auth/email-already-exists") {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        return NextResponse.json(
            { error: error.message || "Failed to create employee" },
            { status: 500 }
        );
    }
}
