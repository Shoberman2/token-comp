const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("../../web/node_modules/sharp");

const ROOT = path.resolve(__dirname, "../..");
const OUT = __dirname;
const WIDTH = 1270;
const HEIGHT = 760;

const assets = {
  background: path.join(OUT, "burnt-gallery-background.png"),
  icon: path.join(ROOT, "web/app/icon.svg"),
  feed: path.join(ROOT, "app-store/screenshots/6.9-inch/01-feed.png"),
  ranks: path.join(ROOT, "app-store/screenshots/6.9-inch/02-ranks.png"),
  post: path.join(ROOT, "app-store/screenshots/6.9-inch/03-post.png"),
  profile: path.join(ROOT, "app-store/screenshots/6.9-inch/04-profile.png"),
  share: path.join(ROOT, "app-store/screenshots/6.9-inch/05-share.png"),
};

const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function textLines(lines, x, y, options = {}) {
  const {
    size = 64,
    weight = 700,
    fill = "#f7f7f8",
    lineHeight = Math.round(size * 1.04),
    letterSpacing = 0,
    family = "Arial, Helvetica, sans-serif",
  } = options;
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}">${lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join("")}</text>`;
}

function chip(x, y, label, width) {
  return `<g><rect x="${x}" y="${y}" width="${width}" height="38" rx="19" fill="#ffffff" fill-opacity="0.07" stroke="#ffffff" stroke-opacity="0.15"/><text x="${x + width / 2}" y="${y + 25}" text-anchor="middle" fill="#cfcfd4" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5">${escapeXml(label)}</text></g>`;
}

function frameSvg(x, y, width, height, radius = 34) {
  return Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#000000" flood-opacity="0.7"/></filter></defs><rect x="${x - 2}" y="${y - 2}" width="${width + 4}" height="${height + 4}" rx="${radius + 2}" fill="#08080a" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2" filter="url(#shadow)"/></svg>`);
}

async function prepareScreen(source, height, angle = 0) {
  const resized = await sharp(source).resize({ height }).png().toBuffer({ resolveWithObject: true });
  const radius = Math.max(28, Math.round(resized.info.width * 0.07));
  const mask = Buffer.from(`<svg width="${resized.info.width}" height="${resized.info.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" rx="${radius}" fill="white"/></svg>`);
  let buffer = await sharp(resized.data).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  if (angle) {
    buffer = await sharp(buffer).rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  }
  const metadata = await sharp(buffer).metadata();
  return { buffer, width: metadata.width, height: metadata.height, radius };
}

async function baseCanvas() {
  const background = await sharp(assets.background)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .modulate({ brightness: 0.62, saturation: 0 })
    .png()
    .toBuffer();
  const veil = Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="veil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#060608" stop-opacity="0.08"/><stop offset="0.6" stop-color="#060608" stop-opacity="0.28"/><stop offset="1" stop-color="#000000" stop-opacity="0.55"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#veil)"/><rect x="24" y="24" width="1222" height="712" rx="30" fill="none" stroke="#ffffff" stroke-opacity="0.08"/></svg>`);
  return sharp(background).composite([{ input: veil }]).png().toBuffer();
}

function brandHeader() {
  return `<text x="142" y="91" fill="#f7f7f8" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700">Burnt</text>`;
}

function footer() {
  return `<text x="72" y="706" fill="#a4a4aa" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="600" letter-spacing="0.4">burnt-delta.vercel.app</text>`;
}

async function makeSlide({ filename, screens, overlay }) {
  const base = await baseCanvas();
  const composites = [];

  for (const spec of screens) {
    const screen = await prepareScreen(spec.source, spec.height, spec.angle || 0);
    composites.push({ input: frameSvg(spec.x, spec.y, screen.width, screen.height, screen.radius), top: 0, left: 0 });
    composites.push({ input: screen.buffer, top: spec.y, left: spec.x });
  }

  const icon = await sharp(assets.icon).resize(56, 56).png().toBuffer();
  composites.push({ input: icon, top: 48, left: 72 });
  composites.push({ input: Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">${brandHeader()}${overlay}${footer()}</svg>`), top: 0, left: 0 });

  await sharp(base).composite(composites).png().toFile(path.join(OUT, filename));
}

async function createThumbnail() {
  const background = await sharp(assets.background).resize(240, 240, { fit: "cover" }).modulate({ brightness: 0.55, saturation: 0 }).png().toBuffer();
  const icon = await sharp(assets.icon).resize(132, 132).png().toBuffer();
  const border = Buffer.from(`<svg width="240" height="240" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="230" height="230" rx="48" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2"/></svg>`);
  await sharp(background).composite([{ input: icon, top: 54, left: 54 }, { input: border, top: 0, left: 0 }]).png().toFile(path.join(OUT, "burnt-product-hunt-thumbnail.png"));
}

async function main() {
  await makeSlide({
    filename: "01-burnt-cover.png",
    screens: [
      { source: assets.post, height: 580, x: 1115, y: 122, angle: 5 },
      { source: assets.ranks, height: 620, x: 955, y: 72, angle: 1 },
      { source: assets.feed, height: 650, x: 765, y: 58, angle: -4 },
    ],
    overlay: [
      `<text x="72" y="153" fill="#a8a8af" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" letter-spacing="3">DAILY AI TOKEN TRACKING</text>`,
      textLines(["BeReal for", "AI tokens."], 72, 258, { size: 78, lineHeight: 80 }),
      textLines(["Post the proof. Build a streak.", "See who burns the most."], 72, 454, { size: 25, weight: 500, fill: "#b8b8be", lineHeight: 34 }),
      chip(72, 548, "SCREENSHOT-FIRST", 184),
      chip(270, 548, "SOCIAL FEED", 150),
      chip(434, 548, "LEADERBOARDS", 174),
    ].join(""),
  });

  await makeSlide({
    filename: "02-post-the-proof.png",
    screens: [{ source: assets.post, height: 690, x: 890, y: 35 }],
    overlay: [
      `<text x="72" y="162" fill="#a8a8af" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" letter-spacing="3">POST</text>`,
      textLines(["Post the", "proof."], 72, 272, { size: 78, lineHeight: 80 }),
      textLines(["Upload your AI usage screenshot,", "pick the model, and share what you shipped."], 72, 465, { size: 25, weight: 500, fill: "#b8b8be", lineHeight: 34 }),
      chip(72, 568, "SCREENSHOT-FIRST", 184),
      chip(270, 568, "MAJOR AI MODELS", 190),
      chip(474, 568, "DAILY BURNS", 148),
    ].join(""),
  });

  await makeSlide({
    filename: "03-social-feed.png",
    screens: [{ source: assets.feed, height: 690, x: 890, y: 35 }],
    overlay: [
      `<text x="72" y="162" fill="#a8a8af" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" letter-spacing="3">FEED</text>`,
      textLines(["See what your", "friends burned."], 72, 272, { size: 72, lineHeight: 76 }),
      textLines(["A social feed for people shipping with AI—", "usage, model, caption, and all."], 72, 465, { size: 25, weight: 500, fill: "#b8b8be", lineHeight: 34 }),
      chip(72, 568, "FOLLOW FRIENDS", 174),
      chip(260, 568, "SHARE BURNS", 154),
    ].join(""),
  });

  await makeSlide({
    filename: "04-token-leaderboard.png",
    screens: [{ source: assets.ranks, height: 690, x: 890, y: 35 }],
    overlay: [
      `<text x="72" y="162" fill="#a8a8af" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" letter-spacing="3">RANKS</text>`,
      textLines(["Climb the token", "leaderboard."], 72, 272, { size: 70, lineHeight: 74 }),
      textLines(["Compete today, this week, this month,", "or all-time."], 72, 465, { size: 25, weight: 500, fill: "#b8b8be", lineHeight: 34 }),
      chip(72, 568, "TOKENS BURNED", 176),
      chip(262, 568, "STREAKS", 112),
      chip(388, 568, "DAILY RANKS", 150),
    ].join(""),
  });

  await makeSlide({
    filename: "05-streaks-and-sharing.png",
    screens: [
      { source: assets.share, height: 610, x: 1035, y: 92, angle: 4 },
      { source: assets.profile, height: 660, x: 810, y: 52, angle: -3 },
    ],
    overlay: [
      `<text x="72" y="162" fill="#a8a8af" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" letter-spacing="3">STREAKS &amp; SHARING</text>`,
      textLines(["Turn usage into", "a daily ritual."], 72, 272, { size: 72, lineHeight: 76 }),
      textLines(["Build a streak, track your best days,", "and share every burn."], 72, 465, { size: 25, weight: 500, fill: "#b8b8be", lineHeight: 34 }),
      chip(72, 568, "PROFILE STATS", 164),
      chip(250, 568, "BEST DAY", 124),
      chip(388, 568, "SHARE CARDS", 154),
    ].join(""),
  });

  await createThumbnail();

  const manifest = {
    platform: "Product Hunt",
    generatedAt: new Date().toISOString(),
    gallerySize: `${WIDTH}x${HEIGHT}`,
    thumbnailSize: "240x240",
    files: [
      "01-burnt-cover.png",
      "02-post-the-proof.png",
      "03-social-feed.png",
      "04-token-leaderboard.png",
      "05-streaks-and-sharing.png",
      "burnt-product-hunt-thumbnail.png",
    ],
    sourceScreenshots: Object.fromEntries(Object.entries(assets).filter(([key]) => !["background", "icon"].includes(key))),
    generatedBackground: "burnt-gallery-background.png",
    provenance: "Feature screenshots are preserved from the existing iOS launch assets. Exact text, dimensions, logo, and layouts are composed deterministically. Image generation was used only for the monochrome abstract background.",
  };
  await fs.writeFile(path.join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
