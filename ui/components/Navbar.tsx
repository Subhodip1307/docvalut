"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Vault, User, LogOut, KeyRound } from "lucide-react";
import { api, UserProfile } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadNavbarProfile() {
      try {
        const res = await api.getMyProfile();
        if (!isCancelled && res.RES && res.data) {
          setProfile(res.data);
        }
      } catch {
        if (!isCancelled && typeof window !== "undefined") {
          const u = localStorage.getItem("username");
          if (u) {
            setProfile({ username: u });
          }
        }
      }
    }
    loadNavbarProfile();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsProfileOpen(false);
      await api.logout();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const displayName =
    profile?.full_name?.trim() || profile?.username?.trim() || "";
  const displayEmail = profile?.email?.trim() || "";

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
          <Vault className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
            DocVault
          </span>
          <span className="text-[11px] text-zinc-500 font-medium">
            Document Hub
          </span>
        </div>
      </Link>

      {/* Right: Profile Icon & Dropdown Popup */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          aria-label="User Profile"
          aria-expanded={isProfileOpen}
          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          <User className="w-5 h-5" />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full"></span>
        </button>

        {/* Profile Popup Menu */}
        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg py-1.5 z-50">
            {/* User Info Header */}
            {(displayName || displayEmail) && (
              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="block px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-t-lg transition-colors"
              >
                {displayName && (
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {displayName}
                  </p>
                )}
                {displayEmail && (
                  <p className="text-[11px] text-zinc-500 truncate">
                    {displayEmail}
                  </p>
                )}
              </Link>
            )}

            {/* Option 1: My Profile */}
            <Link
              href="/profile"
              onClick={() => setIsProfileOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors text-left"
            >
              <User className="w-4 h-4 text-zinc-500" />
              <span>My Profile</span>
            </Link>

            {/* Option 2: Access Token */}
            <Link
              href="/access-token"
              onClick={() => setIsProfileOpen(false)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors text-left"
            >
              <KeyRound className="w-4 h-4 text-zinc-500" />
              <span>Access Token</span>
            </Link>

            {/* Option 3: Log Out */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
