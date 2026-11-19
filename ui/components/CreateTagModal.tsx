"use client";

import React, { useState } from "react";
import { X, Tag, AlertCircle } from "lucide-react";
import { api, Repository } from "@/lib/api";

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: Repository[];
  selectedRepoId?: string;
  onSuccess?: () => void;
}

export default function CreateTagModal({
  isOpen,
  onClose,
  repositories,
  selectedRepoId,
  onSuccess,
}: CreateTagModalProps) {
  const [repository, setRepository] = useState(selectedRepoId || repositories[0]?.id || "");
  const [name, setName] = useState("");
  const [manifest, setManifest] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await api.createTag({
        repository: repository || selectedRepoId || repositories[0]?.id,
        name,
        manifest,
      });

      if (res.RES) {
        setName("");
        setManifest("");
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.msg || "Failed to create tag.");
      }
    } catch {
      setErrorMessage("Network error: Could not reach API server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                Create new tag
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Assign a tag name to an image manifest in a repository.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="tag-repo"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Repository <span className="text-red-500">*</span>
            </label>
            <select
              id="tag-repo"
              required
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all cursor-pointer"
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id.slice(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="tag-name"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Tag name <span className="text-red-500">*</span>
            </label>
            <input
              id="tag-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. latest or v1.0.0"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="tag-manifest"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Manifest digest <span className="text-red-500">*</span>
            </label>
            <input
              id="tag-manifest"
              type="text"
              required
              value={manifest}
              onChange={(e) => setManifest(e.target.value)}
              placeholder="sha256:def456..."
              className="w-full px-3 py-2 text-sm font-mono text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Saving..." : "Save tag"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
