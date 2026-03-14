"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";

interface AdBannerProps {
    position: "header" | "sidebar" | "footer" | "apply_page" | "job_top" | "job_bottom" | "dashboard_top" | "dashboard_bottom";
}

export default function AdBanner({ position }: AdBannerProps) {
    const [ads, setAds] = useState<any[]>([]);
    const [isPremium, setIsPremium] = useState<boolean | null>(null);

    useEffect(() => {
        // Check User Status: If ANY user is logged in, hide ads
        const checkUserStatus = async () => {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", user.uid));
                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            const hasActivePlan = data.subscriptionPlan && data.subscriptionPlan !== "0";
                            const isNotExpired = data.planExpiryDate && data.planExpiryDate.toDate() > new Date();
                            const formCompleted = data.formCompleted === true;

                            if ((hasActivePlan && isNotExpired) || formCompleted) {
                                setIsPremium(true);
                                return;
                            }
                        }
                    } catch (err) {
                        console.error("Error checking premium status:", err);
                    }
                }
                setIsPremium(false);
            });
        };

        checkUserStatus();
    }, []);

    useEffect(() => {
        // Fetch Ads
        const fetchAds = async () => {
            try {
                const q = query(
                    collection(db, "ads"), 
                    where("isActive", "==", true),
                    where("position", "==", position)
                );
                const snapshot = await getDocs(q);
                const fetchedAds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // If there are multiple ads for this position, pick a random one or rotate them. 
                // For now, we'll just pick the first one or show all if it's a sidebar.
                // Let's show the first matching ad for header/footer, and a stack for sidebar.
                setAds(fetchedAds);
            } catch (err) {
                console.error("Error fetching ads", err);
            }
        };

        if (isPremium === false) { // Only fetch if we know they aren't premium
            fetchAds();
        }
    }, [position, isPremium]);

    if (isPremium === null || isPremium === true || ads.length === 0) {
        return null;
    }

    const adToDisplay = ads[Math.floor(Math.random() * ads.length)]; // Randomize if multiple

    return (
        <div className={`w-full overflow-hidden my-4 flex flex-col justify-center items-center relative group`}>
            {/* Optional Ad Text (no default "ADVERTISEMENT" label) */}
            {adToDisplay.adText && (
                <div className="text-gray-500 text-xs mb-1 w-full text-center">
                    {adToDisplay.adText}
                </div>
            )}
            
            <a href={adToDisplay.targetUrl || "#"} target="_blank" rel="noopener noreferrer" className="block w-full">
                <img 
                    src={adToDisplay.imageUrl} 
                    alt={adToDisplay.title || "Advertisement"} 
                    className={`w-full object-cover rounded-lg shadow-sm border border-gray-100 transition-opacity hover:opacity-95 ${
                        position === 'sidebar' ? 'max-h-96' : 
                        position === 'apply_page' ? 'max-h-64' :
                        'max-h-32 md:max-h-48'
                    }`}
                />
            </a>
        </div>
    );
}
