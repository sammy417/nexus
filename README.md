# NEXUS

개인 자산 포트폴리오 관리 웹 앱 MVP (Next.js App Router + TypeScript + Tailwind CSS). 현재는 주식·채권·현금 자산의 보유 현황을 관리하며 (매수/매도 거래 기록이 아닌, 현재 상태를 직접 입력·수정하는 방식), 연금(DC/IRP)·배당금 추적으로 확장 가능한 구조로 설계되어 있습니다. PC(데스크톱) 브라우저에 최적화된 사이드바 레이아웃과 토스(Toss) 스타일의 미니멀한 다크/라이트 모드를 지원합니다.

## 로컬 실행

**요구사항: Node.js 22.13 이상** (SQLite 데이터 계층이 Node 내장 `node:sqlite` 모듈을 사용합니다. `node -v`로 확인하세요.)

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속. 최초 실행 시 `data/nexus.db` (SQLite, git에 커밋되지 않음)가 자동 생성되고 데모 데이터로 시딩됩니다.

> Node 22.13 미만에서 실행하면 SQLite 대신 인메모리 데이터 계층으로 자동 폴백됩니다 — 앱은 동작하지만 **서버 재시작 시 데이터가 사라집니다** (서버 콘솔에 경고 출력). 영속 저장이 필요하면 Node를 업그레이드하세요.

## 폴더 구조

```
src/
  app/                        # 라우트 (App Router)
    page.tsx                  # 대시보드
    portfolio/page.tsx        # 포트폴리오 목록
    analytics/page.tsx        # 분석 (수익률·낙폭·카테고리 손익·성장 추이)
    dividends/page.tsx        # 배당 (기록 입력·월별 차트·통계)
    api/dividends/             # 배당 REST API (GET/POST, [id] DELETE)
    api/assets/                # REST API (Route Handlers)
      route.ts                 # GET(목록)/POST(생성)
      [id]/route.ts             # PATCH(수정)/DELETE(삭제)
      reset/route.ts            # POST(데모 데이터로 초기화, 개발용)
    api/snapshots/route.ts     # GET(일별 자산 히스토리; 오늘 포인트 자동 기록)
    api/quote/route.ts         # GET(티커 현재가 조회 — 야후 파이낸스, 원화 환산)
  components/
    layout/                   # Sidebar (내비게이션 + 자산 추가 + 테마/초기화)
    dashboard/                # 대시보드 위젯 (요약/자산배분/미리보기)
    portfolio/                # AssetTable (자산 목록 테이블)
    asset/                    # AssetFormModal (자산 추가/수정 다이얼로그)
    common/                   # Toast 등 공통 UI
  lib/
    models/                   # 도메인 모델 (자산 타입 정의) — 확장의 시작점
      asset.ts                  # AssetType, CashAsset, StockAsset, Asset(discriminated union)
      asset-types.ts             # 타입별 라벨/표시 순서
      snapshot.ts                # PortfolioSnapshot (일별 자산 히스토리 포인트)
      seed-data.ts               # 데모 데이터
      validate-asset-input.ts    # API 요청 바디 검증
    services/
      portfolio-service.ts      # 손익/평가금액/자산배분 계산 (순수 함수, DB 무관)
      snapshot-service.ts       # 스냅샷 계산 + 데모 히스토리 생성 (순수 함수)
      quote-service.ts          # 외부 시세 조회 (야후 파이낸스, USD→KRW 환산, 5분 캐시)
    repositories/               # 데이터 접근 계층 (교체 가능)
      asset-repository.ts        # AssetRepository 인터페이스
      sqlite-asset-repository.ts # SQLite 구현체 (기본값)
      mock-asset-repository.ts   # 인메모리 목업 구현체
      snapshot-repository.ts     # SnapshotRepository 인터페이스 (+ sqlite/mock 구현체)
      snapshot-sync.ts           # 서버 오케스트레이션: 오늘 스냅샷 기록/히스토리 시딩
      index.ts                   # getAssetRepository()/getSnapshotRepository() 팩토리
    db/
      client.ts                  # SQLite(DatabaseSync) 커넥션 + 스키마 초기화
    hooks/
      use-assets.ts              # 클라이언트: /api/assets CRUD 훅
      use-snapshots.ts           # 클라이언트: /api/snapshots 히스토리 훅
    portfolio-context.tsx       # 전역 상태(Context): assets, summary, CRUD 함수
    asset-modal-context.tsx     # 자산 추가/수정 모달 열림 상태, 토스트
    theme-provider.tsx          # 다크/라이트 모드 전환
    format.ts                   # 통화/퍼센트 포맷터
```

## 데이터 모델 — 자산 타입 확장하기

모든 자산은 `src/lib/models/asset.ts`의 discriminated union `Asset = CashAsset | StockAsset | BondAsset`로 정의됩니다. 채권(BOND)은 실제로 이 절차대로 추가해 설계를 검증했으며, 향후 연금(PENSION) 등을 추가할 때의 절차는 다음과 같습니다:

**컴파일러가 강제하는 단계** (빠뜨리면 `tsc`가 알려줌):

1. `AssetType`에 새 타입 문자열 추가 (예: `"PENSION"`)
2. `BaseAsset`을 확장한 인터페이스 추가 후 `Asset`·`AssetInput` 유니온에 포함
3. `asset-types.ts`에 라벨·표시 순서 추가
4. `portfolio-service.ts`의 `getAssetMetrics`에 case 추가 (`assertNever` exhaustiveness)
5. `AllocationBreakdown.tsx`의 `CATEGORY_COLOR`에 색 추가 — 새 색은 dataviz 검증(라이트/다크 서페이스, 색각 이상 구분)을 통과시킬 것

**컴파일러가 못 잡는 단계** (안전하게 실패하지만 조용히 빠짐 — 직접 챙길 것):

6. `validate-asset-input.ts`에 런타임 검증 branch 추가 — 없으면 새 타입 생성 요청이 400으로 거부됨
7. `AssetFormModal.tsx`에 입력 폼 필드 추가 — 없으면 UI에서 새 타입을 선택할 수 없음
8. (선택) `seed-data.ts`에 데모 데이터 추가

**리포지토리·API 코드는 자산 타입이 늘어나도 구조를 바꿀 필요가 없습니다.** SQLite/목업 리포지토리 둘 다 타입별 필드를 `payload` JSON으로 저장하므로 새 컬럼이나 마이그레이션이 필요 없습니다 (BOND 추가 시에도 마이그레이션 0건이었음). 히스토리 스냅샷의 타입별 구성(`byType`)도 자동으로 새 타입을 포함합니다.

## 데이터 계층 — SQLite / Mock 교체

`src/lib/repositories/index.ts`의 `getAssetRepository()`가 유일한 진입점입니다. 기본값은 파일 기반 SQLite(Node 내장 `node:sqlite`, 네이티브 애드온 불필요)이며, 아래처럼 환경변수로 순수 인메모리 목업으로 바꿀 수 있습니다 (프로세스 재시작 시 초기화됨 — 테스트/데모용):

```bash
DATA_LAYER=mock npm run dev
```

나중에 실제 서버 DB(Postgres 등)로 옮길 때도 `AssetRepository` 인터페이스를 구현하는 새 클래스만 추가하면 되고, API 라우트나 컴포넌트는 그대로 둘 수 있습니다.

## 다크/라이트 모드

사이드바 하단의 해/달 아이콘으로 전환하며, 선택값은 `localStorage`에 저장되고 시스템 설정(prefers-color-scheme)을 기본값으로 따릅니다. Tailwind `darkMode: "class"` 전략을 사용합니다.

## 화면 구성 (데스크톱)

- **좌측 사이드바**: 대시보드/포트폴리오/분석/배당 내비게이션, "자산 추가" 버튼, 하단에 테마 전환·초기화 버튼
- **대시보드**: 총 자산 요약 카드 + 자산 구성 도넛 차트(2:1 그리드, 세그먼트/범례 호버 시 중앙에 카테고리별 금액·비중 표시), 총 자산 추이 차트, 보유 자산 미리보기
- **포트폴리오**: **한국주식 / 해외주식 / 채권 / 현금 / 기타** 카테고리별 섹션. 주식의 국내/해외 구분은 시장(KOSPI·KOSDAQ·KRX) → 티커 형식(6자리 숫자) → 통화 순으로 자동 판별하며 저장 스키마 변경 없이 파생됩니다. 각 섹션에 카테고리 합계, **비중 Top 5 가로 바 차트**, 그리고 카테고리 내 비중(%) 컬럼이 추가된 테이블이 표시됩니다 (행 클릭/연필로 수정, 휴지통으로 삭제, USD 자산 배지). 테이블 헤더(자산·투자 원금·평가 금액·비중·평가 손익)를 클릭하면 해당 컬럼 기준으로 내림/오름차순 정렬됩니다
- **분석**: 일별 스냅샷을 활용한 통계 페이지 — 전체/1개월/3개월 수익률과 최대 낙폭(MDD) 스탯 타일, 월별 수익률 막대 차트(월말 평가액의 전월 대비 변화), 카테고리별 평가 손익 다이버징 바, 전체 기간의 평가 금액 vs 투자 원금 라인 차트(크로스헤어 툴팁)
- **배당**: 배당·이자 수령 기록 관리 — "배당 추가" 다이얼로그(종목명 자동완성, ₩/$ 금액, 지급일, 메모)로 입력하고, 올해 누적·최근 12개월·월 평균·이번 달 스탯 타일과 최근 12개월 월별 배당 막대 차트, 월별 그룹 목록(삭제 가능)으로 확인합니다. 자산과 별개의 이벤트 기록이라 매도한 종목의 과거 배당도 그대로 남습니다
- **표시 통화 전환**: 대시보드/포트폴리오/분석 우측 상단의 ₩/$ 토글로 모든 금액(요약·도넛·추이 차트·테이블)을 원화 또는 달러로 표시. 달러 모드에서는 적용 환율($1 = ₩N)을 함께 표기하며, 선택은 localStorage에 저장됩니다. 환율 조회(`/api/fx`)에 실패하면 기본값(₩1,400)으로 폴백하고 그 사실을 표시합니다.

## 자산 추가 폼 — 필수/선택 항목과 현재가 자동 조회

자산 추가 시 필수 입력은 최소한으로 유지됩니다:

| 종류 | 필수 | 선택 |
|---|---|---|
| 주식 | 종목명, 보유 수량 | 티커, 시장, 평단가 |
| 채권 | 자산명, 매입 금액 | 현재 평가 금액(미입력 시 매입 금액), 표면금리, 만기일 |
| 현금 | 자산명, 금액 | - |
| 기타 | 자산명, 매입 금액 | 카테고리(부동산·금·암호화폐 등 자유 입력), 현재 평가 금액 |

모든 자산은 **원화(₩)/달러($) 중 입력 통화를 선택**할 수 있습니다. 금액은 입력한 통화 그대로 저장되고, 평가/합산 시점에 실시간 USDKRW 환율(야후 파이낸스)로 원화 기준 환산됩니다 — 환율이 움직이면 달러 자산의 원화 평가액도 함께 움직입니다.

**주식의 현재가는 입력받지 않고 저장 시 자동 조회합니다** (`/api/quote` → 야후 파이낸스 차트 API, API 키 불필요):

- 국내 6자리 코드는 KOSPI(`.KS`)/KOSDAQ(`.KQ`)으로, 알파벳 티커는 미국 시장으로 매핑됩니다.
- 미국 주식은 USDKRW 환율로 원화 환산해 저장합니다 (앱 전체가 KRW 기준).
- 조회 우선순위: 티커 조회 성공값 → 평단가 → (수정 시) 기존 저장값. 전부 없으면 안내 문구와 함께 저장이 중단됩니다. 평단가를 비우면 조회된 현재가로 채워집니다(손익 0에서 시작).
- 시세는 서버에서 5분간 캐시되며, 테스트/차단 환경에서는 `QUOTE_API_BASE` 환경변수로 엔드포인트를 교체할 수 있습니다.

## 자산 히스토리 & 추이 차트

일별 스냅샷(`snapshots` 테이블, 날짜당 1행)으로 총 자산 추이를 기록합니다:

- **기록 시점**: 자산을 추가/수정/삭제할 때마다, 그리고 대시보드 접속 시(하루 1회 갱신) 오늘 날짜의 스냅샷이 현재 자산 상태로 덮어써집니다.
- **데모 히스토리**: DB가 비어 있으면 최초 접속 시 현재 자산 가치를 기준으로 90일치 히스토리를 생성해 시딩합니다(고정 시드 난수 워크 — 데모용). 이후 실제 기록이 쌓이면서 대체됩니다.
- **차트**: 대시보드의 "총 자산 추이" 카드. 1개월/3개월/전체 기간 탭, 구간 손익 요약, 호버 시 크로스헤어 + 날짜별 평가금액/전일 대비 툴팁, "표로 보기"로 원본 수치 테이블 확인 가능. 외부 차트 라이브러리 없이 SVG로 구현되어 있습니다.

### 반복 테스트를 위한 초기화

자산 데이터는 SQLite 파일(`data/nexus.db`)에 저장되어 서버를 재시작해도 유지됩니다. 시나리오를 처음부터 다시 테스트하고 싶다면 사이드바 하단의 초기화(↺) 아이콘을 눌러 데모 데이터로 되돌릴 수 있습니다 (`data/nexus.db` 파일을 직접 삭제해도 다음 요청 시 재시딩됩니다).

### 확인해볼 시나리오 예시

1. 사이드바 "자산 추가" → 자산 종류(주식/현금) 선택 후 신규 자산 등록 → 대시보드/포트폴리오에 반영되는지 확인
2. 포트폴리오 테이블에서 자산 행 클릭(또는 행 우측 연필 버튼) → 수정 다이얼로그에서 보유 수량 등 값을 바꿔 저장 → 원금/평가금액/손익이 재계산되어 반영되는지 확인 (예: 30주 → 5주 감소, 5주 → 20주 증가)
3. 포트폴리오 테이블 각 행 우측의 휴지통 버튼(또는 수정 다이얼로그 하단의 삭제 버튼)으로 자산 삭제 → 확인 창 후 목록과 대시보드 총 자산에서 제거되는지 확인
4. 대시보드의 "자산 구성" 비중 그래프가 종류별로 갱신되는지 확인
5. 포트폴리오 페이지에서 주식/현금이 섹션별로 그룹핑되어 보이는지 확인
6. 새로고침(F5) 또는 서버 재시작 후에도 위 변경 사항이 유지되는지 확인
7. 사이드바 하단 아이콘으로 다크/라이트 모드 전환, ↺ 버튼으로 초기 상태로 재설정
