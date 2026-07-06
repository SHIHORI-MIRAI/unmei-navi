"use client";

/**
 * AstroWorldMap — 正距円筒図法のSVG世界地図。
 * 経緯線・大陸シルエット・主要都市マーカー・天体ライン（MC/IC/AC/DC）を描画する。
 *
 * 拡大・移動対応：
 * - ピンチ（2本指）でズーム、拡大中は1本指ドラッグで移動
 * - PCはマウスホイールでズーム、＋/−/リセットボタンでも操作可
 * - viewBox を動かして実現。線・点・文字の太さはズーム率で補正し見た目一定に保つ
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { AstroChart, AngleType } from "@/lib/divination/astrocartography";
import { PLANET_META } from "@/lib/divination/astrocartography";
import type { Body } from "@/lib/divination/astro-core";
import { WORLD_CITIES, type WorldCity } from "@/lib/divination/world-cities";
import { CONTINENTS } from "@/lib/divination/world-map-geo";

// viewBox: 0..360 (経度) × 0..180 (緯度)
const W = 360;
const H = 180;
const MIN_W = W / 8; // 最大8倍まで

const projX = (lon: number) => lon + 180;
const projY = (lat: number) => 90 - lat;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export interface AngleVisibility {
  MC: boolean;
  IC: boolean;
  AC: boolean;
  DC: boolean;
}

interface View {
  x: number;
  y: number;
  w: number;
  h: number;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, w: W, h: H });
  // 最新の view を native wheel ハンドラから参照するための ref
  const viewRef = useRef(view);
  viewRef.current = view;

  // ジェスチャ用の内部状態（レンダーに影響しないので ref）
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gesture = useRef<
    | { type: "pan"; startView: View; startClient: { x: number; y: number } }
    | { type: "pinch"; startView: View; startDist: number; anchor: { x: number; y: number } }
    | null
  >(null);
  const movedRef = useRef(false);

  const scale = W / view.w;
  const k = view.w / W; // 見た目一定にするための補正係数（1/scale）
  const s = (n: number) => n * k;

  const graticule = useMemo(() => {
    const v: number[] = [];
    const h: number[] = [];
    for (let lon = -180; lon <= 180; lon += 30) v.push(lon);
    for (let lat = -60; lat <= 60; lat += 30) h.push(lat);
    return { v, h };
  }, []);

  function rectOf() {
    return svgRef.current?.getBoundingClientRect();
  }

  function clientToVB(cx: number, cy: number, v: View) {
    const r = rectOf();
    if (!r) return { x: v.x, y: v.y };
    return {
      x: v.x + ((cx - r.left) / r.width) * v.w,
      y: v.y + ((cy - r.top) / r.height) * v.h,
    };
  }

  function clampView(nx: number, ny: number, nw: number, nh: number): View {
    return {
      x: clamp(nx, 0, W - nw),
      y: clamp(ny, 0, H - nh),
      w: nw,
      h: nh,
    };
  }

  /** アンカー(VB座標)を固定したまま倍率 m 倍する（m>1で拡大） */
  function zoomAtVB(ax: number, ay: number, m: number) {
    setView((v) => {
      const nw = clamp(v.w / m, MIN_W, W);
      const nh = nw * (H / W);
      const nx = ax - (ax - v.x) * (nw / v.w);
      const ny = ay - (ay - v.y) * (nh / v.h);
      return clampView(nx, ny, nw, nh);
    });
  }

  function zoomAtCenter(m: number) {
    zoomAtVB(view.x + view.w / 2, view.y + view.h / 2, m);
  }

  function reset() {
    setView({ x: 0, y: 0, w: W, h: H });
  }

  // ホイールズーム（passive:false でないと preventDefault できないため native 登録）
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const m = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      const a = clientToVB(e.clientX, e.clientY, viewRef.current);
      zoomAtVB(a.x, a.y, m);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    (e.currentTarget as SVGSVGElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      gesture.current = {
        type: "pan",
        startView: { ...view },
        startClient: { x: e.clientX, y: e.clientY },
      };
    } else if (pts.length === 2) {
      const [p1, p2] = pts;
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      gesture.current = {
        type: "pinch",
        startView: { ...view },
        startDist: dist,
        anchor: clientToVB(midX, midY, view),
      };
    }
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (!g) return;

    if (g.type === "pinch" && pts.length >= 2) {
      const [p1, p2] = pts;
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1;
      const m = dist / g.startDist; // 指を広げる→拡大
      const nw = clamp(g.startView.w / m, MIN_W, W);
      const nh = nw * (H / W);
      const nx = g.anchor.x - (g.anchor.x - g.startView.x) * (nw / g.startView.w);
      const ny = g.anchor.y - (g.anchor.y - g.startView.y) * (nh / g.startView.h);
      movedRef.current = true;
      setView(clampView(nx, ny, nw, nh));
    } else if (g.type === "pan" && pts.length === 1 && scale > 1) {
      const r = rectOf();
      if (!r) return;
      const dxpx = e.clientX - g.startClient.x;
      const dypx = e.clientY - g.startClient.y;
      if (Math.abs(dxpx) + Math.abs(dypx) > 4) movedRef.current = true;
      const dvx = -(dxpx / r.width) * g.startView.w;
      const dvy = -(dypx / r.height) * g.startView.h;
      setView(
        clampView(g.startView.x + dvx, g.startView.y + dvy, g.startView.w, g.startView.h)
      );
    }
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    const pts = [...pointers.current.entries()];
    if (pts.length === 1) {
      // ピンチ→1本残り：そのままパンへ引き継ぐ
      const [, p] = pts[0];
      gesture.current = {
        type: "pan",
        startView: { ...view },
        startClient: { x: p.x, y: p.y },
      };
    } else if (pts.length === 0) {
      gesture.current = null;
    }
  }

  const zoomed = scale > 1.01;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`${view.x.toFixed(2)} ${view.y.toFixed(2)} ${view.w.toFixed(2)} ${view.h.toFixed(2)}`}
        className="w-full h-auto rounded-2xl border border-card-border bg-[#eef4fb] shadow-inner select-none"
        style={{ touchAction: zoomed ? "none" : "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eaf2fb" />
            <stop offset="100%" stopColor="#e6eef8" />
          </linearGradient>
        </defs>

        {/* 海 */}
        <rect x="0" y="0" width={W} height={H} fill="url(#ocean)" />

        {/* 大陸シルエット（うっすら） */}
        <g fill="#e4ddc8" stroke="#d3c9ad" strokeWidth={s(0.25)} opacity={0.7}>
          {CONTINENTS.map((ring, i) => {
            const d =
              ring
                .map(
                  ([lon, lat], j) =>
                    `${j === 0 ? "M" : "L"} ${projX(lon).toFixed(1)} ${projY(lat).toFixed(1)}`
                )
                .join(" ") + " Z";
            return <path key={i} d={d} />;
          })}
        </g>

        {/* 経緯線 */}
        <g stroke="#c9d6e6" strokeWidth={s(0.3)}>
          {graticule.v.map((lon) => (
            <line key={`v${lon}`} x1={projX(lon)} y1={0} x2={projX(lon)} y2={H} />
          ))}
          {graticule.h.map((lat) => (
            <line key={`h${lat}`} x1={0} y1={projY(lat)} x2={W} y2={projY(lat)} />
          ))}
        </g>
        {/* 赤道 */}
        <line x1={0} y1={projY(0)} x2={W} y2={projY(0)} stroke="#b7c6d8" strokeWidth={s(0.5)} strokeDasharray={`${s(2)} ${s(1.5)}`} />
        {/* 回帰線（淡色） */}
        <line x1={0} y1={projY(23.4)} x2={W} y2={projY(23.4)} stroke="#cdd9e8" strokeWidth={s(0.25)} strokeDasharray={`${s(1)} ${s(2)}`} />
        <line x1={0} y1={projY(-23.4)} x2={W} y2={projY(-23.4)} stroke="#cdd9e8" strokeWidth={s(0.25)} strokeDasharray={`${s(1)} ${s(2)}`} />

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
                  strokeWidth={s(0.7)}
                />
              )}
              {/* IC: 点線 */}
              {angleVisibility.IC && (
                <line
                  x1={projX(pl.icLon)} y1={projY(72)}
                  x2={projX(pl.icLon)} y2={projY(-72)}
                  strokeWidth={s(0.6)} strokeDasharray={`${s(1)} ${s(1.4)}`} opacity={0.7}
                />
              )}
              {/* AC: 実線カーブ */}
              {angleVisibility.AC &&
                acPaths.map((d, i) => (
                  <path key={`ac${i}`} d={d} strokeWidth={s(0.6)} />
                ))}
              {/* DC: 破線カーブ */}
              {angleVisibility.DC &&
                dcPaths.map((d, i) => (
                  <path key={`dc${i}`} d={d} strokeWidth={s(0.6)} strokeDasharray={`${s(2)} ${s(1.6)}`} opacity={0.75} />
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
              onClick={() => {
                if (movedRef.current) return; // ドラッグ操作は選択にしない
                onSelectCity?.(c);
              }}
              style={{ cursor: onSelectCity ? "pointer" : "default" }}
            >
              {/* タップ判定用の透明な広い円 */}
              <circle cx={x} cy={y} r={s(3)} fill="transparent" />
              {isTop && !isSelected && (
                <circle cx={x} cy={y} r={s(2.6)} fill="none" stroke="#e8a020" strokeWidth={s(0.6)} opacity={0.9} />
              )}
              {isSelected && (
                <circle cx={x} cy={y} r={s(3.4)} fill="none" stroke="#e8820c" strokeWidth={s(0.9)} />
              )}
              <circle
                cx={x}
                cy={y}
                r={s(isSelected ? 1.6 : 1.1)}
                fill={isSelected ? "#e8820c" : isTop ? "#c4942a" : "#7d8aa0"}
                stroke="#fff"
                strokeWidth={s(0.3)}
              />
            </g>
          );
        })}

        {/* 拡大時は上位都市に名前を表示、そうでなければ選択都市のみ */}
        {WORLD_CITIES.map((c) => {
          const isSelected = c.id === selectedCityId;
          const isTop = highlightCityIds?.has(c.id);
          const show = isSelected || (zoomed && isTop);
          if (!show) return null;
          const x = projX(c.lon);
          const y = projY(c.lat);
          const anchorRight = x > view.x + view.w * 0.8;
          return (
            <text
              key={`label-${c.id}`}
              x={anchorRight ? x - s(4) : x + s(4)}
              y={y - s(3)}
              fontSize={s(5)}
              fontWeight="700"
              fill={isSelected ? "#3a2a1a" : "#6b5a3a"}
              textAnchor={anchorRight ? "end" : "start"}
              style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: s(1.2) }}
            >
              {c.name}
            </text>
          );
        })}
      </svg>

      {/* ズーム操作ボタン */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          type="button"
          aria-label="拡大"
          onClick={() => zoomAtCenter(1.6)}
          className="w-8 h-8 rounded-full bg-white/90 border border-card-border shadow-sm text-lg font-bold text-accent-orange flex items-center justify-center active:scale-95"
        >
          ＋
        </button>
        <button
          type="button"
          aria-label="縮小"
          onClick={() => zoomAtCenter(1 / 1.6)}
          className="w-8 h-8 rounded-full bg-white/90 border border-card-border shadow-sm text-lg font-bold text-accent-orange flex items-center justify-center active:scale-95"
        >
          －
        </button>
        {zoomed && (
          <button
            type="button"
            aria-label="全体表示に戻す"
            onClick={reset}
            className="w-8 h-8 rounded-full bg-white/90 border border-card-border shadow-sm text-sm text-muted flex items-center justify-center active:scale-95"
          >
            ⤢
          </button>
        )}
      </div>

      {/* 倍率表示 */}
      {zoomed && (
        <div className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-card-border text-muted">
          {scale.toFixed(1)}×
        </div>
      )}
    </div>
  );
}
