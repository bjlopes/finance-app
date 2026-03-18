/**
 * Utilitários de data para evitar bugs de timezone no mobile.
 * Strings "YYYY-MM-DD" são interpretadas como UTC pelo new Date(), causando
 * exibição de um dia anterior em fusos negativos (ex: Brasil).
 */

/** Converte "YYYY-MM-DD" para Date em horário local (evita offset de 1 dia) */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Formata "YYYY-MM-DD" para exibição em pt-BR */
export function formatLocalDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }
): string {
  return parseLocalDate(dateStr).toLocaleDateString("pt-BR", options);
}

/** Retorna a data de hoje em "YYYY-MM-DD" no fuso local */
export function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
