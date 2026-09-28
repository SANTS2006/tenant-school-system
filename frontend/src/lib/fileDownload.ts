/**
 * Turns an uploaded file's URL into one that actually downloads when navigated to, instead of
 * opening inline in the browser (the default for a PDF or image).
 *
 * Almost every uploaded file in this app (documents, subject materials, photos, ...) is stored
 * on Cloudinary in production — the plain HTML `download` attribute doesn't reliably force a
 * download for a cross-origin URL like that (browsers are free to ignore it), so for a Cloudinary
 * URL this instead inserts Cloudinary's own `fl_attachment` delivery flag, which makes Cloudinary
 * itself respond with `Content-Disposition: attachment` — that works regardless of origin. A
 * same-origin URL (local dev's FileSystemStorage, served under this app's own domain) doesn't
 * need any of this — the `download` attribute already works there, so the URL is returned as-is.
 */
export function downloadableFileUrl(url: string, filename?: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  const flag = filename ? `fl_attachment:${encodeURIComponent(filename.replace(/\.[^./]+$/, ""))}` : "fl_attachment";
  return url.replace("/upload/", `/upload/${flag}/`);
}

/** Triggers a download of `url` (see `downloadableFileUrl`) without navigating the current page
 * away from it — for a download *button* distinct from a "view" link on the same file. */
export function triggerFileDownload(url: string, filename?: string): void {
  const link = document.createElement("a");
  link.href = downloadableFileUrl(url, filename);
  if (filename) {
    link.download = filename;
  }
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
