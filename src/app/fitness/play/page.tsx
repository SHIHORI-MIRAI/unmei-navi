"use client";

import { Suspense } from "react";
import PlayClient from "./PlayClient";

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">読み込み中…</div>}>
      <PlayClient />
    </Suspense>
  );
}
