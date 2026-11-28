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
  FileText,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import RepoIcon from "@/components/RepoIcon";
import CreateTagModal from "@/components/CreateTagModal";
import RepoIconModal from "@/components/RepoIconModal";
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

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong
          key={match.index}
          className="font-semibold text-zinc-900 dark:text-zinc-100"
        >
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      token.startsWith("[") &&
      token.includes("](") &&
      token.endsWith(")")
    ) {
      const linkText = token.slice(1, token.indexOf("]("));
      const linkUrl = token.slice(token.indexOf("](") + 2, -1);
      parts.push(
        <a
          key={match.index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {linkText}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function SimpleMarkdownRenderer({ content }: { content: string }) {
  if (!content || !content.trim()) {
    return (
      <div className="py-6 text-center text-xs text-zinc-400 italic">
        No markdown documentation provided for this repository.
      </div>
    );
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <div
            key={`code-${i}`}
            className="my-3 p-3.5 rounded-lg bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800"
          >
            <pre className="whitespace-pre">{codeBlockLines.join("\n")}</pre>
          </div>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2 pb-1 border-b border-zinc-200 dark:border-zinc-800"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-3.5 mb-1.5 pb-1 border-b border-zinc-200 dark:border-zinc-800"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-3 mb-1"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-2 pl-3 border-l-2 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 italic text-xs"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      elements.push(
        <li
          key={`li-${i}`}
          className="ml-5 list-disc text-xs text-zinc-700 dark:text-zinc-300 my-0.5"
        >
          {renderInline(line.trim().slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line.trim())) {
      elements.push(
        <li
          key={`oli-${i}`}
          className="ml-5 list-decimal text-xs text-zinc-700 dark:text-zinc-300 my-0.5"
        >
          {renderInline(line.trim().replace(/^\d+\.\s/, ""))}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={`sp-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p
          key={`p-${i}`}
          className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed my-1"
        >
          {renderInline(line)}
        </p>
      );
    }
  }

  if (inCodeBlock && codeBlockLines.length > 0) {
    elements.push(
      <div
        key="code-end"
        className="my-3 p-3.5 rounded-lg bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800"
      >
        <pre className="whitespace-pre">{codeBlockLines.join("\n")}</pre>
      </div>
    );
  }

  return <div className="space-y-0.5 break-words">{elements}</div>;
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
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);

  const handleIconUpdated = (newIconUrl?: string | null) => {
    if (newIconUrl) {
      setRepo((prev) => (prev ? { ...prev, icon: newIconUrl } : prev));
    }
    handleRefresh();
  };

  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");
  const [editMarkdownTab, setEditMarkdownTab] = useState<"write" | "preview">("write");
  const [isSavingMarkdown, setIsSavingMarkdown] = useState(false);
  const [markdownSaveError, setMarkdownSaveError] = useState("");
  const [markdownSuccessToast, setMarkdownSuccessToast] = useState("");

  const handleStartEditMarkdown = () => {
    setMarkdownInput(repo?.markdown || "");
    setMarkdownSaveError("");
    setEditMarkdownTab("write");
    setIsEditingMarkdown(true);
  };

  const handleCancelEditMarkdown = () => {
    setIsEditingMarkdown(false);
    setMarkdownSaveError("");
  };

  const handleSaveMarkdown = async () => {
    if (!repo) return;
    setIsSavingMarkdown(true);
    setMarkdownSaveError("");
    try {
      const res = await api.editMarkdown(repo.id, markdownInput);
      if (res && res.RES) {
        setRepo((prev) => (prev ? { ...prev, markdown: markdownInput } : prev));
        setIsEditingMarkdown(false);
        setMarkdownSuccessToast("README saved successfully!");
        setTimeout(() => setMarkdownSuccessToast(""), 3000);
      } else {
        setMarkdownSaveError(res?.msg || "Failed to update repository markdown.");
      }
    } catch (err: unknown) {
      setMarkdownSaveError(
        err instanceof Error ? err.message : "Failed to update markdown."
      );
    } finally {
      setIsSavingMarkdown(false);
    }
  };

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
        const [repoRes, tagsRes, blobsRes] = await Promise.all([
          api.getRepository(repoId),
          api.getTags(repoId),
          api.getBlobs(repoId),
        ]);

        if (isCancelled) return;

        let fetchedRepo: Repository | null = null;
        if (repoRes) {
          if (repoRes.RES && repoRes.data) {
            if (!Array.isArray(repoRes.data) && typeof repoRes.data === "object") {
              fetchedRepo = repoRes.data;
            } else if (Array.isArray(repoRes.data) && repoRes.data.length > 0) {
              fetchedRepo = repoRes.data[0];
            }
          } else if (
            (repoRes as unknown as Record<string, unknown>).id &&
            (repoRes as unknown as Record<string, unknown>).name
          ) {
            fetchedRepo = repoRes as unknown as Repository;
          }
        }

        if (fetchedRepo) {
          setRepo(fetchedRepo);
        } else {
          setRepo(null);
          if (repoRes && !repoRes.RES && repoRes.msg) {
            setErrorMsg(repoRes.msg);
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
                <button
                  type="button"
                  onClick={() => setIsIconModalOpen(true)}
                  className="relative group cursor-pointer focus:outline-none rounded-xl transition-all hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-600 shrink-0 text-left"
                  title="Click to view and edit repository icon"
                >
                  <RepoIcon src={repo.icon} name={repo.name} size="lg" />
                  <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white shadow-xs">
                    <Pencil className="w-3.5 h-3.5" />
                  </div>
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {repo.name}
                    </h1>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {repo.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Moor Push Command */}
              <div className="w-full sm:w-auto shrink-0 flex flex-col items-start sm:items-end gap-1.5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Moor Command to push a new tag to this repository
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 font-mono text-xs text-zinc-800 dark:text-zinc-200 shadow-xs">
                  <span className="select-all">moor push {repo.name}:tagname</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `moor push ${repo.name}:tagname`,
                        "moor-push-command"
                      )
                    }
                    className="cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors ml-1 p-0.5 rounded"
                    title="Copy command"
                  >
                    {copiedKey === "moor-push-command" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
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
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {tags.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
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
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  `${repo.name}:${tag.name}`,
                                  `repo-tag-name-${tag.id}`
                                )
                              }
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                              title={`Copy ${repo.name}:${tag.name}`}
                            >
                              {copiedKey === `repo-tag-name-${tag.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
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

          {/* Repository Markdown / README Section */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <h2 className="text-xs font-semibold tracking-wider text-zinc-700 dark:text-zinc-300">
                  Markdown
                </h2>
              </div>

              {!isEditingMarkdown && (
                <button
                  type="button"
                  onClick={handleStartEditMarkdown}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Success Toast */}
            {markdownSuccessToast && (
              <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{markdownSuccessToast}</span>
              </div>
            )}

            {/* Card Body */}
            <div className="p-6">
              {isEditingMarkdown ? (
                <div className="space-y-4">
                  {/* Write / Preview Tab switcher */}
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditMarkdownTab("write")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          editMarkdownTab === "write"
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMarkdownTab("preview")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          editMarkdownTab === "preview"
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Edit / Preview area */}
                  {editMarkdownTab === "write" ? (
                    <textarea
                      value={markdownInput}
                      onChange={(e) => setMarkdownInput(e.target.value)}
                      placeholder="Write repository documentation, instructions, or notes in markdown..."
                      rows={12}
                      className="w-full p-3.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 resize-y"
                    />
                  ) : (
                    <div className="min-h-[240px] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                      <SimpleMarkdownRenderer content={markdownInput} />
                    </div>
                  )}

                  {markdownSaveError && (
                    <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{markdownSaveError}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelEditMarkdown}
                      disabled={isSavingMarkdown}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMarkdown}
                      disabled={isSavingMarkdown}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSavingMarkdown && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>{isSavingMarkdown ? "Saving..." : "Save changes"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <SimpleMarkdownRenderer content={repo.markdown || ""} />
              )}
            </div>
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

          {/* Edit Repo Icon Modal */}
          <RepoIconModal
            isOpen={isIconModalOpen}
            onClose={() => setIsIconModalOpen(false)}
            repo={repo}
            onSuccess={handleIconUpdated}
          />
        </>
      )}
    </div>
  );
}
