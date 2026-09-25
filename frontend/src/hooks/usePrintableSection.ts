import { useRef, useState } from "react";

/**
 * Scopes both "Print" and "Download" to one DOM node, so the app's own shell (sidebar, nav,
 * buttons) never ends up in the printed page or the downloaded file — only the marked section
 * does.
 *
 * Print: the returned ref is marked `data-printable-root`; `src/index.css`'s `@media print`
 * rule hides everything else on the page for the duration of `window.print()`.
 *
 * Download: renders that same node to a canvas (html2canvas) and drops it into a single-page PDF
 * (jsPDF) sized to the content, downloaded under `filename`. Both libraries are loaded lazily
 * (dynamic import) so their ~200KB only ever hits a browser that actually clicks Download.
 */
export function usePrintableSection(filename: string) {
  const printableRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const print = () => window.print();

  const download = async () => {
    const node = printableRef.current;
    if (!node) return;
    setIsDownloading(true);
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
    } finally {
      setIsDownloading(false);
    }
  };

  return { printableRef, print, download, isDownloading };
}
