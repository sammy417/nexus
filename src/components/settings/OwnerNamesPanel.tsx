"use client";

import { useEffect, useState } from "react";
import { ASSET_OWNERS, ASSET_OWNER_LABEL, OWNER_COLOR } from "@/lib/models/asset-owner";
import { AssetOwner } from "@/lib/models/asset";
import { useSettings } from "@/lib/settings-context";
import { useAssetModal } from "@/lib/asset-modal-context";

const inputClass =
  "rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";

/** Rename each household owner tag (본인/배우자/자녀/공동). */
export default function OwnerNamesPanel() {
  const { settings, save } = useSettings();
  const { showToast } = useAssetModal();
  const [names, setNames] = useState<Record<AssetOwner, string>>(settings.ownerNames);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when settings load in after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNames(settings.ownerNames);
  }, [settings.ownerNames]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const cleaned = { ...names };
      for (const owner of ASSET_OWNERS) {
        if (!cleaned[owner]?.trim()) cleaned[owner] = ASSET_OWNER_LABEL[owner];
      }
      await save({ ...settings, ownerNames: cleaned });
      showToast("소유자 이름이 저장되었습니다.");
    } catch {
      showToast("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">소유자 이름</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        자산·배당의 소유자 태그에 표시되는 이름입니다. 부부·자녀의 실제 이름으로 바꿀 수 있으며,
        자녀 항목을 쓰지 않으면 비워둬도 됩니다 (기본 이름으로 표시).
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ASSET_OWNERS.map((owner) => (
          <label key={owner} className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: OWNER_COLOR[owner] }}
              />
              {ASSET_OWNER_LABEL[owner]} 기본
            </span>
            <input
              type="text"
              value={names[owner] ?? ""}
              onChange={(event) => setNames((prev) => ({ ...prev, [owner]: event.target.value }))}
              placeholder={ASSET_OWNER_LABEL[owner]}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="mt-4 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        {isSaving ? "저장 중..." : "저장"}
      </button>
    </section>
  );
}
