import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/pagination";

import type {
  Document,
  DocumentCategory,
  DocumentCategoryListParams,
  DocumentCategoryPayload,
  DocumentListParams,
  DocumentPayload,
} from "./types";

interface PageParams {
  page?: number;
  page_size?: number;
}

export async function fetchCategories(
  params: PageParams & DocumentCategoryListParams,
): Promise<PaginatedResponse<DocumentCategory>> {
  const { data } = await apiClient.get<PaginatedResponse<DocumentCategory>>("/document-categories/", { params });
  return data;
}

export async function getCategory(id: string): Promise<DocumentCategory> {
  const { data } = await apiClient.get<DocumentCategory>(`/document-categories/${id}/`);
  return data;
}

export async function createCategory(values: DocumentCategoryPayload): Promise<DocumentCategory> {
  const { data } = await apiClient.post<DocumentCategory>("/document-categories/", values);
  return data;
}

export async function updateCategory(id: string, values: DocumentCategoryPayload): Promise<DocumentCategory> {
  const { data } = await apiClient.patch<DocumentCategory>(`/document-categories/${id}/`, values);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/document-categories/${id}/`);
}

/** A plain JSON body can't carry a File — switch to multipart/form-data only when a new file
 * was actually picked, same pattern as Student.photo and Assignment.attachment. */
function toRequestBody(values: DocumentPayload): DocumentPayload | FormData {
  if (!values.file) {
    return values;
  }
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      formData.append(key, value);
    }
  }
  return formData;
}

export async function fetchDocuments(
  params: PageParams & DocumentListParams,
): Promise<PaginatedResponse<Document>> {
  const { data } = await apiClient.get<PaginatedResponse<Document>>("/documents/", { params });
  return data;
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await apiClient.get<Document>(`/documents/${id}/`);
  return data;
}

export async function createDocument(values: DocumentPayload): Promise<Document> {
  const { data } = await apiClient.post<Document>("/documents/", toRequestBody(values));
  return data;
}

export async function updateDocument(id: string, values: DocumentPayload): Promise<Document> {
  const { data } = await apiClient.patch<Document>(`/documents/${id}/`, toRequestBody(values));
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}/`);
}

export async function fetchMyDocuments(): Promise<Document[]> {
  const { data } = await apiClient.get<{ documents: Document[] }>("/documents/me/");
  return data.documents;
}
