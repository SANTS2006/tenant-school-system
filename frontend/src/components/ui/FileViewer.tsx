import { Download, ExternalLink, FileText } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { downloadName, fileKind, triggerFileDownload } from "@/lib/fileDownload";

import { FileViewerContext, type FileViewerApi, useFileViewer } from "./fileViewerContext";

const MAX_TEXT_BYTES = 1024 * 1024;

function TextPreview({ url }: { url: string }) {
  const [state, setState] = useState<{ text?: string; failed?: boolean }>({});

  useEffect(() => {
    let cancelled = false;
    fetch(url, { credentials: "omit" })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.text();
      })
      .then((text) => !cancelled && setState({ text: text.slice(0, MAX_TEXT_BYTES) }))
      .catch(() => !cancelled && setState({ failed: true }));
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.failed) return <p className="p-6 text-sm text-[var(--color-text-muted)]">This file couldn't be previewed. Download it to read it.</p>;
  if (state.text === undefined) {
    return (
      <div className="flex justify-center p-10">
        <Spinner />
      </div>
    );
  }
  return (
    <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap rounded-md bg-[var(--color-bg-subtle)] p-4 text-sm text-[var(--color-text)]">
      {state.text}
    </pre>
  );
}

function Preview({ url, title }: { url: string; title: string }) {
  const kind = fileKind(url);
  switch (kind) {
    case "image":
      return <img src={url} alt={title} className="mx-auto max-h-[70vh] max-w-full rounded-md object-contain" />;
    case "pdf":
      return <iframe src={url} title={title} className="h-[70vh] w-full rounded-md border border-[var(--color-border)] bg-white" />;
    case "video":
      return <video src={url} controls className="mx-auto max-h-[70vh] w-full rounded-md bg-black" />;
    case "audio":
      return <audio src={url} controls className="w-full" />;
    case "text":
      return <TextPreview url={url} />;
    default:
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <FileText className="size-10 text-[var(--color-text-muted)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text)]">This type of file can't be shown here.</p>
          <p className="text-xs text-[var(--color-text-muted)]">Download it to open it in the right application.</p>
        </div>
      );
  }
}

/** One in-app viewer for every uploaded file: images, PDFs, video, audio and plain text are shown
 * right here in a dialog; anything else offers Download. Wrap the app once; anything inside opens a
 * file with `useFileViewer().openFile(url, title)` or `<OpenFileButton>`. */
export function FileViewerProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<{ url: string; title: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  const openFile = useCallback((url: string, title?: string) => {
    setFile({ url, title: downloadName(url, title) });
  }, []);
  const api = useMemo<FileViewerApi>(() => ({ openFile }), [openFile]);

  const download = async () => {
    if (!file) return;
    setDownloading(true);
    await triggerFileDownload(file.url, file.title);
    setDownloading(false);
  };

  return (
    <FileViewerContext.Provider value={api}>
      {children}
      <Modal open={file !== null} onClose={() => setFile(null)} title={file?.title ?? "File"} maxWidthClassName="max-w-5xl">
        {file && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={download} isLoading={downloading}>
                <Download className="size-4" aria-hidden="true" /> Download
              </Button>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]"
              >
                <ExternalLink className="size-4" aria-hidden="true" /> Open in new tab
              </a>
            </div>
            <Preview url={file.url} title={file.title} />
          </div>
        )}
      </Modal>
    </FileViewerContext.Provider>
  );
}

/** A button that opens `url` in the viewer — a drop-in for what used to be an `<a target="_blank">`. */
export function OpenFileButton({
  url,
  title,
  className,
  ariaLabel,
  children,
}: {
  url: string;
  title?: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { openFile } = useFileViewer();
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        openFile(url, title);
      }}
    >
      {children}
    </button>
  );
}
