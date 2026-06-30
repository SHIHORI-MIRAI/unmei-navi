"use client";

/**
 * AstroWorldMap — 正距円筒図法のSVG世界地図。
 * 経緯線・主要都市マーカー・天体ライン（MC/IC/AC/DC）を描画する。
 * 大陸シルエットは描かず、都市ドットと経緯線で位置を読み取る軽量設計。
 */

import { useMemo } from "react";
import type { AstroChart, AngleType } from "@/lib/divination/astrocartography";
import { PLANET_META } from "@/lib/divination/astrocartography";
import type { Body } from "@/lib/divination/astro-core";
import { WORLD_CITIES, type WorldCity } from "@/lib/divination/world-cities";

// viewBox: 0..360 (経度) × 0..180 (緯度)
const W = 360;
const H = 180;

const projX = (lon: number) => lon + 180;
const projY = (lat: number) => 90 - lat;

export interface AngleVisibility {
  MC: boolean;
  IC: boolean;
  AC: boolean;
  DC: boolean;
}

interface Props {
  chart: AstroChart;
  visiblePlanets: Set<Body>;
  angleVisibility: AngleVisibility;
  selectedCityId?: string;
  highlightCityIds?: Set<string>;
  onSelectCity?: (city: WorldCity) => void;
}

/** ±180をまたぐ経度ジャンプで分割しながらポリラインのpath文字列を作る */
function polylinePaths(points: { lat: number; lon: number }[]): string[] {
  const paths: string[] = [];
  let cur: string[] = [];
  let prevLon: number | null = null;
  for (const p of points) {
    if (prevLon !== null && Math.abs(p.lon - prevLon) > 180) {
      if (cur.length > 1) paths.push(cur.join(" "));
      cur = [];
    }
    cur.push(`${cur.length === 0 ? "M" : "L"} ${projX(p.lon).toFixed(1)} ${projY(p.lat).toFixed(1)}`);
    prevLon = p.lon;
  }
  if (cur.length > 1) paths.push(cur.join(" "));
  return paths;
}

export default function AstroWorldMap({
  chart,
  visiblePlanets,
  angleVisibility,
  selectedCityId,
  highlightCityIds,
  onSelectCity,
}: Props) {
  const graticule = useMemo(() => {
    const v: number[] = [];
    const h: number[] = [];
    for (let lon = -180; lon <= 180; lon += 30) v.push(lon);
    for (let lat = -60; lat <= 60; lat += 30) h.push(lat);
    return { v, h };
  }, []);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto rounded-2xl border border-card-border bg-[#eef4fb] shadow-inner select-none"
      style={{ touchAction: "pan-y" }}
    >
      <defs>
        <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf2fb" />
          <stop offset="100%" stopColor="#e6eef8" />
        </linearGradient>
      </defs>

      {/* 海 */}
      <rect x="0" y="0" width={W} height={H} fill="url(#ocean)" />

      {/* 経緯線 */}
      <g stroke="#c9d6e6" strokeWidth="0.3">
        {graticule.v.map((lon) => (
          <line key={`v${lon}`} x1={projX(lon)} y1={0} x2={projX(lon)} y2={H} />
        ))}
        {graticule.h.map((lat) => (
          <line key={`h${lat}`} x1={0} y1={projY(lat)} x2={W} y2={projY(lat)} />
        ))}
      </g>
      {/* 赤道 */}
      <line x1={0} y1={projY(0)} x2={W} y2={projY(0)} stroke="#b7c6d8" strokeWidth="0.5" strokeDasharray="2 1.5" />
      {/* 回帰線（淡色） */}
      <line x1={0} y1={projY(23.4)} x2={W} y2={projY(23.4)} stroke="#cdd9e8" strokeWidth="0.25" strokeDasharray="1 2" />
      <line x1={0} y1={projY(-23.4)} x2={W} y2={projY(-23.4)} stroke="#cdd9e8" strokeWidth="0.25" strokeDasharray="1 2" />

      {/* 天体ライン */}
      {chart.lines.map((pl) => {
        if (!visiblePlanets.has(pl.body)) return null;
        const meta = PLANET_META[pl.body];
        const acPaths = polylinePaths(pl.acLine);
        const dcPaths = polylinePaths(pl.dcLine);
        return (
          <g key={pl.body} stroke={meta.color} fill="none" opacity={0.85}>
            {/* MC: 実線 */}
            {angleVisibility.MC && (
              <line
                x1={projX(pl.mcLon)} y1={projY(72)}
                x2={projX(pl.mcLon)} y2={projY(-72)}
                strokeWidth="0.7"
              />
            )}
            {/* IC: 点線 */}
            {angleVisibility.IC && (
              <line
                x1={projX(pl.icLon)} y1={projY(72)}
                x2={projX(pl.icLon)} y2={projY(-72)}
                strokeWidth="0.6" strokeDasharray="1 1.4" opacity={0.7}
              />
            )}
            {/* AC: 実線カーブ */}
            {angleVisibility.AC &&
              acPaths.map((d, i) => (
                <path key={`ac${i}`} d={d} strokeWidth="0.6" />
              ))}
            {/* DC: 破線カーブ */}
            {angleVisibility.DC &&
              dcPaths.map((d, i) => (
                <path key={`dc${i}`} d={d} strokeWidth="0.6" strokeDasharray="2 1.6" opacity={0.75} />
              ))}
          </g>
        );
      })}

      {/* 都市 */}
      {WORLD_CITIES.map((c) => {
        const x = projX(c.lon);
        const y = projY(c.lat);
        const isSelected = c.id === selectedCityId;
        const isTop = highlightCityIds?.has(c.id);
        return (
          <g
            key={c.id}
            onClick={() => onSelectCity?.(c)}
            style={{ cursor: onSelectCity ? "pointer" : "default" }}
          >
            {/* タップ判定用の透明な広い円 */}
            <circle cx={x} cy={y} r={3} fill="transparent" />
            {isTop && !isSelected && (
              <circle cx={x} cy={y} r={2.6} fill="none" stroke="#e8a020" strokeWidth="0.6" opacity={0.9} />
            )}
            {isSelected && (
              <circle cx={x} cy={y} r={3.4} fill="none" stroke="#e8820c" strokeWidth="0.9" />
            )}
            <circle
              cx={x}
              cy={y}
              r={isSelected ? 1.6 : 1.1}
              fill={isSelected ? "#e8820c" : isTop ? "#c4942a" : "#7d8aa0"}
              stroke="#fff"
              strokeWidth="0.3"
            />
          </g>
        );
      })}

      {/* 選択都市ラベル */}
      {(() => {
        const c = WORLD_CITIES.find((w) => w.id === selectedCityId);
        if (!c) return null;
        const x = projX(c.lon);
        const y = projY(c.lat);
        const anchorRight = x > W - 60;
        return (
          <text
            x={anchorRight ? x - 4 : x + 4}
            y={y - 3}
            fontSize="5"
            fontWeight="700"
            fill="#3a2a1a"
            textAnchor={anchorRight ? "end" : "start"}
            style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 1.2 }}
          >
            {c.name}
          </text>
        );
      })()}
    </svg>
  );
}
