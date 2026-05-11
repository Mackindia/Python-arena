"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function TiptapEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-[220px] rounded-b-xl border border-white/10 bg-black/40 p-3 text-sm text-white focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-300">Loading editor...</div>;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20">
      <div className="flex gap-2 border-b border-white/10 p-2 text-xs">
        <button type="button" className="rounded bg-white/10 px-2 py-1" onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
        <button type="button" className="rounded bg-white/10 px-2 py-1" onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</button>
        <button type="button" className="rounded bg-white/10 px-2 py-1" onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullets</button>
        <button type="button" className="rounded bg-white/10 px-2 py-1" onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
