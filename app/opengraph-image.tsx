import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "small Talk — Get more detailed Google reviews";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F9F6F0",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#1A2E25",
            fontFamily: "Georgia, serif",
          }}
        >
          small Talk
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#5E7268",
            marginTop: 16,
            fontFamily: "sans-serif",
          }}
        >
          Get more detailed Google reviews
        </div>
        <div
          style={{
            width: 60,
            height: 4,
            backgroundColor: "#E05A3D",
            borderRadius: 2,
            marginTop: 32,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
