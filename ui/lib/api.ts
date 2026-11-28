// API Client for DocVault logic/views backend

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://10.10.0.162:8000"
).replace(/\/$/, "");

export function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  return path.startsWith("/")
    ? `${API_BASE_URL}${path}`
    : `${API_BASE_URL}/${path}`;
}

export interface UserProfile {
  username: string;
  email: string;
  full_name: string;
}

export interface Repository {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  tag_count: number;
  manifest_count: number;
  created_at: string;
  updated_at: string;
  markdown?: string | null;
}

export interface UploadSession {
  id: string;
  repo: string;
  repo_name: string;
  offset: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BlobItem {
  digest: string;
  size: number;
  storage_path: string;
  created_at: string;
}

export interface ManifestItem {
  digest: string;
  media_type: string;
  created_at: string;
}

export interface RepositoryManifest {
  id: number;
  repository: string;
  repository_name: string;
  manifest: string;
  manifest_digest: string;
  manifest_media_type: string;
}

export interface TagItem {
  id: number;
  repository: string;
  repository_name: string;
  name: string;
  manifest: string;
  manifest_digest: string;
  manifest_media_type: string;
  updated_at: string;
}

export interface AccessTokenData {
  id?: string; // UUID, needed for update/delete
  token?: string; // only present in the create response
  name: string;
  description?: string;
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
}

interface ApiResponse<T> {
  RES: boolean;
  msg?: string;
  data?: T;
}

// Token storage helpers
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
  // Also store in document.cookie for SSR / route handlers
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
}

export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("username");
  document.cookie = "auth_token=; path=/; max-age=0";
  document.cookie = "username=; path=/; max-age=0";
}

// Core fetch helper with Authorization: Token <token>
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({
    RES: false,
    msg: `Failed to parse response (${response.status} ${response.statusText})`,
    data: null as unknown as T,
  }));

  if (!response.ok && json.RES === undefined) {
    return {
      RES: false,
      msg:
        json.detail ||
        json.message ||
        `Request failed with status ${response.status}`,
      data: json.data || (null as unknown as T),
    };
  }

  return json;
}

// API methods matching the API Reference
export const api = {
  // Authentication
  async login(username: string, password: string) {
    const url = `${API_BASE_URL}/auth/login/`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data.msg || data.detail || data.non_field_errors?.[0] || "Login failed",
      );
    }

    // Extract token (supports { token }, { key }, { data: { token } })
    const token = data.token || data.key || data.data?.token || data.data?.key;
    if (token) {
      setAuthToken(token);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("username", username);
      document.cookie = `username=${encodeURIComponent(username)}; path=/; max-age=86400; SameSite=Lax`;
    }
    return data;
  },

  async logout() {
    const token = getAuthToken();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });
      }
    } finally {
      removeAuthToken();
    }
  },

  // Profile API: GET /auth/my-profile/
  async getMyProfile(): Promise<ApiResponse<UserProfile>> {
    return apiFetch<UserProfile>("/auth/my-profile/");
  },

  // Access Token APIs: /auth/my-token/
  async getMyToken(): Promise<ApiResponse<AccessTokenData[]>> {
    return apiFetch<AccessTokenData[]>("/auth/my-token/");
  },

  async createMyToken(payload: {
    name: string;
    description?: string;
    days?: number; // omit for no expiry
  }): Promise<ApiResponse<AccessTokenData>> {
    const body: Record<string, unknown> = {
      name: payload.name,
      description: payload.description ?? "",
    };
    if (payload.days) body.days = payload.days;

    return apiFetch<AccessTokenData>("/auth/my-token/", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async updateMyToken(payload: {
    id: string;
    name?: string;
    description?: string;
    is_active?: boolean;
    days?: number | null; // undefined = keep current, null = never expires, number = days from now
  }): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>("/auth/update-my-token/", {
      method: "POST",
      body: JSON.stringify(payload), // undefined fields are dropped, null is kept
    });
  },

  // POST /auth/del-my-token/
  async deleteMyToken(id: string): Promise<ApiResponse<unknown>> {
    return apiFetch<unknown>("/auth/del-my-token/", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  },

  // Repositories
  async getRepositories(page: number = 1): Promise<ApiResponse<any>> {
    return apiFetch<any>(`/logic/views/view/my-repository/?page=${page}`);
  },

  async getRepository(id: string): Promise<ApiResponse<Repository>> {
    return apiFetch<Repository>(`/logic/views/view/my-repository/${id}/`);
  },

  async editMarkdown(
    repoId: string,
    markdown: string,
  ): Promise<ApiResponse<unknown>> {
    const payload = { markdown, repo_id: repoId };
    let res = await apiFetch<unknown>("/logic/views/edit/markdown/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.RES) {
      res = await apiFetch<unknown>("/logic/views/edit/markdown", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    return res;
  },

  async editRepoIcon(
    repoId: string,
    iconFile: File,
  ): Promise<ApiResponse<{ icon?: string; [key: string]: unknown }>> {
    const formData = new FormData();
    formData.append("icon", iconFile);
    formData.append("repo_id", repoId);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}/logic/views/edit/repo-icon/`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      // Fallback without trailing slash
      const fallback = await fetch(`${API_BASE_URL}/logic/views/edit/repo-icon`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (fallback.ok) {
        response = fallback;
      }
    }

    return response.json().catch(() => ({
      RES: false,
      msg: `Failed to parse response (${response.status} ${response.statusText})`,
      data: null as unknown as { icon?: string; [key: string]: unknown },
    }));
  },

  async updateRepository(
    id: string,
    payload: {
      name?: string;
      description?: string;
      markdown?: string;
    },
  ): Promise<ApiResponse<Repository>> {
    // Primary: POST /logic/views/update/my-repository/
    let res = await apiFetch<Repository>("/logic/views/update/my-repository/", {
      method: "POST",
      body: JSON.stringify({ id, ...payload }),
    });

    if (!res.RES) {
      // Fallback 1: POST /logic/views/update/my-repository/<id>/
      res = await apiFetch<Repository>(
        `/logic/views/update/my-repository/${encodeURIComponent(id)}/`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    }

    if (!res.RES) {
      // Fallback 2: PATCH /logic/views/view/my-repository/<id>/
      res = await apiFetch<Repository>(
        `/logic/views/view/my-repository/${encodeURIComponent(id)}/`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );
    }

    if (!res.RES) {
      // Fallback 3: PUT /logic/views/view/my-repository/<id>/
      res = await apiFetch<Repository>(
        `/logic/views/view/my-repository/${encodeURIComponent(id)}/`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
    }

    return res;
  },

  async createRepository(payload: {
    name: string;
    description: string;
    icon?: File | null;
  }): Promise<ApiResponse<Repository>> {
    if (payload.icon) {
      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("description", payload.description);
      formData.append("icon", payload.icon);

      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Token ${token}`;
      }
      const response = await fetch(
        `${API_BASE_URL}/logic/views/create/my-repository/`,
        {
          method: "POST",
          headers,
          body: formData,
        },
      );
      return response.json().catch(() => ({
        RES: false,
        msg: `Failed to parse response (${response.status} ${response.statusText})`,
        data: null as unknown as Repository,
      }));
    }

    return apiFetch<Repository>("/logic/views/create/my-repository/", {
      method: "POST",
      body: JSON.stringify({
        name: payload.name,
        description: payload.description,
      }),
    });
  },

  async deleteRepository(
    id: string,
    name?: string,
  ): Promise<ApiResponse<unknown>> {
    // Primary: POST /logic/views/create/delete-my-repository/
    let res = await apiFetch<unknown>(
      "/logic/views/create/delete-my-repository/",
      {
        method: "POST",
        body: JSON.stringify({ id, repository: id, name }),
      },
    );

    // Fallback: parameterized path
    if (
      !res.RES &&
      res.msg &&
      (res.msg.includes("404") ||
        res.msg.includes("405") ||
        res.msg.includes("Failed"))
    ) {
      res = await apiFetch<unknown>(
        `/logic/views/create/delete-my-repository/${encodeURIComponent(id)}/`,
        {
          method: "POST",
          body: JSON.stringify({ id, repository: id, name }),
        },
      );
    }

    // Additional Fallback: DELETE /logic/views/delete/my-repository/<id>/
    if (
      !res.RES &&
      res.msg &&
      (res.msg.includes("404") || res.msg.includes("405"))
    ) {
      res = await apiFetch<unknown>(
        `/logic/views/delete/my-repository/${encodeURIComponent(id)}/`,
        {
          method: "DELETE",
        },
      );
    }

    return res;
  },

  // Upload Sessions
  async getUploadSessions(
    repoId?: string,
  ): Promise<ApiResponse<UploadSession[]>> {
    const query = repoId ? `?repo=${encodeURIComponent(repoId)}` : "";
    return apiFetch<UploadSession[]>(
      `/logic/views/view/upload-sessions/${query}`,
    );
  },

  async getUploadSession(id: string): Promise<ApiResponse<UploadSession>> {
    return apiFetch<UploadSession>(`/logic/views/view/upload-sessions/${id}/`);
  },

  async createUploadSession(payload: {
    repo: string;
    status?: string;
  }): Promise<ApiResponse<UploadSession>> {
    return apiFetch<UploadSession>("/logic/views/create/upload-sessions/", {
      method: "POST",
      body: JSON.stringify({ status: "pending", ...payload }),
    });
  },

  // Blobs
  async getBlobs(repoId?: string): Promise<ApiResponse<BlobItem[]>> {
    const query = repoId ? `?repo=${encodeURIComponent(repoId)}` : "";
    return apiFetch<BlobItem[]>(`/logic/views/view/blobs/${query}`);
  },

  async getBlob(digest: string): Promise<ApiResponse<BlobItem>> {
    return apiFetch<BlobItem>(
      `/logic/views/view/blobs/${encodeURIComponent(digest)}/`,
    );
  },

  // Manifests
  async getManifests(repoId?: string): Promise<ApiResponse<ManifestItem[]>> {
    const query = repoId ? `?repo=${encodeURIComponent(repoId)}` : "";
    return apiFetch<ManifestItem[]>(`/logic/views/view/manifests/${query}`);
  },

  async getManifest(digest: string): Promise<ApiResponse<ManifestItem>> {
    return apiFetch<ManifestItem>(
      `/logic/views/view/manifests/${encodeURIComponent(digest)}/`,
    );
  },

  // Repository Manifests
  async getRepositoryManifests(
    repoId?: string,
  ): Promise<ApiResponse<RepositoryManifest[]>> {
    const query = repoId ? `?repo=${encodeURIComponent(repoId)}` : "";
    return apiFetch<RepositoryManifest[]>(
      `/logic/views/view/repository-manifests/${query}`,
    );
  },

  async createRepositoryManifest(payload: {
    repository: string;
    manifest: string;
  }): Promise<ApiResponse<RepositoryManifest>> {
    return apiFetch<RepositoryManifest>(
      "/logic/views/create/repository-manifests/",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  // Tags
  async getTags(repoId?: string): Promise<ApiResponse<TagItem[]>> {
    const query = repoId ? `?repo=${encodeURIComponent(repoId)}` : "";
    return apiFetch<TagItem[]>(`/logic/views/view/tags/${query}`);
  },

  async getTag(id: number | string): Promise<ApiResponse<TagItem>> {
    return apiFetch<TagItem>(`/logic/views/view/tags/${id}/`);
  },

  async createTag(payload: {
    repository: string;
    name: string;
    manifest: string;
  }): Promise<ApiResponse<TagItem>> {
    return apiFetch<TagItem>("/logic/views/create/tags/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
