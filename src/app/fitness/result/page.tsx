"use client";

import { Suspense } from "react";
import ResultClient from "./ResultClient";

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">読み込み中…</div>}>
      <ResultClient />
    </Suspense>
  );
}
