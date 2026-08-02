/**
 * English translations keyed by the Korean source string. Korean is the app's
 * source language, so a missing key falls back to the Korean text — the UI
 * never breaks, it just shows Korean for anything not yet translated.
 *
 * `{name}`-style placeholders are filled by the `t(key, params)` call.
 */
export const EN: Record<string, string> = {
  // --- Navigation / sidebar ---
  대시보드: "Dashboard",
  포트폴리오: "Portfolio",
  분석: "Analytics",
  배당: "Dividends",
  설정: "Settings",
  "자산 추가": "Add asset",
  "다크 모드로 전환": "Switch to dark mode",
  "라이트 모드로 전환": "Switch to light mode",
  "금액 숨기기": "Hide amounts",
  "금액 표시": "Show amounts",
  "초기 데이터로 재설정 (테스트용)": "Reset to demo data (for testing)",
  "테스트를 위해 자산 현황을 초기 더미 데이터로 되돌릴까요?":
    "Reset your holdings to the initial demo data?",
  "초기 데이터로 재설정되었습니다.": "Reset to demo data.",
  한국어: "한국어",
  English: "English",
  "언어 전환": "Switch language",

  // --- Common controls ---
  전체: "All",
  원화: "KRW",
  달러: "USD",
  "표시 통화 전환": "Toggle display currency",
  시세: "Prices",
  "시세 갱신 중...": "Refreshing…",
  "시세를 갱신했습니다.": "Prices updated.",
  "시세 갱신에 실패했습니다.": "Failed to refresh prices.",
  "{time} 갱신": "Updated {time}",
  불러오는_중: "Loading…",

  // --- Currency / money ---
  "₩ 원화": "₩ KRW",
  "$ 달러": "$ USD",

  // --- Dashboard ---
  "총 자산 평가 금액": "Total valuation",
  "총 투자 원금": "Total principal",
  "평가 손익": "Unrealized P&L",
  "자산 구성": "Allocation",
  "평가 금액 합계": "Total valuation",
  "총 자산 추이": "Net worth trend",
  "총 자산 추이 및 분석 전체": "Net worth trend & analytics",
  "소유자별 구성": "By owner",
  "전체(합산) 자산 기준": "Across all combined assets",
  "보유 자산": "Holdings",
  전체보기: "See all",
  "표로 보기": "View as table",
  "추이를 표시할 데이터가 아직 부족합니다.": "Not enough data to show a trend yet.",
  "전일 대비 {value}": "{value} vs. prev. day",
  날짜: "Date",
  "평가 금액": "Valuation",
  "투자 원금": "Principal",
  "1개월": "1M",
  "3개월": "3M",

  // --- Dashboard onboarding ---
  "NEXUS에 오신 걸 환영해요": "Welcome to NEXUS",
  "우리 집 자산을 한 곳에 모아 관리하는 첫걸음이에요. 첫 자산을 추가하면 대시보드·분석·배당 화면이 자동으로 채워집니다.":
    "The first step to managing your household assets in one place. Add your first asset and the dashboard, analytics, and dividends views fill in automatically.",
  "첫 자산 추가하기": "Add your first asset",
  "다양한 자산 한눈에": "All your assets at a glance",
  "주식(국내·해외)·채권·현금·연금·기타까지 보유 현황을 한 곳에서 관리해요.":
    "Track stocks (domestic & foreign), bonds, cash, pensions, and more in one place.",
  "가족별로 분리 관리": "Manage by family member",
  "본인·배우자·자녀·공동 소유자 태그로 나누고, 전체 합산도 함께 볼 수 있어요.":
    "Split by owner tags (self, spouse, child, joint) and still see the combined total.",
  "추이와 수익률 분석": "Trends & returns",
  "일별 스냅샷으로 총자산 추이·기간 수익률·최대 낙폭을 자동으로 계산해요.":
    "Daily snapshots auto-compute your net-worth trend, period returns, and max drawdown.",
  "배당 기록과 예측": "Dividend tracking & forecast",
  "받은 배당을 기록하고, 보유 종목의 예상 연간 배당까지 자동으로 보여줘요.":
    "Log received dividends and see estimated annual dividends for your holdings.",

  // --- Portfolio ---
  "보유 자산 {count}개": "{count} holdings",
  "같은 종목 합산": "Merge same tickers",
  "같은 티커의 주식을 하나로 합쳐 표시합니다 (수량 합산, 평단가는 가중평균). 합산 행은 수정/삭제할 수 없으며, 개별 수정은 합산을 해제한 뒤 진행하세요.":
    "Merges stocks with the same ticker into one row (summed quantity, weighted average cost). Merged rows can't be edited/deleted — turn merging off to edit individually.",
  "같은 티커의 주식을 하나로 합쳐 분석합니다 (수량 합산, 평단가는 가중평균). 합산 종목은 수정할 수 없으며, 개별 수정은 합산을 해제한 뒤 진행하세요.":
    "Analyzes stocks with the same ticker as one (summed quantity, weighted average cost). Merged holdings can't be edited — turn merging off to edit individually.",
  자산: "Asset",
  종류: "Type",
  "보유 수량": "Quantity",
  비중: "Weight",
  "아직 등록한 자산이 없어요": "No assets yet",
  "첫 자산을 추가하면 카테고리별로 정리된 보유 현황과 비중 차트가 여기에 표시됩니다.":
    "Add your first asset to see holdings organized by category with weight charts here.",
  "{owner} 명의의 자산이 없어요": "No assets owned by {owner}",
  "자산이 없어요": "No assets",
  "상단의 소유자 필터를 바꾸거나 새 자산을 추가해 보세요.":
    "Change the owner filter above or add a new asset.",
  "비중 Top {n}": "Top {n} by weight",
  합산: "Merged",
  "{count}건 합산": "{count} merged",
  "{name} 자산을 삭제할까요?": "Delete {name}?",
  "{name} 자산이 삭제되었습니다.": "{name} deleted.",
  "삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.": "Delete failed. Please try again shortly.",
  "{name} 수정": "Edit {name}",
  "{name} 삭제": "Delete {name}",
  "접기": "Collapse",
  "전체보기 ({count}개 더)": "Show all ({count} more)",
  "더보기 ({count}개 더)": "Show more ({count} more)",

  // --- News ---
  뉴스: "News",
  "최근 24시간 · 반도체·AI 등 비중 큰 섹터와 보유 종목 중심": "Last 24h · focused on heavy sectors (semiconductors, AI) & your holdings",
  "표시할 뉴스가 없어요": "No news to show",
  "최근 24시간 이내에 반도체·AI 등 비중 큰 섹터나 보유 종목과 관련된 뉴스를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.":
    "Couldn't find news from the last 24 hours about your heavy sectors (semiconductors, AI, etc.) or holdings. Please try again shortly.",
  "일부 출처를 불러오지 못했습니다: {sources}": "Some sources couldn't be loaded: {sources}",
  "방금 전": "just now",
  "{n}분 전": "{n}m ago",
  "{n}시간 전": "{n}h ago",

  // --- Analytics ---
  "{scope} 수익률 (원금 대비)": "{scope} return (vs. principal)",
  "최근 1개월": "Last 1 month",
  "최근 3개월": "Last 3 months",
  "최대 낙폭 (전체 기간)": "Max drawdown (all time)",
  "소유자별 성과": "Performance by owner",
  "현재 보유 자산 기준 · 소유자별 평가금액과 원금 대비 손익":
    "Current holdings · valuation and P&L per owner",
  "월별 수익률": "Monthly returns",
  "각 월 말 평가 금액의 전월 대비 변화율": "Month-end valuation change vs. previous month",
  "비교할 월별 데이터가 아직 부족합니다.": "Not enough monthly data to compare yet.",
  "카테고리별 평가 손익": "P&L by category",
  "현재 보유 자산의 원금 대비 손익 (실현 손익 미포함)":
    "Current holdings' P&L vs. principal (excludes realized)",
  "원금 대비 성장": "Growth vs. principal",
  "전체 기간의 평가 금액과 투자 원금 추이": "Valuation and principal over the full period",
  "{scope} 기준으로 집계했습니다.": "Aggregated for {scope}.",
  " 소유자별 기록이 없는 과거 구간은 현재 비중으로 추정한 값입니다.":
    " Past periods without per-owner records are estimated using the current share.",
  "분석할 자산이 아직 없어요": "Nothing to analyze yet",
  "자산을 추가하면 기간 수익률·최대 낙폭·카테고리별 손익과 성장 추이를 자동으로 계산해 보여드려요.":
    "Add assets to auto-compute period returns, max drawdown, category P&L, and growth trends.",

  // --- Dividends ---
  "배당 추가": "Add dividend",
  "올해 누적 배당": "Dividends this year",
  "최근 12개월": "Last 12 months",
  "월 평균 (최근 12개월)": "Monthly avg (last 12 mo.)",
  "이번 달": "This month",
  "예상 연간 배당": "Estimated annual dividends",
  "보유 종목의 최근 12개월 배당 이력 × 현재 보유 수량 · 세전 추정":
    "Holdings' last-12-mo. dividends × current quantity · pre-tax estimate",
  "배당수익률 {pct}": "Yield {pct}",
  "세후 약 {amount}": "After tax ≈ {amount}",
  "(원천징수 {pct} 가정)": "(assuming {pct} withholding)",
  종목: "Security",
  "주당 배당 (12개월)": "Per-share (12 mo.)",
  "예상 연간 수령액": "Est. annual amount",
  "시가 배당률": "Yield on price",
  "배당 이력이 조회된 보유 종목이 없습니다.": "No holdings with dividend history found.",
  "배당 이력이 없는 종목 {count}개는 제외했습니다. ":
    "Excluded {count} holdings without dividend history. ",
  "조회 실패: {tickers}": "Lookup failed: {tickers}",
  "다가오는 배당": "Upcoming dividends",
  "과거 지급 주기 기반 추정 — 확정 공시가 아닙니다":
    "Estimated from past payout cadence — not an official announcement",
  "추정할 배당 일정이 없습니다.": "No dividend schedule to estimate.",
  월배당: "Monthly",
  분기: "Quarterly",
  반기: "Semiannual",
  연간: "Annual",
  "받은 배당 기록 제안": "Suggested dividend records",
  "외부 배당 이력에서 아직 기록하지 않은 지급 건입니다 (현재 보유 수량·세전 기준 추정) — 실제 수령한 건만 추가하세요.":
    "Payouts from external history you haven't logged yet (estimated at current quantity, pre-tax) — add only the ones you actually received.",
  기록: "Log",
  "월별 배당": "Monthly dividends",
  "최근 12개월 수령액 합계": "Total received over the last 12 months",
  "아직 기록된 배당이 없습니다.": "No dividends recorded yet.",
  "아직 기록된 배당이 없어요": "No dividends recorded yet",
  "받은 배당을 추가하면 월별 추이와 통계가 채워집니다. 보유 종목의 배당 이력은 위 '받은 배당 기록 제안'에서 한 번에 추가할 수도 있어요.":
    "Add received dividends to fill the monthly trend and stats. You can also bulk-add your holdings' history from 'Suggested dividend records' above.",
  "{owner} 배당 기록이 없어요": "No dividend records for {owner}",
  "배당 기록이 없어요": "No dividend records",
  "상단의 소유자 필터를 바꾸거나 새 배당을 추가해 보세요.":
    "Change the owner filter above or add a new dividend.",
  "{year}년 {month}월 {count}건": "{count} in {month}/{year}",
  "{date} {name} 배당 기록을 삭제할까요?": "Delete the {name} dividend from {date}?",
  "배당 기록이 삭제되었습니다.": "Dividend record deleted.",
  "{name} 배당이 기록되었습니다.": "Logged dividend for {name}.",
  "{name} 배당 기록이 추가되었습니다.": "Added dividend record for {name}.",
  "{name} 배당 기록 삭제": "Delete {name} dividend record",
  "배당 정보를 조회하는 중...": "Fetching dividend info…",
  "~{month}월 {day}일 예상": "~{month}/{day} expected",

  // --- Settings ---
  "화면 테마": "Appearance",
  "밝기 모드를 선택하세요. 어두운 곳에서는 눈이 편한 다크 모드를 권장합니다. ‘시스템’은 기기의 다크 모드 설정을 자동으로 따릅니다.":
    "Choose a brightness mode. Dark mode is easier on the eyes in low light. ‘System’ follows your device's dark-mode setting automatically.",
  시스템: "System",
  라이트: "Light",
  다크: "Dark",
  "기기 설정을 따라요": "Follows your device",
  "밝은 화면": "Bright screen",
  "눈이 편한 어두운 화면": "Dark, easy on the eyes",
  "소유자 태그": "Owner tags",
  "자산·배당에 표시되는 소유자의 이름과 색상입니다. 부부·자녀의 실제 이름과 원하는 색으로 바꿀 수 있으며, 색은 배지·도넛·범례에 함께 반영됩니다. 기본색은 라이트·다크 모드 모두에서 잘 보이도록 고른 값입니다.":
    "Names and colors for the owner tags shown on assets and dividends. Use real names and any colors you like — the colors apply to badges, donuts, and legends. The defaults are chosen to read well in both light and dark mode.",
  저장: "Save",
  "저장 중...": "Saving…",
  "소유자 설정이 저장되었습니다.": "Owner settings saved.",
  "{owner} 기본색으로": "Reset {owner} to default color",
  "{owner} 색상": "{owner} color",
  "{label} 미리보기": "{label} preview",
  "데이터 백업": "Data backup",
  "모든 자산·배당·자산 추이 기록을 JSON 파일 하나로 내보내고, 필요할 때 다시 불러올 수 있습니다. 파일을 안전한 곳(클라우드 드라이브 등)에 보관하면 데이터가 초기화돼도 복원할 수 있습니다.":
    "Export all assets, dividends, and history to a single JSON file and re-import it later. Keep the file somewhere safe (a cloud drive, etc.) to restore even if the data resets.",
  "백업 내보내기": "Export backup",
  "백업 가져오기": "Import backup",
  "내보내는 중...": "Exporting…",
  "가져오는 중...": "Importing…",
  "백업 파일을 내보냈습니다.": "Backup file exported.",
  "백업을 복원했습니다. 화면을 새로고침합니다.": "Backup restored. Refreshing…",
  "가져오기는 현재 데이터를 전부 대체합니다 (병합이 아닙니다). 되돌릴 수 없으니 필요하면 먼저 현재 상태를 내보내 두세요.":
    "Importing replaces all current data (not a merge). It can't be undone, so export your current state first if needed.",
  "현재 데이터를 모두 대체합니다. 계속할까요?": "This replaces all current data. Continue?",

  // --- Asset form ---
  "자산 수정": "Edit asset",
  "표시 금액 통화": "Display currency",
  소유자: "Owner",
  종목명: "Security name",
  "예: 삼성전자": "e.g. Samsung Electronics",
  "티커 (선택)": "Ticker (optional)",
  "시장 (선택)": "Market (optional)",
  "평단가 (선택)": "Avg. price (optional)",
  "현재가는 입력하지 않습니다 — 저장 시 티커로 자동 조회해 선택한 통화로 저장합니다 (국내 6자리 코드·미국 티커 지원). 티커가 없거나 조회에 실패하면 평단가로 대신 계산합니다.":
    "No need to enter the current price — on save it's fetched by ticker and stored in the selected currency (6-digit KR codes and US tickers supported). Without a ticker (or if lookup fails) the average price is used instead.",
  추가하기: "Add",
  수정하기: "Save changes",
  잔액: "Balance",
  "표면 금리 (선택)": "Coupon rate (optional)",
  "만기일 (선택)": "Maturity date (optional)",
  "계좌 유형 (선택)": "Account type (optional)",
  "카테고리 (선택)": "Category (optional)",
  "매입가": "Purchase price",
  "현재 평가액": "Current value",
  "납입 원금": "Contributions",

  // --- Asset type labels ---
  주식: "Stocks",
  채권: "Bonds",
  현금: "Cash",
  연금: "Pension",
  기타: "Other",

  // --- Portfolio category labels ---
  한국주식: "KR stocks",
  해외주식: "Foreign stocks",

  // --- Loading ---
  "불러오는 중...": "Loading…",

  // --- Misc (accumulated) ---
  "보유 자산이 없어요": "No holdings yet",
  "환율 조회 실패 · 기본값 ": "FX lookup failed · default ",
  "갱신 중": "Refreshing",
  "시세 새로고침": "Refresh prices",
  "시세를 조회할 주식이 없습니다.": "No stocks to look up.",
  "시세 갱신: {n}개 업데이트{failNote}": "Prices: {n} updated{failNote}",
  " · 실패 {n}건": " · {n} failed",
  "시세 갱신에 실패했습니다. 잠시 후 다시 시도해 주세요.":
    "Failed to refresh prices. Please try again shortly.",
  "표면 {rate}%": "Coupon {rate}%",
  "만기 {date}": "Maturity {date}",
  "{n}주": "{n} sh",
  "{label} 기준 정렬": "Sort by {label}",
  "수정/삭제": "Edit / delete",
  "기준으로 집계했습니다.": "· aggregated view.",
  "배당 이력에서 추가": "From dividend history",
  기본색으로: "Reset to default color",

  // --- Backup ---
  "JSON 파일을 읽을 수 없습니다.": "Couldn't read the JSON file.",
  "복원에 실패했습니다.": "Restore failed.",
  "복원 완료: 자산 {assets}건 · 배당 {dividends}건":
    "Restored: {assets} assets · {dividends} dividends",
  "복원 중...": "Restoring…",
  "가져오기를 진행하면 현재 데이터가 백업 파일의 내용으로 완전히 대체됩니다. 계속할까요?":
    "Importing will completely replace your current data with the backup file. Continue?",
  "⚠️ 가져오기는 현재 데이터를 전부 대체합니다 (병합이 아닙니다). 되돌릴 수 없으니 필요하면 먼저 현재 상태를 내보내 두세요.":
    "⚠️ Import replaces ALL current data (not a merge). It can't be undone, so export your current state first if needed.",

  // --- Asset form ---
  닫기: "Close",
  삭제: "Delete",
  자산명: "Asset name",
  "현재가 조회 중...": "Fetching price…",
  "예: 국고채 3년": "e.g. 3-yr Treasury bond",
  "예: IRP 계좌 (미래에셋)": "e.g. IRP account (Mirae Asset)",
  "예: 자가 아파트, 금 현물": "e.g. home, physical gold",
  "예: 입출금 통장": "e.g. checking account",
  "예: 부동산, 금, 암호화폐": "e.g. real estate, gold, crypto",
  "예: DC, IRP, 연금저축": "e.g. DC, IRP, pension savings",
  "예: 005930, AAPL": "e.g. 005930, AAPL",
  "예: KOSPI, KOSDAQ, NASDAQ": "e.g. KOSPI, KOSDAQ, NASDAQ",
  "예: 3.25": "e.g. 3.25",
  "미입력 시 납입 원금과 동일": "Defaults to contributions",
  "미입력 시 매입 금액과 동일": "Defaults to purchase price",
  "표면금리 % (선택)": "Coupon rate % (optional)",
  금액: "Amount",
  "현재 저장된 현재가:": "Current stored price:",
  "이름을 입력해 주세요.": "Please enter a name.",
  "보유 수량을 올바르게 입력해 주세요.": "Please enter a valid quantity.",
  "평단가를 올바르게 입력해 주세요.": "Please enter a valid average price.",
  "현재가 조회에 실패했습니다. 티커를 확인하거나 평단가를 입력해 주세요.":
    "Price lookup failed. Check the ticker or enter an average price.",
  "티커(현재가 자동 조회) 또는 평단가 중 하나는 입력해 주세요.":
    "Enter either a ticker (auto price lookup) or an average price.",
  "현재가 조회에 실패해 입력된 값으로 대신 계산했습니다.":
    "Price lookup failed — used the entered value instead.",
  "매입 금액을 올바르게 입력해 주세요.": "Please enter a valid purchase amount.",
  "현재 평가 금액을 올바르게 입력해 주세요.": "Please enter a valid current value.",
  "표면금리를 올바르게 입력해 주세요.": "Please enter a valid coupon rate.",
  "납입 원금을 올바르게 입력해 주세요.": "Please enter valid contributions.",
  "금액을 올바르게 입력해 주세요.": "Please enter a valid amount.",
  "{name} 정보가 수정되었습니다.": "Updated {name}.",
  "{name} 자산이 추가되었습니다.": "Added {name}.",
  "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.": "Save failed. Please try again shortly.",

  // --- Dividend form ---
  "배당 기록 추가": "Add dividend record",
  "종목/이름": "Security / name",
  "금액 (세후)": "Amount (after tax)",
  지급일: "Pay date",
  "메모 (선택)": "Memo (optional)",
  "예: 분기 배당": "e.g. quarterly dividend",
  "종목/이름을 입력해 주세요.": "Please enter a security or name.",
  "지급일을 선택해 주세요.": "Please choose a pay date.",

  // --- Stock analysis ---
  섹터: "Sector",
  "섹터 (선택)": "Sector (optional)",
  "세부 섹터 (선택)": "Sub-sector (optional)",
  "예: 반도체, AI SW": "e.g. Semiconductors, AI SW",
  "자동 조회 (티커 기준)": "Auto (from ticker)",
  "주식 평가 금액": "Stock valuation",
  "보유 종목": "Holdings",
  "{count}종목": "{count} stocks",
  "상승 {gainers} · 하락 {losers}": "{gainers} up · {losers} down",
  "분산 점수": "Diversification",
  "실질 {n}종목": "Effective {n}",
  "섹터 구성": "By sector",
  "보유 주식 평가금액 기준": "By stock valuation",
  "보유 주식 평가금액 기준 · 세부 섹터까지 구분": "By stock valuation · split by sub-sector",
  "섹터별 주식 구성 도넛 차트": "Stock allocation by sector donut chart",
  "지역 구성": "By region",
  "통화 노출": "Currency exposure",
  국내: "Domestic",
  해외: "Foreign",
  집중도: "Concentration",
  "상위 종목 쏠림과 분산 정도": "Top-holding skew and diversification",
  "Top 5 비중": "Top 5 weight",
  "실질 종목 수": "Effective holdings",
  "상위 5개 종목에 집중되어 있습니다. 분산을 검토해 보세요.":
    "Concentrated in the top 5 holdings — consider diversifying.",
  "손익 기여": "P&L contribution",
  "수익 기여 1위": "Top gainer",
  "손실 기여 1위": "Top loser",
  "손익 기여를 표시할 데이터가 부족합니다.": "Not enough data for P&L contribution.",
  "아직 등록한 주식이 없어요": "No stocks yet",
  "주식 자산이 없어요": "No stock holdings",
  "{owner} 주식 자산이 없어요": "No stock holdings for {owner}",
  "주식을 추가하면 섹터·지역 구성과 종목별 성과·집중도 분석이 여기에 표시됩니다.":
    "Add stocks to see sector/region breakdowns and per-stock performance & concentration here.",
  "주식 추가": "Add stock",
  "밸류에이션 비교": "Valuation comparison",
  "외부 시세 제공사 기준 · PER·PBR·시가총액·배당수익률·52주 위치":
    "Per external data provider · P/E, P/B, market cap, yield, 52-week position",
  시가총액: "Market cap",
  배당수익률: "Dividend yield",
  "52주 위치": "52-week position",
  "티커가 입력된 주식이 없어 조회할 수 없습니다.": "No stocks with a ticker to look up.",
  "밸류에이션 데이터를 불러오지 못했습니다.": "Couldn't load valuation data.",
  "리스크 분석": "Risk analysis",
  "최근 1년 일간 시세 기준 · 변동성은 연율화":
    "Based on the last year of daily prices · volatility annualized",
  "변동성 (연율)": "Volatility (ann.)",
  "1년 수익률": "1-yr return",
  "최대 낙폭": "Max drawdown",
  "시세 이력을 불러오지 못했습니다 (티커 필요).":
    "Couldn't load price history (ticker required).",
  상관관계: "Correlation",
  "일간 수익률 상관계수 · 빨강=동조, 파랑=역행 (공통 {days}일)":
    "Daily-return correlation · red = move together, blue = inverse ({days} common days)",
  수정: "Edit",
  수량: "Quantity",
  평단가: "Avg. price",
  현재가: "Current price",
  "가격 차트": "Price chart",
  "차트 데이터가 없습니다.": "No chart data.",
  지표: "Metrics",
  "1년": "1Y",

  // --- Sector labels ---
  기술: "Technology",
  금융: "Financials",
  헬스케어: "Healthcare",
  소비재: "Consumer",
  산업재: "Industrials",
  에너지: "Energy",
  소재: "Materials",
  통신: "Communication",
  유틸리티: "Utilities",
  부동산: "Real Estate",
  "ETF·펀드": "ETF · Fund",
  미분류: "Unclassified",
};
