import sharp from "sharp";
import { mkdir, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "assets", "originals");
const output = path.join(root, "public", "images");
const heroes = [
  ["installation", "slider-bg-1.png", 580, 0, 1005, 992],
  ["routine", "slider-bg-2.png", 570, 0, 1016, 992],
  ["filters", "slider-bg-3.png", 620, 40, 966, 952],
  ["repair", "slider-bg-4.png", 560, 0, 1026, 992],
  [
    "reinstallation",
    "AquaCircle Reinstallation in a Modern Kitchen-1.png",
    650,
    86,
    936,
    720,
  ],
];

for (const directory of ["hero", "services", "about"])
  await mkdir(path.join(output, directory), { recursive: true });
for (const [name, file, left, top, width, height] of heroes) {
  await sharp(path.join(source, file))
    .extract({ left, top, width, height })
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(output, "hero", `${name}.webp`));
}
await sharp(path.join(source, "slider-bg-3.png"))
  .extract({ left: 655, top: 105, width: 931, height: 795 })
  .webp({ quality: 88 })
  .toFile(path.join(output, "services", "filters.webp"));
await sharp(
  path.join(source, "AquaCircle Reinstallation in a Modern Kitchen-1.png"),
)
  .extract({ left: 685, top: 242, width: 901, height: 564 })
  .webp({ quality: 88 })
  .toFile(path.join(output, "services", "guidance.webp"));
for (const name of ["installation", "routine", "repair", "reinstallation"]) {
  const file = path.join(root, "assets", "generated", `${name}.png`);
  await access(file);
  await sharp(file)
    .resize({
      width: 1200,
      height: 800,
      fit: "cover",
      withoutEnlargement: true,
    })
    .webp({ quality: 86, effort: 6 })
    .toFile(path.join(output, "services", `${name}.webp`));
}
await sharp(path.join(root, "assets", "generated", "installation.png"))
  .resize({ width: 1300, height: 900, fit: "cover", withoutEnlargement: true })
  .webp({ quality: 88, effort: 6 })
  .toFile(path.join(output, "about", "about.webp"));
console.log(
  "Prepared five hero images, six service images and the about photograph.",
);
