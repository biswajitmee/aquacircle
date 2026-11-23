import { ImageResponse } from "next/og";
export const alt = "AquaCircle — Water care. Made simple.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
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
        <div style={{ fontSize: 32, display: "flex" }}>AquaCircle</div>
        <div
          style={{
            fontSize: 90,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 65,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Water care.</span>
          <span>Made simple.</span>
        </div>
        <div style={{ display: "flex", fontSize: 27, marginTop: 45 }}>
          Water purifier care in Kolkata · aquacircle.in
        </div>
        <div
          style={{
            position: "absolute",
            right: -100,
            top: 70,
            border: "60px solid #42D5CF",
            borderRadius: "50%",
            width: 420,
            height: 420,
            opacity: 0.25,
          }}
        />
      </div>
    ),
    size,
  );
}
