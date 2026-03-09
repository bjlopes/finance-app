"use client";

import { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

function formatCurrency(digits: string): string {
  if (!digits) return "";
  const cents = digits.slice(-2).padStart(2, "0");
  const reaisRaw = digits.slice(0, -2) || "0";
  const reais = reaisRaw.replace(/^0+/, "") || "0";
  const formatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${formatted},${cents}`;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  required = false,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay(formatCurrency(value || ""));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(digits);
    setDisplay(formatCurrency(digits));
  };

  const handleBlur = () => {
    const digits = display.replace(/\D/g, "");
    setDisplay(formatCurrency(digits));
    onChange(digits);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      required={required}
    />
  );
}
