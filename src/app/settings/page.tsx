"use client";

import AppearancePanel from "@/components/settings/AppearancePanel";
import OwnerNamesPanel from "@/components/settings/OwnerNamesPanel";
import TargetAllocationPanel from "@/components/settings/TargetAllocationPanel";
import BackupPanel from "@/components/settings/BackupPanel";
import { useT } from "@/lib/i18n/locale-context";

export default function SettingsPage() {
  const t = useT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("설정")}</h1>
      <div className="flex max-w-2xl flex-col gap-6">
        <AppearancePanel />
        <TargetAllocationPanel />
        <OwnerNamesPanel />
        <BackupPanel />
      </div>
    </div>
  );
}
