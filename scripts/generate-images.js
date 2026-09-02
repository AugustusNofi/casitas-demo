// Generates all images from scripts/image-manifest.js via Gemini ("Nano Banana") image
// generation, or falls back to tasteful SVG placeholders when GEMINI_API_KEY is unset.
// Run once during setup: `node scripts/generate-images.js`. Skips files that already exist.

const fs = require("fs");
const path = require("path");
const { IMAGES } = require("./image-manifest");

const OUT_DIR = path.join(__dirname, "..", "public", "images");
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A duotone coral/teal gradient with a simple rounded-shape overlay, so the demo still looks
// intentional even with no Gemini key configured. Written as SVG regardless of the manifest's
// nominal .png extension; the app renders images with plain <img> tags (no Next.js Image
// optimizer), so an SVG payload under a .png name still displays correctly in the browser.
function placeholderSvg(file, aspectRatio) {
  const [w, h] = aspectRatio === "16:9" ? [1600, 900] : aspectRatio === "1:1" ? [512, 512] : [1200, 900];
  const isIcon = aspectRatio === "1:1";
  const seed = Array.from(file).reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = seed % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="#ff7a59"/>
      <stop offset="100%" stop-color="#12877f"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  ${isIcon
    ? `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.28}" fill="#ffffff" fill-opacity="0.85"/>`
    : `<circle cx="${w * 0.82}" cy="${h * 0.22}" r="${Math.min(w, h) * 0.12}" fill="#ffffff" fill-opacity="0.25"/>
       <path d="M0 ${h * 0.72} Q ${w * 0.25} ${h * 0.6} ${w * 0.5} ${h * 0.72} T ${w} ${h * 0.72} V ${h} H 0 Z" fill="#ffffff" fill-opacity="0.15"/>`
  }
</svg>`;
}

async function generateOne(entry) {
  const outPath = path.join(OUT_DIR, entry.file);
  if (fs.existsSync(outPath)) {
    console.log(`skip (exists): ${entry.file}`);
    return;
  }

  if (!API_KEY) {
    fs.writeFileSync(outPath, placeholderSvg(entry.file, entry.aspectRatio));
    console.log(`placeholder written: ${entry.file}`);
    return;
  }

  const body = {
    contents: [{ parts: [{ text: entry.prompt }] }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: entry.aspectRatio },
    },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`FAILED (${res.status}) for ${entry.file}: ${text}`);
    console.error(`  falling back to placeholder for ${entry.file}`);
    fs.writeFileSync(outPath, placeholderSvg(entry.file, entry.aspectRatio));
    return;
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData?.data);

  if (!imagePart) {
    console.error(`No image data returned for ${entry.file}, falling back to placeholder`);
    fs.writeFileSync(outPath, placeholderSvg(entry.file, entry.aspectRatio));
    return;
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  fs.writeFileSync(outPath, buffer);
  console.log(`generated: ${entry.file} (${imagePart.inlineData.mimeType}, ${buffer.length} bytes)`);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  if (!API_KEY) {
    console.log("GEMINI_API_KEY not set — generating SVG placeholders for all images.");
  } else {
    console.log(`Generating ${IMAGES.length} images via ${MODEL}...`);
  }

  for (const entry of IMAGES) {
    await generateOne(entry);
    await sleep(600);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
