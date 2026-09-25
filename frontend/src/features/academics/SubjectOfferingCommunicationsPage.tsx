import { FileText, Send, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { BackArrowIcon } from "@/components/ui/BackArrowIcon";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import type { ApiError } from "@/lib/api-client";

import { useSubjectsHomePath } from "./useSubjectsHomePath";
import {
  useCreateSubjectMaterial,
  useCreateSubjectMessage,
  useDeleteSubjectMaterial,
  useSubjectMaterials,
  useSubjectMessages,
  useSubjectOffering,
} from "./useAcademicsCrud";

export function SubjectOfferingCommunicationsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subjectsHome = useSubjectsHomePath();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const { data: offering, isLoading: isLoadingOffering } = useSubjectOffering(id);
  const { data: materials, isLoading: isLoadingMaterials } = useSubjectMaterials(id);
  const { data: messages, isLoading: isLoadingMessages } = useSubjectMessages(id);
  const createMaterial = useCreateSubjectMaterial();
  const deleteMaterial = useDeleteSubjectMaterial();
  const createMessage = useCreateSubjectMessage();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [messageBody, setMessageBody] = useState("");

  const handleUpload = () => {
    if (!id || !file || !title.trim()) return;
    setProgress(0);
    createMaterial.mutate(
      { values: { subject_offering: id, title: title.trim(), file }, onProgress: setProgress },
      {
        onSuccess: () => {
          showToast({ title: "Material uploaded" });
          setTitle("");
          setFile(null);
          setProgress(null);
        },
        onError: (err: ApiError) => {
          showToast({ title: "Upload failed", description: err.message, tone: "danger" });
          setProgress(null);
        },
      },
    );
  };

  const handleDeleteMaterial = async (materialId: string, materialTitle: string) => {
    const ok = await confirm({ title: `Delete "${materialTitle}"?`, description: "This cannot be undone.", tone: "danger" });
    if (!ok) return;
    deleteMaterial.mutate(materialId, {
      onSuccess: () => showToast({ title: "Material deleted" }),
      onError: (err: ApiError) => showToast({ title: "Failed to delete", description: err.message, tone: "danger" }),
    });
  };

  const handleSendMessage = () => {
    if (!id || !messageBody.trim()) return;
    createMessage.mutate(
      { subject_offering: id, body: messageBody.trim() },
      {
        onSuccess: () => {
          showToast({ title: "Message sent to all enrolled students" });
          setMessageBody("");
        },
        onError: (err: ApiError) => showToast({ title: "Could not send", description: err.message, tone: "danger" }),
      },
    );
  };

  if (isLoadingOffering) {
    return <FullPageSpinner />;
  }

  if (!offering) {
    return <Alert tone="danger">Subject offering not found.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate(subjectsHome)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <BackArrowIcon className="size-4" />
        {subjectsHome === "/subjects" ? "Back to subjects" : "Back to subject offerings"}
      </button>

      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          {offering.subject_name} — {offering.school_class_name} · Materials & Messages
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{offering.term_name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload material</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--color-text)]">File</span>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded-[var(--radius-md)] file:border-0 file:bg-[var(--color-bg-subtle)] file:px-3 file:py-1.5 file:text-sm file:text-[var(--color-text)]"
              />
            </div>
          </div>
          {progress !== null && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
              <div
                className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleUpload} isLoading={createMaterial.isPending} disabled={!file || !title.trim()}>
              {!createMaterial.isPending && <Upload className="size-4" aria-hidden="true" />}
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMaterials ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : !materials || materials.results.length === 0 ? (
            <EmptyState icon={FileText} title="No materials yet" description="Upload a document above." />
          ) : (
            <div className="flex flex-col gap-2">
              {materials.results.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3"
                >
                  <FileText className="size-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={material.file}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                    >
                      {material.title}
                    </a>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">
                      Uploaded by {material.uploaded_by_name} · {new Date(material.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMaterial(material.id, material.title)}
                    aria-label={`Delete ${material.title}`}
                    className="shrink-0 rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send a message to all enrolled students</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            rows={3}
            placeholder="Write an announcement for this subject..."
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text)]"
          />
          <div className="flex justify-end">
            <Button onClick={handleSendMessage} disabled={!messageBody.trim()} isLoading={createMessage.isPending}>
              <Send className="size-4" aria-hidden="true" />
              Send to class
            </Button>
          </div>

          {isLoadingMessages ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : messages && messages.results.length > 0 ? (
            <div className="mt-2 flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
              {messages.results.map((message) => (
                <div key={message.id} className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3">
                  <p className="text-sm text-[var(--color-text)]">{message.body}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {message.sender_name} · {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
