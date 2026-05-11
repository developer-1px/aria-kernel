import { useResource } from '@p/resource'
import { formatDate, formatSize } from '../features/data'
import { extToLang, extToPreviewKind, type FsNode } from '../entities/types'
import {
  textResource, imageResource, codeHtmlResource, markdownHtmlResource,
} from '../features/resources'
import type { PreviewVM } from '../features/feature'

/** PreviewPane — feature.view.preview VM 을 받아 renders the right preview body. */
export function PreviewPane({ vm }: { vm: PreviewVM }) {
  const show = vm.kind !== 'empty' && vm.kind !== 'dir'
  return (
    <aside aria-label="미리보기" aria-hidden={!show} className="flex flex-col gap-3">
      {show && 'node' in vm && (
        <>
          <PreviewBody node={vm.node} />
          <Meta node={vm.node} />
        </>
      )}
    </aside>
  )
}

const MAX_TEXT_BYTES = 512 * 1024

export function PreviewBody({ node }: { node: FsNode }) {
  const kind = extToPreviewKind(node.ext)
  const tooLarge = (node.size ?? 0) > MAX_TEXT_BYTES

  if (kind === 'image') return <ImageView node={node} />
  if (kind === 'binary') return <Header node={node} note="미리보기를 지원하지 않는 형식" />
  if (tooLarge) return <Header node={node} note="파일이 커서 메타만 표시합니다" />

  if (kind === 'markdown') return <MarkdownView node={node} />
  if (kind === 'code') return <CodeView node={node} />
  return <TextView node={node} />
}

function Header({ node, note }: { node: FsNode; note?: string }) {
  const isDir = node.type === 'dir'
  const kind = isDir ? '폴더' : (node.ext ?? '파일').toUpperCase()
  const sub = isDir ? kind : `${kind} · ${formatSize(node.size)}`
  return (
    <header className="flex flex-col items-center gap-2 py-4">
      <div aria-hidden className="grid h-16 w-16 place-items-center rounded bg-neutral-100 text-2xl text-neutral-500">
        {isDir ? '📁' : '📄'}
      </div>
      <hgroup className="text-center">
        <h2 className="text-sm font-semibold text-neutral-900">{node.name}</h2>
        <p className="text-xs text-neutral-500">{note ?? sub}</p>
      </hgroup>
    </header>
  )
}

function Meta({ node }: { node: FsNode }) {
  const isDir = node.type === 'dir'
  return (
    <dl className="grid grid-cols-[5rem_1fr] gap-x-2 gap-y-1 text-xs">
      <dt className="text-neutral-500">종류</dt>
      <dd className="text-neutral-800">{isDir ? '폴더' : (node.ext || '파일')}</dd>
      <dt className="text-neutral-500">경로</dt>
      <dd className="break-all text-neutral-800" title={node.path}>{node.path}</dd>
      {!isDir && node.size != null && <>
        <dt className="text-neutral-500">크기</dt>
        <dd className="text-neutral-800">{formatSize(node.size)}</dd>
      </>}
      {node.mtime && <>
        <dt className="text-neutral-500">수정일</dt>
        <dd className="text-neutral-800">{formatDate(node.mtime)}</dd>
      </>}
    </dl>
  )
}

function ImageView({ node }: { node: FsNode }) {
  const [src] = useResource(imageResource, node.path)
  if (src === undefined) return <Header node={node} note="이미지 로딩 중…" />
  if (src === null) return <Header node={node} note="이미지를 찾을 수 없습니다" />
  return <img src={src} alt={node.name} className="mx-auto max-h-80 max-w-full rounded border border-neutral-200" />
}

function TextView({ node }: { node: FsNode }) {
  const [text] = useResource(textResource, node.path)
  if (text == null) return <pre aria-busy="true" className="rounded bg-neutral-50 p-3 text-xs" />
  return <pre className="overflow-auto rounded bg-neutral-50 p-3 text-xs leading-relaxed">{text}</pre>
}

function CodeView({ node }: { node: FsNode }) {
  const lang = extToLang(node.ext)
  const [text] = useResource(textResource, node.path)
  const [html] = useResource(codeHtmlResource, node.path, lang)
  if (text == null) return <pre aria-busy="true" className="rounded bg-neutral-50 p-3 text-xs" />
  const lineNoCx = '[counter-reset:line] [&_.line]:before:[counter-increment:line] [&_.line]:before:content-[counter(line)] [&_.line]:before:inline-block [&_.line]:before:w-8 [&_.line]:before:pr-3 [&_.line]:before:mr-3 [&_.line]:before:text-right [&_.line]:before:text-neutral-400 [&_.line]:before:select-none [&_.line]:before:border-r [&_.line]:before:border-neutral-200'
  if (html == null) return <pre data-lang={lang} className="overflow-auto rounded bg-neutral-50 p-3 text-xs">{text}</pre>
  return <div className={`overflow-auto rounded bg-neutral-50 p-3 text-xs [&_pre]:m-0 ${lineNoCx}`} dangerouslySetInnerHTML={{ __html: html }} />
}

function MarkdownView({ node }: { node: FsNode }) {
  const [html] = useResource(markdownHtmlResource, node.path)
  if (html == null) return <article aria-busy="true" className="text-sm" />
  return <article className="text-sm leading-relaxed text-neutral-800 [&_h1]:mt-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_p]:my-2 [&_code]:rounded [&_code]:bg-neutral-100 [&_code]:px-1" dangerouslySetInnerHTML={{ __html: html }} />
}
