const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

export type Role = "owner" | "editor" | "viewer";

export type DocumentSummary = {
  id: string;
  title: string;
  content: any;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  role?: Role;
};

export type PublicDocument = {
  id: string;
  title: string;
  content: any;
  updated_at: string;
};

export type Invite = {
  id: string;
  token: string;
  role: Role;
  email: string | null;
  created_at: string;
};

export type Collaborator = {
  id: string;
  role: Role;
  user: User;
};

export type Comment = {
  id: string;
  quoted_text: string | null;
  content: string;
  resolved: boolean;
  created_at: string;
  author: User;
};

export type PosterElement = {
  id: string;
  type: "text" | "shape" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  name?: string;
  // texte
  text?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  align?: "left" | "center" | "right";
  fontWeight?: number;
  letterSpacing?: number;
  fontSyle?: string;
  textDecoration?: string;
  fontStyle?: string;
  textTransform?: string;

  // commun
  opacity?: number;
  // forme
  shapeType?: "rectangle" | "circle" | "line";
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  fillImage?: string;
  radius?: number;
  // image
  src?: string;
};

export type PosterSummary = {
  id: string;
  title: string;
  width: number;
  height: number;
  elements: PosterElement[];
  background_color: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function setToken(token: string) {
  window.localStorage.setItem("token", token);
}

export function clearToken() {
  window.localStorage.removeItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = "Une erreur est survenue";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  async register(email: string, name: string, password: string) {
    return request<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    });
  },

  async login(email: string, password: string) {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Email ou mot de passe incorrect");
    }
    return res.json() as Promise<{ access_token: string; user: User }>;
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string) {
    return request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },

  async me() {
    return request<User>("/auth/me");
  },

  async listDocuments() {
    return request<DocumentSummary[]>("/documents");
  },

  async createDocument(title?: string) {
    return request<DocumentSummary>("/documents", {
      method: "POST",
      body: JSON.stringify({ title: title || "Document sans titre" }),
    });
  },

  async getDocument(id: string) {
    return request<DocumentSummary>(`/documents/${id}`);
  },

  async updateDocument(
    id: string,
    payload: { title?: string; content?: any; thumbnail_url?: string },
  ) {
    return request<DocumentSummary>(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteDocument(id: string) {
    return request<void>(`/documents/${id}`, { method: "DELETE" });
  },

  async togglePublic(id: string, isPublic: boolean) {
    return request<DocumentSummary>(`/documents/${id}/public`, {
      method: "PATCH",
      body: JSON.stringify({ is_public: isPublic }),
    });
  },

  async getPublicDocument(id: string) {
    return request<PublicDocument>(`/public/documents/${id}`);
  },

  async downloadPublicPdf(id: string, title: string) {
    const res = await fetch(`${API_URL}/public/documents/${id}/export/pdf`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Échec du téléchargement");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async duplicateDocument(id: string) {
    return request<DocumentSummary>(`/documents/${id}/duplicate`, {
      method: "POST",
    });
  },

  async exportPdf(id: string, title: string) {
    const token = getToken();
    const res = await fetch(`${API_URL}/documents/${id}/export/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Échec de l'export PDF");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async fetchPdfBlobUrl(id: string) {
    const token = getToken();
    const res = await fetch(`${API_URL}/documents/${id}/export/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Échec de la génération de l'aperçu");
    }
    const blob = await res.blob();
    return window.URL.createObjectURL(blob);
  },

  async uploadImage(file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<{ id: string; url: string; filename: string }>(
      "/upload/image",
      {
        method: "POST",
        body: form,
      },
    );
  },

  fileUrl(relativeUrl: string) {
    if (relativeUrl.startsWith("http")) return relativeUrl;
    return `${API_URL}${relativeUrl}`;
  },

  // --- Partage ---

  async createInvite(
    documentId: string,
    email: string | null,
    role: "viewer" | "editor",
  ) {
    return request<Invite>(`/documents/${documentId}/invites`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  },

  async listCollaborators(documentId: string) {
    return request<{
      collaborators: Collaborator[];
      pending_invites: Invite[];
    }>(`/documents/${documentId}/collaborators`);
  },

  async revokeCollaborator(documentId: string, collaboratorId: string) {
    return request<void>(
      `/documents/${documentId}/collaborators/${collaboratorId}`,
      {
        method: "DELETE",
      },
    );
  },

  async revokeInvite(documentId: string, inviteId: string) {
    return request<void>(`/documents/${documentId}/invites/${inviteId}`, {
      method: "DELETE",
    });
  },

  async previewInvite(token: string) {
    return request<{
      document_title: string;
      role: Role;
      email: string | null;
    }>(`/invites/${token}`);
  },

  async acceptInvite(token: string) {
    return request<{ document_id: string }>(`/invites/${token}/accept`, {
      method: "POST",
    });
  },

  // --- Commentaires / suggestions ---

  async listComments(documentId: string) {
    return request<Comment[]>(`/documents/${documentId}/comments`);
  },

  async createComment(
    documentId: string,
    quotedText: string | null,
    content: string,
  ) {
    return request<Comment>(`/documents/${documentId}/comments`, {
      method: "POST",
      body: JSON.stringify({ quoted_text: quotedText, content }),
    });
  },

  async resolveComment(
    documentId: string,
    commentId: string,
    resolved: boolean,
  ) {
    return request<Comment>(`/documents/${documentId}/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved }),
    });
  },

  async deleteComment(documentId: string, commentId: string) {
    return request<void>(`/documents/${documentId}/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  // --- Affiches (canvas libre) ---

  async listPosters() {
    return request<PosterSummary[]>("/posters");
  },

  async createPoster(title?: string) {
    return request<PosterSummary>("/posters", {
      method: "POST",
      body: JSON.stringify({
        title: title || "Affiche sans titre",
        width: 800,
        height: 1100,
      }),
    });
  },

  async getPoster(id: string) {
    return request<PosterSummary>(`/posters/${id}`);
  },

  async updatePoster(
    id: string,
    payload: {
      title?: string;
      elements?: PosterElement[];
      thumbnail_url?: string;
      background_color?: string;
    },
  ) {
    return request<PosterSummary>(`/posters/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deletePoster(id: string) {
    return request<void>(`/posters/${id}`, { method: "DELETE" });
  },
};
