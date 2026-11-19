"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Plus,
  X,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import { api, API_BASE_URL } from "@/lib/api";

// Row shown in the table. The secret token value is intentionally NOT part of this type.
interface TokenRow {
  id?: string; // UUID, must be returned by GET /auth/my-token/ for edit/delete to work
  name?: string;
  description?: string;
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
}

type ExpiryOption = "none" | "30" | "60" | "custom";
type EditExpiryOption = "keep" | ExpiryOption;

// Accepts an array or a single object from the API and strips the secret token value.
// Rows without an id are kept so the table still shows them.
function normalizeTokens(data: unknown): TokenRow[] {
  const list = Array.isArray(data) ? data : data ? [data] : [];
  return list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { token, ...rest } = item;
      const row = rest as unknown as TokenRow;
      return { ...row, is_active: row.is_active !== false };
    });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function AccessTokenPage() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expiryOption, setExpiryOption] = useState<ExpiryOption>("30");
  const [customDays, setCustomDays] = useState("90");

  // Edit modal
  const [editTarget, setEditTarget] = useState<TokenRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editExpiry, setEditExpiry] = useState<EditExpiryOption>("keep");
  const [editCustomDays, setEditCustomDays] = useState("90");
  const [editError, setEditError] = useState("");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<TokenRow | null>(null);

  // One-time reveal of a freshly created token (memory only, cleared on dismiss)
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const hasMissingIds = tokens.some((t) => !t.id);

  const copyToClipboard = async (text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setErrorMsg("Clipboard is not available in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrorMsg("Failed to copy token to clipboard.");
    }
  };

  const dismissNewToken = () => {
    setNewToken(null);
    setCopied(false);
  };

  const closeEditModal = () => {
    if (isSaving) return;
    setEditTarget(null);
    setEditError("");
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  // Close modals with the Escape key
  useEffect(() => {
    if (!editTarget && !deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editTarget && !isSaving) {
        setEditTarget(null);
        setEditError("");
      }
      if (deleteTarget && !isDeleting) setDeleteTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editTarget, deleteTarget, isSaving, isDeleting]);

  // List tokens: GET /auth/my-token/
  useEffect(() => {
    let isCancelled = false;

    async function loadTokens() {
      setIsLoading(true);
      setErrorMsg("");

      try {
        const res = await api.getMyToken();
        if (isCancelled) return;

        if (res.RES && res.data) {
          setTokens(normalizeTokens(res.data));
        } else {
          setTokens([]);
          if (!res.RES && res.msg) setErrorMsg(res.msg);
        }
      } catch {
        if (!isCancelled) {
          setErrorMsg("Could not connect to API server at " + API_BASE_URL);
          setTokens([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadTokens();

    return () => {
      isCancelled = true;
    };
  }, [refreshKey]);

  // Create token: POST /auth/my-token/
  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Token name is required.");
      return;
    }

    let days: number | undefined;
    if (expiryOption === "30") days = 30;
    else if (expiryOption === "60") days = 60;
    else if (expiryOption === "custom") {
      const n = parseInt(customDays, 10);
      if (isNaN(n) || n <= 0) {
        setErrorMsg("Invalid expiry days. Please enter a positive number.");
        return;
      }
      days = n;
    } // "none" -> days omitted (never expires)

    setIsGenerating(true);
    try {
      const res = await api.createMyToken({
        name: trimmedName,
        description: description.trim(),
        days,
      });

      if (res.RES && res.data) {
        if (res.data.token) {
          setNewToken(res.data.token);
          setCopied(false);
        }
        setSuccessMsg(res.msg || "Access token created successfully.");
        setName("");
        setDescription("");
        setExpiryOption("30");
        setCustomDays("90");
        setShowForm(false);
        handleRefresh();
      } else {
        setErrorMsg(res.msg || "Failed to generate access token.");
      }
    } catch {
      setErrorMsg("Failed to generate token: Could not reach API server.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Open edit modal
  const openEdit = (t: TokenRow) => {
    if (!t.id) return;
    setEditTarget(t);
    setEditName(t.name || "");
    setEditDescription(t.description || "");
    setEditExpiry("keep");
    setEditCustomDays("90");
    setEditError("");
    setSuccessMsg("");
    setErrorMsg("");
  };

  // Update token: POST /auth/update-my-token/
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget?.id) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError("Token name is required.");
      return;
    }

    // days: undefined = keep current, null = never expires, number = new validity in days
    let days: number | null | undefined;
    if (editExpiry === "30") days = 30;
    else if (editExpiry === "60") days = 60;
    else if (editExpiry === "none") days = null;
    else if (editExpiry === "custom") {
      const n = parseInt(editCustomDays, 10);
      if (isNaN(n) || n <= 0) {
        setEditError("Invalid expiry days. Please enter a positive number.");
        return;
      }
      days = n;
    }

    setIsSaving(true);
    setEditError("");
    try {
      const res = await api.updateMyToken({
        id: editTarget.id,
        name: trimmedName,
        description: editDescription.trim(),
        is_active: editTarget.is_active !== false,
        days,
      });

      if (res.RES) {
        setEditTarget(null);
        setSuccessMsg(res.msg || "Access token updated successfully.");
        handleRefresh();
      } else {
        setEditError(res.msg || "Failed to update access token.");
      }
    } catch {
      setEditError("Failed to update token: Could not reach API server.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete token: POST /auth/del-my-token/  { id }
  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    const id = deleteTarget.id;

    setIsDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.deleteMyToken(id);

      if (res.RES) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
        setDeleteTarget(null);
        dismissNewToken();
        setSuccessMsg(res.msg || "Access token deleted.");
      } else {
        setDeleteTarget(null);
        setErrorMsg(res.msg || "Failed to delete access token.");
      }
    } catch {
      setDeleteTarget(null);
      setErrorMsg("Failed to delete token: Could not reach API server.");
    } finally {
      setIsDeleting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5";
  const primaryBtn =
    "px-5 py-2 text-sm font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const secondaryBtn =
    "px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50";
  const rowBtn =
    "px-2.5 py-1.5 text-xs font-medium rounded-md border inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Access Tokens
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Personal access tokens allow you to authenticate with the CLI and OCI registry.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Refresh tokens"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {!showForm && (
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setSuccessMsg("");
              }}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate new token</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
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

      {/* Missing id warning */}
      {hasMissingIds && (
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            The token list response does not include an <code className="font-mono">id</code> field, so
            Edit and Delete are disabled. The backend must return the token UUID as{" "}
            <code className="font-mono">id</code> in <code className="font-mono">GET /auth/my-token/</code>.
          </span>
        </div>
      )}

      {/* One-time token reveal (only right after creation) */}
      {newToken && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Your new access token
                </h2>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Copy it now. For security, it will not be shown again once you leave or dismiss this
                  message.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissNewToken}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={newToken}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(newToken)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy token</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Create token form */}
      {showForm && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Generate Access Token
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Give your token a name and choose when it should expire.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={isGenerating}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleGenerateToken} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="token-name" className={labelClass}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="token-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Office Laptop"
                  maxLength={100}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="token-expiry" className={labelClass}>
                  Expiration
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="token-expiry"
                    value={expiryOption}
                    onChange={(e) => setExpiryOption(e.target.value as ExpiryOption)}
                    className={inputClass}
                  >
                    <option value="none">None (never expires)</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="custom">Custom</option>
                  </select>

                  {expiryOption === "custom" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        placeholder="90"
                        className="w-24 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                      />
                      <span className="text-xs text-zinc-500">days</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="token-desc" className={labelClass}>
                Description
              </label>
              <textarea
                id="token-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this token used for?"
                rows={2}
                maxLength={255}
                className={inputClass}
              />
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isGenerating}
                className={secondaryBtn}
              >
                Cancel
              </button>
              <button type="submit" disabled={isGenerating} className={primaryBtn}>
                <KeyRound className="w-4 h-4" />
                <span>{isGenerating ? "Generating..." : "Generate Token"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tokens table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Created</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Updated</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Expires</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && tokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-xs text-zinc-500">
                    Loading tokens...
                  </td>
                </tr>
              ) : tokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <KeyRound className="w-6 h-6 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      No access tokens yet
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Click &quot;Generate new token&quot; to create one.
                    </p>
                  </td>
                </tr>
              ) : (
                tokens.map((t, index) => {
                  const expired = !!t.expires_at && new Date(t.expires_at).getTime() < Date.now();
                  const canAct = !!t.id;

                  let statusLabel = "Active";
                  let statusClass =
                    "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
                  if (t.is_active === false) {
                    statusLabel = "Inactive";
                    statusClass =
                      "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
                  } else if (expired) {
                    statusLabel = "Expired";
                    statusClass =
                      "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
                  }

                  return (
                    <tr key={t.id ?? `${t.name}-${t.created_at}-${index}`} className="align-middle">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {t.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 max-w-[240px] truncate">
                        {t.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(t.updated_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {t.expires_at ? formatDate(t.expires_at) : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            disabled={!canAct}
                            title={canAct ? "Edit" : "Token id missing from API response"}
                            className={`${rowBtn} border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(t)}
                            disabled={!canAct}
                            title={canAct ? "Delete" : "Token id missing from API response"}
                            className={`${rowBtn} border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeEditModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
          >
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="edit-modal-title"
                    className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    Edit Access Token
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Update the name, description or expiration.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSaving}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label htmlFor="edit-name" className={labelClass}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={100}
                  autoFocus
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-desc" className={labelClass}>
                  Description
                </label>
                <textarea
                  id="edit-desc"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  maxLength={255}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-expiry" className={labelClass}>
                  Expiration
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="edit-expiry"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value as EditExpiryOption)}
                    className={inputClass}
                  >
                    <option value="keep">
                      Keep current (
                      {editTarget.expires_at ? formatDate(editTarget.expires_at) : "never expires"})
                    </option>
                    <option value="none">None (never expires)</option>
                    <option value="30">30 days from now</option>
                    <option value="60">60 days from now</option>
                    <option value="custom">Custom</option>
                  </select>

                  {editExpiry === "custom" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={editCustomDays}
                        onChange={(e) => setEditCustomDays(e.target.value)}
                        className="w-24 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                      />
                      <span className="text-xs text-zinc-500">days</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSaving}
                  className={secondaryBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className={primaryBtn}>
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeDeleteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
          >
            <div className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="delete-modal-title"
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Delete access token?
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {deleteTarget.name || "this token"}
                  </span>
                  ? Any CLI or registry session using it will stop working immediately. This cannot be
                  undone.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className={secondaryBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Deleting..." : "Yes, delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}