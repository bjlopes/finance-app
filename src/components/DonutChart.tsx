"use client";

import { useState } from "react";

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  total: number;
  formatValue: (n: number) => string;
  size?: number;
}

export function DonutChart({
  data,
  total,
  formatValue,
  size = 240,
}: DonutChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0 || total <= 0) return null;

  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 2;

  const leaderLength = 16;
  const tickLength = 3;
  const innerRadius = radius - strokeWidth / 2;
  const outerRadius = radius + strokeWidth / 2 + leaderLength;

  const MIN_PCT_FOR_LEADER = 0.06;
  const LABEL_COLOR = "rgb(148 163 184)";
  const LINE_COLOR = "rgb(100 116 139 / 0.5)";

  const margin = 72;
  const viewBox = `${-margin} ${-margin} ${size + margin * 2} ${size + margin * 2}`;

  let offset = -90;

  const segments = data.map((item) => {
    const pct = total > 0 ? item.value / total : 0;
    const segmentGap = gap / data.length;
    const strokeLength = Math.max(1, pct * circumference - segmentGap);
    const startAngle = offset;
    const midAngle = offset + (pct * 360) / 2;
    offset += pct * 360;

    const midRad = (midAngle * Math.PI) / 180;
    const innerX = cx + innerRadius * Math.cos(midRad);
    const innerY = cy + innerRadius * Math.sin(midRad);
    const outerX = cx + outerRadius * Math.cos(midRad);
    const outerY = cy + outerRadius * Math.sin(midRad);
    const perpRad = midRad + Math.PI / 2;
    const tick1X = innerX + tickLength * Math.cos(perpRad);
    const tick1Y = innerY + tickLength * Math.sin(perpRad);
    const tick2X = innerX - tickLength * Math.cos(perpRad);
    const tick2Y = innerY - tickLength * Math.sin(perpRad);

    const isLeft = midAngle > 90 && midAngle < 270;
    const isBottom = midAngle > 0 && midAngle < 180;
    const textAnchor: "start" | "end" = isLeft ? "end" : "start";
    const textOffset = 4;
    const textX = outerX + (isLeft ? -textOffset : textOffset);
    const textY = outerY + (isBottom ? 3 : -1);
    const showLeader = pct >= MIN_PCT_FOR_LEADER;

    return {
      ...item,
      strokeLength,
      startAngle,
      pct,
      innerX,
      innerY,
      outerX,
      outerY,
      tick1X,
      tick1Y,
      tick2X,
      tick2Y,
      textX,
      textY,
      textAnchor,
      showLeader,
    };
  });

  const overflowLabels = segments.filter((s) => !s.showLeader);

  const centerValue = selectedIndex !== null ? segments[selectedIndex]!.value : total;
  const centerLabel = selectedIndex !== null ? segments[selectedIndex]!.label : "total";

  return (
    <div className="relative flex flex-col items-center w-full max-w-[min(100%,320px)]">
      <svg
        width="100%"
        height="auto"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {segments.map((seg, i) => {
          const isSelected = selectedIndex === i;
          const isHovered = hoveredIndex === i;
          const isActive = isSelected || isHovered;
          return (
            <g key={i}>
              <g
                transform={`rotate(${seg.startAngle}, ${cx}, ${cy})`}
                className="cursor-pointer"
                onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.strokeLength} ${circumference}`}
                  strokeLinecap="round"
                  opacity={isActive ? 1 : 0.75}
                  className="transition-all duration-200 ease-out"
                />
              </g>
              {seg.showLeader && (
                <g
                  className="cursor-pointer"
                  onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <line
                    x1={seg.tick1X}
                    y1={seg.tick1Y}
                    x2={seg.tick2X}
                    y2={seg.tick2Y}
                    stroke={LINE_COLOR}
                    strokeWidth="1"
                  />
                  <line
                    x1={seg.innerX}
                    y1={seg.innerY}
                    x2={seg.outerX}
                    y2={seg.outerY}
                    stroke={LINE_COLOR}
                    strokeWidth="1"
                  />
                  <text
                    x={seg.textX}
                    y={seg.textY}
                    textAnchor={seg.textAnchor}
                    dominantBaseline="middle"
                    className="select-none font-medium"
                    style={{ fontSize: 9, fill: LABEL_COLOR }}
                  >
                    {`${seg.label} (${(seg.pct * 100).toFixed(0)}%)`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ margin: strokeWidth / 2 }}
      >
        <span className="text-lg font-semibold tabular-nums text-slate-100">
          {formatValue(centerValue)}
        </span>
        <span className="text-[10px] text-slate-500 capitalize mt-0.5">
          {centerLabel}
        </span>
      </div>
      {overflowLabels.length > 0 && (
        <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
          {overflowLabels.map((seg) => {
            const idx = segments.indexOf(seg);
            const isActive = selectedIndex === idx || hoveredIndex === idx;
            return (
              <li key={idx}>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[10px] hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ opacity: isActive ? 1 : 0.85 }}
                  onClick={() => setSelectedIndex(selectedIndex === idx ? null : idx)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className="w-2 h-2 rounded-full shrink-0 bg-slate-500" />
                  <span className="text-slate-400 capitalize">{seg.label}</span>
                  <span className="text-slate-500">({(seg.pct * 100).toFixed(0)}%)</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
