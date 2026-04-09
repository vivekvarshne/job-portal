"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown, LayoutDashboard, CreditCard } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface UserData {
  role: "vendor" | "customer";
  name?: string;
  subscriptionPlan?: string;
}

export default function AuthButtons() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsOpen(false);
  };

  if (loading) {
    return <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {user ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
        >
          <User className="h-4 w-4" />
          <span className="capitalize">{userData?.name || userData?.role || "My Account"}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <User className="h-4 w-4" />
          <span>Login / Register</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
          {user ? (
            <>
              {user?.email === "v753400@gmail.com" && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-blue-700 font-bold bg-blue-50 hover:bg-blue-100"
                >
                  <LayoutDashboard className="h-4 w-4 mr-3" />
                  Admin Dashboard
                </Link>
              )}
              {userData?.role === "vendor" && (
                <Link
                  href="/vendor/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <LayoutDashboard className="h-4 w-4 mr-3" />
                  Employee Dashboard
                </Link>
              )}
              {userData?.role === "customer" && (
                <Link
                  href="/customer/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <LayoutDashboard className="h-4 w-4 mr-3" />
                  My Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                For Students
              </div>
              <Link
                href="/auth/customer/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              >
                <User className="h-4 w-4 mr-3" />
                Customer Login
              </Link>
              <div className="border-t my-1"></div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                For Janseva Kendra
              </div>
              <Link
                href="/auth/vendor/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              >
                <CreditCard className="h-4 w-4 mr-3" />
                Employee Login
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
