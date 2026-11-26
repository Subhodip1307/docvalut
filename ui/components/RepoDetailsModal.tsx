"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tag as TagIcon,
  HardDrive,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Clock,
  Layers,
} from "lucide-react";
import RepoIcon from "@/components/RepoIcon";
import { api, Repository, TagItem, BlobItem } from "@/lib/api";

interface RepoDetailsModalProps {
  repo: Repository | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTag?: (repoId: string) => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function RepoDetailsModal({
  repo,
  isOpen,
  onClose,
  onOpenCreateTag,
}: RepoDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"tags" | "blobs">("tags");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [blobs, setBlobs] = useState<BlobItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    if (!isOpen || !repo) return;
    const repoId = repo.id;
    let isCancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [tagsRes, blobsRes] = await Promise.all([
          api.getTags(repoId),
          api.getBlobs(repoId),
        ]);

        if (!isCancelled) {
          if (tagsRes.RES && Array.isArray(tagsRes.data)) {
            setTags(tagsRes.data);
          } else {
            setTags([]);
          }

          if (blobsRes.RES && Array.isArray(blobsRes.data)) {
            setBlobs(blobsRes.data);
          } else {
            setBlobs([]);
          }
        }
      } catch {
        // Handled silently
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, repo, refreshKey]);

  if (!isOpen || !repo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <RepoIcon src={repo.icon} name={repo.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {repo.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  Repository Details
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {repo.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Refresh repository details"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Repository Meta Info Bar */}
        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-zinc-400 text-[11px] block">Tags</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
              <TagIcon className="w-3 h-3 text-zinc-400" />
              {repo.tag_count ?? tags.length}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 text-[11px] block">Manifests</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
              <Layers className="w-3 h-3 text-zinc-400" />
              {repo.manifest_count ?? 0}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 text-[11px] block">Created At</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-zinc-400" />
              {repo.created_at
                ? new Date(repo.created_at).toLocaleString()
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 text-[11px] block">Updated At</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-zinc-400" />
              {repo.updated_at
                ? new Date(repo.updated_at).toLocaleString()
                : "—"}
            </span>
          </div>
        </div>

        {/* Details Tabs Navigation */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 pt-3 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("tags")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === "tags"
                  ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/40"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>Tags ({tags.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("blobs")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === "blobs"
                  ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800/40"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Blobs ({blobs.length})</span>
            </button>
          </div>

          {activeTab === "tags" && onOpenCreateTag && (
            <button
              type="button"
              onClick={() => onOpenCreateTag(repo.id)}
              className="mb-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tag</span>
            </button>
          )}
        </div>

        {/* Modal Body with Tags or Blobs */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "tags" && (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tag</th>
                    <th className="px-4 py-3 font-medium">Manifest Digest</th>
                    <th className="px-4 py-3 font-medium">Media Type</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {tags.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500">
                        {isLoading
                          ? "Loading tags..."
                          : "No tags found for this repository."}
                      </td>
                    </tr>
                  ) : (
                    tags.map((tag) => (
                      <tr
                        key={tag.id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">
                            <TagIcon className="w-3 h-3 text-zinc-400" />
                            {tag.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-zinc-500">
                          <div className="flex items-center gap-1.5">
                            <span>
                              {tag.manifest_digest
                                ? tag.manifest_digest.slice(0, 24) + "..."
                                : tag.manifest}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  tag.manifest_digest || tag.manifest,
                                  `modal-tag-${tag.id}`
                                )
                              }
                              className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                              title="Copy digest"
                            >
                              {copiedKey === `modal-tag-${tag.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-zinc-400 truncate max-w-xs">
                          {tag.manifest_media_type ||
                            "application/vnd.docker.distribution.manifest.v2+json"}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-[11px]">
                          {tag.updated_at
                            ? new Date(tag.updated_at).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "blobs" && (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Digest</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Storage Path</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {blobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500">
                        {isLoading
                          ? "Loading blobs..."
                          : "No blobs found for this repository."}
                      </td>
                    </tr>
                  ) : (
                    blobs.map((blob) => (
                      <tr
                        key={blob.digest}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-[11px] text-zinc-900 dark:text-zinc-100">
                          <div className="flex items-center gap-1.5">
                            <span>{blob.digest.slice(0, 24)}...</span>
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  blob.digest,
                                  `modal-blob-${blob.digest}`
                                )
                              }
                              className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                              title="Copy full digest"
                            >
                              {copiedKey === `modal-blob-${blob.digest}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
                          {formatBytes(blob.size)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-zinc-500 truncate max-w-sm">
                          {blob.storage_path}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-[11px]">
                          {blob.created_at
                            ? new Date(blob.created_at).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
