"use client";

import { Fragment, useMemo } from "react";
import {
  proj,
  pts,
  paintKey,
  VIEWBOX,
  ROOM_HALF,
  WALL_H,
  COUNTER_H,
  DESK_H,
  DESK_T,
  SEAT_POSITIONS,
  DESKS,
  MONITORS,
  COPA,
  SNACK_TABLE,
  PORTA,
  PLANT,
  LAMP,
  type Facing,
  type DeskDef,
  type MonitorDef,
} from "@/lib/seats-layout";
import type { Seat } from "@/lib/types";
import type { ReservationWithProfile } from "@/lib/hooks/use-reservations";
import { Chair } from "@/components/office/chair";

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
  // Só hot-desks contam pro "cheio" (Gustavo é fixo, sempre lá)
  const hotDeskCount = reservations.filter((r) => r.seat_id !== 1).length;
  const [floorColorA, floorColorB] = useMemo(
    () => interpolateFloorTemp(hotDeskCount / 10),
    [hotDeskCount]
  );

  const reservationMap = useMemo(
    () => new Map(reservations.map((r) => [r.seat_id, r])),
    [reservations]
  );

  // Painter's order: coleta todo mundo com sortKey (e+n), ordena desc,
  // renderiza — objetos mais atrás desenham primeiro, os da frente por cima.
  const sortedItems = useMemo(() => {
    type Item = { key: number; node: React.ReactNode };
    const list: Item[] = [];

    // Snack table (fica bem na frente, sortKey muito baixo)
    list.push({
      key: paintKey(SNACK_TABLE.centerE, SNACK_TABLE.centerN),
      node: <SnackTable key="snack" />,
    });

    // Gustavo desk + monitor
    list.push({
      key: paintKey(DESKS.gustavo.centerE, DESKS.gustavo.centerN),
      node: <Desk key="d-gus" def={DESKS.gustavo} />,
    });

    // Cluster A desk
    list.push({
      key: paintKey(DESKS.clusterA.centerE, DESKS.clusterA.centerN),
      node: <Desk key="d-A" def={DESKS.clusterA} />,
    });

    // Cluster B desk
    list.push({
      key: paintKey(DESKS.clusterB.centerE, DESKS.clusterB.centerN),
      node: <Desk key="d-B" def={DESKS.clusterB} />,
    });

    // Monitores — sortKey ligeiramente menor que a mesa correspondente,
    // então renderizam DEPOIS (em cima) da mesa mas atrás de cadeiras frontais
    for (const mon of MONITORS) {
      list.push({
        key: paintKey(mon.e, mon.n) - 0.1,
        node: <Monitor key={`mon-${mon.seatId}`} def={mon} />,
      });
    }

    // Cadeiras
    for (const layout of SEAT_POSITIONS) {
      const seatMeta = seats.find((s) => s.id === layout.id);
      const reservation = reservationMap.get(layout.id) ?? null;
      const isMine = reservation?.user_id === currentUserId;
      const isFixed = seatMeta?.is_fixed ?? false;
      list.push({
        key: paintKey(layout.e, layout.n),
        node: (
          <Chair
            key={`chair-${layout.id}`}
            layout={layout}
            reservation={reservation}
            isMine={isMine}
            isFixed={isFixed}
            disabled={disabled}
            onClick={() => onSeatClick(layout.id)}
          />
        ),
      });
    }

    // Planta
    list.push({
      key: paintKey(PLANT.e, PLANT.n),
      node: <Plant key="plant" />,
    });

    list.sort((a, b) => b.key - a.key);
    return list.map((i) => i.node);
  }, [seats, reservationMap, currentUserId, onSeatClick, disabled]);

  return (
    <svg
      viewBox={VIEWBOX}
      className="w-full h-full max-w-[1200px]"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mapa do escritório Oncar"
    >
      <defs>
        <radialGradient id="ao" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="haloAccent" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7A93F5" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#3E5EE8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3E5EE8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="haloMine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B0C1FF" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#7A93F5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3E5EE8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampPool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFC988" stopOpacity="0.14" />
          <stop offset="55%" stopColor="#E8A05B" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#E8A05B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampBulb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF0D6" stopOpacity="1" />
          <stop offset="55%" stopColor="#FFC988" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#E8A05B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampBloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFC988" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#E8A05B" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#E8A05B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="floorFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={floorColorA}>
            <animate
              attributeName="stop-color"
              to={floorColorA}
              dur="1.2s"
              fill="freeze"
            />
          </stop>
          <stop offset="100%" stopColor={floorColorB}>
            <animate
              attributeName="stop-color"
              to={floorColorB}
              dur="1.2s"
              fill="freeze"
            />
          </stop>
        </linearGradient>
        <filter id="floorGrain" x="0" y="0">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.4"
            numOctaves={2}
            stitchTiles="stitch"
          />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.10 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      <Floor />
      <FloorGrid />
      <FloorGrain />
      <LampFloorPool />
      <Walls />
      <Copa />

      {sortedItems}

      <Porta />
      <CeilingLamp />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Componentes internos do mapa
// ─────────────────────────────────────────────────────────────────────

function Floor() {
  return (
    <polygon
      points={pts(
        [-ROOM_HALF, -ROOM_HALF],
        [ROOM_HALF, -ROOM_HALF],
        [ROOM_HALF, ROOM_HALF],
        [-ROOM_HALF, ROOM_HALF]
      )}
      fill="url(#floorFill)"
      stroke="rgba(255,255,255,0.06)"
      strokeWidth={0.8}
    />
  );
}

function FloorGrid() {
  const lines: React.ReactNode[] = [];
  for (let i = -ROOM_HALF + 40; i < ROOM_HALF; i += 40) {
    const [x1a, y1a] = proj(i, -ROOM_HALF);
    const [x2a, y2a] = proj(i, ROOM_HALF);
    const [x1b, y1b] = proj(-ROOM_HALF, i);
    const [x2b, y2b] = proj(ROOM_HALF, i);
    lines.push(
      <Fragment key={`g-${i}`}>
        <line
          x1={x1a}
          y1={y1a}
          x2={x2a}
          y2={y2a}
          stroke="rgba(255,255,255,0.025)"
          strokeWidth={0.6}
        />
        <line
          x1={x1b}
          y1={y1b}
          x2={x2b}
          y2={y2b}
          stroke="rgba(255,255,255,0.025)"
          strokeWidth={0.6}
        />
      </Fragment>
    );
  }
  return <g pointerEvents="none">{lines}</g>;
}

function FloorGrain() {
  return (
    <polygon
      points={pts(
        [-ROOM_HALF, -ROOM_HALF],
        [ROOM_HALF, -ROOM_HALF],
        [ROOM_HALF, ROOM_HALF],
        [-ROOM_HALF, ROOM_HALF]
      )}
      fill="rgba(255,255,255,0.008)"
      filter="url(#floorGrain)"
      pointerEvents="none"
    />
  );
}

function LampFloorPool() {
  const [x, y] = proj(LAMP.e, LAMP.n, 0);
  return (
    <ellipse
      cx={x}
      cy={y}
      rx={340}
      ry={180}
      fill="url(#lampPool)"
      pointerEvents="none"
    />
  );
}

function Walls() {
  return (
    <>
      {/* N wall (back) — face sul visível */}
      <polygon
        points={pts(
          [-ROOM_HALF, ROOM_HALF, 0],
          [ROOM_HALF, ROOM_HALF, 0],
          [ROOM_HALF, ROOM_HALF, WALL_H],
          [-ROOM_HALF, ROOM_HALF, WALL_H]
        )}
        fill="#101118"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={0.6}
      />
      <line
        x1={proj(-ROOM_HALF, ROOM_HALF, WALL_H)[0]}
        y1={proj(-ROOM_HALF, ROOM_HALF, WALL_H)[1]}
        x2={proj(ROOM_HALF, ROOM_HALF, WALL_H)[0]}
        y2={proj(ROOM_HALF, ROOM_HALF, WALL_H)[1]}
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={0.6}
      />
      {/* W wall — face leste visível */}
      <polygon
        points={pts(
          [-ROOM_HALF, -ROOM_HALF, 0],
          [-ROOM_HALF, ROOM_HALF, 0],
          [-ROOM_HALF, ROOM_HALF, WALL_H],
          [-ROOM_HALF, -ROOM_HALF, WALL_H]
        )}
        fill="#0A0B10"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={0.6}
      />
      <line
        x1={proj(-ROOM_HALF, -ROOM_HALF, WALL_H)[0]}
        y1={proj(-ROOM_HALF, -ROOM_HALF, WALL_H)[1]}
        x2={proj(-ROOM_HALF, ROOM_HALF, WALL_H)[0]}
        y2={proj(-ROOM_HALF, ROOM_HALF, WALL_H)[1]}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={0.6}
      />
      {/* Costura vertical do canto NW */}
      <line
        x1={proj(-ROOM_HALF, ROOM_HALF, 0)[0]}
        y1={proj(-ROOM_HALF, ROOM_HALF, 0)[1]}
        x2={proj(-ROOM_HALF, ROOM_HALF, WALL_H)[0]}
        y2={proj(-ROOM_HALF, ROOM_HALF, WALL_H)[1]}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={0.6}
      />
    </>
  );
}

function Copa() {
  const CH = COUNTER_H;
  const [labelX, labelY] = proj(COPA.label.e, COPA.label.n);
  return (
    <>
      {/* Segmento horizontal ao longo da parede norte */}
      <polygon
        points={pts(
          [COPA.horizontal.e0, COPA.horizontal.n0, CH],
          [COPA.horizontal.e1, COPA.horizontal.n0, CH],
          [COPA.horizontal.e1, COPA.horizontal.n1, CH],
          [COPA.horizontal.e0, COPA.horizontal.n1, CH]
        )}
        fill="#1F2028"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={0.5}
      />
      {/* Face sul (frente, visível) */}
      <polygon
        points={pts(
          [COPA.horizontal.e0, COPA.horizontal.n0, 0],
          [COPA.horizontal.e1, COPA.horizontal.n0, 0],
          [COPA.horizontal.e1, COPA.horizontal.n0, CH],
          [COPA.horizontal.e0, COPA.horizontal.n0, CH]
        )}
        fill="#151620"
      />
      {/* Face leste */}
      <polygon
        points={pts(
          [COPA.horizontal.e1, COPA.horizontal.n0, 0],
          [COPA.horizontal.e1, COPA.horizontal.n1, 0],
          [COPA.horizontal.e1, COPA.horizontal.n1, CH],
          [COPA.horizontal.e1, COPA.horizontal.n0, CH]
        )}
        fill="#191A24"
      />
      {/* Segmento vertical ao longo da parede oeste */}
      <polygon
        points={pts(
          [COPA.vertical.e0, COPA.vertical.n0, CH],
          [COPA.vertical.e1, COPA.vertical.n0, CH],
          [COPA.vertical.e1, COPA.vertical.n1, CH],
          [COPA.vertical.e0, COPA.vertical.n1, CH]
        )}
        fill="#1F2028"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={0.5}
      />
      <polygon
        points={pts(
          [COPA.vertical.e0, COPA.vertical.n0, 0],
          [COPA.vertical.e1, COPA.vertical.n0, 0],
          [COPA.vertical.e1, COPA.vertical.n0, CH],
          [COPA.vertical.e0, COPA.vertical.n0, CH]
        )}
        fill="#151620"
      />
      <polygon
        points={pts(
          [COPA.vertical.e1, COPA.vertical.n0, 0],
          [COPA.vertical.e1, COPA.vertical.n1, 0],
          [COPA.vertical.e1, COPA.vertical.n1, CH],
          [COPA.vertical.e1, COPA.vertical.n0, CH]
        )}
        fill="#191A24"
      />
      {/* Pia embutida no seg horizontal */}
      <SinkAt e={COPA.sink.e} n={COPA.sink.n} z={CH} />
      {/* Cafeteira */}
      <CoffeeMakerAt e={COPA.coffee.e} n={COPA.coffee.n} z={CH} />
      {/* Xícaras */}
      {COPA.cups.map((c, i) => {
        const [cx, cy] = proj(c.e, c.n, CH);
        return (
          <ellipse
            key={`cup-${i}`}
            cx={cx}
            cy={cy}
            rx={4}
            ry={2.2}
            fill="#2F3038"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={0.4}
          />
        );
      })}
      {/* Label */}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        fontSize={9}
        letterSpacing="0.22em"
        fill="#545866"
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        className="uppercase select-none pointer-events-none"
      >
        Copa
      </text>
    </>
  );
}

function SinkAt({ e, n, z }: { e: number; n: number; z: number }) {
  const [sx, sy] = proj(e, n, z);
  return (
    <>
      <ellipse
        cx={sx}
        cy={sy}
        rx={18}
        ry={10}
        fill="#08080B"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={0.5}
      />
      <ellipse
        cx={sx}
        cy={sy - 1}
        rx={14}
        ry={7}
        fill="none"
        stroke="rgba(255,255,255,0.03)"
        strokeWidth={0.5}
      />
    </>
  );
}

function CoffeeMakerAt({ e, n, z }: { e: number; n: number; z: number }) {
  const h = 20;
  return (
    <>
      <polygon
        points={pts(
          [e - 8, n - 6, z + h],
          [e + 8, n - 6, z + h],
          [e + 8, n + 6, z + h],
          [e - 8, n + 6, z + h]
        )}
        fill="#2A2B35"
      />
      <polygon
        points={pts(
          [e - 8, n - 6, z],
          [e + 8, n - 6, z],
          [e + 8, n - 6, z + h],
          [e - 8, n - 6, z + h]
        )}
        fill="#1B1C24"
      />
      <polygon
        points={pts(
          [e - 8, n - 6, z],
          [e - 8, n + 6, z],
          [e - 8, n + 6, z + h],
          [e - 8, n - 6, z + h]
        )}
        fill="#141520"
      />
      {/* LED accent */}
      <polygon
        points={pts(
          [e - 4, n - 6, z + 3],
          [e + 4, n - 6, z + 3],
          [e + 4, n - 6, z + 6],
          [e - 4, n - 6, z + 6]
        )}
        fill="#3E5EE8"
        opacity={0.55}
      />
    </>
  );
}

function SnackTable() {
  const { centerE: cE, centerN: cN, halfE: HE, halfN: HN, snacks } = SNACK_TABLE;
  const H = COUNTER_H;
  const T = 2;
  const [aoX, aoY] = proj(cE, cN, 0);
  const legs: Array<[number, number]> = [
    [cE - HE + 3, cN - HN + 3],
    [cE - HE + 3, cN + HN - 3],
    [cE + HE - 3, cN - HN + 3],
    [cE + HE - 3, cN + HN - 3],
  ];

  return (
    <>
      <ellipse
        cx={aoX}
        cy={aoY + 6}
        rx={HE * 1.6}
        ry={HN * 0.75}
        fill="url(#ao)"
      />
      {/* Topo */}
      <polygon
        points={pts(
          [cE - HE, cN + HN, H],
          [cE + HE, cN + HN, H],
          [cE + HE, cN - HN, H],
          [cE - HE, cN - HN, H]
        )}
        fill="#2A2B36"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={0.5}
      />
      {/* Face sul */}
      <polygon
        points={pts(
          [cE - HE, cN - HN, H],
          [cE + HE, cN - HN, H],
          [cE + HE, cN - HN, H - T],
          [cE - HE, cN - HN, H - T]
        )}
        fill="#1A1B23"
      />
      {/* Face oeste */}
      <polygon
        points={pts(
          [cE - HE, cN + HN, H],
          [cE - HE, cN - HN, H],
          [cE - HE, cN - HN, H - T],
          [cE - HE, cN + HN, H - T]
        )}
        fill="#141520"
      />
      {/* Pernas */}
      {legs.map(([lE, lN], i) => (
        <Fragment key={`leg-${i}`}>
          <polygon
            points={pts(
              [lE - 1.5, lN - 1.5, 0],
              [lE + 1.5, lN - 1.5, 0],
              [lE + 1.5, lN - 1.5, H - T],
              [lE - 1.5, lN - 1.5, H - T]
            )}
            fill="#0F101A"
          />
          <polygon
            points={pts(
              [lE - 1.5, lN - 1.5, 0],
              [lE - 1.5, lN + 1.5, 0],
              [lE - 1.5, lN + 1.5, H - T],
              [lE - 1.5, lN - 1.5, H - T]
            )}
            fill="#0B0C13"
          />
        </Fragment>
      ))}
      {/* Snacks */}
      <SnackBowl e={cE + snacks.bowl.dE} n={cN + snacks.bowl.dN} z={H} />
      <CookieStack e={cE + snacks.cookies.dE} n={cN + snacks.cookies.dN} z={H} />
      <FruitBowl e={cE + snacks.fruit.dE} n={cN + snacks.fruit.dN} z={H} />
    </>
  );
}

function SnackBowl({ e, n, z }: { e: number; n: number; z: number }) {
  const R = 7;
  const [cx, cy] = proj(e, n, z);
  return (
    <>
      <polygon
        points={pts(
          [e - R, n - R, z],
          [e + R, n - R, z],
          [e + R, n + R, z],
          [e - R, n + R, z]
        )}
        fill="#C89A3E"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={0.4}
      />
      <polygon
        points={pts(
          [e - R + 1.5, n - R + 1.5, z],
          [e + R - 1.5, n - R + 1.5, z],
          [e + R - 1.5, n + R - 1.5, z],
          [e - R + 1.5, n + R - 1.5, z]
        )}
        fill="#8A6B24"
      />
      <polygon points={`${cx - 4},${cy - 1} ${cx - 2},${cy - 7} ${cx - 0.5},${cy - 1}`} fill="#E6C468" />
      <polygon points={`${cx + 1},${cy - 2} ${cx + 3},${cy - 8} ${cx + 5},${cy - 1}`} fill="#F2D278" />
      <polygon points={`${cx - 1},${cy - 3} ${cx + 1.5},${cy - 9} ${cx + 3},${cy - 2}`} fill="#DDB854" />
    </>
  );
}

function CookieStack({ e, n, z }: { e: number; n: number; z: number }) {
  const R = 5;
  const layers = [0, 1, 2];
  const [cx, cy] = proj(e, n, z + 3 * 1.6 + 1.6);
  return (
    <>
      {layers.map((i) => {
        const zi = z + i * 1.6;
        return (
          <Fragment key={`ck-${i}`}>
            <polygon
              points={pts(
                [e - R, n - R, zi + 1.6],
                [e + R, n - R, zi + 1.6],
                [e + R, n + R, zi + 1.6],
                [e - R, n + R, zi + 1.6]
              )}
              fill={i % 2 === 0 ? "#8A5A2E" : "#9B6634"}
            />
            <polygon
              points={pts(
                [e - R, n - R, zi],
                [e + R, n - R, zi],
                [e + R, n - R, zi + 1.6],
                [e - R, n - R, zi + 1.6]
              )}
              fill="#5C3B1D"
            />
          </Fragment>
        );
      })}
      {[
        [-2, -1],
        [1, 0],
        [-1, 1.5],
        [2, -2],
      ].map(([dx, dy], i) => (
        <circle key={`chip-${i}`} cx={cx + dx} cy={cy + dy} r={0.9} fill="#2A1608" />
      ))}
    </>
  );
}

function FruitBowl({ e, n, z }: { e: number; n: number; z: number }) {
  const R = 8;
  const [ax, ay] = proj(e - 1.5, n - 1, z + 3);
  const [bx, by] = proj(e + 2, n + 1, z + 2.5);
  const [gx, gy] = proj(e + 1.5, n - 2, z + 2.5);
  return (
    <>
      <polygon
        points={pts(
          [e - R, n - R, z],
          [e + R, n - R, z],
          [e + R, n + R, z],
          [e - R, n + R, z]
        )}
        fill="#3A2A1E"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={0.4}
      />
      <polygon
        points={pts(
          [e - R + 1.5, n - R + 1.5, z],
          [e + R - 1.5, n - R + 1.5, z],
          [e + R - 1.5, n + R - 1.5, z],
          [e - R + 1.5, n + R - 1.5, z]
        )}
        fill="#2A1E14"
      />
      <circle cx={ax} cy={ay} r={3.5} fill="#B93A2E" />
      <path
        d={`M ${ax - 3} ${ay - 2} Q ${ax - 2} ${ay - 3.5} ${ax - 1} ${ay - 3}`}
        fill="rgba(255,255,255,0.20)"
      />
      <path
        d={`M ${ax} ${ay - 3.5} Q ${ax + 0.5} ${ay - 4.5} ${ax + 1.5} ${ay - 4}`}
        fill="none"
        stroke="#3A5A28"
        strokeWidth={0.7}
      />
      <path
        d={`M ${bx - 3} ${by + 1.5} Q ${bx - 1} ${by - 4} ${bx + 4} ${by - 0.5} Q ${bx + 3} ${by + 2} ${bx - 3} ${by + 1.5} Z`}
        fill="#E6C155"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={0.3}
      />
      <circle cx={gx} cy={gy} r={2.5} fill="#7EA83A" />
    </>
  );
}

function Desk({ def }: { def: DeskDef }) {
  const { centerE: cE, centerN: cN, long, deep } = def;
  const HL = long / 2;
  const HD = deep / 2;
  const H = DESK_H;
  const T = DESK_T;
  const [aoX, aoY] = proj(cE, cN, 0);
  const legs: Array<[number, number]> = [
    [cE - HL + 4, cN - HD + 3],
    [cE - HL + 4, cN + HD - 3],
    [cE + HL - 4, cN - HD + 3],
    [cE + HL - 4, cN + HD - 3],
  ];
  return (
    <>
      <ellipse
        cx={aoX}
        cy={aoY + 8}
        rx={HL * 1.05}
        ry={HD * 1.2}
        fill="url(#ao)"
      />
      <polygon
        points={pts(
          [cE - HL, cN + HD, H],
          [cE + HL, cN + HD, H],
          [cE + HL, cN - HD, H],
          [cE - HL, cN - HD, H]
        )}
        fill="#262731"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={0.5}
      />
      <polygon
        points={pts(
          [cE - HL, cN + HD, H],
          [cE + HL, cN + HD, H],
          [cE + HL, cN + HD - 4, H],
          [cE - HL, cN + HD - 4, H]
        )}
        fill="rgba(255,255,255,0.04)"
      />
      <polygon
        points={pts(
          [cE - HL, cN - HD, H],
          [cE + HL, cN - HD, H],
          [cE + HL, cN - HD, H - T],
          [cE - HL, cN - HD, H - T]
        )}
        fill="#1A1B23"
      />
      <polygon
        points={pts(
          [cE - HL, cN + HD, H],
          [cE - HL, cN - HD, H],
          [cE - HL, cN - HD, H - T],
          [cE - HL, cN + HD, H - T]
        )}
        fill="#141520"
      />
      {legs.map(([lE, lN], i) => (
        <Fragment key={`dl-${i}`}>
          <polygon
            points={pts(
              [lE - 1.5, lN - 1.5, 0],
              [lE + 1.5, lN - 1.5, 0],
              [lE + 1.5, lN - 1.5, H - T],
              [lE - 1.5, lN - 1.5, H - T]
            )}
            fill="#0F101A"
          />
          <polygon
            points={pts(
              [lE - 1.5, lN - 1.5, 0],
              [lE - 1.5, lN + 1.5, 0],
              [lE - 1.5, lN + 1.5, H - T],
              [lE - 1.5, lN - 1.5, H - T]
            )}
            fill="#0B0C13"
          />
        </Fragment>
      ))}
    </>
  );
}

function Monitor({ def }: { def: MonitorDef }) {
  const { e, n, facing } = def;
  const H_BASE = 14;
  const H_POST_TOP = 20;
  const H_TOP = 34;
  const W = 9;
  const D = 1.2;

  // Base + post fixos
  const basePost = (
    <>
      <polygon
        points={pts(
          [e - 4, n - 3, H_BASE],
          [e + 4, n - 3, H_BASE],
          [e + 4, n + 3, H_BASE],
          [e - 4, n + 3, H_BASE]
        )}
        fill="#1A1B22"
      />
      <polygon
        points={pts(
          [e - 0.9, n - 0.9, H_BASE],
          [e + 0.9, n - 0.9, H_BASE],
          [e + 0.9, n - 0.9, H_POST_TOP],
          [e - 0.9, n - 0.9, H_POST_TOP]
        )}
        fill="#1F2028"
      />
    </>
  );

  // Screen faces dependem do facing
  const { southFace, westFace, topFace, isFrontVisible } = computeMonitorPanel(
    e,
    n,
    facing,
    W,
    D,
    H_POST_TOP,
    H_TOP
  );

  return (
    <>
      {basePost}
      <polygon points={pts(...westFace)} fill="#0F1017" />
      <polygon
        points={pts(...southFace)}
        fill="#0A0B10"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={0.4}
      />
      {isFrontVisible && (
        <polygon points={pts(...southFace)} fill="#3E5EE8" opacity={0.14} />
      )}
      <polygon points={pts(...topFace)} fill="rgba(255,255,255,0.05)" />
    </>
  );
}

function computeMonitorPanel(
  e: number,
  n: number,
  facing: Facing,
  W: number,
  D: number,
  H_POST_TOP: number,
  H_TOP: number
) {
  type Pt = [number, number, number];
  let southFace: Pt[], westFace: Pt[], topFace: Pt[];
  let isFrontVisible: boolean;

  if (facing === "S" || facing === "N") {
    const nA = n - D / 2;
    const nB = n + D / 2;
    southFace = [
      [e - W, nA, H_POST_TOP],
      [e + W, nA, H_POST_TOP],
      [e + W, nA, H_TOP],
      [e - W, nA, H_TOP],
    ];
    topFace = [
      [e - W, nA, H_TOP],
      [e + W, nA, H_TOP],
      [e + W, nB, H_TOP],
      [e - W, nB, H_TOP],
    ];
    westFace = [
      [e - W, nA, H_POST_TOP],
      [e - W, nB, H_POST_TOP],
      [e - W, nB, H_TOP],
      [e - W, nA, H_TOP],
    ];
    isFrontVisible = facing === "S";
  } else {
    const eA = e - D / 2;
    const eB = e + D / 2;
    southFace = [
      [eA, n - W, H_POST_TOP],
      [eB, n - W, H_POST_TOP],
      [eB, n - W, H_TOP],
      [eA, n - W, H_TOP],
    ];
    topFace = [
      [eA, n - W, H_TOP],
      [eB, n - W, H_TOP],
      [eB, n + W, H_TOP],
      [eA, n + W, H_TOP],
    ];
    westFace = [
      [eA, n - W, H_POST_TOP],
      [eA, n + W, H_POST_TOP],
      [eA, n + W, H_TOP],
      [eA, n - W, H_TOP],
    ];
    // Facing W = tela aponta pra oeste → observador vê a face oeste-ish (frente)
    isFrontVisible = facing === "W";
  }

  return { southFace, westFace, topFace, isFrontVisible };
}

function Plant() {
  const e = PLANT.e;
  const n = PLANT.n;
  const H = 10;
  const [aoX, aoY] = proj(e, n, 0);
  const [cx, cy] = proj(e, n, H + 4);
  return (
    <>
      <ellipse cx={aoX} cy={aoY + 5} rx={16} ry={5} fill="url(#ao)" />
      <polygon
        points={pts(
          [e - 9, n - 9, 0],
          [e + 9, n - 9, 0],
          [e + 8, n - 8, H],
          [e - 8, n - 8, H]
        )}
        fill="#3E2A1F"
      />
      <polygon
        points={pts(
          [e - 9, n - 9, 0],
          [e - 9, n + 9, 0],
          [e - 8, n + 8, H],
          [e - 8, n - 8, H]
        )}
        fill="#31221A"
      />
      <polygon
        points={pts(
          [e - 8, n - 8, H],
          [e + 8, n - 8, H],
          [e + 8, n + 8, H],
          [e - 8, n + 8, H]
        )}
        fill="#4A3627"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={0.4}
      />
      {/* Folhas */}
      <path
        d={`M ${cx} ${cy} Q ${cx + 3} ${cy - 22} ${cx + 12} ${cy - 30} Q ${cx + 14} ${cy - 12} ${cx + 2} ${cy - 4} Z`}
        fill="#365D3B"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={0.4}
      />
      <path
        d={`M ${cx - 3} ${cy - 2} Q ${cx - 16} ${cy - 16} ${cx - 24} ${cy - 10} Q ${cx - 14} ${cy} ${cx - 3} ${cy - 2} Z`}
        fill="#2A4A2E"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={0.4}
      />
      <path
        d={`M ${cx + 2} ${cy - 4} Q ${cx + 18} ${cy - 8} ${cx + 22} ${cy + 2} Q ${cx + 12} ${cy + 2} ${cx + 2} ${cy - 4} Z`}
        fill="#2E5233"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={0.4}
      />
      <path
        d={`M ${cx - 1} ${cy - 6} Q ${cx - 4} ${cy - 24} ${cx - 14} ${cy - 24} Q ${cx - 6} ${cy - 8} ${cx - 1} ${cy - 6} Z`}
        fill="#233F27"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={0.4}
      />
    </>
  );
}

function Porta() {
  const { centerE: e0, hingeOffsetE, swingAngleDeg, leafLen, leafH } = PORTA;
  const angle = (swingAngleDeg * Math.PI) / 180;
  const hingeE = e0 + hingeOffsetE;
  const hingeN = -ROOM_HALF;
  const tipE = hingeE + leafLen * Math.cos(angle);
  const tipN = hingeN + leafLen * Math.sin(angle);
  const perpE = -Math.sin(angle) * 1.5;
  const perpN = Math.cos(angle) * 1.5;

  // Arco do swing (linhas curtas ao invés de path — projeção fica correta)
  const arcSteps = 8;
  const arcSegs: React.ReactNode[] = [];
  for (let i = 0; i < arcSteps; i += 2) {
    const a1 = (angle / arcSteps) * i;
    const a2 = (angle / arcSteps) * (i + 1);
    const [x1, y1] = proj(
      hingeE + leafLen * Math.cos(a1),
      hingeN + leafLen * Math.sin(a1),
      0
    );
    const [x2, y2] = proj(
      hingeE + leafLen * Math.cos(a2),
      hingeN + leafLen * Math.sin(a2),
      0
    );
    arcSegs.push(
      <line
        key={`arc-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="rgba(232,160,91,0.30)"
        strokeWidth={0.6}
      />
    );
  }

  // Soleira
  const [tx1, ty1] = proj(e0 - 30, -ROOM_HALF, 0);
  const [tx2, ty2] = proj(e0 + 30, -ROOM_HALF, 0);

  // Maçaneta
  const handleE = hingeE + Math.cos(angle) * leafLen * 0.82;
  const handleN = hingeN + Math.sin(angle) * leafLen * 0.82;
  const [hx, hy] = proj(handleE, handleN, leafH * 0.5);

  // Label
  const [lx, ly] = proj(e0, -ROOM_HALF - 5);

  return (
    <>
      <line
        x1={tx1}
        y1={ty1}
        x2={tx2}
        y2={ty2}
        stroke="#E8A05B"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.75}
      />
      <polygon
        points={pts(
          [hingeE, hingeN, 0],
          [tipE, tipN, 0],
          [tipE, tipN, leafH],
          [hingeE, hingeN, leafH]
        )}
        fill="#1B1C24"
        stroke="rgba(232,160,91,0.30)"
        strokeWidth={0.6}
      />
      <polygon
        points={pts(
          [hingeE, hingeN, leafH],
          [tipE, tipN, leafH],
          [tipE + perpE, tipN + perpN, leafH],
          [hingeE + perpE, hingeN + perpN, leafH]
        )}
        fill="rgba(255,255,255,0.06)"
      />
      <circle cx={hx} cy={hy} r={1.8} fill="#E8A05B" opacity={0.9} />
      {arcSegs}
      <text
        x={lx}
        y={ly + 22}
        textAnchor="middle"
        fontSize={9}
        letterSpacing="0.22em"
        fill="#545866"
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        className="uppercase select-none pointer-events-none"
      >
        Porta
      </text>
    </>
  );
}

function CeilingLamp() {
  const { e, n, zShadeTop, zShadeBot, rTop, rBot, zCeiling } = LAMP;
  const [wx1, wy1] = proj(e, n, zCeiling);
  const [wx2, wy2] = proj(e, n, zShadeTop);
  const [gx, gy] = proj(e, n, (zShadeTop + zShadeBot) / 2);
  const [bx, by] = proj(e, n, zShadeBot);

  return (
    <>
      <line
        x1={wx1}
        y1={wy1}
        x2={wx2}
        y2={wy2}
        stroke="#22232D"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <ellipse
        cx={gx}
        cy={gy}
        rx={rBot * 3.5}
        ry={rBot * 2.4}
        fill="url(#lampBloom)"
        pointerEvents="none"
      />
      {/* Frustum: south, west, top */}
      <polygon
        points={pts(
          [e - rTop, n - rTop, zShadeTop],
          [e + rTop, n - rTop, zShadeTop],
          [e + rBot, n - rBot, zShadeBot],
          [e - rBot, n - rBot, zShadeBot]
        )}
        fill="#171820"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={0.5}
      />
      <polygon
        points={pts(
          [e - rTop, n - rTop, zShadeTop],
          [e - rTop, n + rTop, zShadeTop],
          [e - rBot, n + rBot, zShadeBot],
          [e - rBot, n - rBot, zShadeBot]
        )}
        fill="#101118"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={0.5}
      />
      <polygon
        points={pts(
          [e - rTop, n + rTop, zShadeTop],
          [e + rTop, n + rTop, zShadeTop],
          [e + rTop, n - rTop, zShadeTop],
          [e - rTop, n - rTop, zShadeTop]
        )}
        fill="#1B1C24"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={0.4}
      />
      <ellipse
        cx={bx}
        cy={by}
        rx={rBot * 0.9}
        ry={rBot * 0.55}
        fill="url(#lampBulb)"
      />
      <ellipse
        cx={bx}
        cy={by}
        rx={rBot * 0.35}
        ry={rBot * 0.22}
        fill="#FFF0D6"
        opacity={0.85}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────

/**
 * Interpola a tonalidade do chão baseado na ocupação de hot-desks.
 * Vazio: azulado frio. Cheio: âmbar quente. Aproximação RGB da OKLCH.
 */
function interpolateFloorTemp(ratio: number): [string, string] {
  let r: number, g: number, b: number;
  if (ratio < 0.3) {
    r = 0x14;
    g = 0x15;
    b = 0x1c;
  } else if (ratio < 0.7) {
    const k = (ratio - 0.3) / 0.4;
    r = 0x14 + Math.round((0x18 - 0x14) * k);
    g = 0x15 + Math.round((0x19 - 0x15) * k);
    b = 0x1c + Math.round((0x24 - 0x1c) * k);
  } else {
    const k = (ratio - 0.7) / 0.3;
    r = 0x18 + Math.round((0x24 - 0x18) * k);
    g = 0x19 + Math.round((0x1c - 0x19) * k);
    b = 0x24 + Math.round((0x15 - 0x24) * k);
  }
  const c1 = `rgb(${r},${g},${b})`;
  const c2 = `rgb(${Math.max(0, r - 6)},${Math.max(0, g - 6)},${Math.max(0, b - 8)})`;
  return [c1, c2];
}
