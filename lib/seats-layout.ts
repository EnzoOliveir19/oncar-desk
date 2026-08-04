/**
 * Sistema de coordenadas isométrico do escritório.
 *
 * Trabalhamos em coordenadas de CHÃO (e, n, z), não pixels. A função `proj()`
 * converte (e, n, z) → pixel de tela. Consequência: mover uma mesa é mudar
 * um número; todos os elementos que dependem dela seguem sozinhos.
 *
 * Convenção:
 *   e  →  eixo leste-oeste  (+e = direita/leste na sala)
 *   n  →  eixo norte-sul    (+n = fundo/norte, longe do observador)
 *   z  →  altura acima do chão
 *
 * Projeção iso 30°:
 *   x_screen = OX + (e − n) · cos30
 *   y_screen = OY − (e + n) · sin30 − z
 */

const COS30 = 0.8660254;
const SIN30 = 0.5;

export const OX = 550;
export const OY = 360;

/** ViewBox do SVG — com margem no topo pra luminária + laterais */
export const VIEWBOX = "-40 -80 1180 800";

/** Projeta (e, n, z) → [x, y] em pixels */
export function proj(e: number, n: number, z: number = 0): [number, number] {
  return [OX + (e - n) * COS30, OY - (e + n) * SIN30 - z];
}

/** `<polygon points={pts(...)}>` — aceita tuplas [e, n] ou [e, n, z] */
export function pts(...coords: Array<[number, number] | [number, number, number]>): string {
  return coords
    .map((c) => {
      const [px, py] = proj(c[0], c[1], c[2] ?? 0);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
}

// ── Sala ────────────────────────────────────────────────────────────

/** Sala é um quadrado 600×600 em floor coords, centrado em (0, 0) */
export const ROOM_HALF = 300;

/** Altura das paredes de fundo (N e W) */
export const WALL_H = 40;

/** Altura do balcão da copa e da mesa de snacks */
export const COUNTER_H = 12;

/** Altura do tampo das mesas de trabalho */
export const DESK_H = 14;
export const DESK_T = 2;

/** Altura do assento (topo da almofada) */
export const SEAT_H = 10;

/** Topo do encosto */
export const BACK_H = 24;

/** Half-width do encosto ao longo do eixo perpendicular à direção de encosto */
export const BACK_HW = 6;

/** Half-width do assento (rhombus) */
export const SEAT_R = 8;

/** Espessura da placa do encosto */
export const BACK_D = 2;

/** Altura em que o avatar flutua acima do topo do encosto */
export const AVATAR_LIFT = 10;

// ── Assentos ────────────────────────────────────────────────────────

export type Facing = "N" | "S" | "E" | "W";

export type SeatLayout = {
  /** id 1-11 pareado com supabase seats.id */
  id: number;
  /** posição no chão */
  e: number;
  n: number;
  /** direção que a pessoa olha sentada (encosto no lado oposto) */
  facing: Facing;
};

export const SEAT_POSITIONS: SeatLayout[] = [
  // Gustavo — canto NW, mesa solo perto da copa
  { id: 1, e: -220, n: 245, facing: "S" },

  // Cluster A — mesa central superior
  { id: 2, e: -145, n: 90, facing: "E" }, // ponta oeste
  { id: 3, e: -30, n: 152, facing: "S" }, // 2×2 top-left
  { id: 4, e: 90, n: 152, facing: "S" }, // 2×2 top-right
  { id: 5, e: -30, n: 28, facing: "N" }, // 2×2 bot-left
  { id: 6, e: 90, n: 28, facing: "N" }, // 2×2 bot-right

  // Cluster B — mesa central inferior
  { id: 7, e: -145, n: -110, facing: "E" }, // ponta oeste
  { id: 8, e: -30, n: -48, facing: "S" },
  { id: 9, e: 90, n: -48, facing: "S" },
  { id: 10, e: -30, n: -172, facing: "N" },
  { id: 11, e: 90, n: -172, facing: "N" },
];

// ── Mesas / clusters ────────────────────────────────────────────────

export type DeskDef = {
  centerE: number;
  centerN: number;
  long: number;
  deep: number;
};

export const DESKS: Record<"gustavo" | "clusterA" | "clusterB", DeskDef> = {
  gustavo: { centerE: -220, centerN: 200, long: 100, deep: 45 },
  clusterA: { centerE: 30, centerN: 90, long: 240, deep: 60 },
  clusterB: { centerE: 30, centerN: -110, long: 240, deep: 60 },
};

// ── Monitores (um por assento) ──────────────────────────────────────

export type MonitorDef = {
  seatId: number;
  e: number;
  n: number;
  facing: Facing;
};

export const MONITORS: MonitorDef[] = [
  { seatId: 1, e: -220, n: 200, facing: "S" },
  // Cluster A
  { seatId: 2, e: -70, n: 90, facing: "E" },
  { seatId: 3, e: -30, n: 115, facing: "S" },
  { seatId: 4, e: 90, n: 115, facing: "S" },
  { seatId: 5, e: -30, n: 65, facing: "N" },
  { seatId: 6, e: 90, n: 65, facing: "N" },
  // Cluster B
  { seatId: 7, e: -70, n: -110, facing: "E" },
  { seatId: 8, e: -30, n: -85, facing: "S" },
  { seatId: 9, e: 90, n: -85, facing: "S" },
  { seatId: 10, e: -30, n: -135, facing: "N" },
  { seatId: 11, e: 90, n: -135, facing: "N" },
];

// ── Copa ────────────────────────────────────────────────────────────

export const COPA = {
  /** Balcão vertical encostado na parede oeste */
  vertical: { e0: -300, e1: -260, n0: 80, n1: 260 },
  /** Balcão horizontal encostado na parede norte */
  horizontal: { e0: -300, e1: -60, n0: 260, n1: 300 },
  /** Pia embutida no balcão horizontal */
  sink: { e: -180, n: 280 },
  /** Cafeteira no balcão horizontal */
  coffee: { e: -110, n: 280 },
  /** Xícaras */
  cups: [{ e: -70, n: 280 }],
  /** Label "COPA" no chão */
  label: { e: -170, n: 165 },
};

// ── Mesa comprida de snacks ─────────────────────────────────────────

export const SNACK_TABLE = {
  centerE: -283,
  centerN: -30,
  /** half-extent leste-oeste (curto) */
  halfE: 15,
  /** half-extent norte-sul (longo) */
  halfN: 110,
  /** Posições dos snacks em coords de chão (relativas ao centro) */
  snacks: {
    bowl: { dE: 0, dN: 70 }, // bowl de chips no topo
    cookies: { dE: 0, dN: 10 }, // pilha de cookies no meio
    fruit: { dE: 0, dN: -55 }, // fruteira ao sul
  },
};

// ── Porta ───────────────────────────────────────────────────────────

export const PORTA = {
  /** Centro do vão em e; sempre em n = -ROOM_HALF (parede sul) */
  centerE: 0,
  hingeOffsetE: -30,
  swingAngleDeg: 40,
  leafLen: 60,
  leafH: 32,
};

// ── Planta ──────────────────────────────────────────────────────────

export const PLANT = { e: 250, n: -240 };

// ── Luminária pendente ──────────────────────────────────────────────

export const LAMP = {
  e: 0,
  n: 0,
  zShadeTop: 66,
  zShadeBot: 52,
  rTop: 4,
  rBot: 10,
  zCeiling: 130,
};

// ── Painter's algorithm ─────────────────────────────────────────────

/**
 * Chave de ordenação. Objetos com maior (e + n) estão mais LONGE do observador
 * e devem ser desenhados PRIMEIRO — objetos mais próximos desenham por cima.
 * Ordene descendente antes de renderizar.
 */
export function paintKey(e: number, n: number): number {
  return e + n;
}
