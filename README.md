# PassWave — 국가자격증 합격 플랫폼

하나의 Supabase 프로젝트 안에 모든 자격증·학원을 담는 **단일 프로젝트 멀티테넌트** 구조의 국가자격증 학습 플랫폼입니다.

## 기술 스택

- **프레임워크**: Next.js (App Router) + TypeScript
- **DB / 인증**: Supabase (Postgres + Auth + RLS)
- **AI**: Anthropic Claude API (오개념 진단 / 문항 생성, 캐싱 포함)
- **결제**: Toss Payments (정기결제 / 빌링키)
- **스타일**: Tailwind CSS
- **상태관리**: Zustand
- **배포**: Vercel (도메인: passwave.kr)

> 참고: 기획안은 Next.js 14를 명시했으나 `create-next-app@latest`로 생성되어 최신 메이저(App Router) 버전이 설치되었습니다. 동적 라우트의 `params`는 최신 규약(Promise)에 맞춰 `await`/`use()`로 처리했습니다.

## 시작하기

### 1. 환경변수 설정

`.env.example`를 참고하여 `.env.local`을 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
NEXT_PUBLIC_TOSS_CLIENT_KEY=...
TOSS_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 데이터베이스 마이그레이션

Supabase Dashboard → SQL Editor에서 아래 순서대로 실행합니다.

1. `supabase/migrations/0001_init.sql` — 테이블 생성 + 트리거
2. `supabase/migrations/0002_rls.sql` — RLS(행 수준 보안) 정책
3. `supabase/migrations/0003_seed.sql` — 초기 자격증/과목 + 데모 문제

> 카카오 소셜 로그인을 쓰려면 Supabase Auth → Providers에서 Kakao를 활성화하세요.

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속

## 폴더 구조

```
src/
├── app/
│   ├── (marketing)/   비로그인: 랜딩·요금제
│   ├── (auth)/        로그인·회원가입·OAuth 콜백
│   ├── (learn)/       B2C 학습 (자격증 선택, 문제풀기, 오답노트, 대시보드)
│   ├── (academy)/     B2B 학원 관리 (반·학생·CBT·설정)
│   └── api/           AI 진단/생성, 결제, 합격지수 라우트
├── lib/               supabase 클라이언트, claude, toss, utils
├── components/        ui / quiz / dashboard / academy / layout
├── hooks/             use-auth, use-quiz, use-subscription
├── stores/            quiz-store (Zustand)
├── types/             전역 타입 정의
└── middleware.ts      인증 미들웨어
```

## 핵심 설계 원칙

- **데이터 금광**: 모든 풀이를 `user_attempts`에 빠짐없이 기록
- **AI 비용 절감**: 진단은 캐시(`ai_diagnoses`) 먼저 확인 → 없을 때만 Claude 호출
- **보안**: 모든 테이블에 RLS 적용 (`academy_members` 자기참조 재귀는 `SECURITY DEFINER` 헬퍼로 회피)
- **확장성**: `/learn/[certSlug]` 동적 경로로 자격증 무한 확장
- **멀티테넌트**: 학원은 `academy_id` 컬럼으로 구분
