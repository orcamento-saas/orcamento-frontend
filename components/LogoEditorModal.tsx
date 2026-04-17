"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

// A logo no PDF usa área retangular (2:1); exportamos maior para evitar borrado.
const LOGO_EXPORT_WIDTH = 1024;
const LOGO_EXPORT_HEIGHT = 512;
const CROP_WIDTH = 560;
const CROP_HEIGHT = 280;
const CROP_MIN_WIDTH = 220;
const CROP_MIN_HEIGHT = 110;

export interface LogoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string | null;
  onConfirm: (resizedDataUrl: string) => void;
}

/** Carrega uma imagem a partir de URL (data URL ou http). */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.src = url;
  });
}

/**
 * Gera a imagem recortada em pixels e redimensionada para alta resolução.
 * Baseado na documentação e exemplos oficiais do react-easy-crop.
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number = LOGO_EXPORT_WIDTH,
  outputHeight: number = LOGO_EXPORT_HEIGHT
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d não disponível");

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Forca interpolacao de alta qualidade no downscale/upscale.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return canvas.toDataURL("image/png");
}

export function LogoEditorModal({
  isOpen,
  onClose,
  imageDataUrl,
  onConfirm,
}: LogoEditorModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropSize, setCropSize] = useState({ width: CROP_WIDTH, height: CROP_HEIGHT });
  const [confirming, setConfirming] = useState(false);
  const cropContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMinZoom(0.2);
    setCroppedAreaPixels(null);
    setCropSize({ width: CROP_WIDTH, height: CROP_HEIGHT });
  }, [isOpen, imageDataUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const updateCropSize = () => {
      const container = cropContainerRef.current;
      if (!container) return;

      // Reserva bordas/folga interna para garantir que o retângulo apareça inteiro.
      const availableWidth = Math.max(CROP_MIN_WIDTH, container.clientWidth - 28);
      const availableHeight = Math.max(CROP_MIN_HEIGHT, container.clientHeight - 28);

      let width = Math.min(CROP_WIDTH, availableWidth);
      let height = width / 2;

      if (height > availableHeight) {
        height = availableHeight;
        width = height * 2;
      }

      setCropSize({
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    updateCropSize();
    window.addEventListener("resize", updateCropSize);
    return () => window.removeEventListener("resize", updateCropSize);
  }, [isOpen, imageDataUrl]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!imageDataUrl || !croppedAreaPixels) return;
    setConfirming(true);
    try {
      const dataUrl = await getCroppedImg(imageDataUrl, croppedAreaPixels);
      onConfirm(dataUrl);
      onClose();
    } catch {
      // fallback: poderia mostrar mensagem de erro
    } finally {
      setConfirming(false);
    }
  }, [imageDataUrl, croppedAreaPixels, onConfirm, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajustar logo">
      <div className="space-y-4">
        <p className="text-sm text-zinc-600">
          Arraste a imagem para posicionar e use o zoom. O retângulo é o que
          aparecerá no PDF.
        </p>

        {imageDataUrl && (
          <div
            ref={cropContainerRef}
            className="relative h-[380px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
          >
            <Cropper
              image={imageDataUrl}
              crop={crop}
              zoom={zoom}
              minZoom={minZoom}
              aspect={2}
              objectFit="contain"
              restrictPosition={false}
              cropSize={cropSize}
              cropShape="rect"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onCropAreaChange={onCropComplete}
              onMediaLoaded={(mediaSize) => {
                const fitByWidth = cropSize.width / mediaSize.naturalWidth;
                const fitByHeight = cropSize.height / mediaSize.naturalHeight;
                const fitZoom = Math.min(fitByWidth, fitByHeight);
                const computedMinZoom = Math.max(0.1, Math.min(1, fitZoom));
                setMinZoom(computedMinZoom);
                setZoom(computedMinZoom);
              }}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Zoom</label>
          <input
            type="range"
            min={minZoom}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-zinc-700"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-sm">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || confirming}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-green-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirming ? "Aplicando…" : "Usar esta logo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
