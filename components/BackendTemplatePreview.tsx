"use client";

import { useEffect, useRef, useState } from "react";

const A4_PREVIEW_WIDTH_PX = 794;
const A4_PREVIEW_HEIGHT_PX = 1123;
const PREVIEW_FRAME_PADDING_PX = 16;

interface BackendTemplatePreviewProps {
  html: string;
  loading: boolean;
  error: string | null;
  title: string;
  minHeightClassName?: string;
}

export function BackendTemplatePreview({
  html,
  loading,
  error,
  title,
  minHeightClassName = "min-h-[300px]",
}: BackendTemplatePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateFrameScale = () => {
    const container = containerRef.current;
    if (!container) return;

    const nextScale = Math.min(
      Math.max(container.clientWidth - PREVIEW_FRAME_PADDING_PX * 2, 0) /
        A4_PREVIEW_WIDTH_PX,
      Math.max(container.clientHeight - PREVIEW_FRAME_PADDING_PX * 2, 0) /
        A4_PREVIEW_HEIGHT_PX,
      1
    );

    setScale(nextScale > 0 ? nextScale : 1);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateFrameScale();
    const resizeObserver = new ResizeObserver(() => updateFrameScale());
    resizeObserver.observe(container);
    window.addEventListener("resize", updateFrameScale);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFrameScale);
    };
  }, [html]);

  if (loading && !html) {
    return (
      <div
        className={`flex h-full ${minHeightClassName} items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500`}
      >
        Carregando prévia do template...
      </div>
    );
  }

  if (error && !html) {
    return (
      <div
        className={`flex h-full ${minHeightClassName} items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-center text-sm text-red-700`}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex h-full ${minHeightClassName} items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white p-4 shadow-sm`}
    >
      <div
        style={{
          width: A4_PREVIEW_WIDTH_PX * scale,
          height: A4_PREVIEW_HEIGHT_PX * scale,
        }}
      >
        <div
          style={{
            width: A4_PREVIEW_WIDTH_PX,
            height: A4_PREVIEW_HEIGHT_PX,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "3px solid #000000",
            borderRadius: "6px",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <iframe
            title={title}
            srcDoc={html}
            scrolling="no"
            onLoad={updateFrameScale}
            style={{
              width: A4_PREVIEW_WIDTH_PX,
              height: A4_PREVIEW_HEIGHT_PX,
              border: "none",
              background: "white",
            }}
          />
        </div>
      </div>
    </div>
  );
}
