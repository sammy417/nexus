"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useAssetModal } from "@/lib/asset-modal-context";

export default function BackupPanel() {
  const { showToast } = useAssetModal();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    // The route sets Content-Disposition, so navigating triggers a download.
    window.location.href = "/api/backup";
  }

  async function handleFile(file: File) {
    setError(null);
    setIsImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("JSON 파일을 읽을 수 없습니다.");
      }

      const response = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? "복원에 실패했습니다.");
      }

      showToast(
        `복원 완료: 자산 ${result.assets}건 · 배당 ${result.dividends}건`
      );
      // Every context reads from the server on mount — reload to refresh all views.
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "복원에 실패했습니다.");
    } finally {
      setIsImporting(false);
    }
  }

  function handleImportClick() {
    const confirmed = window.confirm(
      "가져오기를 진행하면 현재 데이터가 백업 파일의 내용으로 완전히 대체됩니다. 계속할까요?"
    );
    if (confirmed) fileInputRef.current?.click();
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">데이터 백업</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        모든 자산·배당·자산 추이 기록을 JSON 파일 하나로 내보내고, 필요할 때 다시 불러올 수
        있습니다. 파일을 안전한 곳(클라우드 드라이브 등)에 보관하면 데이터가 초기화돼도 복원할 수
        있습니다.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Download size={15} strokeWidth={2.5} />
          백업 내보내기
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          disabled={isImporting}
          className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
        >
          <Upload size={15} strokeWidth={2.5} />
          {isImporting ? "복원 중..." : "백업 가져오기"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-3 text-xs font-medium text-fall">{error}</p>}

      <p className="mt-4 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        ⚠️ 가져오기는 <strong className="font-semibold">현재 데이터를 전부 대체</strong>합니다
        (병합이 아닙니다). 되돌릴 수 없으니 필요하면 먼저 현재 상태를 내보내 두세요.
      </p>
    </section>
  );
}
