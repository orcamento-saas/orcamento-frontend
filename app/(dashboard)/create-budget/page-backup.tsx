"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createBudget, generatePdf } from "@/services/budgets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { BudgetPdfPreview } from "@/components/BudgetPdfPreview";
import { LogoEditorModal } from "@/components/LogoEditorModal";
import type { BudgetItem, CreateBudgetBody } from "@/types/budget";
import type { ApiError } from "@/lib/api";
import {
  type LayoutId,
  type BudgetLayoutConfig,
  fetchBudgetLayout,
} from "@/lib/budgetLayouts";

const EMPTY_ITEM: BudgetItem = {
  description: "",
  quantity: 1,
  unitPrice: 0,
};

function ColorPaletteRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  colors: string[];
}) {
  const normalizedValue = value.toLowerCase();
  return (
    <div>
      <label className="mb-2 block text-center text-sm font-medium text-zinc-700">{label}</label>
      <div className="mb-2 flex flex-wrap justify-center gap-1.5">
        {colors.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            className={`h-8 w-8 shrink-0 rounded-md border-2 shadow-sm transition-transform hover:scale-110 ${
              normalizedValue === hex.toLowerCase()
                ? "border-zinc-900 ring-2 ring-zinc-400"
                : "border-zinc-300 hover:border-zinc-400"
            }`}
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>
    </div>
  );
}

// Componente dropdown para cores em mobile
function MobileColorDropdown({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  colors: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative flex-1">
      <label className="mb-1 block text-center text-xs font-medium text-zinc-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-8 rounded-md border border-zinc-300 shadow-sm flex items-center justify-between px-2"
        style={{ backgroundColor: value }}
      >
        <span className="text-xs font-medium" style={{ color: value === "#ffffff" ? "#000" : "#fff" }}>
          {value}
        </span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: value === "#ffffff" ? "#000" : "#fff" }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-zinc-300 rounded-md shadow-lg p-2">
          <div className="grid grid-cols-4 gap-1">
            {colors.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => {
                  onChange(hex);
                  setIsOpen(false);
                }}
                className={`h-6 w-6 rounded border-2 ${
                  value.toLowerCase() === hex.toLowerCase()
                    ? "border-zinc-900 ring-1 ring-zinc-400"
                    : "border-zinc-300"
                }`}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente dropdown para templates em mobile
function MobileTemplateDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value) || options[0];
  
  return (
    <div className="relative flex-1">
      <label className="mb-1 block text-center text-xs font-medium text-zinc-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-8 rounded-md border border-zinc-300 bg-white shadow-sm flex items-center justify-between px-2"
      >
        <span className="text-xs text-zinc-700">{selectedOption.label}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-zinc-300 rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 ${
                value === option.value ? "bg-zinc-100 font-medium" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateBudgetPage() {
  // Backup do arquivo original
  console.log("Backup criado");
  return <div>Backup criado</div>;
}