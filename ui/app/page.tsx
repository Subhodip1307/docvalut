"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  FolderGit2,
  Tag as TagIcon,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import CreateRepoModal from "@/components/CreateRepoModal";
import CreateTagModal from "@/components/CreateTagModal";
import RepoDetailsModal from "@/components/RepoDetailsModal";
import {
  api,
  API_BASE_URL,
  Repository,
  getAuthToken,
} from "@/lib/api";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Modals state
  const [isCreateRepoOpen, setIsCreateRepoOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [selectedTagRepoId, setSelectedTagRepoId] = useState<string>("");
  const [selectedDetailsRepo, setSelectedDetailsRepo] = useState<Repository | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Delete confirmation state
  const [repoToDelete, setRepoToDelete] = useState<Repository | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data state
  const [repositories, setRepositories] = useState<Repository[]>([]);

  // Loading & notification states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Auth token presence
  const hasToken = typeof window !== "undefined" ? !!getAuthToken() : false;

  const handleRefresh = () => {
    setRefreshIndex((prev) => prev + 1);
  };

  // Open Details Modal for a repository (shows its tags & blobs)
  const handleOpenDetails = (repo: Repository) => {
    setSelectedDetailsRepo(repo);
    setIsDetailsOpen(true);
  };

  // Open Create Tag modal for a specific repository
  const handleOpenCreateTagForRepo = (repoId: string) => {
    setSelectedTagRepoId(repoId);
    setIsCreateTagOpen(true);
  };

  // Delete repository handler - calls /logic/master/create/delete-my-repository/
  const handleConfirmDelete = async () => {
    if (!repoToDelete) return;
    setIsDeleting(true);
    setErrorMsg("");

    try {
      const res = await api.deleteRepository(repoToDelete.id, repoToDelete.name);
      if (
        res.RES ||
        res.msg?.toLowerCase().includes("deleted") ||
        res.msg?.toLowerCase().includes("success")
      ) {
        setSuccessToast(`Repository "${repoToDelete.name}" deleted successfully.`);
        setRepoToDelete(null);
        handleRefresh();
      } else {
        setErrorMsg(res.msg || "Failed to delete repository.");
      }
    } catch {
      setErrorMsg("Failed to delete repository: Could not connect to API server.");
    } finally {
      setIsDeleting(false);
      setTimeout(() => setSuccessToast(""), 4000);
    }
  };

  // Fetch repositories only for main table
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoading(true);
      setErrorMsg("");

      try {
        const repoRes = await api.getRepositories();

        if (!isCancelled) {
          if (repoRes.RES && Array.isArray(repoRes.data)) {
            setRepositories(repoRes.data);
          }
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

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [refreshIndex]);

  // Search filter
  const filteredRepositories = useMemo(() => {
    return repositories.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [repositories, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Repositories
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
            <span>Manage document and image repositories.</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <span className={`w-1.5 h-1.5 rounded-full ${hasToken ? "bg-emerald-500" : "bg-amber-500"}`} />
              {hasToken ? "Authenticated" : "No Token"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Refresh repositories"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateRepoOpen(true)}
            className="px-4 py-2 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create repository</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="underline font-semibold hover:opacity-80 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-medium">Total Repositories</span>
            <FolderGit2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {repositories.length}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
              Quick Action
            </span>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              New Repository
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateRepoOpen(true)}
            className="px-3.5 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            Add Repository
          </button>
        </div>
      </div>

      {/* Main Repositories Table Box */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories by name or description..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>
          <span className="text-xs text-zinc-500">
            {filteredRepositories.length} of {repositories.length} repositories
          </span>
        </div>

        {/* REPOSITORIES TABLE */}
        {/* Displays all fields EXCEPT id in table with View details and Delete in last column */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Icon</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Tag count</th>
                <th className="px-4 py-3 font-medium">Manifest count</th>
                <th className="px-4 py-3 font-medium">Created at</th>
                <th className="px-4 py-3 font-medium">Updated at</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRepositories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    {repositories.length === 0
                      ? "No repositories found. Click 'Create repository' to add one."
                      : "No repositories match your filter query."}
                  </td>
                </tr>
              ) : (
                filteredRepositories.map((repo) => (
                  <tr
                    key={repo.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    {/* 1. Icon (without id) */}
                    <td className="px-4 py-3">
                      {repo.icon ? (
                        <Image
                          src={repo.icon}
                          alt={repo.name}
                          width={24}
                          height={24}
                          unoptimized
                          className="w-6 h-6 rounded-md object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <FolderGit2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>

                    {/* 2. Name */}
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {repo.name}
                    </td>

                    {/* 3. Description */}
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {repo.description || "—"}
                    </td>

                    {/* 4. Tag count */}
                    <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                        <TagIcon className="w-3 h-3 text-zinc-400" />
                        {repo.tag_count ?? 0}
                      </span>
                    </td>

                    {/* 5. Manifest count */}
                    <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                        {repo.manifest_count ?? 0}
                      </span>
                    </td>

                    {/* 6. Created at */}
                    <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">
                      {repo.created_at
                        ? new Date(repo.created_at).toLocaleString()
                        : "—"}
                    </td>

                    {/* 7. Updated at */}
                    <td className="px-4 py-3 text-zinc-500 text-[11px] whitespace-nowrap">
                      {repo.updated_at
                        ? new Date(repo.updated_at).toLocaleString()
                        : "—"}
                    </td>

                    {/* 8. Actions: View details and Delete */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Option 1: View details (shows tags and blobs) */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(repo)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                          title="View tags and blobs"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>View details</span>
                        </button>

                        {/* Option 2: Delete */}
                        <button
                          type="button"
                          onClick={() => setRepoToDelete(repo)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                          title="Delete repository"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog Modal */}
      {repoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Delete repository
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Are you sure you want to delete repository &quot;{repoToDelete.name}&quot;?
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              This action will remove the repository from the vault using <code className="text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">/logic/master/create/delete-my-repository/</code>.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRepoToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete repository"}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Modals */}
      <CreateRepoModal
        isOpen={isCreateRepoOpen}
        onClose={() => setIsCreateRepoOpen(false)}
        onSuccess={handleRefresh}
      />

      <CreateTagModal
        isOpen={isCreateTagOpen}
        onClose={() => setIsCreateTagOpen(false)}
        repositories={repositories}
        selectedRepoId={selectedTagRepoId}
        onSuccess={handleRefresh}
      />

      <RepoDetailsModal
        repo={selectedDetailsRepo}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDetailsRepo(null);
        }}
        onOpenCreateTag={handleOpenCreateTagForRepo}
      />
    </div>
  );
}
