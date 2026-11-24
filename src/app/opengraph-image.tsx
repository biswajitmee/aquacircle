import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const alt = "AquaCircle — Water care. Made simple.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  const logo = await readFile(
    join(process.cwd(), "public/images/brand/aquacircle-logo.png"),
    "base64",
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#DCEFE9",
          color: "#123F3B",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div style={{ fontSize: 28, display: "flex" }}>
          WATER PURIFIER CARE IN KOLKATA
        </div>
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 70,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Water care.</span>
          <span>Made simple.</span>
        </div>
        <div style={{ display: "flex", fontSize: 27, marginTop: 45 }}>
          Pure Care. Full Circle. · aquacircle.in
        </div>
        <div
          style={{
            position: "absolute",
            right: 70,
            top: 190,
            display: "flex",
            background: "white",
            padding: 24,
            borderRadius: 24,
          }}
        >
          {/* next/og embeds image bytes directly when rendering the share card. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${logo}`}
            width={330}
            height={255}
            alt="AquaCircle.in"
          />
        </div>
      </div>
    ),
    size,
  );
}
