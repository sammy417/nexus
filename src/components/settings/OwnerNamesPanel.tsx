"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ASSET_OWNERS, ASSET_OWNER_LABEL, hexWithAlpha } from "@/lib/models/asset-owner";
import { DEFAULT_SETTINGS } from "@/lib/models/settings";
import { AssetOwner } from "@/lib/models/asset";
import { useSettings } from "@/lib/settings-context";
import { useAssetModal } from "@/lib/asset-modal-context";

const inputClass =
  "min-w-0 flex-1 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:ring-white/10";

/** Rename each household owner tag and pick its color (badge/dot/donut). */
export default function OwnerNamesPanel() {
  const { settings, save } = useSettings();
  const { showToast } = useAssetModal();
  const [names, setNames] = useState<Record<AssetOwner, string>>(settings.ownerNames);
  const [colors, setColors] = useState<Record<AssetOwner, string>>(settings.ownerColors);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when settings load in after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNames(settings.ownerNames);
    setColors(settings.ownerColors);
  }, [settings.ownerNames, settings.ownerColors]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const cleanedNames = { ...names };
      for (const owner of ASSET_OWNERS) {
        if (!cleanedNames[owner]?.trim()) cleanedNames[owner] = ASSET_OWNER_LABEL[owner];
      }
      await save({ ...settings, ownerNames: cleanedNames, ownerColors: colors });
      showToast("소유자 설정이 저장되었습니다.");
    } catch {
      showToast("저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-card-dark">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">소유자 태그</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        자산·배당에 표시되는 소유자의 이름과 색상입니다. 부부·자녀의 실제 이름과 원하는 색으로 바꿀 수
        있으며, 색은 배지·도넛·범례에 함께 반영됩니다. 기본색은 라이트·다크 모드 모두에서 잘 보이도록
        고른 값입니다.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {ASSET_OWNERS.map((owner) => {
          const label = names[owner]?.trim() || ASSET_OWNER_LABEL[owner];
          const color = colors[owner] ?? DEFAULT_SETTINGS.ownerColors[owner];
          const isDefaultColor =
            color.toLowerCase() === DEFAULT_SETTINGS.ownerColors[owner].toLowerCase();
          return (
            <div key={owner} className="flex items-center gap-2.5">
              <input
                type="color"
                aria-label={`${ASSET_OWNER_LABEL[owner]} 색상`}
                value={color}
                onChange={(event) =>
                  setColors((prev) => ({ ...prev, [owner]: event.target.value }))
                }
                className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-border bg-transparent p-1 dark:border-border-dark [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
              />
              <input
                type="text"
                value={names[owner] ?? ""}
                onChange={(event) =>
                  setNames((prev) => ({ ...prev, [owner]: event.target.value }))
                }
                placeholder={ASSET_OWNER_LABEL[owner]}
                className={inputClass}
              />
              <span
                className="w-16 shrink-0 truncate rounded px-1.5 py-1 text-center text-[11px] font-semibold"
                style={{ color, backgroundColor: hexWithAlpha(color, 0.12) }}
                title={`${label} 미리보기`}
              >
                {label}
              </span>
              <button
                type="button"
                aria-label={`${ASSET_OWNER_LABEL[owner]} 기본색으로`}
                title="기본색으로"
                disabled={isDefaultColor}
                onClick={() =>
                  setColors((prev) => ({ ...prev, [owner]: DEFAULT_SETTINGS.ownerColors[owner] }))
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent dark:text-gray-500 dark:hover:bg-white/10"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          );
        })}
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
