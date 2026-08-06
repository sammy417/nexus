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

  // --- External data failures ---
  "배당 예측을 불러오지 못했습니다 — 네트워크나 시세 제공사 상태를 확인한 뒤 새로고침해 주세요.":
    "Couldn't load the dividend forecast — check your network or the data provider, then refresh.",
  "배당 예측을 불러오지 못해 연말 예상에 추가 배당이 반영되지 않았습니다 — 실제 금액은 이보다 클 수 있습니다.":
    "The dividend forecast failed to load, so the year-end projection excludes upcoming payouts — the real figure may be higher.",
  "배당 예측을 불러오지 못해 배당·금융소득 관련 항목이 빠져 있을 수 있습니다.":
    "The dividend forecast failed to load, so dividend and financial-income items may be missing.",
  "뉴스를 불러오지 못했습니다 — 네트워크나 언론사 RSS 상태를 확인한 뒤 새로고침해 주세요.":
    "Couldn't load the news — check your network or the outlets' RSS feeds, then refresh.",

  // --- Action center ---
  "오늘 챙길 것": "What to handle today",
  "{count}건": "{count} items",
  "지금 조치할 일이 없어요": "Nothing needs action right now",
  "목표 배분·세금 기준·배당 일정 모두 여유가 있습니다.":
    "Target allocation, tax thresholds, and dividend timing all have room.",
  "{category} 비중이 목표보다 {drift}%p 높아요 — {amount} 매도 검토":
    "{category} is {drift}%p above target — consider selling {amount}",
  "{category} 비중이 목표보다 {drift}%p 낮아요 — {amount} 매수 검토":
    "{category} is {drift}%p below target — consider buying {amount}",
  "{owner} 금융소득이 기준금액을 {excess} 초과했어요 — 종합과세 대상":
    "{owner}'s financial income exceeds the threshold by {excess} — subject to comprehensive taxation",
  "{owner} 금융소득이 기준금액까지 {remaining} 남았어요":
    "{owner}'s financial income is {remaining} from the threshold",
  "{owner} 금융소득이 이대로면 연말에 기준금액을 넘길 것으로 보여요":
    "{owner}'s financial income is on track to pass the threshold by year-end",
  "{owner} 해외주식 양도세 기본공제 {exemption}가 아직 남아 있어요 — 연내 이익 실현 검토":
    "{owner} still has the {exemption} overseas capital-gains exemption unused — consider realizing gains this year",
  "{owner} 평가손실 종목 {count}개 — 연내 손실 확정으로 양도세를 줄일 수 있어요":
    "{owner} has {count} holdings at a loss — realizing them this year could cut capital-gains tax",
  "{owner} 연금 세액공제 한도 {limit}까지 연내 납입하면 환급받을 수 있어요":
    "{owner} can still contribute up to {limit} this year for a pension tax credit",
  "{name} 배당 {amount} 예상 (D-{days})": "{name} dividend of {amount} expected (D-{days})",

  // --- Tax ---
  세금: "Tax",
  "보유 현황 기준의 세금 시뮬레이션 — 실제 세액이 아닌 추정치입니다. 공제·기준금액이 개인별로 적용돼 소유자별로 나누어 계산합니다.":
    "Tax simulations based on your current holdings — estimates, not actual tax liability. Exemptions and thresholds apply per individual, so results are broken down by owner.",
  "계산할 자산·배당이 없어요": "Nothing to calculate yet",
  "주식이나 배당 기록을 추가하면 소유자별 세금 시뮬레이션이 여기에 표시됩니다.":
    "Add a stock or dividend record to see per-owner tax simulations here.",
  "공동 명의로 태그된 자산·배당은 제외했습니다 — 세법상 '공동' 귀속은 없고 실제로는 어느 한 사람 명의의 계좌이므로, 실제 명의자로 소유자를 바꾸면 그 사람 계산에 반영됩니다.":
    "Assets and dividends tagged \"joint\" are excluded — tax law has no \"joint\" attribution, and in reality the account belongs to one person. Re-tag them to the actual holder and they'll be included in that person's calculation.",
  "해외주식 양도소득세 시뮬레이터": "Overseas stock capital gains simulator",
  "보유한 해외주식이 없어 추가 매도를 시뮬레이션할 수 없습니다.":
    "No foreign stock holdings to simulate an additional sale with.",
  "연 {exemption} 기본공제는 올해 실현손익 전체 합계에 적용되고 이월되지 않습니다. 이미 매도해서 확정된 손익을 입력하고, 보유 종목을 선택해 '추가로 더 판다면'을 함께 시뮬레이션하세요 — 확정 세액이 아닌 추정치입니다.":
    "The annual {exemption} basic exemption applies to your total realized gain/loss for the year and doesn't carry over. Enter what you've already realized from sales this year, then select holdings to simulate selling more on top — an estimate, not a final tax amount.",
  "올해 실현손익 (이미 매도해서 확정된 금액, 세전)": "Realized gain/loss this year (already sold, pre-tax)",
  이익: "Gain",
  손실: "Loss",
  "올해 실현손익": "Realized this year",
  "선택 종목 추가 매도 시": "If you also sell the selected",
  "합계 손익": "Combined gain/loss",
  "남은 기본공제": "Exemption remaining",
  "과세 대상 차익": "Taxable gain",
  "과세 대상 차익 (합계)": "Taxable gain (combined)",
  "예상 세액 ({rate}%)": "Estimated tax ({rate}%)",
  "예상 세액 ({rate}%, 합계)": "Estimated tax ({rate}%, combined)",
  "추가로 아무것도 팔지 않아도 올해 실현손익만으로 이미 약 {tax}의 세금이 예상됩니다. 선택한 종목을 추가로 매도하면 세액이 약 {delta} 더 늘어납니다.":
    "Even without selling anything else, this year's realized gain/loss alone already implies about {tax} in tax. Selling the selected holdings on top adds about {delta} more.",
  "{name} 시뮬레이션에 포함": "Include {name} in the simulation",
  "손실 확정 후보": "Loss-harvest candidate",
  "금융소득종합과세 트래커": "Comprehensive financial income tracker",
  "배당·이자 합계가 기준금액을 넘으면 초과분이 다른 소득과 합산되어 종합과세됩니다(기준 이하는 {rate}% 원천징수로 종결). 기준 {threshold}":
    "If your combined dividend/interest income exceeds the threshold, the excess is combined with other income and taxed at your marginal rate (below the threshold, {rate}% withholding is final). Threshold {threshold}",
  "기록되지 않은 배당·이자 (선택, 세전)": "Dividends/interest not recorded (optional, pre-tax)",
  "지금까지 (기록 + 위 보정액)": "So far (recorded + adjustment above)",
  "연말까지 예상 (배당률·보유 수량 유지 가정)": "Projected by year-end (assuming rate & holdings unchanged)",
  "기준금액을 {excess} 초과했습니다 — 초과분은 다음 해 5월 종합소득세 신고 대상입니다.":
    "You've exceeded the threshold by {excess} — the excess is subject to comprehensive income tax filing next May.",
  "기준금액까지 {remaining} 남았습니다.": "{remaining} left before the threshold.",
  "이대로면 연말까지 기준금액을 {excess} 초과할 것으로 예상됩니다.":
    "At this pace, you're projected to exceed the threshold by {excess} by year-end.",
  "이대로면 연말까지 기준금액에 {remaining} 못 미칠 것으로 예상됩니다.":
    "At this pace, you're projected to stay {remaining} under the threshold by year-end.",
  "연금 세액공제 계산기": "Pension tax credit calculator",
  "연금저축은 연 {savingsLimit}, IRP 합산 시 연 {combinedLimit}까지 세액공제 대상입니다. 올해 납입(예정) 금액을 입력해 예상 공제액을 확인하세요.":
    "Pension savings (연금저축) alone counts up to {savingsLimit}/year; combined with IRP, up to {combinedLimit}/year. Enter this year's (planned) contributions to estimate your credit.",
  "연금저축 올해 납입액": "Pension savings (연금저축) contribution this year",
  "IRP 올해 납입액": "IRP contribution this year",
  "총급여 5,500만원(종합소득 4,500만원) 이하": "Salary ≤ 55M won (income ≤ 45M won)",
  초과: "Above that",
  "예상 세액공제 ({rate}%)": "Estimated tax credit ({rate}%)",
  "공제 인정 납입액": "Credit-eligible contribution",
  "한도까지 남은 여력": "Room left under the limit",
  "보유 연금 계좌: {names}": "Pension accounts on file: {names}",

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
  // Target allocation & rebalancing
  "목표 자산배분": "Target allocation",
  "대시보드의 리밸런싱 카드가 이 목표와 현재 비중을 비교합니다. 아래 프리셋은 일반적인 포트폴리오 구성을 참고한 출발점일 뿐이니, 투자 기간·위험 성향에 맞게 직접 조정하세요.":
    "The dashboard's rebalancing card compares your current weights against this target. The presets below are starting points based on common portfolio construction — adjust them to your own horizon and risk tolerance.",
  "목표 배분 사용": "Use target allocation",
  안정형: "Conservative",
  중립형: "Balanced",
  성장형: "Growth",
  공격형: "Aggressive",
  "주식 30 · 채권 40 — 원금 보존과 변동성 억제를 우선합니다.":
    "30 stocks · 40 bonds — prioritizes capital preservation and low volatility.",
  "주식 60 · 채권 25 — 고전적인 60/40 균형 포트폴리오에 가깝습니다.":
    "60 stocks · 25 bonds — close to the classic 60/40 balanced portfolio.",
  "주식 75 · 채권 10 — 장기 투자 기간을 전제로 수익을 우선합니다.":
    "75 stocks · 10 bonds — favors return, assuming a long horizon.",
  "주식 85 — 큰 하락을 감내할 수 있을 때만 선택하세요.":
    "85 stocks — only if you can stomach deep drawdowns.",
  "직접 설정한 배분입니다.": "Custom allocation.",
  "{category} 목표 비중": "{category} target weight",
  합계: "Total",
  "100%가 되도록 {delta}%p 조정하세요": "Adjust by {delta}%p to reach 100%",
  "허용 범위": "Tolerance",
  "목표에서 이만큼 벗어나면 리밸런싱을 제안합니다. 비중이 작은 자산은 목표의 {relative}%(5/25 규칙)를 함께 적용해 더 엄격하게 판단합니다.":
    "Drift beyond this triggers a rebalancing suggestion. Small sleeves also use {relative}% of their own target (the 5/25 rule), so they're judged more strictly.",
  "기본값으로 되돌리기": "Reset to defaults",
  "목표 배분이 저장되었습니다.": "Target allocation saved.",
  "실거주 주택(집) 제외": "Exclude primary residence (home)",
  "— 자산 폼에서 '집'으로 표시한 항목을 목표 배분 계산에서 빼고, 나머지 비중을 다시 계산합니다.":
    "— leaves items marked \"home\" in the asset form out of the target-allocation math and recomputes the remaining weights.",
  "실거주 주택(집)이에요": "This is my primary residence (home)",
  "— 설정에서 목표 배분 계산 시 제외할 수 있어요": "— can be excluded from the target-allocation math in settings",
  "실거주 주택(집) {amount}은(는) 계산에서 제외했습니다.":
    "Excluded your primary residence ({amount}) from this calculation.",
  "목표 배분 · 리밸런싱": "Target allocation · rebalancing",
  "최대 이탈 {drift} · 허용 ±{band}%p": "Max drift {drift} · tolerance ±{band}%p",
  "리밸런싱 필요 {count}개": "{count} to rebalance",
  "목표 범위 내": "Within target",
  "목표를 맞추려면": "To reach the target",
  매수: "Buy",
  매도: "Sell",
  "새 자금으로만 맞추기": "Rebalance with new money only",
  "매도 없이 추가 투자금만으로 비중을 조정하는 방법입니다 (세금·거래비용 절약).":
    "Shifts weights using new contributions instead of selling — saving taxes and trading costs.",
  "추가 투자금 입력": "Enter contribution",
  "{category} 현재 {current}%, 목표 {target}%": "{category}: {current}% now, {target}% target",

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
  "배당 합계 기록": "Record dividend total",
  "종목별 입력": "One security",
  "전체 한번에": "Lump sum",
  "종목을 하나씩 찾아 넣는 대신, 받은 배당을 모두 더한 금액을 한 건으로 기록합니다. 통계·차트·세금 계산에는 똑같이 반영되고, 종목별 상세만 남지 않습니다.":
    "Instead of hunting down each security, record the total of all dividends received as a single entry. It counts the same in stats, charts, and tax calculations — you just won't have the per-security breakdown.",
  "기간 표시 (선택)": "Period label (optional)",
  "예: 2026, 2026 상반기": "e.g. 2026, H1 2026",
  "배당 합계 (일괄 입력)": "Dividend total (lump sum)",
  "여러 종목 합산": "Multiple securities combined",
  "합계 금액 (세후)": "Total amount (after tax)",
  기준일: "As-of date",
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
  "조회된 밸류에이션 데이터가 없습니다 (티커를 확인해 주세요).":
    "No valuation data was returned (check the tickers).",
  "밸류에이션 조회에 실패했습니다 — 네트워크나 시세 제공사 상태를 확인한 뒤 새로고침해 주세요.":
    "Valuation lookup failed — check your network or the data provider, then refresh.",
  "리스크 분석": "Risk analysis",
  "최근 1년 일간 시세 기준 · 변동성은 연율화":
    "Based on the last year of daily prices · volatility annualized",
  "변동성 (연율)": "Volatility (ann.)",
  "1년 수익률": "1-yr return",
  "최대 낙폭": "Max drawdown",
  "조회된 시세 이력이 없습니다 (티커를 확인해 주세요).":
    "No price history was returned (check the tickers).",
  "시세 이력 조회에 실패했습니다 — 네트워크나 시세 제공사 상태를 확인한 뒤 새로고침해 주세요.":
    "Price history lookup failed — check your network or the data provider, then refresh.",
  "일부 지표를 불러오지 못해 '-'로 표시됩니다 — 네트워크나 시세 제공사 상태를 확인해 주세요.":
    "Some metrics couldn't be loaded and show as \"-\" — check your network or the data provider.",
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

  // --- Retirement ---
  은퇴: "Retirement",
  "은퇴 준비": "Retirement",
  "지금 페이스로 가면 은퇴 시점에 얼마가 되고, 그 돈으로 몇 년을 살 수 있는지 추정합니다.":
    "Projects what you'll have at retirement on your current pace, and how many years it lasts.",
  "출생연도와 월 생활비를 입력하면 진단이 시작됩니다": "Enter your birth year and monthly spending to begin",
  "보유 자산과 최근 저축 페이스는 앱이 이미 알고 있어요. 왼쪽에 계획만 채워 주세요.":
    "The app already knows your assets and recent saving pace — just fill in the plan on the left.",
  "선택한 소유자의 자산이 없어 현재 자산을 0으로 계산했습니다. 소유자 필터를 바꿔보세요.":
    "The selected owner has no assets, so current assets are counted as zero — try another owner filter.",
  "나의 계획": "My plan",
  "금액은 모두 오늘 물가 기준으로 입력하세요 — 물가상승은 계산에서 알아서 반영합니다. 입력값은 자동 저장됩니다.":
    "Enter every amount in today's money — inflation is handled for you. Inputs save automatically.",
  출생연도: "Birth year",
  "예: 1980": "e.g. 1980",
  "은퇴 목표 나이": "Target retirement age",
  "은퇴 후 월 생활비": "Monthly spending in retirement",
  "기타 월 수입 (국민연금 등)": "Other monthly income (pension, etc.)",
  "기대 수익률 (연, 세전)": "Expected return (annual, pre-tax)",
  보수적: "Conservative",
  기본: "Base",
  공격적: "Aggressive",
  "물가상승률 (연)": "Inflation (annual)",
  "기대 수명": "Life expectancy",
  세: "yrs",
  "월 저축액": "Monthly saving",
  "자동 감지 사용": "Auto-detect",
  "기록이 부족해 감지할 수 없어요": "Not enough history to detect",
  "최근 {n}개월 원금 증가 기준": "based on principal growth over {n} months",
  "원금 이력에 큰 변동(자산 뒤늦은 등록·평단가 수정 등)이 섞여 있어요. 중앙값으로 계산했지만, 실제 저축 페이스와 다르면 자동 감지를 끄고 직접 입력하세요.":
    "The principal history has large jumps (late-added assets, price edits). We used the median, but if it doesn't match your real pace, turn off auto-detect and enter it.",
  "자산이 은퇴 기간 내내 유지됩니다": "Your assets last through the whole retirement",
  "자산이 약 {age}세까지 버팁니다": "Your money lasts to about age {age}",
  "자산이 약 {age}세에 바닥납니다": "Your money runs out at about age {age}",
  "목표: {retire}세 은퇴 · {life}세까지 대비": "Goal: retire at {retire} · funded to {life}",
  "목표 달성률": "Goal funded",
  충분: "Enough",
  "은퇴 시점 예상 자산": "Projected at retirement",
  "명목 {value}": "nominal {value}",
  "필요 자산": "Needed",
  "여유 {value}": "{value} surplus",
  "부족 {value}": "{value} short",
  "금액은 오늘 물가 기준(실질)입니다. 실제 세액·수익률·물가는 가정과 다를 수 있는 추정치예요.":
    "Amounts are in today's money (real). Actual taxes, returns and inflation may differ from these estimates.",
  "목표에 닿으려면 (하나만 택해도 됩니다)": "To reach the goal (any one works)",
  "더 저축": "Save more",
  "/월": "/mo",
  "은퇴 늦추기": "Retire later",
  "+{n}년": "+{n} yrs",
  어려움: "Not enough",
  "→ {age}세": "→ age {age}",
  "생활비 줄이기": "Spend less",
  "현재 계획이면 목표를 달성합니다.": "Your current plan reaches the goal.",
  "자산 성장 시나리오": "Asset growth scenarios",
  "과거 실제 자산과 은퇴 시점까지의 예상 경로 (명목 · 미래 금액 기준)":
    "Actual assets and the projected path to retirement (nominal, future won)",
  실제: "Actual",
  "예상(기본)": "Projected (base)",
  "보수~낙관": "Conservative–optimistic",
  "{age}세": "{age}",
  "은퇴 시점 필요 자산(명목): {value}": "Needed at retirement (nominal): {value}",

  // --- Pension withdrawal simulator (tax page) ---
  "연금 수령 시뮬레이터": "Pension withdrawal simulator",
  "보유한 사적연금(연금저축·IRP) 잔액을 수령 기간에 걸쳐 나눠 받을 때의 월 수령액과 연금소득세를 추정합니다. 국민연금은 포함하지 않으며, 확정 세액이 아닌 추정치입니다.":
    "Estimates the monthly payout and pension income tax from drawing your private pension (연금저축·IRP) down over a chosen period. Excludes the national pension; an estimate, not a filing.",
  "연금 잔액": "Pension balance",
  "수령 시작 나이": "Start age",
  "수령 중 기대 수익률 (연)": "Return while drawing (annual)",
  "수령 기간": "Withdrawal period",
  "{n}년": "{n} yrs",
  년: "yrs",
  "월 수령액 (세전)": "Monthly payout (pre-tax)",
  "월 실수령액": "Monthly after-tax",
  "연금소득세 (연, {rate}%)": "Pension income tax (yr, {rate}%)",
  "연 수령액이 {threshold}을 넘어 종합과세 또는 16.5% 분리과세 대상입니다. 수령 기간을 {years}년 이상으로 늘리면 연 수령액이 한도 아래로 내려가 연령별 저율 분리과세(5.5~3.3%)로 종결됩니다.":
    "The annual payout exceeds {threshold}, so it falls under global taxation or elective 16.5% separate taxation. Stretching the period to {years}+ years brings it back under the line, where the low age-based rate (5.5–3.3%) settles it.",
  "연 수령액이 {threshold}을 넘어 종합과세 또는 16.5% 분리과세 대상입니다. 잔액이 커서 수령 기간을 늘려도 한도 아래로 내리기 어렵습니다.":
    "The annual payout exceeds {threshold} (global taxation or elective 16.5% separate taxation). The balance is large enough that even a longer period can't bring it under the line.",
  "연 수령액이 {threshold} 이하라 연령별 저율 분리과세로 종결됩니다(수령 시작 시점 {rate}%, 나이가 들수록 낮아집니다).":
    "The annual payout is at or under {threshold}, so the low age-based separate rate settles it ({rate}% at the start age, falling with age).",
  "과세 대상은 세액공제를 받은 납입액과 운용수익입니다. 여기서는 잔액 전체를 과세 대상으로 단순 가정하므로, 세액공제를 받지 않은 납입원금이 있으면 실제 세금은 더 적을 수 있습니다.":
    "Only deductible contributions and investment gains are taxable. This assumes the whole balance is taxable, so if you have non-deductible contributions the actual tax may be lower.",

  // --- Goals ---
  목표: "Goals",
  "주택·교육 등 시점이 있는 목표에 자산을 배정하고 진행률을 추적합니다.":
    "Earmark assets toward dated goals (a home, tuition, …) and track progress.",
  "목표 추가": "Add goal",
  "목표 수정": "Edit goal",
  "첫 목표를 추가해 보세요": "Add your first goal",
  "목표 금액과 시점을 정하고 보유 자산을 배정하면, 진행률과 필요한 월 저축액을 계산해 드려요.":
    "Set a target amount and date, assign your assets, and we'll compute the progress and the monthly saving needed.",
  "목표 이름": "Goal name",
  "예: 전세 보증금, 자녀 학자금": "e.g. rental deposit, children's tuition",
  "목표 금액": "Target amount",
  "목표 시점": "Target date",
  "목표 이름을 입력해 주세요.": "Enter a goal name.",
  "목표 시점을 선택해 주세요.": "Choose a target date.",
  "목표 금액을 입력해 주세요.": "Enter a target amount.",
  달성: "Reached",
  "D-{days}": "D-{days}",
  "약 {months}개월 남음": "~{months} mo left",
  "기한 지남": "Past due",
  "목표 {value}": "Target {value}",
  "배정 {value}": "Assigned {value}",
  "남은 금액": "Remaining",
  "필요 월 저축": "Monthly saving needed",
  "기한 경과": "Overdue",
  "지금 필요": "Needed now",
  "{months}개월 뒤 쓸 돈인데 배정 자산의 {ratio}%가 주식이에요 — 하락장에 대비해 안전자산 비중을 늘리는 걸 검토하세요.":
    "This money is needed in {months} months, but {ratio}% of the assigned assets are in stocks — consider shifting toward safer assets in case of a downturn.",
  "목표 시점이 지났지만 아직 {value} 부족합니다.": "The target date has passed and you're still {value} short.",
  "삭제된 자산 {count}개가 배정 목록에 남아 있어요 — 다시 배정하면 정리됩니다.":
    "{count} deleted asset(s) still linger in the assignment — re-assigning clears them.",
  "자산 배정 ({count}개)": "Assigned assets ({count})",
  "배정할 자산이 없어요.": "No assets to assign.",
  "현재 '{name}'에 배정됨": "assigned to '{name}'",
  "미배정 자산": "Unassigned assets",
  "모든 자산이 목표에 배정되었습니다.": "Every asset is assigned to a goal.",
  "어느 목표에도 배정되지 않은 자산입니다. 각 목표 카드의 '자산 배정'에서 연결하세요.":
    "Assets not earmarked for any goal — link them from a goal's 'Assigned assets'.",
  "목표가 추가되었습니다.": "Goal added.",
  "목표가 수정되었습니다.": "Goal updated.",
  "목표가 삭제되었습니다.": "Goal deleted.",
};
