"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { updateBudgetSchedule } from "@/services/budgets";
import type { Budget } from "@/types/budget";
import type { ApiError } from "@/lib/api";
import {
  buildBrScheduleString,
  scheduleBrInputToIsoUtc,
  todayYmdBr,
  toDatetimeLocalValue,
} from "@/lib/budgetSchedule";

export type BudgetScheduleTarget = {
  id: string;
  clientName: string | null;
  serviceScheduledAt: string | null;
};

const IconChevronUp = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m18 15-6-6-6 6" />
  </svg>
);

const IconChevronDown = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

function ScheduleTimeColumn({
  label,
  value,
  min,
  max,
  onChange,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const uid = useId();
  const [text, setText] = useState(() => String(value).padStart(2, "0"));

  useEffect(() => {
    setText(String(value).padStart(2, "0"));
  }, [value]);

  const commitText = useCallback(
    (raw: string) => {
      const digits = raw.replace(/\D/g, "").slice(0, 2);
      if (digits === "") {
        setText(String(value).padStart(2, "0"));
        return;
      }
      let n = parseInt(digits, 10);
      if (Number.isNaN(n)) {
        setText(String(value).padStart(2, "0"));
        return;
      }
      n = Math.min(max, Math.max(min, n));
      onChange(n);
      setText(String(n).padStart(2, "0"));
    },
    [min, max, onChange, value]
  );

  const inputId = `schedule-${label.toLowerCase()}-${uid.replace(/:/g, "")}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <label
        htmlFor={inputId}
        className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs"
      >
        {label}
      </label>
      <button
        type="button"
        className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.98] sm:h-10 sm:w-[4.25rem]"
        onClick={onIncrement}
        aria-label={`Aumentar ${label}`}
      >
        <IconChevronUp />
      </button>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={2}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        value={text}
        onChange={(e) => {
          const d = e.target.value.replace(/\D/g, "").slice(0, 2);
          setText(d);
        }}
        onBlur={() => commitText(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitText(text);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="h-11 w-14 rounded-lg border border-zinc-200 bg-white text-center font-mono text-xl font-semibold tabular-nums text-zinc-900 shadow-inner outline-none ring-teal-500/0 transition-shadow focus:border-teal-400 focus:ring-2 focus:ring-teal-500/30 sm:h-12 sm:w-[4.25rem] sm:text-2xl"
      />
      <button
        type="button"
        className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.98] sm:h-10 sm:w-[4.25rem]"
        onClick={onDecrement}
        aria-label={`Diminuir ${label}`}
      >
        <IconChevronDown />
      </button>
    </div>
  );
}

type Props = {
  target: BudgetScheduleTarget | null;
  accessToken: string | null;
  onClose: () => void;
  onSaved: (updated: Budget) => void;
};

export function BudgetScheduleModal({ target, accessToken, onClose, onSaved }: Props) {
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleHour, setScheduleHour] = useState(9);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleErr, setScheduleErr] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const raw = toDatetimeLocalValue(target.serviceScheduledAt);
    if (raw.includes("T")) {
      const [d, t] = raw.split("T");
      const [hh, mm] = (t ?? "00:00").split(":");
      setScheduleDate(d);
      setScheduleHour(Math.min(23, Math.max(0, parseInt(hh, 10) || 0)));
      setScheduleMinute(Math.min(59, Math.max(0, parseInt(mm, 10) || 0)));
    } else {
      setScheduleDate(todayYmdBr());
      setScheduleHour(9);
      setScheduleMinute(0);
    }
    setScheduleErr(null);
  }, [target]);

  const saveSchedule = async () => {
    if (!accessToken || !target) return;
    if (!scheduleDate.trim()) {
      setScheduleErr("Selecione a data.");
      return;
    }
    const composed = buildBrScheduleString(scheduleDate, scheduleHour, scheduleMinute);
    let isoUtc: string;
    try {
      isoUtc = scheduleBrInputToIsoUtc(composed);
    } catch {
      setScheduleErr("Data e hora inválidas.");
      return;
    }
    if (Number.isNaN(new Date(isoUtc).getTime())) {
      setScheduleErr("Data e hora inválidas.");
      return;
    }
    setScheduleSaving(true);
    setScheduleErr(null);
    try {
      const updated = await updateBudgetSchedule(
        target.id,
        { serviceScheduledAt: isoUtc },
        accessToken
      );
      onSaved(updated);
      onClose();
    } catch (err) {
      const e = err as ApiError;
      setScheduleErr(e.message ?? "Erro ao salvar agendamento.");
    } finally {
      setScheduleSaving(false);
    }
  };

  const clearSchedule = async () => {
    if (!accessToken || !target) return;
    setScheduleSaving(true);
    setScheduleErr(null);
    try {
      const updated = await updateBudgetSchedule(
        target.id,
        { serviceScheduledAt: null },
        accessToken
      );
      onSaved(updated);
      onClose();
    } catch (err) {
      const e = err as ApiError;
      setScheduleErr(e.message ?? "Erro ao remover agendamento.");
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <Modal
      isOpen={target !== null}
      onClose={() => {
        if (!scheduleSaving) {
          onClose();
          setScheduleErr(null);
        }
      }}
      title="Agendar serviço"
      panelClassName="max-w-md sm:max-w-lg"
    >
      {target && (
        <div className="flex flex-col gap-3 sm:gap-4">
          <p className="text-xs leading-snug text-zinc-600 sm:text-sm">
            Data e hora previstas para o serviço.
            {target.clientName ? (
              <>
                {" "}
                <span className="font-medium text-zinc-800">{target.clientName}</span>
              </>
            ) : null}
          </p>

          <div>
            <label
              htmlFor="budget-schedule-date"
              className="block text-xs font-medium text-zinc-700 sm:text-sm"
            >
              Data
            </label>
            <input
              id="budget-schedule-date"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-base"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-700 sm:text-sm">Horário (Brasília)</p>
            <div className="mt-2 flex flex-wrap items-end justify-center gap-1.5 sm:mt-2.5 sm:gap-4">
              <ScheduleTimeColumn
                label="Hora"
                value={scheduleHour}
                min={0}
                max={23}
                onChange={setScheduleHour}
                onIncrement={() => setScheduleHour((h) => (h + 1) % 24)}
                onDecrement={() => setScheduleHour((h) => (h - 1 + 24) % 24)}
              />
              <span
                className="mb-8 select-none text-2xl font-light leading-none text-zinc-300 sm:mb-9 sm:text-3xl"
                aria-hidden
              >
                :
              </span>
              <ScheduleTimeColumn
                label="Minuto"
                value={scheduleMinute}
                min={0}
                max={59}
                onChange={setScheduleMinute}
                onIncrement={() => setScheduleMinute((m) => (m + 1) % 60)}
                onDecrement={() => setScheduleMinute((m) => (m - 1 + 60) % 60)}
              />
            </div>
          </div>

          {scheduleErr && (
            <p className="text-xs text-red-600 sm:text-sm" role="alert">
              {scheduleErr}
            </p>
          )}

          <div className="flex flex-col-reverse gap-1.5 border-t border-zinc-100 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2 sm:pt-4">
            {target.serviceScheduledAt ? (
              <Button
                type="button"
                variant="secondary"
                disabled={scheduleSaving}
                className="w-full sm:mr-auto sm:w-auto"
                onClick={() => void clearSchedule()}
              >
                Remover agendamento
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              disabled={scheduleSaving}
              className="w-full sm:w-auto sm:min-w-[7.5rem]"
              onClick={() => {
                onClose();
                setScheduleErr(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              isLoading={scheduleSaving}
              className="w-full sm:w-auto sm:min-w-[7.5rem]"
              onClick={() => void saveSchedule()}
            >
              Salvar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
