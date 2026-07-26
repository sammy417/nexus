import AppearancePanel from "@/components/settings/AppearancePanel";
import OwnerNamesPanel from "@/components/settings/OwnerNamesPanel";
import BackupPanel from "@/components/settings/BackupPanel";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">설정</h1>
      <div className="flex max-w-2xl flex-col gap-6">
        <AppearancePanel />
        <OwnerNamesPanel />
        <BackupPanel />
      </div>
    </div>
  );
}
