"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  FLOOR,
  COPA_AREA,
  DOOR,
  DESKS,
  SEAT_POSITIONS,
  SEAT_RX,
  SEAT_RY,
  AVATAR_R,
  VIEWBOX,
} from "@/lib/seats-layout";
import type { ReservationWithProfile } from "@/lib/hooks/use-reservations";
import type { Seat } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  seats: Seat[];
  reservations: ReservationWithProfile[];
  currentUserId: string;
  onSeatClick: (seatId: number) => void;
  disabled?: boolean;
};

export function OfficeMap({
  seats,
  reservations,
  currentUserId,
  onSeatClick,
  disabled,
}: Props) {
  const count = reservations.length;
  const ratio = count / 11;

  // Temperatura ambiente: sub-tom do chão muda com ocupação
  const floorColor = ratio < 0.3
    ? "#282838" // frio/azulado
    : ratio < 0.7
      ? "#2B2B37" // neutro (base)
      : "#302B28"; // quente/âmbar

  // Mapa de seat_id → reservation
  const reservationMap = new Map(
    reservations.map((r) => [r.seat_id, r])
  );

  return (
    <svg
      viewBox={VIEWBOX}
      className="w-full h-full max-w-[880px]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Bloom glow pra cadeiras ocupadas */}
        <radialGradient id="seat-bloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3E5EE8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3E5EE8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="seat-bloom-mine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7A93F5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7A93F5" stopOpacity="0" />
        </radialGradient>

        {/* Clip paths pra fotos de perfil */}
        {SEAT_POSITIONS.map((s) => (
          <clipPath key={`clip-${s.id}`} id={`avatar-clip-${s.id}`}>
            <circle cx={s.x} cy={s.y - 18} r={AVATAR_R} />
          </clipPath>
        ))}
      </defs>

      {/* ── Chão ─────────────────────────────────────────── */}
      <motion.polygon
        points={FLOOR.points}
        fill={floorColor}
        stroke="#48485A"
        strokeWidth="0.8"
        initial={false}
        animate={{ fill: floorColor }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      {/* Grid sutil no chão */}
      <FloorGrid />

      {/* ── Copa ──────────────────────────────────────────── */}
      <polygon
        points={COPA_AREA.points}
        fill="#333340"
        opacity="0.35"
      />
      <text
        x={COPA_AREA.label.x}
        y={COPA_AREA.label.y}
        textAnchor="middle"
        className="fill-text-muted text-[10px] tracking-[0.2em] uppercase select-none"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        Copa
      </text>

      {/* ── Porta ─────────────────────────────────────────── */}
      <line
        x1={DOOR.line.x1} y1={DOOR.line.y1}
        x2={DOOR.line.x2} y2={DOOR.line.y2}
        stroke="#F5A623"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      <text
        x={DOOR.label.x}
        y={DOOR.label.y}
        className="fill-text-muted text-[9px] tracking-[0.15em] uppercase select-none"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        Porta
      </text>

      {/* ── Mesas ─────────────────────────────────────────── */}
      <polygon
        points={DESKS.gustavo.points}
        fill="#3A3A48"
        stroke="#48485A"
        strokeWidth="0.6"
      />
      <polygon
        points={DESKS.clusterA.points}
        fill="#3A3A48"
        stroke="#48485A"
        strokeWidth="0.6"
      />
      <polygon
        points={DESKS.clusterB.points}
        fill="#3A3A48"
        stroke="#48485A"
        strokeWidth="0.6"
      />

      {/* ── Cadeiras ──────────────────────────────────────── */}
      {SEAT_POSITIONS.map((seatLayout) => {
        const reservation = reservationMap.get(seatLayout.id);
        const isOccupied = !!reservation;
        const isMine = reservation?.user_id === currentUserId;
        const seatMeta = seats.find((s) => s.id === seatLayout.id);
        const isFixed = seatMeta?.is_fixed ?? false;

        return (
          <SeatElement
            key={seatLayout.id}
            layout={seatLayout}
            reservation={reservation ?? null}
            isOccupied={isOccupied}
            isMine={isMine}
            isFixed={isFixed}
            disabled={disabled}
            onClick={() => onSeatClick(seatLayout.id)}
          />
        );
      })}
    </svg>
  );
}

// ── Componente de cadeira individual ──────────────────────────────────

type SeatProps = {
  layout: (typeof SEAT_POSITIONS)[number];
  reservation: ReservationWithProfile | null;
  isOccupied: boolean;
  isMine: boolean;
  isFixed: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function SeatElement({
  layout,
  reservation,
  isOccupied,
  isMine,
  isFixed,
  disabled,
  onClick,
}: SeatProps) {
  const { x, y, id } = layout;
  const profile = reservation?.profiles;
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const canClick = !disabled && (!isOccupied || isMine);

  return (
    <g
      onClick={canClick ? onClick : undefined}
      className={cn(
        canClick && "cursor-pointer",
        !canClick && isOccupied && !isMine && "cursor-default"
      )}
      role="button"
      aria-label={
        isOccupied
          ? `${firstName || "Ocupada"} — cadeira ${id}${isMine ? " (sua)" : ""}`
          : `Cadeira ${id} — livre`
      }
    >
      {/* Hover hitbox (invisível, maior que a cadeira visual) */}
      <rect
        x={x - 28}
        y={y - 32}
        width={56}
        height={64}
        fill="transparent"
      />

      {/* Bloom glow (só aparece quando ocupada) */}
      <AnimatePresence>
        {isOccupied && (
          <motion.ellipse
            cx={x}
            cy={y}
            rx={SEAT_RX * 2.2}
            ry={SEAT_RY * 2.2}
            fill={isMine ? "url(#seat-bloom-mine)" : "url(#seat-bloom)"}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Sombra no chão */}
      <ellipse
        cx={x + 2}
        cy={y + 5}
        rx={SEAT_RX - 2}
        ry={SEAT_RY - 3}
        fill="rgba(0,0,0,0.12)"
      />

      {/* Assento da cadeira */}
      <motion.ellipse
        cx={x}
        cy={y}
        rx={SEAT_RX}
        ry={SEAT_RY}
        fill={isOccupied ? (isMine ? "#4B6BF0" : "#3E5EE8") : "#2B2B37"}
        stroke={isOccupied ? "#7A93F5" : "#5C5C70"}
        strokeWidth={isOccupied ? 1 : 0.8}
        whileHover={canClick ? { scale: 1.08 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />

      {/* Encosto da cadeira (arco atrás do assento) */}
      {!isOccupied && (
        <ellipse
          cx={x}
          cy={y - 6}
          rx={SEAT_RX - 4}
          ry={5}
          fill="none"
          stroke="#5C5C70"
          strokeWidth="0.6"
          opacity="0.5"
        />
      )}

      {/* Indicador "fixo" pra cadeira do Gustavo */}
      {isFixed && !isOccupied && (
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          className="text-[8px] fill-text-muted select-none"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          G
        </text>
      )}

      {/* Foto de perfil (flutuando acima da cadeira) */}
      <AnimatePresence>
        {isOccupied && profile?.avatar_url && (
          <motion.g
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
          >
            {/* Borda da foto */}
            <circle
              cx={x}
              cy={y - 18}
              r={AVATAR_R + 1.5}
              fill={isMine ? "#7A93F5" : "#3E5EE8"}
              opacity="0.6"
            />
            {/* Foto */}
            <image
              href={profile.avatar_url}
              x={x - AVATAR_R}
              y={y - 18 - AVATAR_R}
              width={AVATAR_R * 2}
              height={AVATAR_R * 2}
              clipPath={`url(#avatar-clip-${layout.id})`}
              style={{ imageRendering: "auto" }}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Nome (abaixo da cadeira, só quando ocupada) */}
      <AnimatePresence>
        {isOccupied && firstName && (
          <motion.text
            x={x}
            y={y + SEAT_RY + 14}
            textAnchor="middle"
            className="text-[10px] fill-text-primary select-none"
            style={{ fontFamily: "var(--font-geist-sans)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            {firstName}
          </motion.text>
        )}
      </AnimatePresence>

      {/* Tooltip "Clique pra reservar" no hover (só pra cadeiras livres) */}
      {!isOccupied && !isFixed && (
        <text
          x={x}
          y={y + SEAT_RY + 12}
          textAnchor="middle"
          className="text-[8px] fill-text-muted opacity-0 hover-parent:opacity-100 select-none pointer-events-none"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          livre
        </text>
      )}
    </g>
  );
}

// ── Grid sutil do chão ───────────────────────────────────────────────
// Linhas isométricas que dão textura sem distrair

function FloorGrid() {
  // Gera linhas paralelas ao longo das duas direções isométricas
  const lines: JSX.Element[] = [];
  const step = 40;

  // Diagonal NE-SW (paralela ao lado direito do diamante)
  for (let i = 1; i < 20; i++) {
    const offset = i * step;
    lines.push(
      <line
        key={`ne-${i}`}
        x1={45 + offset * 0.87}
        y1={210 - offset * 0.5}
        x2={440 + offset * 0.87}
        y2={405 - offset * 0.5}
        stroke="#48485A"
        strokeWidth="0.2"
        opacity="0.3"
      />
    );
  }

  // Diagonal NW-SE (paralela ao lado esquerdo do diamante)
  for (let i = 1; i < 20; i++) {
    const offset = i * step;
    lines.push(
      <line
        key={`nw-${i}`}
        x1={440 - offset * 0.87}
        y1={15 + offset * 0.5}
        x2={835 - offset * 0.87}
        y2={210 + offset * 0.5}
        stroke="#48485A"
        strokeWidth="0.2"
        opacity="0.3"
      />
    );
  }

  return (
    <g clipPath="url(#floor-clip)">
      <defs>
        <clipPath id="floor-clip">
          <polygon points={FLOOR.points} />
        </clipPath>
      </defs>
      {lines}
    </g>
  );
}
