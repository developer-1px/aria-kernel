# minimal md PPT

마크다운 한 파일을 슬라이드로

`Space` / `→` 로 다음 장

---

## What is this?

마크다운 파일을 PPT로 보는 가장 작은 뷰어.

- 📝 **Text-based** — 본문은 그냥 마크다운
- 🪓 **Split rule** — 줄 단독 `---` 1개가 슬라이드 경계
- 👀 **View only** — CRUD 0, 어포던스 최소
- 🎯 **Canonical** — Marpit · Slidev · Deckset 수렴 표준

> 어휘를 닫으면 발산이 멎는다.

---

## Why split by `---`?

업계가 이미 이 자리에 수렴했다.

| 도구 | 분할 규칙 |
|------|----------|
| Marpit | `^---$` |
| Slidev | `^---$` |
| Deckset | `^---$` |
| reveal.js (md) | `^---$` (default) |
| Pandoc beamer | `^---$` |

**4곳 이상 일치한 걸 우리가 다시 정할 이유는 없다.**

CANONICAL.md 한 줄로 못 박는다 — 발산 차단의 가장 싼 방법.

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| <kbd>→</kbd> · <kbd>Space</kbd> · <kbd>PgDn</kbd> | next |
| <kbd>←</kbd> · <kbd>PgUp</kbd> | previous |
| <kbd>Home</kbd> | first slide |
| <kbd>End</kbd> | last slide |
| 썸네일 클릭 | 해당 위치로 점프 |

---

## Code highlighting

지원 언어 자동 감지. shiki/highlight.js 등 외부 라이브러리가 HTML payload로 내놓고, ds의 `CodeBlock` entity 안에서만 `dangerouslySetInnerHTML`로 격리.

```ts
import { z } from 'zod'

export const SlideSchema = z.object({
  index: z.number().int().nonnegative(),
  source: z.string(),
})
export type Slide = z.infer<typeof SlideSchema>
```

```tsx
function splitMarkdown(path: string, text: string): Deck {
  const parts = text.split(/\r?\n---\r?\n/)
  const slides = parts
    .map((s, i) => ({ index: i, source: s.trim() }))
    .filter((s) => s.source.length > 0)
  return DeckSchema.parse({ path, slides })
}
```

---

## Two-column comparison

<table>
<tr>
<td>

### ❌ Before

```js
let html = ''
for (const part of md.split('---')) {
  html += '<section>' + render(part) + '</section>'
}
return html
```

- 줄 단독 검증 없음
- frontmatter 와 충돌
- 빈 슬라이드 누수

</td>
<td>

### ✅ After

```ts
const parts = text.split(/\r?\n---\r?\n/)
return parts
  .map((s, i) => ({ index: i, source: s.trim() }))
  .filter((s) => s.source.length > 0)
```

- 줄 단독만 경계
- zod로 boundary 검증
- 빈 조각 자동 제거

</td>
</tr>
</table>

---

## Lists & emphasis

순서 있는 단계:

1. 마크다운 파일을 `loadText(path)`로 읽는다
2. `splitMarkdown`이 `---`로 자른다
3. 각 조각을 `renderMarkdown`이 HTML로
4. `Prose` entity가 `dangerouslySetInnerHTML`로 격리해 렌더
5. 사용자는 ←→로 이동

순서 없는 강조:

- *italic으로 부드러운 강조*
- **bold로 강한 강조**
- ~~취소선으로 폐기~~
- `inline code`로 식별자

---

## Blockquote

> "정본 = 합의된 단 하나의 형태."
> 정본이 합의되어 있지 않으면 코드는 반드시 발산한다.
> — `CANONICAL.md`

> A picture is worth a thousand words.
> A canonical declaration is worth a thousand reviews.

---

## Anatomy of a slide

```
┌────────────────────────────────────────┐  ← 16:9 카드
│                                        │
│   # Heading                            │
│                                        │
│   - bullet                             │
│   - bullet                             │
│                                        │
│              N / total ─┐              │
│                         │              │
└─────────────────────────┴──────────────┘
   썸네일 ─ 썸네일 ─ 썸네일       6 / 11
```

- 카드 1장 = 슬라이드 1장
- 그림자 + 16:9 = "PPT다" 신호
- 회색 무대 + 흰 카드 = Keynote/PPT 컨벤션
- 그 외 chrome 없음

---

## Architecture

```
URL  /slides/<md-path>
        │
        ▼
  loadText(path) ─ @p/fs ─ virtual:fs-tree
        │
        ▼
  splitMarkdown(path, text) ─ apps/slides/features/split
        │
        ▼
  Deck { slides: Slide[] }   ← zod validated
        │
        ▼
  renderMarkdown(slide.source) ─ @p/fs/markdown
        │
        ▼
  16:9 article frame  ← apps/slides/style.ts
```

레이어 직교: slides harness 는 `@p/slides`, `@p/fs`, `@p/aria-kernel` public export 만 소비한다.

---

## Constraints — what we *don't* do

- ❌ CRUD — 편집·생성·삭제 없음
- ❌ 트랜지션 — 페이드/슬라이드 효과 없음
- ❌ Speaker notes — 발표자 모드 없음
- ❌ Custom themes
- ❌ Vue/React 컴포넌트 임베드
- ❌ Per-slide frontmatter — 본문만
- ❌ Drawing/annotation
- ❌ Export to PDF/PPTX

> 빠진 기능 = 의도적으로 안 만든 것. 필요해지면 추가한다 — 미리 만들지 않는다.

---

## Q & A

- **Q**. 슬라이드별 layout(cover/two-col/image-bg)을 frontmatter로 받을 수는 없나?
  **A**. 만들 수 있지만 *지금은* 안 만든다. minimal MVP — 본문만.

- **Q**. 전체화면 모드는?
  **A**. 브라우저의 F11. 우리는 따로 키바인딩을 추가하지 않는다.

- **Q**. 마크다운 안에 HTML 써도 되나?
  **A**. 된다. 위 두-컬럼 슬라이드가 `<table>`을 직접 쓴 예.

- **Q**. 이미지·다이어그램 mermaid는?
  **A**. 이미지 ✅. mermaid는 `renderMarkdown`이 지원하면 자동 ✅.

---

## Thanks 🙏

`docs/slides-sample.md` — 이 파일이 곧 이 데크.

```
$ open /slides/docs/slides-sample.md
```

또는 cmd+k → **Slides (md PPT)**.

---
