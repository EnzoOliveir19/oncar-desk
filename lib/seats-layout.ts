/**
 * Geometria isométrica do escritório.
 *
 * ViewBox: 0 0 880 500
 * Perspectiva: 2:1 dimetric (chamada "isométrica" em jogos)
 * Observador: frente-esquerda olhando pro fundo-direita
 *
 * Tudo aqui é posição final em pixels no SVG — não tem grid abstrato.
 * Se quiser mover algum elemento, muda aqui e toda a UI segue.
 */

// ── Chão (diamante isométrico) ──────────────────────────────────────

export const FLOOR = {
  points: "440,15  835,210  440,405  45,210",
};

// ── Copa (overlay no canto esquerdo do chão) ────────────────────────

export const COPA = {
  points: "440,15  260,108  200,210  170,210  105,210  250,135  440,40",
  // Simplified: a polygon hugging the upper-left of the floor
  label: { x: 165, y: 175, text: "Copa" },
};

// Simplificando a copa pra um polígono mais limpo:
export const COPA_AREA = {
  points: "440,15  250,110  130,210  45,210",
  label: { x: 190, y: 160 },
};

// ── Porta (canto frontal-esquerdo do diamante) ──────────────────────

export const DOOR = {
  // Duas marcas na aresta esquerda-inferior do diamante
  line: { x1: 115, y1: 260, x2: 175, y2: 290 },
  label: { x: 120, y: 290 },
};

// ── Mesas (parallelogramas isométricos) ─────────────────────────────

export const DESKS = {
  gustavo: {
    points: "260,80  330,100  315,135  245,115",
  },
  clusterA: {
    points: "415,120  575,165  555,220  395,175",
  },
  clusterB: {
    points: "415,270  575,315  555,370  395,325",
  },
};

// ── Posições dos assentos ───────────────────────────────────────────

export type SeatLayout = {
  id: number;
  x: number;
  y: number;
  /** Ângulo do encosto da cadeira (graus, 0 = encosto pro topo) */
  backrestAngle: number;
};

export const SEAT_POSITIONS: SeatLayout[] = [
  // Gustavo (solo, acima da mesa dele)
  { id: 1,  x: 265, y: 68,  backrestAngle: -30 },

  // Cluster A — Ponta (esquerda da mesa)
  { id: 2,  x: 370, y: 150, backrestAngle: 30 },
  // Cluster A — 2×2 acima da mesa
  { id: 3,  x: 450, y: 105, backrestAngle: -30 },
  { id: 4,  x: 535, y: 130, backrestAngle: -30 },
  // Cluster A — 2×2 abaixo da mesa
  { id: 5,  x: 440, y: 225, backrestAngle: 150 },
  { id: 6,  x: 525, y: 250, backrestAngle: 150 },

  // Cluster B — Ponta (esquerda da mesa)
  { id: 7,  x: 370, y: 300, backrestAngle: 30 },
  // Cluster B — 2×2 acima da mesa
  { id: 8,  x: 450, y: 255, backrestAngle: -30 },
  { id: 9,  x: 535, y: 280, backrestAngle: -30 },
  // Cluster B — 2×2 abaixo da mesa
  { id: 10, x: 440, y: 375, backrestAngle: 150 },
  { id: 11, x: 525, y: 400, backrestAngle: 150 },
];

// ── Constantes de rendering ─────────────────────────────────────────

/** Raio da elipse do assento */
export const SEAT_RX = 18;
export const SEAT_RY = 12;

/** Raio da foto de perfil */
export const AVATAR_R = 13;

/** ViewBox do SVG do escritório */
export const VIEWBOX = "0 0 880 500";
