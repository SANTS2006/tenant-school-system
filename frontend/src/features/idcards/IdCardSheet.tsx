import { Download, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

import { IdCardBack, IdCardFront } from "./IdCardFaces";
import type { IdCard } from "./types";

// While printing, hide the whole app (#root) and show only the portal below, which is mounted
// straight on <body> — so no modal transform/overflow ancestor can clip or offset the cards.
const PRINT_CSS = `
.idcard-print-root { display: none; }
@media print {
  @page { margin: 10mm; }
  #root { display: none !important; }
  .idcard-print-root { display: block !important; }
  .idcard-print-pair { display: flex; gap: 8mm; break-inside: avoid; page-break-inside: avoid; margin-bottom: 8mm; }
  .idcard-print-pair > * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

function CardPair({ card }: { card: IdCard }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <IdCardFront card={card} />
      <IdCardBack card={card} />
    </div>
  );
}

/** Shows one or more cards (front + back side by side) with Print and — for a single card —
 * Download PNG. Printing goes through the browser's own dialog, which also offers "Save as PDF". */
export function IdCardSheet({ cards }: { cards: IdCard[] }) {
  const { showToast } = useToast();
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPng = async () => {
    if (!captureRef.current || cards.length !== 1) return;
    setDownloading(true);
    try {
      // Loaded on demand — it's only needed when someone actually downloads a card.
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(captureRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${cards[0].card_number}.png`;
      link.click();
    } catch {
      showToast({
        title: "Could not create the image",
        description: "Use Print instead and choose 'Save as PDF'.",
        tone: "danger",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <style>{PRINT_CSS}</style>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" /> Print
        </Button>
        {cards.length === 1 && (
          <Button type="button" size="sm" variant="secondary" onClick={downloadPng} isLoading={downloading}>
            <Download className="size-4" aria-hidden="true" /> Download PNG
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-5 overflow-x-auto">
        {cards.map((card, index) => (
          <div key={card.id} ref={index === 0 ? captureRef : undefined} className="w-fit bg-white p-2">
            <CardPair card={card} />
          </div>
        ))}
      </div>

      {createPortal(
        <div className="idcard-print-root">
          {cards.map((card) => (
            <div key={card.id} className="idcard-print-pair">
              <IdCardFront card={card} />
              <IdCardBack card={card} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
