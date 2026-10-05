"use client";

// Hand-drawn charts for Finances: no charting library, just CSS bars and a little SVG for the donut and the line.
// The view toggles only change how a chart is drawn; every view shows the same already-filtered figures.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DONUT_RADIUS, donutSegments, linePath, rankAndFold, xAt, type BreakdownItem } from "@/lib/erp/charts";
import { formatPaise } from "@/lib/erp/money";

// Real colour values rather than classes, because SVG strokes need paint and one list keeps bars and donut in step.
const CATEGORY_COLOURS = ["#A67C52", "#111111", "#0F766E", "#D97706", "#64748B", "#D9BF9F"];
const OTHER_COLOUR = "#D1D5DB";

export const CHART_GREEN = "#22C55E";
export const CHART_RED = "#F87171";
export const CHART_BRONZE = "#A67C52";
export const CHART_GREY = "#9CA3AF";

function ViewToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="group" aria-label="Chart view" className="flex gap-1">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function Swatch({ colour }: { colour: string }) {
  return <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} aria-hidden="true" />;
}

function share(percent: number): string {
  return percent > 0 && percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

// A ranked breakdown of one total, as horizontal bars or a donut; amounts are always printed, so nothing depends on hovering.
export function BarBreakdown({ items, emptyText }: { items: BreakdownItem[]; emptyText: string }) {
  const [view, setView] = useState<"bar" | "donut">("bar");

  const ranked = rankAndFold(items);
  if (ranked.length === 0) return <p className="p-5 text-sm text-gray-500">{emptyText}</p>;

  const total = ranked.reduce((sum, item) => sum + item.value, 0);
  const largest = ranked[0].value;
  const segments = donutSegments(ranked.map((item) => item.value));
  const rows = ranked.map((item, index) => ({
    ...item,
    colour: item.otherItems ? OTHER_COLOUR : CATEGORY_COLOURS[index % CATEGORY_COLOURS.length],
    percent: segments[index].percent,
    offset: segments[index].offset,
  }));

  const list = (
    <ul className={`w-full min-w-0 ${view === "bar" ? "space-y-3" : "space-y-2"}`}>
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0 text-gray-700">
              <Swatch colour={row.colour} />
              <span className="truncate">{row.label}</span>
            </span>
            <span className="shrink-0 whitespace-nowrap">
              <span className="text-xs text-gray-500 mr-2">{share(row.percent)}</span>
              <span className="font-semibold text-gray-900">{formatPaise(row.value)}</span>
            </span>
          </div>
          {row.otherItems && (
            <p className="text-xs text-gray-500 truncate pl-[1.125rem]" title={row.otherItems.map((item) => item.label).join(", ")}>
              {row.otherItems.map((item) => item.label).join(", ")}
            </p>
          )}
          {view === "bar" && (
            <div className="mt-1 h-2 rounded-full bg-gray-100" aria-hidden="true">
              <div className="h-2 rounded-full" style={{ width: `${Math.max(2, (row.value / largest) * 100)}%`, backgroundColor: row.colour }} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="p-5">
      <div className="flex justify-end mb-4">
        <ViewToggle
          value={view}
          onChange={setView}
          options={[
            { value: "bar", label: "Bars" },
            { value: "donut", label: "Donut" },
          ]}
        />
      </div>

      {view === "bar" ? (
        list
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* The list beside it carries every figure, so the drawing itself is decoration to a screen reader. */}
          <div className="relative size-40 shrink-0" aria-hidden="true">
            <svg viewBox="0 0 36 36" className="size-full">
              {rows.map((row) => (
                <circle
                  key={row.label}
                  cx="18"
                  cy="18"
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={row.colour}
                  strokeWidth="4"
                  strokeDasharray={`${row.percent} ${100 - row.percent}`}
                  strokeDashoffset={row.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Total</span>
              <span className="text-xs font-bold text-matte-black">{formatPaise(total)}</span>
            </div>
          </div>
          {list}
        </div>
      )}
    </div>
  );
}

export type TrendSeries = { label: string; colour: string };
export type TrendRow = { key: string; label: string; values: number[] };

// A see-through button over each month, so clicking or tapping anywhere in its column picks it.
function MonthPicker({ rows, selected, onSelect }: { rows: { key: string; label: string }[]; selected: number; onSelect: (index: number) => void }) {
  return (
    <div className="absolute inset-0 flex">
      {rows.map((row, index) => (
        <button
          key={row.key}
          type="button"
          aria-pressed={index === selected}
          aria-label={`Show amounts for ${row.label}`}
          onClick={() => onSelect(index)}
          className={`flex-1 min-w-0 rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#A67C52] ${index === selected ? "bg-gray-900/[0.07]" : "hover:bg-gray-900/[0.04]"}`}
        />
      ))}
    </div>
  );
}

// Amounts over time, one value per series per month, as side-by-side columns or as lines; none of the values may be negative.
export function TrendChart({ rows, series, label }: { rows: TrendRow[]; series: TrendSeries[]; label: string }) {
  const [view, setView] = useState<"column" | "line">("column");
  // Starts on the latest month, so one month's exact amounts are on show before anything is clicked.
  const [picked, setPicked] = useState(rows.length - 1);
  const selected = Math.min(Math.max(picked, 0), rows.length - 1);
  const active = rows[selected];

  const max = Math.max(1, ...rows.flatMap((row) => row.values));
  const seriesTotals = series.map((_, index) => rows.reduce((sum, row) => sum + row.values[index], 0));

  return (
    <div className="p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-[11px] text-gray-500">Top of scale {formatPaise(max)}</span>
        <ViewToggle
          value={view}
          onChange={setView}
          options={[
            { value: "column", label: "Columns" },
            { value: "line", label: "Line" },
          ]}
        />
      </div>

      <div className="relative h-48 border-b border-gray-300" role="group" aria-label={label}>
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-200" aria-hidden="true" />
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-200" aria-hidden="true" />

        {view === "column" ? (
          <div className="absolute inset-0 flex items-end">
            {rows.map((row) => (
              <div key={row.key} className="flex-1 min-w-0 h-full flex items-end justify-center gap-0.5 px-0.5">
                {row.values.map((value, index) => (
                  <div
                    key={series[index].label}
                    className="w-full max-w-4 rounded-t"
                    style={{ height: `${(value / max) * 100}%`, backgroundColor: series[index].colour }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stretched to fit the box, so strokes are kept unscaled and the dots are drawn outside the SVG to stay round. */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
              {series.map((item, index) => (
                <path
                  key={item.label}
                  d={linePath(rows.map((row) => row.values[index]), max)}
                  fill="none"
                  stroke={item.colour}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            {rows.map((row, rowIndex) =>
              row.values.map((value, index) => (
                <span
                  key={`${row.key}-${series[index].label}`}
                  className="absolute size-2 rounded-full ring-2 ring-white -translate-x-1/2 translate-y-1/2"
                  style={{ left: `${xAt(rowIndex, rows.length)}%`, bottom: `${(value / max) * 100}%`, backgroundColor: series[index].colour }}
                />
              ))
            )}
          </>
        )}
        <MonthPicker rows={rows} selected={selected} onSelect={setPicked} />
      </div>

      <div className="flex mt-1" aria-hidden="true">
        {rows.map((row, index) => (
          <span
            key={row.key}
            className={`flex-1 min-w-0 text-center text-[10px] whitespace-nowrap ${index === selected ? "font-bold text-matte-black" : "text-gray-500"}`}
          >
            {row.label}
          </span>
        ))}
      </div>

      {active && (
        <div className="mt-3 rounded-md bg-gray-50 px-4 py-3" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wider text-matte-black">{active.label}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-sm text-gray-700">
            {series.map((item, index) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <Swatch colour={item.colour} />
                {item.label}
                <span className="font-semibold text-gray-900">{formatPaise(active.values[index])}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* The legend prints each series' total across every month shown. */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-gray-600">
        <span className="text-gray-500">All months shown:</span>
        {series.map((item, index) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <Swatch colour={item.colour} />
            {item.label}
            <span className="font-semibold text-gray-900">{formatPaise(seriesTotals[index])}</span>
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            {series.map((item) => (
              <th key={item.label} scope="col">{item.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, index) => (
                <td key={series[index].label}>{formatPaise(value)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// One bar per month around a zero line: profit rises above it in green, a loss drops below it in red.
export function ProfitChart({ rows }: { rows: { key: string; label: string; profit: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.profit)));
  const hasLoss = rows.some((row) => row.profit < 0);
  const net = rows.reduce((sum, row) => sum + row.profit, 0);
  const [picked, setPicked] = useState(rows.length - 1);
  const selected = Math.min(Math.max(picked, 0), rows.length - 1);
  const active = rows[selected];

  return (
    <div className="p-5">
      <div className="relative flex h-52" role="group" aria-label="Bar chart of profit or loss for each month">
        {rows.map((row, index) => (
          <div key={row.key} className="flex-1 flex flex-col items-center min-w-0 px-0.5">
            {/* Upper half holds profits, lower half losses; the halves only split when there is a loss to show. */}
            <div className="w-full flex flex-col h-[calc(100%-1rem)]">
              <div className={`flex items-end justify-center ${hasLoss ? "h-1/2" : "h-full"} border-b border-gray-300`}>
                {row.profit > 0 && (
                  <div
                    className="w-full max-w-6 rounded-t"
                    style={{ height: `${(row.profit / max) * 100}%`, backgroundColor: CHART_GREEN }}
                  />
                )}
              </div>
              {hasLoss && (
                <div className="flex items-start justify-center h-1/2">
                  {row.profit < 0 && (
                    <div
                      className="w-full max-w-6 rounded-b"
                      style={{ height: `${(Math.abs(row.profit) / max) * 100}%`, backgroundColor: CHART_RED }}
                    />
                  )}
                </div>
              )}
            </div>
            <span className={`text-[10px] whitespace-nowrap mt-1 ${index === selected ? "font-bold text-matte-black" : "text-gray-500"}`}>{row.label}</span>
          </div>
        ))}
        <MonthPicker rows={rows} selected={selected} onSelect={setPicked} />
      </div>

      {active && (
        <div className="mt-3 rounded-md bg-gray-50 px-4 py-3" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wider text-matte-black">{active.label}</p>
          <p className="flex items-center gap-1.5 mt-1 text-sm text-gray-700">
            <Swatch colour={active.profit < 0 ? CHART_RED : CHART_GREEN} />
            {active.profit < 0 ? "Loss" : "Profit"}
            <span className={`font-semibold ${active.profit < 0 ? "text-red-600" : "text-gray-900"}`}>{formatPaise(active.profit)}</span>
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><Swatch colour={CHART_GREEN} /> Profit</span>
        <span className="flex items-center gap-1.5"><Swatch colour={CHART_RED} /> Loss</span>
        <span>
          Net for these months <span className={`font-semibold ${net < 0 ? "text-red-600" : "text-gray-900"}`}>{formatPaise(net)}</span>
        </span>
      </div>
    </div>
  );
}
