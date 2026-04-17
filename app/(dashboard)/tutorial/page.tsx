import fs from "node:fs/promises";
import path from "node:path";
import { TutorialGuide } from "@/components/TutorialGuide";

const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const TAB_ORDER: Array<{ rank: number; pattern: RegExp }> = [
  { rank: 0, pattern: /login|entrar|acesso/i },
  { rank: 1, pattern: /dashboard|inicio|home/i },
  { rank: 2, pattern: /meus|lista|orcamentos|orçamentos|budgets/i },
  { rank: 3, pattern: /perfil|profile|budget-profile/i },
  { rank: 4, pattern: /novo|create|criar|create-budget/i },
  { rank: 5, pattern: /agend|schedule/i },
  { rank: 6, pattern: /conta|account|perfil-usuario|usuario/i },
];

type TutorialImage = {
  src: string;
  fileName: string;
};

function getFileOrder(fileName: string): number {
  const normalized = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const match = TAB_ORDER.find((item) => item.pattern.test(normalized));
  return match?.rank ?? Number.MAX_SAFE_INTEGER;
}

async function getTutorialImages(): Promise<TutorialImage[]> {
  const tutorialDirectory = path.join(process.cwd(), "public", "tutorial");

  try {
    const entries = await fs.readdir(tutorialDirectory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => SUPPORTED_EXTENSIONS.includes(path.extname(name).toLowerCase()))
      .sort((a, b) => {
        const orderA = getFileOrder(a);
        const orderB = getFileOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
      })
      .map((fileName) => ({
        src: `/tutorial/${encodeURIComponent(fileName)}`,
        fileName,
      }));
  } catch {
    return [];
  }
}

export default async function TutorialPage() {
  const images = await getTutorialImages();

  return (
    <div className="h-full overflow-hidden py-1">
      <TutorialGuide images={images} />
    </div>
  );
}
