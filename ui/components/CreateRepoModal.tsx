"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  X,
  FolderPlus,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";

interface CreateRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_ICON_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CreateRepoModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateRepoModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (iconPreview) {
        URL.revokeObjectURL(iconPreview);
      }
    };
  }, [iconPreview]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setErrorMessage("");
    setIsDragging(false);
    onClose();
  };

  const handleIconSelect = (file: File | null) => {
    if (!file) return;

    const isImageFile =
      file.type.startsWith("image/") ||
      /\.(png|jpe?g|gif|webp|svg|ico|avif)$/i.test(file.name);

    if (!isImageFile) {
      setErrorMessage(
        "Please select a valid image file (PNG, JPG, GIF, WebP, or SVG)."
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_ICON_SIZE_BYTES) {
      setErrorMessage("Icon image must be 5 MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setErrorMessage("");
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleIconSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0] ?? null;
    handleIconSelect(file);
  };

  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await api.createRepository({
        name,
        description,
        icon: iconFile,
      });

      if (res.RES) {
        setName("");
        setDescription("");
        handleRemoveIcon();
        onSuccess?.();
        onClose();
      } else {
        setErrorMessage(res.msg || "Failed to create repository.");
      }
    } catch {
      setErrorMessage("Network error: Could not reach API server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                Create a new repository
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Set up a new document repository for your team.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Repo Name */}
          <div>
            <label
              htmlFor="repo-name"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Repository name <span className="text-red-500">*</span>
            </label>
            <input
              id="repo-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. project-documentation"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="repo-description"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Description{" "}
              <span className="text-zinc-400 font-normal lowercase">
                (optional)
              </span>
            </label>
            <textarea
              id="repo-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this repository..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all resize-none"
            />
          </div>

          {/* Repository Icon Upload */}
          <div>
            <label
              htmlFor="repo-icon"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Repository icon{" "}
              <span className="text-zinc-400 font-normal lowercase">
                (optional)
              </span>
            </label>

            <input
              ref={fileInputRef}
              id="repo-icon"
              type="file"
              accept="image/*"
              disabled={isLoading}
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div
              role="button"
              tabIndex={isLoading ? -1 : 0}
              aria-label="Upload repository icon"
              onClick={() => !isLoading && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (!isLoading && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex items-center gap-3.5 p-3 rounded-xl border border-dashed transition-all ${
                isLoading
                  ? "opacity-60 cursor-not-allowed border-zinc-300 dark:border-zinc-700"
                  : isDragging
                    ? "cursor-pointer border-zinc-900 dark:border-zinc-100 bg-zinc-100/80 dark:bg-zinc-800/70"
                    : "cursor-pointer border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/30"
              }`}
            >
              {/* Icon Preview Thumbnail */}
              <div className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                {iconPreview ? (
                  <Image
                    src={iconPreview}
                    alt="Repository icon preview"
                    width={48}
                    height={48}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-zinc-400" />
                )}
              </div>

              {/* File details or upload prompt */}
              <div className="flex-1 min-w-0">
                {iconFile ? (
                  <>
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {iconFile.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {formatFileSize(iconFile.size)} &middot; Click or drop to replace
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>Click to upload or drag &amp; drop</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      PNG, JPG, WebP, GIF, or SVG (max 5 MB)
                    </p>
                  </>
                )}
              </div>

              {/* Remove Icon Button */}
              {iconFile && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveIcon();
                  }}
                  aria-label="Remove selected icon"
                  title="Remove icon"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
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
              {isLoading ? "Creating..." : "Create repository"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
