"use client";

import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SeatBookingStatus = "AVAILABLE" | "LOCKED" | "BOOKED";
type SeatType = "REGULAR" | "COUPLE" | "RECLINER";

export interface SeatItem {
  id: number;
  status: SeatBookingStatus;
  price: string;
  isLockedByCurrentUser?: boolean;
  screenSeat: {
    rowLabel: string;
    seatNumber: number;
    seatLabel: string;
    seatType: SeatType;
  };
}

// ── Sizing constants (pixel-precise for alignment) ────────────────────────────
//
//  Regular seat  : 40 px wide, 36 px tall
//  Gap in section: 6 px  (gap-1.5)
//  Aisle gap     : 24 px (gap-6)
//  Section size  : 10 regular seats per section
//
//  Recliner      : 86 px wide  = 2 × 40 + 1 × 6  (spans exactly 2 regular slots)
//                  46 px tall  (visibly bigger / deeper)
//  Rec section   : 5 recliners = 5 × 86 + 4 × 6 = 454 px
//  Reg section   : 10 regulars = 10 × 40 + 9 × 6 = 454 px  → rows align perfectly

const REG_W   = 40;   // px
const REG_H   = 36;   // px
const REC_H   = 46;   // px
const SEAT_GAP = 6;   // px between seats within a section
const REC_W   = 2 * REG_W + SEAT_GAP; // 86px

// ── Claymorphism shadow helpers ───────────────────────────────────────────────

// Raised clay button (available / unselected)
const CLAY_UP =
  "4px 4px 10px rgba(0,0,0,0.14), " +
  "-1px -1px 4px rgba(255,255,255,0.9), " +
  "inset 2px 2px 4px rgba(255,255,255,0.7), " +
  "inset -1px -1px 3px rgba(0,0,0,0.06)";

// Pressed-in clay (booked / locked)
const CLAY_PRESSED =
  "inset 3px 3px 7px rgba(0,0,0,0.15), " +
  "inset -2px -2px 5px rgba(255,255,255,0.7)";

// Selected – deeper, vibrant shadow
const CLAY_SELECTED =
  "5px 5px 14px rgba(183,19,26,0.35), " +
  "-1px -1px 4px rgba(255,255,255,0.6), " +
  "inset 2px 2px 5px rgba(255,255,255,0.25), " +
  "inset -2px -2px 5px rgba(0,0,0,0.18)";

// ── Per-type color palettes ───────────────────────────────────────────────────

type Palette = {
  label: string;
  availBg: string;      // CSS background for available
  availText: string;
  selBg: string;        // CSS background for selected
  selText: string;
  lockedBg: string;
  lockedText: string;
  bookedBg: string;
  bookedText: string;
  legendDot: string;    // tailwind class for legend dot
};

const PALETTE: Record<SeatType, Palette> = {
  REGULAR: {
    label: "Regular",
    availBg:    "linear-gradient(145deg, #eff6ff 0%, #bfdbfe 100%)",
    availText:  "#1e3a8a",
    selBg:      "linear-gradient(145deg, #dc2626 0%, #b7131a 100%)",
    selText:    "#fff",
    lockedBg:   "linear-gradient(145deg, #fefce8 0%, #fef08a 100%)",
    lockedText: "#713f12",
    bookedBg:   "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
    bookedText: "#94a3b8",
    legendDot:  "bg-blue-400",
  },
  COUPLE: {
    label: "Premium",
    availBg:    "linear-gradient(145deg, #fff1f2 0%, #fecdd3 100%)",
    availText:  "#881337",
    selBg:      "linear-gradient(145deg, #dc2626 0%, #b7131a 100%)",
    selText:    "#fff",
    lockedBg:   "linear-gradient(145deg, #fefce8 0%, #fef08a 100%)",
    lockedText: "#713f12",
    bookedBg:   "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
    bookedText: "#94a3b8",
    legendDot:  "bg-rose-400",
  },
  RECLINER: {
    label: "Recliner",
    availBg:    "linear-gradient(145deg, #fffbeb 0%, #fde68a 100%)",
    availText:  "#78350f",
    selBg:      "linear-gradient(145deg, #dc2626 0%, #b7131a 100%)",
    selText:    "#fff",
    lockedBg:   "linear-gradient(145deg, #fefce8 0%, #fef08a 100%)",
    lockedText: "#713f12",
    bookedBg:   "linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)",
    bookedText: "#94a3b8",
    legendDot:  "bg-amber-400",
  },
};

// ── Individual Seat button ────────────────────────────────────────────────────

function Seat({
  seat, selected, onToggle,
}: {
  seat: SeatItem;
  selected: boolean;
  onToggle: (s: SeatItem) => void;
}) {
  const pal      = PALETTE[seat.screenSeat.seatType];
  const isRec    = seat.screenSeat.seatType === "RECLINER";
  const isOwnedLock = seat.status === "LOCKED" && seat.isLockedByCurrentUser;
  const disabled = seat.status === "BOOKED" || (seat.status === "LOCKED" && !isOwnedLock);

  const w = isRec ? REC_W : REG_W;
  const h = isRec ? REC_H : REG_H;

  let bg: string;
  let color: string;
  let shadow: string;
  let cursor: string;
  let extra = "";

  if (seat.status === "BOOKED") {
    bg = pal.bookedBg; color = pal.bookedText; shadow = CLAY_PRESSED; cursor = "not-allowed";
    extra = "opacity-60 line-through";
  } else if (seat.status === "LOCKED") {
    bg = pal.lockedBg; color = pal.lockedText; shadow = CLAY_PRESSED; cursor = "not-allowed";
  } else if (selected) {
    bg = pal.selBg; color = pal.selText; shadow = CLAY_SELECTED; cursor = "pointer";
  } else {
    bg = pal.availBg; color = pal.availText; shadow = CLAY_UP; cursor = "pointer";
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onToggle(seat)}
      title={`${seat.screenSeat.seatLabel} · ${pal.label} · Rs. ${Number(seat.price).toLocaleString("en-IN")}${seat.status !== "AVAILABLE" ? ` (${seat.status})` : ""}`}
      className={`inline-flex items-center justify-center font-mono font-bold select-none
        transition-transform duration-150 active:scale-95
        ${!disabled && !selected ? "hover:scale-105 hover:-translate-y-0.5" : ""}
        ${selected ? "scale-105 -translate-y-0.5" : ""}
        ${extra}`}
      style={{
        width: w,
        height: h,
        fontSize: isRec ? 9 : 10,
        borderRadius: isRec ? "10px 10px 6px 6px" : "8px 8px 4px 4px",
        background: bg,
        color,
        boxShadow: shadow,
        cursor,
        border: "none",
        outline: "none",
        // Clay "neck" of the seat back – tiny border-bottom detail
        borderBottom: `3px solid rgba(0,0,0,0.10)`,
      }}
    >
      {seat.screenSeat.seatLabel}
    </button>
  );
}

// ── Chunk helper ──────────────────────────────────────────────────────────────

function chunkBy<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// ── Price / Status Legend ─────────────────────────────────────────────────────

function PriceLegend({ seats }: { seats: SeatItem[] }) {
  const seen = new Map<SeatType, string>();
  for (const s of seats) {
    if (!seen.has(s.screenSeat.seatType)) seen.set(s.screenSeat.seatType, s.price);
  }

  const CLAY_PILL =
    "4px 4px 8px rgba(0,0,0,0.10), " +
    "-1px -1px 3px rgba(255,255,255,0.9), " +
    "inset 1px 1px 3px rgba(255,255,255,0.8), " +
    "inset -1px -1px 2px rgba(0,0,0,0.05)";

  const pill = (key: string, dot: string, label: string, sub?: string) => (
    <span
      key={key}
      className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-on-surface rounded-2xl bg-surface-container-lowest"
      style={{ boxShadow: CLAY_PILL }}
    >
      <span className={`w-3 h-3 rounded-md inline-block shrink-0 ${dot}`} />
      {label}{sub ? <span className="text-on-surface-variant font-normal">· Rs.&nbsp;{sub}</span> : null}
    </span>
  );

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {(["REGULAR", "COUPLE", "RECLINER"] as SeatType[])
        .filter((t) => seen.has(t))
        .map((t) =>
          pill(t, PALETTE[t].legendDot, PALETTE[t].label,
            Number(seen.get(t)!).toLocaleString("en-IN"))
        )}
      {pill("sel",    "bg-primary rounded-full",  "Selected")}
      {pill("locked", "bg-yellow-300 rounded-full","Locked")}
      {pill("booked", "bg-slate-300 rounded-full", "Booked")}
    </div>
  );
}

// ── Live / Interactive Layout ─────────────────────────────────────────────────

function LiveSeatLayout({
  seats, selectedIds, onToggle,
}: {
  seats: SeatItem[];
  selectedIds: number[];
  onToggle: (s: SeatItem) => void;
}) {
  const rowMap = new Map<string, SeatItem[]>();
  for (const s of seats) {
    if (!rowMap.has(s.screenSeat.rowLabel)) rowMap.set(s.screenSeat.rowLabel, []);
    rowMap.get(s.screenSeat.rowLabel)!.push(s);
  }
  for (const v of rowMap.values()) v.sort((a, b) => a.screenSeat.seatNumber - b.screenSeat.seatNumber);

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {[...rowMap.entries()].map(([rowLabel, rowSeats]) => {
        const type      = rowSeats[0]?.screenSeat.seatType ?? "REGULAR";
        const isRec     = type === "RECLINER";
        // Regular/Premium: 10 per section | Recliner: 5 per section (= 10 regular slots)
        const sections  = chunkBy(rowSeats, isRec ? 5 : 10);
        const rowHeight = isRec ? REC_H : REG_H;

        return (
          <div
            key={rowLabel}
            className="flex items-center"
            style={{ gap: 8 }}
          >
            {/* Row label */}
            <span
              className="shrink-0 font-bold text-on-surface-variant text-center"
              style={{ width: 24, fontSize: 11 }}
            >
              {rowLabel}
            </span>

            {/* Sections with aisle gap between them */}
            <div className="flex items-center" style={{ gap: 24 }}>
              {sections.map((section, si) => (
                <div
                  key={si}
                  className="flex items-end"
                  style={{ gap: SEAT_GAP, height: rowHeight }}
                >
                  {section.map((s) => (
                    <Seat
                      key={s.id}
                      seat={s}
                      selected={selectedIds.includes(s.id)}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Static Preview (admin config mode) ───────────────────────────────────────

function StaticPreview({
  regularRows, coupleRows, reclinerRows, totalCols,
  maxRenderRows = 50, maxRenderCols = 50,
}: {
  regularRows: number; coupleRows: number; reclinerRows: number; totalCols: number;
  maxRenderRows?: number; maxRenderCols?: number;
}) {
  const reg  = Math.max(0, regularRows);
  const cpl  = Math.max(0, coupleRows);
  const rec  = Math.max(0, reclinerRows);
  const cols = Math.max(0, totalCols);
  const cap  = (reg + cpl) * cols + rec * Math.floor(cols / 2);

  const getSections = (total: number) => {
    const capped  = Math.min(total, maxRenderCols);
    const count   = Math.max(1, Math.floor(capped / 10));
    const base    = Math.floor(capped / count);
    let   rem     = capped % count;
    return Array.from({ length: count }, () => (rem-- > 0 ? base + 1 : base));
  };

  const sections  = getSections(cols);
  const visReg    = Math.min(reg, maxRenderRows);
  const visCpl    = Math.min(cpl, maxRenderRows);
  const visRec    = Math.min(rec, Math.floor(maxRenderRows / 2));
  const isCapped  = reg > visReg || cpl > visCpl || rec > visRec || cols > maxRenderCols;

  if ((reg + cpl + rec) === 0 || cols === 0)
    return (
      <div className="flex flex-col items-center text-on-surface-variant my-10 gap-1">
        <span className="font-semibold">Enter screen dimensions</span>
        <span className="text-sm">e.g. 10 rows × 20 columns</span>
      </div>
    );

  const StaticSeat = ({
    type, w = REG_W, h = REG_H,
  }: { type: SeatType; w?: number; h?: number }) => (
    <div
      style={{
        width: w, height: h,
        background: PALETTE[type].availBg,
        borderRadius: w > REG_W ? "10px 10px 6px 6px" : "8px 8px 4px 4px",
        boxShadow: CLAY_UP,
        borderBottom: "3px solid rgba(0,0,0,0.10)",
        cursor: "default",
      }}
    />
  );

  const Row = ({ type, count, isRec }: { type: SeatType; count: number; isRec?: boolean }) => {
    const sectionCount = isRec ? Math.floor(count / 2) : count;
    const secs         = isRec
      ? getSections(Math.floor(cols / 2)).map((s) => Math.floor(s / 2))
      : sections;
    return (
      <div className="flex justify-center items-end" style={{ gap: 24 }}>
        {secs.map((sz, si) => (
          <div key={si} className="flex items-end" style={{ gap: SEAT_GAP }}>
            {Array.from({ length: sz }).map((_, i) => (
              <StaticSeat
                key={i}
                type={type}
                w={isRec ? REC_W : REG_W}
                h={isRec ? REC_H : REG_H}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center" style={{ gap: 8 }}>
      {Array.from({ length: visReg }).map((_, r) => <Row key={`r-${r}`} type="REGULAR" count={cols} />)}
      {visCpl > 0 && visReg > 0 && <div style={{ height: 2 }} />}
      {Array.from({ length: visCpl }).map((_, r) => <Row key={`c-${r}`} type="COUPLE" count={cols} />)}
      {visRec > 0 && (visReg > 0 || visCpl > 0) && <div style={{ height: 16 }} />}
      {Array.from({ length: visRec }).map((_, r) => <Row key={`rec-${r}`} type="RECLINER" count={cols} isRec />)}
      {isCapped && (
        <p className="text-center text-xs text-on-surface-variant mt-4 px-4 py-2 rounded-xl bg-surface-container-high">
          Preview capped. Actual capacity: {cap} seats.
        </p>
      )}
    </div>
  );
}

// ── Cinema Screen ─────────────────────────────────────────────────────────────

function CinemaScreen() {
  return (
    <div className="w-full flex flex-col items-center" style={{ paddingBottom: 64, paddingTop: 8 }}>

      {/* Projector beam – radiating glow from top */}
      <div
        style={{
          width: "60%",
          maxWidth: 480,
          height: 72,
          background: "linear-gradient(to bottom, rgba(255,202,77,0.22) 0%, transparent 100%)",
          filter: "blur(20px)",
          borderRadius: "0 0 50% 50%",
        }}
      />

      {/* Screen surface – clay convex bar */}
      <div
        style={{
          marginTop: -36,
          width: "82%",
          maxWidth: 640,
          height: 48,
          borderRadius: "0 0 50% 50% / 0 0 100% 100%",
          background: "linear-gradient(180deg, #ffffff 0%, #f0f1f1 40%, #e7e8e8 100%)",
          boxShadow:
            "0 12px 32px rgba(0,0,0,0.18), " +
            "0 4px 8px rgba(0,0,0,0.10), " +
            "inset 0 4px 12px rgba(255,255,255,0.9), " +
            "inset 0 -2px 4px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Sheen on top edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            width: "80%",
            height: 4,
            borderRadius: "0 0 50% 50%",
            background: "rgba(255,255,255,0.95)",
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.35em",
            color: "rgba(45,47,47,0.45)",
            textTransform: "uppercase",
          }}
        >
          Screen
        </span>
      </div>

      {/* Distance / carpet fade – screen to first seat */}
      <div
        style={{
          width: "70%",
          maxWidth: 520,
          height: 32,
          marginTop: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, transparent 100%)",
          borderRadius: "0 0 50% 50%",
        }}
      />
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export interface SeatLayoutPreviewProps {
  regularRows?: number;
  coupleRows?: number;
  reclinerRows?: number;
  totalCols?: number;
  maxRenderRows?: number;
  maxRenderCols?: number;
  seats?: SeatItem[];
  selectedIds?: number[];
  onToggle?: (seat: SeatItem) => void;
}

export function SeatLayoutPreview({
  regularRows = 0, coupleRows = 0, reclinerRows = 0, totalCols = 0,
  maxRenderRows = 50, maxRenderCols = 50,
  seats, selectedIds = [], onToggle,
}: SeatLayoutPreviewProps) {
  const isLive = Array.isArray(seats) && seats.length > 0;

  return (
    <div className="w-full flex flex-col items-center">

      <CinemaScreen />

      {/* Seat grid – overflow-x-auto for small screens, content centred */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex justify-center px-4">
          {isLive ? (
            <LiveSeatLayout
              seats={seats!}
              selectedIds={selectedIds}
              onToggle={onToggle ?? (() => {})}
            />
          ) : (
            <StaticPreview
              regularRows={regularRows}
              coupleRows={coupleRows}
              reclinerRows={reclinerRows}
              totalCols={totalCols}
              maxRenderRows={maxRenderRows}
              maxRenderCols={maxRenderCols}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      {isLive && (
        <div className="w-full mt-8 pt-5 border-t border-surface-container-high">
          <PriceLegend seats={seats!} />
        </div>
      )}
    </div>
  );
}
