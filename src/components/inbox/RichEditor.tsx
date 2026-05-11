'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, List, ListOrdered, Link2, Image as ImageIcon,
  Strikethrough, Code, Undo, Redo
} from 'lucide-react'
import { useState } from 'react'

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichEditor({ value, onChange, placeholder = 'Write your message…' }: RichEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[180px] px-3 py-2.5',
      },
    },
  })

  if (!editor) return null

  function applyLink() {
    if (!linkUrl) return
    editor!.chain().focus().setLink({ href: linkUrl }).run()
    setLinkUrl('')
    setShowLinkInput(false)
  }

  function insertImage() {
    if (!imageUrl) return
    editor!.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl('')
    setShowImageInput(false)
  }

  const ToolBtn = ({
    onClick, active, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded transition-colors"
      style={{
        backgroundColor: active ? 'var(--color-accent)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-accent)' }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
    >
      {children}
    </button>
  )

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap"
        style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}
      >
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} title="Bold">
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} title="Italic">
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')} title="Inline code">
          <Code size={14} />
        </ToolBtn>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} title="Bullet list">
          <List size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered size={14} />
        </ToolBtn>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

        {/* Link */}
        <ToolBtn onClick={() => { setShowLinkInput(!showLinkInput); setShowImageInput(false) }}
          active={editor.isActive('link') || showLinkInput} title="Insert link">
          <Link2 size={14} />
        </ToolBtn>

        {/* Image */}
        <ToolBtn onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false) }}
          active={showImageInput} title="Insert image by URL">
          <ImageIcon size={14} />
        </ToolBtn>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={14} />
        </ToolBtn>
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b"
          style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface)' }}>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyLink()}
            placeholder="https://example.com"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--color-foreground)' }}
            autoFocus
          />
          <button type="button" onClick={applyLink}
            className="text-xs font-medium px-2 py-1 rounded"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            Apply
          </button>
          <button type="button" onClick={() => setShowLinkInput(false)}
            className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Image URL input */}
      {showImageInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b"
          style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface)' }}>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertImage()}
            placeholder="Paste image URL…"
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--color-foreground)' }}
            autoFocus
          />
          <button type="button" onClick={insertImage}
            className="text-xs font-medium px-2 py-1 rounded"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            Insert
          </button>
          <button type="button" onClick={() => setShowImageInput(false)}
            className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
