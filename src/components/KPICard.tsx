/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import * as Icons from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof Icons;
  colorClass: string;
  subtitle?: string;
  badge?: {
    text: string;
    isPositive: boolean;
  };
  progress?: number; // target achievement progress
  id?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  iconName,
  colorClass,
  subtitle,
  badge,
  progress,
  id
}) => {
  const IconComponent = Icons[iconName] as React.ComponentType<{ className?: string }>;

  // Derive status color styling for the accent line and indicators
  const getAccentColor = () => {
    const t = title.toLowerCase();
    if (t.includes("sales") || t.includes("volume") || t.includes("transaction")) return { border: "border-l-4 border-l-[#1F4E79]", bg: "bg-[#1F4E79]/5", text: "text-[#1F4E79]", stroke: "#1F4E79" };
    if (t.includes("achievement") || t.includes("conversion")) return { border: "border-l-4 border-l-[#2E7D32]", bg: "bg-[#2E7D32]/5", text: "text-[#2E7D32]", stroke: "#2E7D32" };
    if (t.includes("discount") || t.includes("promo")) return { border: "border-l-4 border-l-[#3949AB]", bg: "bg-[#3949AB]/5", text: "text-[#3949AB]", stroke: "#3949AB" };
    if (t.includes("return") || t.includes("threat") || t.includes("stockout")) {
      const isBad = value === "High" || (typeof value === "string" && parseFloat(value) > 5);
      return {
        border: `border-l-4 ${isBad ? "border-l-[#C62828]" : "border-l-[#F9A825]"}`,
        bg: isBad ? "bg-[#C62828]/5" : "bg-[#F9A825]/5",
        text: isBad ? "text-[#C62828]" : "text-[#F9A825]",
        stroke: isBad ? "#C62828" : "#F9A825"
      };
    }
    return { border: "border-l-4 border-l-[#1976D2]", bg: "bg-[#1976D2]/5", text: "text-[#1976D2]", stroke: "#1976D2" };
  };

  const accent = getAccentColor();

  // Generate a distinct, deterministic, clean sparkline path based on the title to look professional & consistent
  const getSparklinePath = () => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const points: number[] = [];
    for (let i = 0; i < 7; i++) {
      const offset = (hash >> (i * 3)) & 15;
      // create waves with average standard deviation to look like a realistic sales trend
      points.push(15 + (offset % 12));
    }
    // Convert points to SVG line coordinates (width 80, height 30)
    const segmentWidth = 75 / (points.length - 1);
    return points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${index * segmentWidth + 2.5} ${p}`).join(' ');
  };

  const sparklinePath = getSparklinePath();

  return (
    <div
      id={id || `kpi-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className={`bg-white dark:bg-[#1E1E1E] border border-[#E5E7EB] dark:border-[#2D2D2D] ${accent.border} rounded-r-xl rounded-l-md p-5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#A0AEC0] uppercase tracking-wider block truncate mb-1">
            {title}
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2937] dark:text-white font-sans">
            {value}
          </h3>
        </div>
        <div className={`p-2 rounded-lg ${accent.bg} ${accent.text} flex-shrink-0`}>
          {IconComponent && <IconComponent className="w-5 h-5 stroke-[1.75]" />}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {progress !== undefined && (
            <div className="w-full pr-2">
              <div className="flex justify-between text-[11px] font-semibold mb-1">
                <span className="text-[#6B7280] dark:text-[#A0AEC0]">Target Goal Achievement</span>
                <span className={progress >= 100 ? "text-[#2E7D32]" : "text-[#F9A825]"}>
                  {progress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[#F5F7FA] dark:bg-[#2D2D2D] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    progress >= 100 ? "bg-[#2E7D32]" : "bg-[#F9A825]"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {badge && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide ${
                  badge.isPositive
                    ? "bg-[#2E7D32]/10 text-[#2E7D32] dark:bg-[#2E7D32]/20 dark:text-emerald-400"
                    : "bg-[#C62828]/10 text-[#C62828] dark:bg-[#C62828]/20 dark:text-red-400"
                }`}
              >
                {badge.isPositive ? "▲" : "▼"} {badge.text}
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] text-[#6B7280] dark:text-[#A0AEC0] truncate" title={subtitle}>
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Executive Sparkline element */}
        <div className="w-20 h-8 flex-shrink-0 flex items-center justify-end pb-1 pl-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 80 30">
            <path
              d={sparklinePath}
              fill="none"
              stroke={accent.stroke}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-80 animate-[dash_1.5s_ease-in-out_forwards]"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
