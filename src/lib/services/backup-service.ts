import "server-only";
import { Asset } from "@/lib/models/asset";
import { DividendRecord } from "@/lib/models/dividend";
import { PortfolioSnapshot } from "@/lib/models/snapshot";
import { AppSettings, normalizeSettings } from "@/lib/models/settings";
import { isValidAssetInput } from "@/lib/models/validate-asset-input";
import { isValidDividendInput } from "@/lib/models/dividend";
import {
  getAssetRepository,
  getDividendRepository,
  getSettingsRepository,
  getSnapshotRepository,
} from "@/lib/repositories";

const BACKUP_VERSION = 1;

export interface BackupFile {
  app: "nexus";
  version: number;
  exportedAt: string;
  assets: Asset[];
  dividends: DividendRecord[];
  snapshots: PortfolioSnapshot[];
  settings: AppSettings;
}

export async function exportBackup(): Promise<BackupFile> {
  const [assets, dividends, snapshots, settings] = await Promise.all([
    getAssetRepository().list(),
    getDividendRepository().list(),
    getSnapshotRepository().list(),
    getSettingsRepository().get(),
  ]);
  return {
    app: "nexus",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    assets,
    dividends,
    snapshots,
    settings,
  };
}

export interface ImportResult {
  assets: number;
  dividends: number;
  snapshots: number;
}

function isBackupString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Validate a parsed backup object, restoring only if every record checks out. */
export async function importBackup(data: unknown): Promise<ImportResult> {
  if (!data || typeof data !== "object") {
    throw new Error("백업 파일 형식이 올바르지 않습니다.");
  }
  const backup = data as Record<string, unknown>;
  if (backup.app !== "nexus") {
    throw new Error("NEXUS 백업 파일이 아닙니다.");
  }
  if (typeof backup.version !== "number" || backup.version > BACKUP_VERSION) {
    throw new Error("지원하지 않는 백업 버전입니다.");
  }

  const assets = Array.isArray(backup.assets) ? backup.assets : [];
  const dividends = Array.isArray(backup.dividends) ? backup.dividends : [];
  const snapshots = Array.isArray(backup.snapshots) ? backup.snapshots : [];

  for (const asset of assets) {
    const a = asset as Record<string, unknown>;
    if (!isBackupString(a.id) || !isBackupString(a.createdAt) || !isValidAssetInput(asset)) {
      throw new Error("백업의 자산 데이터가 손상되었습니다.");
    }
  }
  for (const dividend of dividends) {
    const d = dividend as Record<string, unknown>;
    if (!isBackupString(d.id) || !isBackupString(d.createdAt) || !isValidDividendInput(dividend)) {
      throw new Error("백업의 배당 데이터가 손상되었습니다.");
    }
  }
  for (const snapshot of snapshots) {
    const s = snapshot as Record<string, unknown>;
    if (
      !isBackupString(s.date) ||
      typeof s.totalValuation !== "number" ||
      typeof s.totalPrincipal !== "number"
    ) {
      throw new Error("백업의 히스토리 데이터가 손상되었습니다.");
    }
  }

  await getAssetRepository().replaceAll(assets as Asset[]);
  await getDividendRepository().replaceAll(dividends as DividendRecord[]);
  await getSnapshotRepository().replaceAll(snapshots as PortfolioSnapshot[]);
  // Older backups may omit settings; normalizeSettings fills in defaults.
  if (backup.settings !== undefined) {
    await getSettingsRepository().save(normalizeSettings(backup.settings));
  }

  return { assets: assets.length, dividends: dividends.length, snapshots: snapshots.length };
}
