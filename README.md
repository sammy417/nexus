# NEXUS

개인 자산 포트폴리오 관리 웹 앱 MVP (Next.js App Router + TypeScript + Tailwind CSS). 현재는 주식·현금 자산의 보유 현황을 관리하며 (매수/매도 거래 기록이 아닌, 현재 상태를 직접 입력·수정하는 방식), 채권·연금(DC/IRP)·배당금 추적으로 확장 가능한 구조로 설계되어 있습니다. 토스(Toss) 스타일의 미니멀한 다크/라이트 모드를 지원합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속. 최초 실행 시 `data/nexus.db` (SQLite, git에 커밋되지 않음)가 자동 생성되고 데모 데이터로 시딩됩니다.

## 폴더 구조

```
src/
  app/                        # 라우트 (App Router)
    page.tsx                  # 대시보드
    portfolio/page.tsx        # 포트폴리오 목록
    api/assets/                # REST API (Route Handlers)
      route.ts                 # GET(목록)/POST(생성)
      [id]/route.ts             # PATCH(수정)/DELETE(삭제)
      reset/route.ts            # POST(데모 데이터로 초기화, 개발용)
  components/
    layout/                   # Header, BottomNav
    dashboard/                # 대시보드 위젯 (요약/자산배분/미리보기)
    portfolio/                # AssetCard
    asset/                    # AssetFormModal (자산 추가/수정 폼)
    common/                   # Toast 등 공통 UI
  lib/
    models/                   # 도메인 모델 (자산 타입 정의) — 확장의 시작점
      asset.ts                  # AssetType, CashAsset, StockAsset, Asset(discriminated union)
      asset-types.ts             # 타입별 라벨/표시 순서
      seed-data.ts               # 데모 데이터
      validate-asset-input.ts    # API 요청 바디 검증
    services/
      portfolio-service.ts      # 손익/평가금액/자산배분 계산 (순수 함수, DB 무관)
    repositories/               # 데이터 접근 계층 (교체 가능)
      asset-repository.ts        # AssetRepository 인터페이스
      sqlite-asset-repository.ts # SQLite 구현체 (기본값)
      mock-asset-repository.ts   # 인메모리 목업 구현체
      index.ts                   # getAssetRepository() 팩토리
    db/
      client.ts                  # SQLite(DatabaseSync) 커넥션 + 스키마 초기화
    hooks/
      use-assets.ts              # 클라이언트: /api/assets CRUD 훅
    portfolio-context.tsx       # 전역 상태(Context): assets, summary, CRUD 함수
    asset-modal-context.tsx     # 자산 추가/수정 모달 열림 상태, 토스트
    theme-provider.tsx          # 다크/라이트 모드 전환
    format.ts                   # 통화/퍼센트 포맷터
```

## 데이터 모델 — 자산 타입 확장하기

모든 자산은 `src/lib/models/asset.ts`의 discriminated union `Asset = CashAsset | StockAsset`로 정의됩니다. 향후 채권(BOND)·연금(PENSION)·배당금(DIVIDEND) 등을 추가할 때 아래 순서만 따르면 됩니다:

1. `AssetType`에 새 타입 문자열 추가 (예: `"BOND"`)
2. `BaseAsset`을 확장한 인터페이스 추가 (예: `BondAsset`)
3. `Asset`·`AssetInput` 유니온에 추가
4. `asset-types.ts`에 라벨 추가
5. `portfolio-service.ts`의 `getAssetMetrics`에 case 추가 — TypeScript의 exhaustiveness 체크(`assertNever`)가 놓친 곳을 알려줍니다

**리포지토리·API·UI 코드는 자산 타입이 늘어나도 구조를 바꿀 필요가 없습니다.** SQLite/목업 리포지토리 둘 다 타입별 필드를 `payload` JSON으로 저장하므로 새 컬럼이나 마이그레이션이 필요 없습니다.

## 데이터 계층 — SQLite / Mock 교체

`src/lib/repositories/index.ts`의 `getAssetRepository()`가 유일한 진입점입니다. 기본값은 파일 기반 SQLite(Node 내장 `node:sqlite`, 네이티브 애드온 불필요)이며, 아래처럼 환경변수로 순수 인메모리 목업으로 바꿀 수 있습니다 (프로세스 재시작 시 초기화됨 — 테스트/데모용):

```bash
DATA_LAYER=mock npm run dev
```

나중에 실제 서버 DB(Postgres 등)로 옮길 때도 `AssetRepository` 인터페이스를 구현하는 새 클래스만 추가하면 되고, API 라우트나 컴포넌트는 그대로 둘 수 있습니다.

## 다크/라이트 모드

헤더 우측 상단 버튼으로 전환하며, 선택값은 `localStorage`에 저장되고 시스템 설정(prefers-color-scheme)을 기본값으로 따릅니다. Tailwind `darkMode: "class"` 전략을 사용합니다.

## 휴대폰 없이 PC에서 테스트하기

이 앱은 모바일 퍼스트로 설계되어 있어서, 전체 화면(`max-w-md`)이 항상 폰 너비 카드 형태로 가운데 정렬됩니다. 즉 **PC 브라우저 창을 그냥 넓게 열어도 자동으로 폰 화면처럼 보입니다** — 별도 설정 없이 바로 확인 가능합니다.

더 실제 기기에 가깝게(디바이스 프레임, 터치 시뮬레이션 등) 보고 싶다면 브라우저 개발자도구의 반응형 모드를 사용하세요.

- Chrome / Edge: `F12` → 좌측 상단 기기 아이콘 클릭 (또는 `Ctrl+Shift+M` / Mac: `Cmd+Shift+M`) → 상단에서 "iPhone 14 Pro" 등 기기 선택
- Safari: 개발자 메뉴 → "반응형 웹 디자인 모드"

### 반복 테스트를 위한 초기화

자산 데이터는 SQLite 파일(`data/nexus.db`)에 저장되어 서버를 재시작해도 유지됩니다. 시나리오를 처음부터 다시 테스트하고 싶다면 헤더의 초기화(↺) 아이콘을 눌러 데모 데이터로 되돌릴 수 있습니다 (`data/nexus.db` 파일을 직접 삭제해도 다음 요청 시 재시딩됩니다).

### 확인해볼 시나리오 예시

1. 하단 네비 "자산 추가" → 자산 종류(주식/현금) 선택 후 신규 자산 등록 → 대시보드/포트폴리오에 반영되는지 확인
2. 포트폴리오 목록에서 기존 자산 카드를 탭 → 수정 폼이 뜨는지, 값을 바꿔 저장하면 반영되는지 확인
3. 수정 폼 하단의 삭제 버튼으로 자산 삭제 → 목록과 대시보드 총 자산에서 제거되는지 확인
4. 대시보드의 "자산 구성" 비중 그래프가 종류별로 갱신되는지 확인
5. 포트폴리오 페이지에서 주식/현금이 섹션별로 그룹핑되어 보이는지 확인
6. 새로고침(F5) 또는 서버 재시작 후에도 위 변경 사항이 유지되는지 확인
7. 헤더 우측 상단 아이콘으로 다크/라이트 모드 전환, ↺ 버튼으로 초기 상태로 재설정
