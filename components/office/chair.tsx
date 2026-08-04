"use client";

import { useEffect, useRef, useState } from "react";
import {
  proj,
  pts,
  SEAT_H,
  BACK_H,
  SEAT_R,
  BACK_HW,
  BACK_D,
  AVATAR_LIFT,
  type Facing,
  type SeatLayout,
} from "@/lib/seats-layout";
import type { ReservationWithProfile } from "@/lib/hooks/use-reservations";
import { cn } from "@/lib/utils";

// ── Palette ────────────────────────────────────────────────────────
const SEAT_FREE = "#262731";
const SEAT_FIXED = "#22232B";
const SEAT_OCCUPIED = "#2E3140";
const SEAT_MINE = "#3E5EE8";
const BACK_FREE = "#1D1E26";
const BACK_OCCUPIED = "#22242E";
const BACK_MINE = "#2A44BC";

/** Escurece/clareia um #rrggbb somando `delta` a cada canal (clamp 0..255) */
function shade(hex: string, delta: number): string {
  const c = hex.replace("#", "");
  const r = clamp(parseInt(c.slice(0, 2), 16) + delta);
  const g = clamp(parseInt(c.slice(2, 4), 16) + delta);
  const b = clamp(parseInt(c.slice(4, 6), 16) + delta);
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}
const clamp = (n: number) => Math.max(0, Math.min(255, n));
const hex2 = (n: number) => n.toString(16).padStart(2, "0");

// ── Types ──────────────────────────────────────────────────────────
type Props = {
  layout: SeatLayout;
  reservation: ReservationWithProfile | null;
  isMine: boolean;
  isFixed: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

// ── Ordem de facings pra swivel ────────────────────────────────────
const CW_ORDER: Facing[] = ["S", "W", "N", "E"];
const CCW_ORDER: Facing[] = ["S", "E", "N", "W"];

/** Steps do swivel — dwells crescentes dão sensação de ease-out */
const SWIVEL_DWELLS_MS = [70, 85, 105, 140];

export function Chair({
  layout,
  reservation,
  isMine,
  isFixed,
  disabled,
  onClick,
}: Props) {
  const restingFacing = layout.facing;
  const [facing, setFacing] = useState<Facing>(restingFacing);
  const prevReservationIdRef = useRef<string | null>(reservation?.id ?? null);
  const swivelTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Trigger swivel quando ocupação da cadeira MUDA
  useEffect(() => {
    const currentId = reservation?.id ?? null;
    const prevId = prevReservationIdRef.current;

    if (currentId !== prevId) {
      const justBooked = !!currentId && !prevId;
      const justReleased = !currentId && !!prevId;
      if (justBooked || justReleased) {
        swivel(justBooked ? "cw" : "ccw");
      }
      prevReservationIdRef.current = currentId;
    }
  }, [reservation?.id]);

  // Limpa timers pendentes ao desmontar
  useEffect(() => {
    return () => {
      swivelTimersRef.current.forEach(clearTimeout);
      swivelTimersRef.current = [];
    };
  }, []);

  function swivel(direction: "cw" | "ccw") {
    // Cancela swivel anterior se ainda estiver rodando
    swivelTimersRef.current.forEach(clearTimeout);
    swivelTimersRef.current = [];

    const order = direction === "cw" ? CW_ORDER : CCW_ORDER;
    const startIdx = Math.max(0, order.indexOf(facing));

    let elapsed = 0;
    for (let step = 1; step <= 4; step++) {
      const nextFacing = order[(startIdx + step) % 4];
      const t = setTimeout(() => setFacing(nextFacing), elapsed);
      swivelTimersRef.current.push(t);
      elapsed += SWIVEL_DWELLS_MS[step - 1];
    }
    // Landing: volta ao facing de repouso pra deixar o encosto na direção certa
    const tFinal = setTimeout(() => setFacing(restingFacing), elapsed + 20);
    swivelTimersRef.current.push(tFinal);
  }

  const { e, n, id } = layout;
  const isOccupied = !!reservation;
  const profile = reservation?.profiles ?? null;
  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const canClick = !disabled && (!isOccupied || isMine);

  // ── Colors por estado ──
  const seatTop = isMine
    ? SEAT_MINE
    : isOccupied
      ? SEAT_OCCUPIED
      : isFixed
        ? SEAT_FIXED
        : SEAT_FREE;
  const seatSide = isMine ? "#2A44BC" : shade(seatTop, -12);
  const seatWest = isMine ? "#1F339E" : shade(seatTop, -22);
  const backMain = isMine ? BACK_MINE : isOccupied ? BACK_OCCUPIED : BACK_FREE;

  // ── Base star (5 pernas do rodízio) ──
  const baseSpokes = Array.from({ length: 5 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 5 + Math.PI / 2;
    const de = Math.cos(a) * 10;
    const dn = Math.sin(a) * 10;
    return { de, dn };
  });
  const [baseCx, baseCy] = proj(e, n, 0);
  const [postX1, postY1] = proj(e, n, 1);
  const [postX2, postY2] = proj(e, n, SEAT_H - 1);

  // ── Encosto: 3 faces cujas coords dependem do facing ──
  const back = computeBackPanel(e, n, facing);

  // ── Avatar (se ocupada) ──
  let avatarCoords: { avx: number; avy: number; sx: number; sy: number } | null = null;
  if (isOccupied) {
    let avE = e,
      avN = n;
    if (facing === "S") avN = n + SEAT_R + BACK_D / 2;
    else if (facing === "N") avN = n - SEAT_R - BACK_D / 2;
    else if (facing === "W") avE = e + SEAT_R + BACK_D / 2;
    else avE = e - SEAT_R - BACK_D / 2;

    const [avx, avy] = proj(avE, avN, BACK_H + AVATAR_LIFT);
    const [sx, sy] = proj(avE, avN, BACK_H);
    avatarCoords = { avx, avy, sx, sy };
  }

  const [nameX, nameY] = proj(e, n, 0);

  return (
    <g
      onClick={canClick ? onClick : undefined}
      className={cn(
        canClick && "cursor-pointer",
        !canClick && isOccupied && !isMine && "cursor-default",
        isFixed && "cursor-default"
      )}
      role="button"
      aria-label={
        isOccupied
          ? `${firstName || "Ocupada"} — cadeira ${id}${isMine ? " (sua)" : ""}`
          : `Cadeira ${id} — livre`
      }
      style={{ pointerEvents: isFixed ? "none" : "auto" }}
      data-seat={id}
    >
      {/* AO no chão */}
      <ellipse cx={baseCx} cy={baseCy + 3} rx={18} ry={7} fill="url(#ao)" />

      {/* Halo (se ocupada) */}
      {isOccupied && (
        <ellipse
          cx={proj(e, n, 3)[0]}
          cy={proj(e, n, 3)[1]}
          rx={isMine ? 38 : 30}
          ry={isMine ? 22 : 17}
          fill={isMine ? "url(#haloMine)" : "url(#haloAccent)"}
        />
      )}

      {/* Hover hitbox — maior que a cadeira visual, invisível */}
      <rect
        x={baseCx - 26}
        y={baseCy - 40}
        width={52}
        height={60}
        fill="transparent"
      />

      {/* Base star */}
      {baseSpokes.map(({ de, dn }, i) => {
        const [x2, y2] = proj(e + de, n + dn, 0);
        return (
          <g key={`spoke-${i}`}>
            <line
              x1={baseCx}
              y1={baseCy}
              x2={x2}
              y2={y2}
              stroke="#1F2028"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
            <circle cx={x2} cy={y2} r={1.4} fill="#2C2D36" />
          </g>
        );
      })}

      {/* Post */}
      <line
        x1={postX1}
        y1={postY1}
        x2={postX2}
        y2={postY2}
        stroke="#1A1B22"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Assento — 3 faces (sul, oeste, topo) */}
      <polygon
        points={pts(
          [e - SEAT_R, n - SEAT_R, SEAT_H - 2],
          [e + SEAT_R, n - SEAT_R, SEAT_H - 2],
          [e + SEAT_R, n - SEAT_R, SEAT_H],
          [e - SEAT_R, n - SEAT_R, SEAT_H]
        )}
        fill={seatSide}
      />
      <polygon
        points={pts(
          [e - SEAT_R, n - SEAT_R, SEAT_H - 2],
          [e - SEAT_R, n + SEAT_R, SEAT_H - 2],
          [e - SEAT_R, n + SEAT_R, SEAT_H],
          [e - SEAT_R, n - SEAT_R, SEAT_H]
        )}
        fill={seatWest}
      />
      <polygon
        points={pts(
          [e - SEAT_R, n + SEAT_R, SEAT_H],
          [e + SEAT_R, n + SEAT_R, SEAT_H],
          [e + SEAT_R, n - SEAT_R, SEAT_H],
          [e - SEAT_R, n - SEAT_R, SEAT_H]
        )}
        fill={seatTop}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={0.5}
      />

      {/* Encosto: face oeste, face sul, topo */}
      <polygon points={pts(...back.westFace)} fill={shade(backMain, -22)} />
      <polygon
        points={pts(...back.southFace)}
        fill={backMain}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={0.5}
      />
      <polygon points={pts(...back.topFace)} fill="rgba(255,255,255,0.05)" />

      {/* Avatar flutuando acima do encosto (quando ocupada) */}
      {isOccupied && avatarCoords && (
        <>
          <ellipse
            cx={avatarCoords.sx}
            cy={avatarCoords.sy + 2}
            rx={7}
            ry={2}
            fill="rgba(0,0,0,0.45)"
          />
          <circle
            cx={avatarCoords.avx}
            cy={avatarCoords.avy}
            r={9}
            fill="none"
            stroke={isMine ? "#B0C1FF" : "rgba(255,255,255,0.22)"}
            strokeWidth={0.9}
          />
          {profile?.avatar_url ? (
            <>
              <defs>
                <clipPath id={`chair-av-clip-${id}`}>
                  <circle cx={avatarCoords.avx} cy={avatarCoords.avy} r={8} />
                </clipPath>
              </defs>
              <image
                href={profile.avatar_url}
                x={avatarCoords.avx - 8}
                y={avatarCoords.avy - 8}
                width={16}
                height={16}
                clipPath={`url(#chair-av-clip-${id})`}
              />
            </>
          ) : (
            <>
              <circle
                cx={avatarCoords.avx}
                cy={avatarCoords.avy}
                r={8}
                fill={isMine ? "#FF6A3D" : "#3E5EE8"}
              />
              <text
                x={avatarCoords.avx}
                y={avatarCoords.avy + 3.2}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                fill="white"
                fontFamily="var(--font-geist-sans), ui-sans-serif, sans-serif"
              >
                {firstName.charAt(0) || "?"}
              </text>
            </>
          )}
        </>
      )}

      {/* Nome / label */}
      {isOccupied ? (
        <text
          x={nameX}
          y={nameY + 22}
          textAnchor="middle"
          fontSize={9}
          fill="#9095A3"
          fontFamily="var(--font-geist-sans), ui-sans-serif, sans-serif"
          className="select-none pointer-events-none"
        >
          {firstName}
        </text>
      ) : isFixed ? (
        <text
          x={nameX}
          y={nameY + 22}
          textAnchor="middle"
          fontSize={8}
          fill="#545866"
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
          letterSpacing="0.12em"
          className="select-none pointer-events-none"
        >
          GUSTAVO
        </text>
      ) : null}
    </g>
  );
}

/**
 * Retorna os 3 polígonos visíveis do encosto (sul, oeste, topo) em floor coords,
 * baseado em `facing`. O encosto é uma placa fina paralela à mesa.
 */
function computeBackPanel(e: number, n: number, facing: Facing) {
  type Pt = [number, number, number];
  let southFace: Pt[], westFace: Pt[], topFace: Pt[];

  if (facing === "S") {
    const nA = n + SEAT_R;
    const nB = n + SEAT_R + BACK_D;
    southFace = [
      [e - BACK_HW, nA, SEAT_H],
      [e + BACK_HW, nA, SEAT_H],
      [e + BACK_HW, nA, BACK_H],
      [e - BACK_HW, nA, BACK_H],
    ];
    westFace = [
      [e - BACK_HW, nA, SEAT_H],
      [e - BACK_HW, nB, SEAT_H],
      [e - BACK_HW, nB, BACK_H],
      [e - BACK_HW, nA, BACK_H],
    ];
    topFace = [
      [e - BACK_HW, nA, BACK_H],
      [e + BACK_HW, nA, BACK_H],
      [e + BACK_HW, nB, BACK_H],
      [e - BACK_HW, nB, BACK_H],
    ];
  } else if (facing === "N") {
    const nA = n - SEAT_R - BACK_D;
    const nB = n - SEAT_R;
    southFace = [
      [e - BACK_HW, nA, SEAT_H],
      [e + BACK_HW, nA, SEAT_H],
      [e + BACK_HW, nA, BACK_H],
      [e - BACK_HW, nA, BACK_H],
    ];
    westFace = [
      [e - BACK_HW, nA, SEAT_H],
      [e - BACK_HW, nB, SEAT_H],
      [e - BACK_HW, nB, BACK_H],
      [e - BACK_HW, nA, BACK_H],
    ];
    topFace = [
      [e - BACK_HW, nA, BACK_H],
      [e + BACK_HW, nA, BACK_H],
      [e + BACK_HW, nB, BACK_H],
      [e - BACK_HW, nB, BACK_H],
    ];
  } else if (facing === "W") {
    const eA = e + SEAT_R;
    const eB = e + SEAT_R + BACK_D;
    southFace = [
      [eA, n - BACK_HW, SEAT_H],
      [eB, n - BACK_HW, SEAT_H],
      [eB, n - BACK_HW, BACK_H],
      [eA, n - BACK_HW, BACK_H],
    ];
    westFace = [
      [eA, n - BACK_HW, SEAT_H],
      [eA, n + BACK_HW, SEAT_H],
      [eA, n + BACK_HW, BACK_H],
      [eA, n - BACK_HW, BACK_H],
    ];
    topFace = [
      [eA, n - BACK_HW, BACK_H],
      [eB, n - BACK_HW, BACK_H],
      [eB, n + BACK_HW, BACK_H],
      [eA, n + BACK_HW, BACK_H],
    ];
  } else {
    // facing E — encosto no lado oeste do assento
    const eA = e - SEAT_R - BACK_D;
    const eB = e - SEAT_R;
    southFace = [
      [eA, n - BACK_HW, SEAT_H],
      [eB, n - BACK_HW, SEAT_H],
      [eB, n - BACK_HW, BACK_H],
      [eA, n - BACK_HW, BACK_H],
    ];
    westFace = [
      [eA, n - BACK_HW, SEAT_H],
      [eA, n + BACK_HW, SEAT_H],
      [eA, n + BACK_HW, BACK_H],
      [eA, n - BACK_HW, BACK_H],
    ];
    topFace = [
      [eA, n - BACK_HW, BACK_H],
      [eB, n - BACK_HW, BACK_H],
      [eB, n + BACK_HW, BACK_H],
      [eA, n + BACK_HW, BACK_H],
    ];
  }

  return { southFace, westFace, topFace };
}
