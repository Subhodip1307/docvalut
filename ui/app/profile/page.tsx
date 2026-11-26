"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  Mail,
  Camera,
  CheckCircle2,
  AtSign,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    company: "",
    gravatarEmail: "",
  });

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from GET /auth/my-profile/
  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await api.getMyProfile();
        if (!isCancelled && res.RES && res.data) {
          setFormData((prev) => ({
            ...prev,
            fullName: res.data?.full_name ?? "",
            username: res.data?.username ?? "",
            gravatarEmail: res.data?.email ?? "",
          }));
        }
      } catch {
        // Fallback to local username if API is unavailable
        if (!isCancelled) {
          const storedUser = localStorage.getItem("username");
          if (storedUser) {
            setFormData((prev) => ({
              ...prev,
              username: storedUser,
            }));
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 3000);
  };

  const handleCancel = () => {
    router.back();
  };

  const displayName = formData.fullName.trim() || formData.username.trim();
  const displayEmail = formData.gravatarEmail.trim();

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Profile Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your personal details and public profile information.
        </p>
      </div>

      {/* Success Notification */}
      {showSavedToast && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 transition-all animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">
            Profile changes saved successfully!
          </span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-semibold text-xl">
              {formData.fullName.trim() ? (
                formData.fullName
                  .trim()
                  .split(/\s+/)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              ) : formData.username.trim() ? (
                formData.username.trim().slice(0, 2).toUpperCase()
              ) : (
                <User className="w-6 h-6 text-zinc-400" />
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow hover:scale-105 transition-transform cursor-pointer"
              title="Change avatar via Gravatar"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            {displayName && (
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {displayName}
              </h2>
            )}
            {displayEmail && (
              <p className="text-sm text-zinc-500">{displayEmail}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {formData.username.trim() && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  <AtSign className="w-3 h-3" />
                  {formData.username.trim()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Public Information
            </h2>
          </div>
          {isLoading && (
            <span className="text-xs text-zinc-400 animate-pulse">Loading profile...</span>
          )}
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                />
              </div>
            </div>

            {/* 2. Company */}
            <div>
              <label
                htmlFor="company"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Company
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Enter your company"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                />
              </div>
            </div>

            {/* 3. Gravatar Email */}
            <div>
              <label
                htmlFor="gravatarEmail"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Gravatar email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="gravatarEmail"
                  name="gravatarEmail"
                  type="email"
                  value={formData.gravatarEmail}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                Your Gravatar email is used to display your profile picture across DocVault.
              </p>
            </div>
          </div>

          {/* Actions: Save and Cancel */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors shadow-xs cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
