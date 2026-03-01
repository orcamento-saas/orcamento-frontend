"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const PDF_LOGO_SIZE = 96;

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
 * Gera a imagem recortada em pixels e redimensionada para PDF_LOGO_SIZE.
 * Baseado na documentação e exemplos oficiais do react-easy-crop.
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number = PDF_LOGO_SIZE
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d não disponível");

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
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
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);

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
          Arraste a imagem para posicionar e use o zoom. O quadrado é o que
          aparecerá no PDF (96×96 px).
        </p>

        {imageDataUrl && (
          <div className="relative h-[320px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
            <Cropper
              image={imageDataUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid
              roundCropAreaPixels
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onCropAreaChange={onCropComplete}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-zinc-700"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || confirming}
          >
            {confirming ? "Aplicando…" : "Usar esta logo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
