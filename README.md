# HYMeal

한양대학교 식당 메뉴를 한눈에 볼 수 있는 웹앱.

[fnb.hanyang.ac.kr](https://fnb.hanyang.ac.kr)의 데이터를 파싱하여 깔끔한 UI로 제공합니다.

## 기능

- 5개 식당 메뉴 조회 (학생식당, 신소재공학관, 생활과학관, 체육부실, 제2학생생활관)
- 일간 / 주간 뷰
- 주 단위 네비게이션
- 체육부실 식권 구매 링크
- 모바일 반응형
- 다크모드 지원

## 기술 스택

- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Cheerio (HTML 파싱)
- Pretendard (폰트)

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인.
