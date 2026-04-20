"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";

type TutorialImage = {
  src: string;
  fileName: string;
};

type TutorialGuideProps = {
  images: TutorialImage[];
  /** Imagens para viewports abaixo do breakpoint `lg`; se vazio, usa só `images`. */
  mobileImages?: TutorialImage[];
};

type TutorialTab = {
  tabName: string;
  description: string;
};

const TAB_HINTS: Array<{
  pattern: RegExp;
  tabName: string;
  description: string;
}> = [
  {
    pattern: /login|entrar|acesso/i,
    tabName: "Login",
    description:
      "Tela de acesso para entrar na aplicação com e-mail e senha e iniciar o uso do sistema.",
  },
  {
    pattern: /dashboard|inicio|home/i,
    tabName: "Dashboard",
    description:
      "Exibe os indicadores de orçamentos criados, assinados e concluídos, com filtros de período e gráfico por status.",
  },
  {
    pattern: /meus|lista|orcamentos|orçamentos|budgets/i,
    tabName: "Meus orçamentos",
    description:
      "Lista todos os orçamentos com busca e filtros, permitindo abrir PDF, compartilhar para assinatura, ver assinado, agendar, marcar como concluído e excluir.",
  },
  {
    pattern: /perfil|profile|budget-profile/i,
    tabName: "Perfil de orçamento",
    description:
      "Configura os dados padrão da empresa, template e cores para aplicar automaticamente na criação de novos orçamentos.",
  },
  {
    pattern: /novo|create|criar|create-budget/i,
    tabName: "Novo orçamento",
    description:
      "Permite montar o orçamento completo com cliente, itens e valores, visualizar prévia em tempo real e finalizar com geração de PDF.",
  },
  {
    pattern: /agend|schedule/i,
    tabName: "Agendados",
    description:
      "Mostra os orçamentos com data de execução agendada em lista e calendário, com filtros por período e atualização de status.",
  },
  {
    pattern: /conta|account|perfil-usuario|usuario/i,
    tabName: "Minha conta",
    description:
      "Central de dados da conta: atualiza nome e telefone, e gerencia assinatura, forma de pagamento e cancelamento do plano.",
  },
  {
    pattern: /admin|administracao|administração/i,
    tabName: "Administração",
    description:
      "Painel administrativo para filtrar usuários, alterar plano, suspender/reativar contas e auditar eventos do sistema.",
  },
  {
    pattern: /tutorial|guia/i,
    tabName: "Tutorial",
    description:
      "Guia visual das abas do sistema com navegação por setas para avançar rapidamente entre as telas.",
  },
];

function formatFileNameAsTab(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const normalized = baseName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "Tutorial";

  return normalized
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildTab(fileName: string): TutorialTab {
  const normalized = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const match = TAB_HINTS.find((hint) => hint.pattern.test(normalized));
  if (match) {
    return {
      tabName: match.tabName,
      description: match.description,
    };
  }

  return {
    tabName: formatFileNameAsTab(fileName),
    description:
      "Faça login na aplicação, caso não tenha crie sua conta.",
  };
}

export function TutorialGuide({ images, mobileImages = [] }: TutorialGuideProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [useMobileGallery, setUseMobileGallery] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => {
      setUseMobileGallery(mq.matches && mobileImages.length > 0);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [mobileImages.length]);

  const activeImages = useMemo(() => {
    const hasMobile = mobileImages.length > 0;
    const hasDesktop = images.length > 0;

    if (useMobileGallery && hasMobile) {
      return mobileImages;
    }
    if (hasDesktop) {
      return images;
    }
    if (hasMobile) {
      return mobileImages;
    }
    return [];
  }, [images, mobileImages, useMobileGallery]);

  useEffect(() => {
    setCurrentIndex((i) => {
      if (activeImages.length === 0) return 0;
      return Math.min(i, activeImages.length - 1);
    });
  }, [activeImages]);

  const goToPrevious = () => {
    if (activeImages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  const goToNext = () => {
    if (activeImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeImages.length);
  };

  const tabs = useMemo(
    () => activeImages.map((image) => buildTab(image.fileName)),
    [activeImages]
  );

  if (images.length === 0 && mobileImages.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Nenhuma imagem encontrada em <span className="font-semibold">public/tutorial</span> nem em{" "}
        <span className="font-semibold">public/tutorial_mobile</span>.
        <br />
        Adicione os prints das telas nessas pastas para montar o tutorial visual.
      </div>
    );
  }

  const currentImage = activeImages[currentIndex];
  const currentTab = tabs[currentIndex];

  return (
    <section className="flex h-full min-h-0 flex-col">
      <article className="flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">{currentTab.tabName}</h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
            {currentIndex + 1} / {activeImages.length}
          </span>
        </div>

        <p className="mb-2 text-sm leading-5 text-zinc-600">{currentTab.description}</p>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={currentImage.src}
            src={currentImage.src}
            alt={`Tela da aba ${currentTab.tabName}`}
            className="h-full w-full object-contain transition duration-500 ease-out"
          />
        </div>

        <div className="mt-2 flex gap-3 sm:mx-auto sm:max-w-md">
          <button
            type="button"
            onClick={goToPrevious}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Voltar
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Próxima
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </article>
    </section>
  );
}
