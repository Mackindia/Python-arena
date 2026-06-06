"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import FontFamily from "@tiptap/extension-font-family";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Table as TableIcon, Type, Palette, Highlighter,
  Save, CheckCircle2, Loader2, Printer, Heading1, Heading2, Heading3, Minus,
  ArrowLeft, ImageIcon, Subscript as SubIcon, Superscript as SupIcon, ExternalLink
} from "lucide-react";

type Props = {
  documentId: string;
  initialContent: string;
  title: string;
  onBack: () => void;
  readOnly?: boolean;
  sourceFileUrl?: string;
};

export default function DocumentEditor({ documentId, initialContent, title, onBack, readOnly, sourceFileUrl }: Props) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    initialContent.includes("<table") && initialContent.length > 5000 ? "landscape" : "portrait"
  );
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
      FontFamily,
      Subscript,
      Superscript,
    ],
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[600px] focus:outline-none text-[15px] leading-relaxed text-black",
      },
    },
    onUpdate: () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => saveDocument(), 3000);
    },
  });

  const saveDocument = useCallback(async () => {
    if (!editor || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editor.getHTML() }),
      });
      if (res.ok) setLastSaved(new Date().toLocaleTimeString());
    } catch { /* silent */ }
    setSaving(false);
  }, [editor, documentId, saving]);

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

  if (!editor) return null;

  const ToolBtn = ({ onClick, active, children, tip }: { onClick: () => void; active?: boolean; children: React.ReactNode; tip?: string }) => (
    <button type="button" onClick={onClick} title={tip}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${active ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}>
      {children}
    </button>
  );

  const Separator = () => <div className="mx-1 h-6 w-px bg-white/10" />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-white truncate max-w-[300px]">{title}</h2>
            <p className="text-[11px] text-slate-400">
              {saving ? <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>
                : lastSaved ? <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Saved at {lastSaved}</span>
                : "Auto-save enabled"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Orientation Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1 mr-2">
            <button onClick={() => setOrientation("portrait")} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${orientation === "portrait" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}>
              Portrait
            </button>
            <button onClick={() => setOrientation("landscape")} 
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${orientation === "landscape" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}>
              Landscape
            </button>
          </div>

          {sourceFileUrl && (
            <a
              href={sourceFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20 mr-1"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Uploaded Format
            </a>
          )}

          <button onClick={saveDocument} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> Save
          </button>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-slate-950/80 px-3 py-2">
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} tip="Bold"><Bold className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} tip="Italic"><Italic className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} tip="Underline"><UnderlineIcon className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} tip="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} tip="Subscript"><SubIcon className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} tip="Superscript"><SupIcon className="h-4 w-4" /></ToolBtn>
          <Separator />
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} tip="Heading 1"><Heading1 className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} tip="Heading 2"><Heading2 className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} tip="Heading 3"><Heading3 className="h-4 w-4" /></ToolBtn>
          <Separator />
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} tip="Align Left"><AlignLeft className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} tip="Align Center"><AlignCenter className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} tip="Align Right"><AlignRight className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} tip="Justify"><AlignJustify className="h-4 w-4" /></ToolBtn>
          <Separator />
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} tip="Bullet List"><List className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} tip="Numbered List"><ListOrdered className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} tip="Horizontal Rule"><Minus className="h-4 w-4" /></ToolBtn>
          <Separator />
          <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} tip="Insert Table"><TableIcon className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => { const url = prompt("Image URL:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }} tip="Insert Image"><ImageIcon className="h-4 w-4" /></ToolBtn>
          <Separator />
          <div className="flex items-center gap-1">
            <Type className="h-3.5 w-3.5 text-slate-500" />
            <input type="color" className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent" title="Text Color"
              onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} />
          </div>
          <div className="flex items-center gap-1">
            <Highlighter className="h-3.5 w-3.5 text-slate-500" />
            <input type="color" defaultValue="#fef08a" className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent" title="Highlight"
              onInput={(e) => editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()} />
          </div>
          <Separator />
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} tip="Undo"><Undo className="h-4 w-4" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} tip="Redo"><Redo className="h-4 w-4" /></ToolBtn>
          <Separator />
          <select className="h-8 rounded-lg border border-white/10 bg-black/30 px-2 text-xs text-white"
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}>
            <option value="">Font</option>
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
      )}

      {/* Editor Canvas */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-8">
        <div className={`mx-auto rounded-xl border border-slate-300 bg-white text-black shadow-2xl transition-all duration-300 print:border-0 print:shadow-none print:m-0 print:max-w-none ${orientation === "landscape" ? "max-w-[1123px]" : "max-w-[816px]"}`}>
          <div className="overflow-x-auto p-8">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
