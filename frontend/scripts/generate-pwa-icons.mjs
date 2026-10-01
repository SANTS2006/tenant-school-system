// Regenerates the PWA icons in public/icons from public/nts-logo.webp (run: npm run icons).
// "any" icons show the wide logo large on a white square; the maskable icon keeps it inside the
// central ~60% "safe zone" so platforms that crop to a circle/squircle never cut the letters.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SOURCE = fileURLToPath(new URL("../public/nts-logo.webp", import.meta.url));
const OUT = fileURLToPath(new URL("../public/icons/", import.meta.url));
await mkdir(OUT, { recursive: true });

async function icon(size, logoShare, file) {
  const logoWidth = Math.round(size * logoShare);
  const logo = await sharp(SOURCE).resize({ width: logoWidth }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#ffffff" } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(OUT + file);
  console.log("wrote", file);
}

await icon(192, 0.82, "icon-192.png");
await icon(512, 0.82, "icon-512.png");
await icon(512, 0.58, "icon-maskable-512.png");
await icon(180, 0.82, "apple-touch-icon.png");
await icon(48, 0.9, "favicon-48.png");
