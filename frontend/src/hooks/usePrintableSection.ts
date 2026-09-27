import { useRef, useState } from "react";

/**
 * Scopes both "Print" and "Download" to one DOM node, so the app's own shell (sidebar, nav,
 * buttons) never ends up in the printed page or the downloaded file — only the marked section
 * does.
 *
 * Print: the returned ref is marked `data-printable-root`; `src/index.css`'s `@media print`
 * rule hides everything else on the page for the duration of `window.print()`, and re-declares
 * every color token to its light value so a viewer in dark mode doesn't print near-invisible text.
 *
 * Download: renders that same node to a canvas (html2canvas) and drops it into a single-page PDF
 * (jsPDF) sized to the content, downloaded under `filename`. The page is temporarily forced to
 * the light theme for the capture too (html2canvas has no notion of `@media print`, so it would
 * otherwise snapshot whatever theme is currently on screen) and restored immediately after,
 * whether the capture succeeds or not. Both libraries are loaded lazily (dynamic import) so
 * their ~200KB only ever hits a browser that actually clicks Download.
 */
export function usePrintableSection(filename: string) {
  const printableRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const print = () => window.print();

  const download = async () => {
    const node = printableRef.current;
    if (!node) return;
    setIsDownloading(true);
    setDownloadError(null);

    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imageData = canvas.toDataURL("image/png");

      // One page sized to the content itself (in points, at 72dpi) rather than forcing it onto
      // a fixed A4/Letter page — a report card's aspect ratio doesn't match either, and this
      // avoids the multi-page-slicing complexity that would otherwise need.
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imageData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Could not generate the file.");
    } finally {
      if (previousTheme === null) {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", previousTheme);
      }
      setIsDownloading(false);
    }
  };

  return { printableRef, print, download, isDownloading, downloadError };
}
