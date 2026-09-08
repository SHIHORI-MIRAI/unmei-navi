"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  loadProfiles,
  loadTeams,
  saveTeam,
  deleteTeam,
  newTeamMemberId,
  type TeamGroup,
  type TeamMember,
  type UserProfile,
} from "@/lib/storage";
import { analyzeTeam, type MemberAnalysis, type TeamAnalysis } from "@/lib/divination/team";
import { useI18n } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n/dict";

/** この画面固有の二言語文言（dict.ts は編集禁止のためローカルで保持） */
const L: Record<Lang, Record<string, string>> = {
  ja: {
    title: "家族・組織の関係図",
    lead: "メンバーの生年月日を入れると、一人ひとりの本質と、この集まりの中での役回りを分けて見られます。",
    groups: "グループ",
    newGroup: "＋ 新しいグループ",
    groupName: "グループ名",
    groupNamePlaceholder: "例）田中家 / 〇〇プロジェクトチーム",
    kindFamily: "家族として見る",
    kindBusiness: "組織として見る",
    kindNote: "同じ人でも、家族の中と組織の中では役割の言葉が変わります",
    members: "メンバー",
    addFromProfiles: "登録済みから追加",
    selectProfile: "-- 選ぶと追加されます --",
    addManual: "その場で追加",
    namePlaceholder: "お名前",
    rolePlaceholder: "続柄・肩書き（任意）",
    add: "追加",
    remove: "はずす",
    deleteGroup: "このグループを削除",
    deleteConfirm: "このグループを削除しますか？（メンバーのプロフィール自体は消えません）",
    needTwo: "分析にはメンバーが2人以上必要です。もう1人追加してください。",
    noGroup: "まだグループがありません。「＋ 新しいグループ」から作成してください。",
    overview: "全体で見たとき",
    balanceLabel: "気のバランス",
    harmonyLabel: "噛み合い",
    elements: "五行バランス（この集まりが持っている気）",
    elementHolders: "主な担い手",
    gaps: "足りていない役割",
    noGaps: "5つの力（守る・学ぶ・動く・集める・伝える）がすべて揃っています",
    coverBy: "代われる人",
    noCover: "この集まりの中に代われる人がいません。外部に頼るか、仕組みで補うと決めておくと消耗しません。",
    memberList: "一人ひとりの見え方",
    soloView: "一人で見たとき",
    teamView: "この中での役回り",
    contribution: "この人がいることで",
    watchInTeam: "意識したいこと",
    relations: "関係マップ",
    supports: "支える相手",
    supportedBy: "支えてくれる相手",
    sparks: "刺激し合う相手",
    advice: "この集まりの活かし方",
    energy: "エネルギー量",
    star: "主星",
    dayMaster: "日主",
    lifePath: "ライフパス",
    honmeisei: "本命星",
    seal: "紋章",
    soloVsTeam: "見方について",
    disclaimer: "※ 占いは参考情報です。人との関わりの判断は、ご自身の実感を大切にしてください。",
    profileLink: "＋ プロフィールに人を登録する",
    duplicate: "同じ生年月日の人がすでにいます",
    memberCount: "人",
  },
  ko: {
    title: "가족·조직 관계도",
    lead: "구성원의 생년월일을 넣으면, 한 사람 한 사람의 본질과 이 모임 안에서의 역할을 나누어 볼 수 있습니다.",
    groups: "그룹",
    newGroup: "＋ 새 그룹",
    groupName: "그룹 이름",
    groupNamePlaceholder: "예) 다나카 가족 / ○○ 프로젝트 팀",
    kindFamily: "가족으로 보기",
    kindBusiness: "조직으로 보기",
    kindNote: "같은 사람이라도 가족 안과 조직 안에서는 역할의 표현이 달라집니다",
    members: "구성원",
    addFromProfiles: "등록된 사람에서 추가",
    selectProfile: "-- 고르면 추가됩니다 --",
    addManual: "바로 추가",
    namePlaceholder: "이름",
    rolePlaceholder: "관계·직함 (선택)",
    add: "추가",
    remove: "빼기",
    deleteGroup: "이 그룹 삭제",
    deleteConfirm: "이 그룹을 삭제할까요? (구성원의 프로필 자체는 지워지지 않습니다)",
    needTwo: "분석하려면 구성원이 2명 이상 필요합니다. 한 명 더 추가해 주세요.",
    noGroup: "아직 그룹이 없습니다. 「＋ 새 그룹」에서 만들어 주세요.",
    overview: "전체로 봤을 때",
    balanceLabel: "기운 밸런스",
    harmonyLabel: "맞물림",
    elements: "오행 밸런스 (이 모임이 지닌 기운)",
    elementHolders: "주요 담당",
    gaps: "부족한 역할",
    noGaps: "다섯 가지 힘(지키기·배우기·움직이기·모으기·전하기)이 모두 갖춰져 있습니다",
    coverBy: "대신할 수 있는 사람",
    noCover: "이 모임 안에 대신할 사람이 없습니다. 외부에 기대거나 구조로 보완한다고 정해 두면 소모되지 않습니다.",
    memberList: "한 사람 한 사람의 모습",
    soloView: "혼자 봤을 때",
    teamView: "이 안에서의 역할",
    contribution: "이 사람이 있음으로써",
    watchInTeam: "의식하면 좋은 점",
    relations: "관계 지도",
    supports: "지지하는 상대",
    supportedBy: "지지해 주는 상대",
    sparks: "서로 자극하는 상대",
    advice: "이 모임을 살리는 법",
    energy: "에너지 양",
    star: "주성",
    dayMaster: "일간",
    lifePath: "라이프패스",
    honmeisei: "본명성",
    seal: "문장",
    soloVsTeam: "보는 방법에 대해",
    disclaimer: "※ 점술은 참고 정보입니다. 사람과의 관계에 대한 판단은 자신의 실감을 소중히 여겨 주세요.",
    profileLink: "＋ 프로필에 사람 등록하기",
    duplicate: "같은 생년월일의 사람이 이미 있습니다",
    memberCount: "명",
  },
};

const ELEMENT_COLOR: Record<string, string> = {
  木: "#5aa469",
  火: "#e2725b",
  土: "#c89b62",
  金: "#c4a747",
  水: "#5b8fd6",
};

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export default function TeamPage() {
  const { lang } = useI18n();
  const tx = L[lang];

  const [teams, setTeams] = useState<TeamGroup[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [newName, setNewName] = useState("");
  const [newBirth, setNewBirth] = useState("");
  const [newRole, setNewRole] = useState("");
  const [notice, setNotice] = useState("");
  const [openMemberId, setOpenMemberId] = useState<string>("");

  useEffect(() => {
    const list = loadTeams();
    setTeams(list);
    setProfiles(loadProfiles());
    if (list.length > 0) setActiveId(list[0].id);
  }, []);

  const active = useMemo(
    () => teams.find((t) => t.id === activeId) ?? null,
    [teams, activeId]
  );

  function persist(next: TeamGroup) {
    saveTeam({ ...next, updatedAt: new Date().toISOString() });
    setTeams(loadTeams());
  }

  function handleNewGroup() {
    const group: TeamGroup = {
      id: genId(),
      name: lang === "ko" ? `그룹 ${teams.length + 1}` : `グループ ${teams.length + 1}`,
      kind: "family",
      members: [],
      createdAt: new Date().toISOString(),
    };
    saveTeam(group);
    setTeams(loadTeams());
    setActiveId(group.id);
  }

  function handleDeleteGroup() {
    if (!active) return;
    if (!window.confirm(tx.deleteConfirm)) return;
    deleteTeam(active.id);
    const rest = loadTeams();
    setTeams(rest);
    setActiveId(rest[0]?.id ?? "");
  }

  function addMember(m: TeamMember) {
    if (!active) return;
    if (active.members.some((x) => x.birthDate === m.birthDate && x.name === m.name)) {
      setNotice(tx.duplicate);
      return;
    }
    setNotice("");
    persist({ ...active, members: [...active.members, m] });
  }

  function handleAddFromProfile(profileId: string) {
    const p = profiles.find((x) => x.id === profileId);
    if (!p) return;
    addMember({
      id: newTeamMemberId(),
      name: p.name,
      birthDate: p.birthDate,
      birthTime: p.birthTime || undefined,
      profileId: p.id,
    });
  }

  function handleAddManual() {
    if (!newName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(newBirth)) return;
    addMember({
      id: newTeamMemberId(),
      name: newName.trim(),
      birthDate: newBirth,
      role: newRole.trim() || undefined,
    });
    setNewName("");
    setNewBirth("");
    setNewRole("");
  }

  function handleRemoveMember(memberId: string) {
    if (!active) return;
    persist({ ...active, members: active.members.filter((m) => m.id !== memberId) });
  }

  function handleRoleChange(memberId: string, role: string) {
    if (!active) return;
    persist({
      ...active,
      members: active.members.map((m) => (m.id === memberId ? { ...m, role } : m)),
    });
  }

  const analysis: TeamAnalysis | null = useMemo(() => {
    if (!active) return null;
    return analyzeTeam(
      active.members.map((m) => ({
        id: m.id,
        name: m.name,
        birthDate: m.birthDate,
        birthTime: m.birthTime,
        role: m.role,
      })),
      active.kind,
      lang
    );
  }, [active, lang]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-accent-orange flex items-center gap-2">
          <span className="text-accent-gold">◎</span>
          {tx.title}
        </h2>
        <p className="text-xs text-muted mt-1 leading-relaxed">{tx.lead}</p>
      </div>

      {/* グループ選択 */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted">{tx.groups}</span>
          <button
            onClick={handleNewGroup}
            className="text-[11px] px-3 py-1.5 rounded-full bg-accent-orange/10 border border-accent-orange/30 text-accent-orange hover:bg-accent-orange/20 transition-colors"
          >
            {tx.newGroup}
          </button>
        </div>

        {teams.length === 0 ? (
          <p className="text-xs text-muted/80">{tx.noGroup}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  t.id === activeId
                    ? "bg-accent-orange text-white border-accent-orange shadow-sm"
                    : "bg-background border-card-border text-muted hover:text-accent-orange"
                }`}
              >
                {t.name}
                <span className="opacity-70 ml-1">
                  {t.members.length}
                  {tx.memberCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {active && (
        <>
          {/* グループ設定 */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">{tx.groupName}</label>
              <input
                type="text"
                value={active.name}
                onChange={(e) => persist({ ...active, name: e.target.value })}
                placeholder={tx.groupNamePlaceholder}
                className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-background rounded-xl p-1">
              {(["family", "business"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => persist({ ...active, kind: k })}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    active.kind === k
                      ? "bg-accent-orange text-white shadow-sm"
                      : "text-muted hover:text-accent-orange"
                  }`}
                >
                  {k === "family" ? tx.kindFamily : tx.kindBusiness}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted/80">{tx.kindNote}</p>
          </div>

          {/* メンバー編集 */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-medium text-muted">
              {tx.members}（{active.members.length}
              {tx.memberCount}）
            </span>

            {active.members.length > 0 && (
              <ul className="space-y-1.5">
                {active.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 bg-background border border-card-border rounded-xl px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{m.name}</p>
                      <p className="text-[10px] text-muted">{m.birthDate}</p>
                    </div>
                    <input
                      type="text"
                      value={m.role ?? ""}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      placeholder={tx.rolePlaceholder}
                      className="w-24 bg-card-bg border border-card-border rounded-lg px-2 py-1 text-[11px]"
                    />
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-[10px] text-muted hover:text-danger px-1.5 py-1"
                    >
                      {tx.remove}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {profiles.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted">{tx.addFromProfiles}</label>
                <select
                  value=""
                  onChange={(e) => e.target.value && handleAddFromProfile(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="">{tx.selectProfile}</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}（{p.birthDate}）
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5 pt-1 border-t border-card-border">
              <label className="text-[11px] text-muted">{tx.addManual}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={tx.namePlaceholder}
                className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-1.5">
                <input
                  type="date"
                  value={newBirth}
                  onChange={(e) => setNewBirth(e.target.value)}
                  className="flex-1 bg-background border border-card-border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder={tx.rolePlaceholder}
                  className="w-28 bg-background border border-card-border rounded-lg px-2 py-2 text-xs"
                />
              </div>
              <button
                onClick={handleAddManual}
                disabled={!newName.trim() || !newBirth}
                className="w-full py-2 bg-accent-gold/20 border border-accent-gold/40 text-accent-gold hover:bg-accent-gold/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium rounded-lg transition-colors"
              >
                {tx.add}
              </button>
              {notice && <p className="text-[11px] text-accent-orange">{notice}</p>}
              <Link
                href="/profile"
                className="inline-block text-[11px] text-accent-gold hover:text-accent-orange"
              >
                {tx.profileLink}
              </Link>
            </div>

            <button
              onClick={handleDeleteGroup}
              className="w-full py-2 text-[11px] text-muted hover:text-danger transition-colors"
            >
              {tx.deleteGroup}
            </button>
          </div>

          {!analysis && (
            <div className="bg-card-bg border border-dashed border-card-border rounded-2xl p-6 text-center">
              <p className="text-sm text-muted">{tx.needTwo}</p>
            </div>
          )}

          {analysis && (
            <>
              {/* 全体サマリー */}
              <section className="animate-fade-up rounded-2xl border border-accent-gold/30 p-4 shadow-sm space-y-3"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(232,130,12,0.10), rgba(196,148,42,0.10), rgba(255,255,255,0.6))",
                }}
              >
                <p className="text-[10px] text-accent-gold font-bold tracking-wider">
                  ◈ {tx.overview}
                </p>
                <p className="font-mincho text-lg font-bold text-foreground">
                  {analysis.typeTitle}
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {analysis.typeComment}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Gauge label={tx.balanceLabel} value={analysis.balanceScore} color="#c4942a" />
                  <Gauge label={tx.harmonyLabel} value={analysis.harmony} color="#e8820c" />
                </div>
              </section>

              {/* 五行バランス */}
              <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
                  <span>◈</span> {tx.elements}
                </h3>
                <div className="space-y-2">
                  {analysis.elements.map((e) => {
                    const max = Math.max(...analysis.elements.map((x) => x.count), 1);
                    return (
                      <div key={e.element} className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {e.name}
                            <span className="text-[10px] text-muted ml-1.5">{e.role}</span>
                          </span>
                          <span className="text-xs font-bold" style={{ color: ELEMENT_COLOR[e.element] }}>
                            {e.count}
                          </span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(e.count / max) * 100}%`,
                              backgroundColor: ELEMENT_COLOR[e.element],
                            }}
                          />
                        </div>
                        {e.holders.length > 0 && (
                          <p className="text-[10px] text-muted">
                            {tx.elementHolders}: {e.holders.join("・")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed bg-background rounded-xl p-3">
                  {analysis.elementComment}
                </p>
              </section>

              {/* 足りない役割 */}
              <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
                  <span>◈</span> {tx.gaps}
                </h3>
                {analysis.gaps.length === 0 ? (
                  <p className="text-xs text-foreground/80">{tx.noGaps}</p>
                ) : (
                  <div className="space-y-2">
                    {analysis.gaps.map((g) => (
                      <div
                        key={g.instinct}
                        className="bg-background border border-card-border rounded-xl p-3 space-y-1.5"
                      >
                        <p className="text-xs font-bold text-accent-orange">{g.label}</p>
                        <p className="text-xs text-foreground/80">{g.effect}</p>
                        {g.covers.length > 0 ? (
                          <div className="pt-1 space-y-1">
                            <p className="text-[10px] text-accent-gold font-bold">{tx.coverBy}</p>
                            <div className="flex flex-wrap gap-1">
                              {g.covers.map((name) => (
                                <span
                                  key={name}
                                  className="text-[11px] px-2 py-0.5 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-foreground"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-muted">{g.coverHow}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted">{tx.noCover}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* メンバーごと */}
              <section className="space-y-2">
                <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
                  <span>◈</span> {tx.memberList}
                </h3>
                <p className="text-[11px] text-muted leading-relaxed bg-background border border-card-border rounded-xl p-3">
                  <span className="font-bold text-accent-gold">{tx.soloVsTeam}：</span>
                  {analysis.soloVsTeamNote}
                </p>
                {analysis.members.map((m) => (
                  <MemberCard
                    key={m.id}
                    m={m}
                    tx={tx}
                    open={openMemberId === m.id}
                    onToggle={() => setOpenMemberId(openMemberId === m.id ? "" : m.id)}
                  />
                ))}
              </section>

              {/* 関係マップ */}
              <section className="bg-card-bg border border-card-border rounded-2xl p-4 shadow-sm space-y-2">
                <h3 className="text-sm font-medium text-accent-gold flex items-center gap-1.5">
                  <span>◈</span> {tx.relations}
                </h3>
                {analysis.pairs.map((p) => (
                  <div
                    key={`${p.aId}-${p.bId}`}
                    className="bg-background border border-card-border rounded-xl p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground truncate">
                        {p.giver && p.receiver
                          ? `${p.giver} → ${p.receiver}`
                          : `${p.aName} ・ ${p.bName}`}
                      </span>
                      <span className="text-xs font-bold text-accent-orange shrink-0">
                        {p.score}
                        <span className="text-[10px] text-muted">/100</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-accent-gold">{p.label}</p>
                    <p className="text-[11px] text-foreground/80">{p.comment}</p>
                  </div>
                ))}
              </section>

              {/* アドバイス */}
              <section className="bg-accent-orange/10 border border-accent-orange/30 rounded-2xl p-4 space-y-2">
                <h3 className="text-[10px] text-accent-orange font-bold tracking-wider">
                  ◈ {tx.advice}
                </h3>
                <ul className="space-y-2">
                  {analysis.advice.map((a, i) => (
                    <li key={i} className="text-xs text-foreground/80 leading-relaxed flex gap-2">
                      <span className="text-accent-gold shrink-0">✦</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}

      <p className="text-center text-xs text-muted/60 px-4">{tx.disclaimer}</p>
    </div>
  );
}

function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white/60 rounded-xl p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] text-muted">{label}</span>
        <span className="text-lg font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="w-full bg-background rounded-full h-1.5 mt-1">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MemberCard({
  m,
  tx,
  open,
  onToggle,
}: {
  m: MemberAnalysis;
  tx: Record<string, string>;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              {m.name}
              {m.role && <span className="text-[10px] text-muted ml-1.5">{m.role}</span>}
            </p>
            <p className="font-mincho text-base text-accent-orange mt-0.5">
              {m.archetype.title}
            </p>
          </div>
          <span className="text-accent-gold/60 text-lg shrink-0">{open ? "−" : "＋"}</span>
        </div>

        {m.badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {m.badges.map((b) => (
              <span
                key={b}
                className="text-[9px] px-2 py-0.5 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-foreground/80 leading-relaxed">{m.contribution}</p>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-card-border pt-3">
          <Block title={tx.soloView} body={m.soloView} tone="muted" />
          <Block title={tx.teamView} body={m.teamView} tone="accent" />
          <Block title={tx.watchInTeam} body={m.watchInTeam} tone="muted" />

          {(m.supports.length > 0 || m.supportedBy.length > 0 || m.sparksWith.length > 0) && (
            <div className="grid grid-cols-1 gap-1 text-[11px]">
              {m.supports.length > 0 && (
                <p className="text-foreground/80">
                  <span className="text-accent-gold">{tx.supports}：</span>
                  {m.supports.join("・")}
                </p>
              )}
              {m.supportedBy.length > 0 && (
                <p className="text-foreground/80">
                  <span className="text-accent-gold">{tx.supportedBy}：</span>
                  {m.supportedBy.join("・")}
                </p>
              )}
              {m.sparksWith.length > 0 && (
                <p className="text-foreground/80">
                  <span className="text-accent-gold">{tx.sparks}：</span>
                  {m.sparksWith.join("・")}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted bg-background rounded-xl p-3">
            <span>
              {tx.star}: <span className="text-foreground">{m.archetype.starName}</span>
            </span>
            <span>
              {tx.energy}: <span className="text-foreground">{m.energy}</span>（{m.energyLabel}）
            </span>
            <span>
              {tx.dayMaster}: <span className="text-foreground">{m.dayMaster.stem}</span>
            </span>
            <span>
              {tx.lifePath}: <span className="text-foreground">{m.lifePath}</span>
            </span>
            <span>
              {tx.honmeisei}: <span className="text-foreground">{m.honmeisei.name}</span>
            </span>
            <span>
              {tx.seal}: <span className="text-foreground">{m.mayanSeal}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Block({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "muted" | "accent";
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        tone === "accent"
          ? "bg-accent-orange/10 border border-accent-orange/25"
          : "bg-background border border-card-border"
      }`}
    >
      <p
        className={`text-[10px] font-bold ${
          tone === "accent" ? "text-accent-orange" : "text-muted"
        }`}
      >
        {title}
      </p>
      <p className="text-xs text-foreground/80 leading-relaxed mt-1">{body}</p>
    </div>
  );
}
