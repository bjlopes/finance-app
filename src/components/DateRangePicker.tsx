"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatLocalDate } from "@/lib/dateUtils";

interface DateRangePickerProps {
  dataDe: string;
  dataAte: string;
  onChange: (de: string, ate: string) => void;
  className?: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getDaysInMonth(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days = last.getDate();
  const result: (number | null)[] = Array(startPad).fill(null);
  for (let d = 1; d <= days; d++) result.push(d);
  return result;
}

export function DateRangePicker({
  dataDe,
  dataAte,
  onChange,
  className = "",
}: DateRangePickerProps) {
  const [selecting, setSelecting] = useState<"de" | "ate">("de");
  const [viewYear, setViewYear] = useState(() => {
    if (dataDe) {
      const [y] = dataDe.split("-").map(Number);
      return y;
    }
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (dataDe) {
      const [, m] = dataDe.split("-").map(Number);
      return m - 1;
    }
    return new Date().getMonth();
  });

  useEffect(() => {
    if (dataDe) {
      const [y, m] = dataDe.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [dataDe]);

  const handleDayClick = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (selecting === "de") {
      onChange(dateStr, dateStr);
      setSelecting("ate");
    } else {
      if (dateStr < dataDe) {
        onChange(dateStr, dataDe);
      } else {
        onChange(dataDe, dateStr);
      }
      setSelecting("de");
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const clearRange = () => {
    onChange("", "");
    setSelecting("de");
  };

  const days = getDaysInMonth(viewYear, viewMonth);
  const hasRange = !!dataDe && !!dataAte;
  const label = hasRange
    ? `${formatLocalDate(dataDe)} – ${formatLocalDate(dataAte)}`
    : "Selecionar período";

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Calendar size={18} className="shrink-0 text-slate-400" />
        <span className="text-sm text-slate-400">{label}</span>
        {hasRange && (
          <button
            type="button"
            onClick={clearRange}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 inline-block">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-slate-200">
            {MESES[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-center text-xs text-slate-500 py-1"
            >
              {w}
            </div>
          ))}
          {days.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isStart = dateStr === dataDe;
            const isEnd = dateStr === dataAte;
            const inRange =
              hasRange && dateStr >= dataDe && dateStr <= dataAte;
            const isToday =
              dateStr ===
              `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDayClick(viewYear, viewMonth, day)}
                className={`
                  min-h-[36px] rounded-lg text-sm font-medium transition-colors
                  ${inRange ? "bg-brand-500/20 text-brand-300" : "text-slate-200 hover:bg-slate-700/50"}
                  ${isStart || isEnd ? "bg-brand-500 text-white hover:bg-brand-600" : ""}
                  ${isToday && !inRange ? "ring-1 ring-slate-500" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          {selecting === "de"
            ? "Clique na data inicial"
            : "Clique na data final"}
        </p>
      </div>
    </div>
  );
}
