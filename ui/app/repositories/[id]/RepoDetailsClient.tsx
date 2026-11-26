"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Tag as TagIcon,
  HardDrive,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  AlertCircle,
  FolderGit2,
} from "lucide-react";
import RepoIcon from "@/components/RepoIcon";
import CreateTagModal from "@/components/CreateTagModal";
import {
  api,
  API_BASE_URL,
  Repository,
  TagItem,
  BlobItem,
} from "@/lib/api";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function RepoDetailsClient() {
  const params = useParams<{ id: string }>();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const repoId = rawId ? decodeURIComponent(rawId) : "";

  const [repo, setRepo] = useState<Repository | null>(null);
  const [activeTab, setActiveTab] = useState<"tags" | "blobs">("tags");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [blobs, setBlobs] = useState<BlobItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(repoId));
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);

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
    if (!repoId) return;

    let isCancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setErrorMsg("");

      try {
        const [reposRes, tagsRes, blobsRes] = await Promise.all([
          api.getRepositories(),
          api.getTags(repoId),
          api.getBlobs(repoId),
        ]);

        if (isCancelled) return;

        if (reposRes.RES && Array.isArray(reposRes.data)) {
          const matched =
            reposRes.data.find((r) => String(r.id) === String(repoId)) ?? null;
          setRepo(matched);
        } else {
          setRepo(null);
          if (!reposRes.RES && reposRes.msg) {
            setErrorMsg(reposRes.msg);
          }
        }

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
      } catch {
        if (!isCancelled) {
          setErrorMsg("Failed to connect to API server at " + API_BASE_URL);
        }
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
  }, [repoId, refreshKey]);

  return (
    <div className="w-full space-y-6">
      {/* Top Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Repositories</span>
        </Link>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh repository details"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading State (initial load before repo is resolved) */}
      {isLoading && !repo ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center text-xs text-zinc-500">
          Loading repository details...
        </div>
      ) : !repo ? (
        /* Not Found State */
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Repository not found
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              The requested repository could not be found or you do not have access to it.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Repositories</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Repository Overview Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3.5 min-w-0">
                <RepoIcon src={repo.icon} name={repo.name} size="lg" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {repo.name}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      Repository Details
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {repo.description || "No description provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Repository Meta Info Bar */}
            <div className="px-6 py-4 bg-zinc-50/40 dark:bg-zinc-950/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 text-[11px] block">Tags</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5">
                  <TagIcon className="w-3.5 h-3.5 text-zinc-400" />
                  {repo.tag_count ?? tags.length}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 text-[11px] block">
                  Manifests
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  {repo.manifest_count ?? 0}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 text-[11px] block">
                  Created At
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {repo.created_at
                    ? new Date(repo.created_at).toLocaleString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 text-[11px] block">
                  Updated At
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {repo.updated_at
                    ? new Date(repo.updated_at).toLocaleString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Tags & Blobs Card */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
            {/* Tabs Navigation */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 pt-3 flex items-center justify-between gap-4">
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

              {activeTab === "tags" && (
                <button
                  type="button"
                  onClick={() => setIsCreateTagOpen(true)}
                  className="mb-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === "tags" && (
              <div className="overflow-x-auto">
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
                        <td
                          colSpan={4}
                          className="p-8 text-center text-zinc-500"
                        >
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
                                    `page-tag-${tag.id}`
                                  )
                                }
                                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                                title="Copy digest"
                              >
                                {copiedKey === `page-tag-${tag.id}` ? (
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
                          <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">
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
              <div className="overflow-x-auto">
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
                        <td
                          colSpan={4}
                          className="p-8 text-center text-zinc-500"
                        >
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
                                    `page-blob-${blob.digest}`
                                  )
                                }
                                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
                                title="Copy full digest"
                              >
                                {copiedKey === `page-blob-${blob.digest}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                            {formatBytes(blob.size)}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-zinc-500 truncate max-w-sm">
                            {blob.storage_path}
                          </td>
                          <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">
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

          {/* Add Tag Modal */}
          <CreateTagModal
            key={repo.id}
            isOpen={isCreateTagOpen}
            onClose={() => setIsCreateTagOpen(false)}
            repositories={[repo]}
            selectedRepoId={repo.id}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  );
}
