"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Pencil, RefreshCw, FolderGit2, AlertCircle } from "lucide-react";
import { api, resolveAssetUrl, Repository } from "@/lib/api";

interface RepoIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: Repository;
  onSuccess: (newIconUrl?: string | null) => void;
}

export default function RepoIconModal({
  isOpen,
  onClose,
  repo,
  onSuccess,
}: RepoIconModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imgLoadFailed, setImgLoadFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null);
      setErrorMessage("");
      setImgLoadFailed(false);
    }
  }, [isOpen, repo.icon]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  const currentIconUrl = repo.icon ? resolveAssetUrl(repo.icon) : null;
  const displayUrl = previewUrl || (imgLoadFailed ? null : currentIconUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const res = await api.editRepoIcon(repo.id, file);
      if (res && res.RES) {
        const updatedIcon =
          res.data && typeof res.data === "object" && "icon" in res.data
            ? (res.data.icon as string)
            : localUrl;

        onSuccess(updatedIcon);
        onClose();
      } else {
        setErrorMessage(res?.msg || "Failed to update repository icon.");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to connect to API server."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}


        {/* Circular Icon Container with Edit Icon */}
        <div className="relative group">
          <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full border-4 border-white dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-2xl flex items-center justify-center">
            {displayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayUrl}
                alt={repo.name}
                onError={() => setImgLoadFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <FolderGit2 className="w-20 h-20 text-zinc-400" />
            )}
          </div>

          {/* Edit Icon Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-2 right-2 p-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-xl border-2 border-white dark:border-zinc-900 transition-all hover:scale-110 cursor-pointer disabled:opacity-50"
            title="Edit icon"
          >
            {isUploading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Pencil className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Error message if upload fails */}
        {errorMessage && (
          <div className="mt-4 px-3.5 py-2 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2 max-w-xs text-center shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
