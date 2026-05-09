export function MarkdownArticle({ html }: { html: string }) {
  return (
    <article
      aria-label="문서 본문"
      className="prose-doc min-w-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
