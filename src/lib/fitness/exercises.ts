export type ExerciseId = "knee-up" | "calf-raise" | "side-leg" | "squat";

export interface Exercise {
  id: ExerciseId;
  name: string;
  emoji: string;
  description: string;
  /** 主に鍛える筋肉 */
  muscles: { name: string; effect: string }[];
  /** 達成後にもらえる希望メッセージ。継続日数別に解錠 */
  benefits: { afterDays: number; title: string; body: string }[];
  /** 1ノートあたりの推奨動作 */
  motion: string;
  /** ゲーム中の左右ラベル */
  laneLabels: [string, string];
}

export const EXERCISES: Exercise[] = [
  {
    id: "knee-up",
    name: "もも上げリズム",
    emoji: "🦵",
    description:
      "音楽のリズムに合わせて、ももを高く上げ下げ。基礎代謝アップと体幹強化に効きます。",
    motion: "ノーツが下に来たら、上がっている側の足のももをグッと上げる",
    laneLabels: ["左もも", "右もも"],
    muscles: [
      { name: "腸腰筋", effect: "姿勢が良くなり、お腹がスッキリ" },
      { name: "大腿四頭筋", effect: "前ももが引き締まる" },
      { name: "腹直筋", effect: "下腹のたるみにアプローチ" },
    ],
    benefits: [
      {
        afterDays: 1,
        title: "今日のあなた、よく動きました",
        body: "血流が良くなって、明日の朝が少し軽くなります。",
      },
      {
        afterDays: 3,
        title: "3日続いた！習慣化のサイン",
        body: "脳が「これは続けるもの」と認識し始めるタイミング。",
      },
      {
        afterDays: 7,
        title: "1週間達成、もも前がほどけてきた",
        body: "筋肉が動きを覚えて、階段が少しラクに感じる頃。",
      },
      {
        afterDays: 14,
        title: "2週間、姿勢が変わり始める",
        body: "腸腰筋が目覚めて、立ち姿がスッと伸びてきます。",
      },
      {
        afterDays: 30,
        title: "1ヶ月、見た目に表れる",
        body: "ももの境目が出始めて、パンツのウエストに余裕が。",
      },
    ],
  },
  {
    id: "calf-raise",
    name: "かかと上げリズム",
    emoji: "👣",
    description:
      "ビートに合わせてかかとを上げ下げ。「第二の心臓」と呼ばれるふくらはぎを刺激。",
    motion: "ノーツに合わせて、つま先立ちでかかとを上げる",
    laneLabels: ["両足", "両足"],
    muscles: [
      { name: "腓腹筋", effect: "ふくらはぎが引き締まる" },
      { name: "ヒラメ筋", effect: "むくみが取れて足が軽くなる" },
    ],
    benefits: [
      {
        afterDays: 1,
        title: "足がじんわり温まる感覚",
        body: "下半身の血流が回って、冷え予防に。",
      },
      {
        afterDays: 7,
        title: "夕方のむくみが減ってくる",
        body: "靴がきつく感じる時間が後ろにズレてきます。",
      },
      {
        afterDays: 30,
        title: "ふくらはぎにラインが出る",
        body: "スカートやパンツ姿が変わって見える時期。",
      },
    ],
  },
  {
    id: "side-leg",
    name: "横足上げリズム",
    emoji: "🩰",
    description: "中臀筋を狙って、お尻の横をキュッと。",
    motion: "ノーツに合わせて、立ったまま足を真横に上げる",
    laneLabels: ["左横", "右横"],
    muscles: [
      { name: "中臀筋", effect: "お尻の横が上がってヒップラインが整う" },
      { name: "内転筋", effect: "ももの内側がスッキリ" },
    ],
    benefits: [
      {
        afterDays: 7,
        title: "歩きが安定してくる",
        body: "横ブレが減って、長く歩いても疲れにくく。",
      },
      {
        afterDays: 30,
        title: "ヒップトップが上がる",
        body: "後ろ姿の印象が変わってきます。",
      },
    ],
  },
  {
    id: "squat",
    name: "スクワットリズム",
    emoji: "🏋️",
    description: "ビートに合わせてゆっくり腰を落とす。下半身全体に効く王様メニュー。",
    motion: "ノーツに合わせて、お尻を後ろに引きながら腰を落とす",
    laneLabels: ["下げる", "上げる"],
    muscles: [
      { name: "大腿四頭筋", effect: "もも全体が引き締まる" },
      { name: "大臀筋", effect: "ヒップアップ効果" },
      { name: "ハムストリングス", effect: "もも裏がスッキリ" },
    ],
    benefits: [
      {
        afterDays: 7,
        title: "立ち上がりがラクになる",
        body: "下半身全体が目覚めて、日常動作が軽く感じます。",
      },
      {
        afterDays: 30,
        title: "基礎代謝が上がってくる",
        body: "下半身の大きな筋肉が育つと、何もしてなくても消費が増える。",
      },
    ],
  },
];

export function getExercise(id: ExerciseId): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
