"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Newspaper } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import DataErrorNotice from "@/components/common/DataErrorNotice";
import NewsSkeleton from "@/components/skeletons/NewsSkeleton";
import { useNews } from "@/lib/hooks/use-news";
import { useT, type TFn } from "@/lib/i18n/locale-context";
import { newsSourceColor, type NewsItem } from "@/lib/models/news";
import { hexWithAlpha } from "@/lib/models/asset-owner";

/** Headlines shown initially, and how many each 더보기 reveals. */
const STEP = 10;

function relativeTime(iso: string, t: TFn): string {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (minutes < 1) return t("방금 전");
  if (minutes < 60) return t("{n}분 전", { n: minutes });
  return t("{n}시간 전", { n: Math.floor(minutes / 60) });
}

function NewsRow({ item, t }: { item: NewsItem; t: TFn }) {
  const color = newsSourceColor(item.source);
  return (
    <li>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start justify-between gap-4 border-l-2 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
        style={{ borderLeftColor: hexWithAlpha(color, 0.5) }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ color, backgroundColor: hexWithAlpha(color, 0.12) }}
            >
              {item.source}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {relativeTime(item.publishedAt, t)}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-gray-900 group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-white">
            {item.title}
          </p>
          {item.summary && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              {item.summary}
            </p>
          )}
        </div>
        <ExternalLink
          size={15}
          className="mt-1 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400"
        />
      </a>
    </li>
  );
}

export default function NewsPage() {
  const { news, isLoading, hasError } = useNews();
  const t = useT();
  const [visible, setVisible] = useState(STEP);

  if (isLoading) return <NewsSkeleton />;

  const items = news?.items ?? [];
  const failed = news?.failedSources ?? [];

  const header = (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("뉴스")}</h1>
      <p className="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
        {t("최근 24시간 · 반도체·AI 등 비중 큰 섹터와 보유 종목 중심")}
      </p>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        {hasError ? (
          <DataErrorNotice message="뉴스를 불러오지 못했습니다 — 네트워크나 언론사 RSS 상태를 확인한 뒤 새로고침해 주세요." />
        ) : (
          <EmptyState
            icon={Newspaper}
            title={t("표시할 뉴스가 없어요")}
            description={t(
              "최근 24시간 이내에 반도체·AI 등 비중 큰 섹터나 보유 종목과 관련된 뉴스를 찾지 못했습니다. 잠시 후 다시 시도해 주세요."
            )}
          />
        )}
      </div>
    );
  }

  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;
  const isExpanded = visible > STEP;

  return (
    <div className="flex flex-col gap-6">
      {header}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-card-dark">
        <ul className="divide-y divide-gray-50 dark:divide-white/5">
          {shown.map((item) => (
            <NewsRow key={item.id} item={item} t={t} />
          ))}
        </ul>

        {(hasMore || isExpanded) && (
          <button
            type="button"
            onClick={() =>
              hasMore ? setVisible((v) => Math.min(v + STEP, items.length)) : setVisible(STEP)
            }
            className="flex w-full items-center justify-center gap-1 border-t border-border py-3 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-border-dark dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
          >
            {hasMore
              ? t("더보기 ({count}개 더)", { count: Math.min(STEP, items.length - visible) })
              : t("접기")}
            <ChevronDown size={14} className={`transition-transform ${hasMore ? "" : "rotate-180"}`} />
          </button>
        )}
      </section>

      {failed.length > 0 && (
        <p className="px-1 text-[11px] text-gray-400 dark:text-gray-500">
          {t("일부 출처를 불러오지 못했습니다: {sources}", { sources: failed.join(", ") })}
        </p>
      )}
    </div>
  );
}
