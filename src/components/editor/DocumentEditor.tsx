"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  createEditorExtensions,
  fontFamilyOptions,
  fontSizeOptions,
  paragraphSpacingOptions,
  ribbonTabs,
  type RibbonTab,
} from "./editor-config";

const DEFAULT_ZOOM = 100;
const ZOOM_STEPS = [50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200];

type TabButtonProps = { active: boolean; children: React.ReactNode; onClick: () => void };

function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-white text-slate-900 shadow-[0_-2px_0_0_#2563eb_inset]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

type RibbonButtonProps = {
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  wide?: boolean;
};

function RibbonButton({ active = false, disabled = false, children, onClick, title, wide = false }: RibbonButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition",
        wide ? "min-w-24" : "min-w-16",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : active
            ? "border-blue-700 bg-blue-600 text-white shadow-sm"
            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

type RibbonGroupProps = { title: string; children: React.ReactNode; className?: string };

function RibbonGroup({ title, children, className = "" }: RibbonGroupProps) {
  return (
    <div className={`min-w-max rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm ${className}`}>
      <div className="flex items-end gap-3">{children}</div>
      <div className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</div>
    </div>
  );
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") { reject(new Error("Invalid image data.")); return; }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

function getActiveHeadingLabel(editorHeadings: Array<{ level: number; label: string }>, activeLevel: number | false) {
  if (!activeLevel) return "Paragraph";
  return editorHeadings.find((h) => h.level === activeLevel)?.label ?? "Paragraph";
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const headingOptions: Array<{ level: HeadingLevel; label: string }> = [
  { level: 1, label: "Heading 1" },
  { level: 2, label: "Heading 2" },
  { level: 3, label: "Heading 3" },
  { level: 4, label: "Heading 4" },
  { level: 5, label: "Heading 5" },
  { level: 6, label: "Heading 6" },
];

export default function DocumentEditor() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");
  const [ribbonOpen, setRibbonOpen] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [paragraphSpacing, setParagraphSpacing] = useState(2);
  const [statusMessage, setStatusMessage] = useState("");
  const [showRuler, setShowRuler] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [spellcheck, setSpellcheck] = useState(true);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const ribbonRef = useRef<HTMLDivElement | null>(null);
  const originalTitleRef = useRef<string>("Python Arena");
  const [imageToolbarPos, setImageToolbarPos] = useState<{ top: number; left: number } | null>(null);

  const zoomIn = useCallback(() => {
    setZoom((z) => { const next = ZOOM_STEPS.find((s) => s > z); return next ?? z; });
  }, []);
  const zoomOut = useCallback(() => {
    setZoom((z) => { const prev = [...ZOOM_STEPS].reverse().find((s) => s < z); return prev ?? z; });
  }, []);
  const zoomReset = useCallback(() => setZoom(DEFAULT_ZOOM), []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ribbonRef.current && !ribbonRef.current.contains(e.target as Node)) {
        setRibbonOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    originalTitleRef.current = document.title || originalTitleRef.current;
    const handleBeforePrint = () => { document.title = ""; };
    const handleAfterPrint = () => { document.title = originalTitleRef.current; };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.title = originalTitleRef.current;
    };
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const timeout = window.setTimeout(() => setStatusMessage(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const editor = useEditor({
    extensions: useMemo(() => createEditorExtensions(), []),
    content: '<div data-type="page"><p>Start typing here.</p></div>',
    editorProps: {
      attributes: {
        class: "prose-doc min-h-[calc(100%_-_2px)] outline-none text-[14px] leading-[1.7] text-slate-900",
        spellcheck: spellcheck ? "true" : "false",
      },
    },
    immediatelyRender: false,
  });

  const setMessage = (message: string) => setStatusMessage(message);

  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom as HTMLElement;
    el.spellcheck = spellcheck;
  }, [spellcheck, editor]);

  // Track image selection to show/hide floating toolbar
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      if (editor.isActive("imageResize")) {
        const { from } = editor.state.selection;
        const node = editor.view.domAtPos(from).node as HTMLElement;
        const el = node.nodeType === 1 ? node : (node.parentElement as HTMLElement);
        const img = el?.querySelector("img") ?? el?.closest("img") ?? el;
        if (img) {
          const rect = (img as HTMLElement).getBoundingClientRect();
          setImageToolbarPos({ top: rect.top + window.scrollY - 48, left: rect.left + window.scrollX + rect.width / 2 });
          return;
        }
      }
      setImageToolbarPos(null);
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const setImagePosition = (pos: "left" | "center" | "right" | "inline") => {
    if (!editor) return;
    let wrapperStyle = "";
    switch (pos) {
      case "left":    wrapperStyle = "float: left; margin: 4px 16px 8px 0; display: block;"; break;
      case "right":   wrapperStyle = "float: right; margin: 4px 0 8px 16px; display: block;"; break;
      case "center":  wrapperStyle = "display: flex; justify-content: center; margin: 8px auto; clear: both;"; break;
      case "inline":  wrapperStyle = "display: inline-block; margin: 2px 4px;"; break;
    }
    editor.chain().focus().updateAttributes("imageResize", { wrapperStyle }).run();
    setMessage(`Image: ${pos}`);
  };

  const insertPageBreak = () => {
    if (!editor) return;
    (editor.chain().focus() as unknown as { insertPageBreak: () => { run: () => void } }).insertPageBreak().run();
    setMessage("Page break inserted.");
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) { event.target.value = ""; return; }
    try {
      const src = await readImageFile(file);
      editor.chain().focus().setImage({ src }).run();
      setMessage("Image inserted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to insert image.");
    } finally {
      event.target.value = "";
    }
  };

  const insertLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter a link URL", previousUrl ?? "");
    if (url === null) return;
    if (!url.trim()) { editor.chain().focus().extendMarkRange("link").unsetLink().run(); setMessage("Link removed."); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    setMessage("Link inserted.");
  };

  const insertImageUrl = () => {
    if (!editor) return;
    const url = window.prompt("Enter image URL");
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
    setMessage("Image inserted.");
  };

  const resizeSelectedImage = (width: number) => {
    if (!editor) return;
    if (!editor.isActive("imageResize")) { setMessage("Select an image first."); return; }
    editor.chain().focus().updateAttributes("imageResize", {
      containerStyle: `width: ${width}px; height: auto; cursor: pointer;`,
      wrapperStyle: "display: flex; margin: 0;",
    }).run();
    setMessage(`Image width set to ${width}px.`);
  };

  const setHeading = (level: HeadingLevel | "paragraph") => {
    if (!editor) return;
    if (level === "paragraph") { editor.chain().focus().setParagraph().run(); return; }
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const clearFormatting = () => {
    if (!editor) return;
    editor.chain().focus().unsetAllMarks().clearNodes().run();
    setMessage("Formatting cleared.");
  };

  const printDoc = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const pageW = isLandscape ? "297mm" : "210mm";
    const pageH = isLandscape ? "210mm" : "297mm";
    const padX  = isLandscape ? "10mm" : "14mm";
    const padY  = isLandscape ? "10mm" : "16mm";
    const w = window.open("", "_blank");
    if (!w) { window.print(); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title></title>
<style>
  @page { size: ${pageW} ${pageH}; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: white; }
  body {
    width: ${pageW};
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.7;
    color: #000;
  }
  .page-node {
    width: ${pageW};
    height: ${pageH};
    padding: ${padY} ${padX};
    page-break-after: always;
    break-after: page;
    position: relative;
    overflow: hidden;
  }
  p { margin: ${paragraphSpacing}px 0; min-height: 1em; }
  h1 { font-size: 32px; font-weight: bold; margin: 8px 0; }
  h2 { font-size: 24px; font-weight: bold; margin: 8px 0; }
  h3 { font-size: 20px; font-weight: bold; margin: 6px 0; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #444; padding: 8px; }
  th { background: #f3f4f6; }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
  [data-type="page-break"] { page-break-after: always; break-after: page; display: block; height: 0; }
</style>
</head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  if (!mounted || !editor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-200 text-slate-700">
        Loading document editor...
      </div>
    );
  }

  const editorInstance = editor;
  const activeHeading = editorInstance.isActive("heading")
    ? (Number(editorInstance.getAttributes("heading").level) as HeadingLevel)
    : false;

  return (
    <div className="min-h-screen bg-[#d9dde5] text-slate-900">
      {/* ── Sticky ribbon ── */}
      <div
        ref={ribbonRef}
        className="sticky top-0 z-50 border-b border-slate-300 bg-[#eef1f6] shadow-[0_10px_30px_rgba(15,23,42,0.08)] print:hidden"
      >
        {/* Title / quick-access bar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-300 bg-[#f8fafc] px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-700 bg-blue-600 font-black text-white shadow-[0_3px_0_0_rgba(30,64,175,0.8)]">
              W
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Word-style Document Editor</p>
              <p className="text-xs text-slate-500">Rich ribbon • print layout • tables • images • links</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RibbonButton title="Undo" disabled={!editorInstance.can().chain().focus().undo().run()} onClick={() => editorInstance.chain().focus().undo().run()}>↶</RibbonButton>
            <RibbonButton title="Redo" disabled={!editorInstance.can().chain().focus().redo().run()} onClick={() => editorInstance.chain().focus().redo().run()}>↷</RibbonButton>
            <RibbonButton title="Print" onClick={printDoc} wide>Print / PDF</RibbonButton>
            <div className="flex items-center gap-0.5 rounded-md border border-slate-300 bg-white px-1 py-0.5">
              <button type="button" title="Zoom out" onClick={zoomOut} className="rounded px-2 py-1 text-sm font-bold text-slate-700 hover:bg-slate-100">−</button>
              <button type="button" title="Reset to 100%" onClick={zoomReset} className="min-w-[3rem] text-center text-xs font-semibold text-slate-700 hover:underline">{zoom}%</button>
              <button type="button" title="Zoom in" onClick={zoomIn} className="rounded px-2 py-1 text-sm font-bold text-slate-700 hover:bg-slate-100">+</button>
            </div>
          </div>
        </div>

        {/* Always-visible tab bar — clicking a tab expands the ribbon */}
        <div className="flex flex-wrap items-end gap-1 border-b border-slate-200 px-3 pt-1">
          {ribbonTabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => { setActiveTab(tab.id); setRibbonOpen(true); }}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>

        {/* Collapsible ribbon content */}
        {ribbonOpen && (
          <>

            {/* Tab content */}
            <div className="border-t border-slate-300 bg-[#fefefe] px-3 py-3">

              {/* HOME */}
              {activeTab === "home" && (
                <div className="flex flex-wrap items-start gap-3">
                  <RibbonGroup title="Clipboard">
                    <div className="flex flex-col gap-2">
                      <RibbonButton onClick={() => navigator.clipboard?.writeText(editorInstance.getText())} title="Copy plain text">Copy</RibbonButton>
                      <RibbonButton onClick={clearFormatting} title="Remove formatting">Clear</RibbonButton>
                    </div>
                  </RibbonGroup>

                  <RibbonGroup title="Font">
                    <div className="flex flex-col gap-2">
                      <select
                        value={editor.getAttributes("textStyle").fontFamily ?? fontFamilyOptions[0].value}
                        onChange={(e) => { editor.chain().focus().setFontFamily(e.target.value).run(); setMessage("Font updated."); }}
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                      >
                        {fontFamilyOptions.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
                      </select>
                      <select
                        value={editor.getAttributes("textStyle").fontSize ?? "14px"}
                        onChange={(e) => { editor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run(); setMessage("Font size updated."); }}
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                      >
                        {fontSizeOptions.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </RibbonGroup>

                  <RibbonGroup title="Formatting">
                    <div className="grid grid-cols-4 gap-2">
                      <RibbonButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>B</RibbonButton>
                      <RibbonButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>I</RibbonButton>
                      <RibbonButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</RibbonButton>
                      <RibbonButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>S</RibbonButton>
                      <RibbonButton active={editor.isActive("superscript")} onClick={() => editor.chain().focus().setMark("superscript").run()}>x²</RibbonButton>
                      <RibbonButton active={editor.isActive("subscript")} onClick={() => editor.chain().focus().setMark("subscript").run()}>x₂</RibbonButton>
                      <RibbonButton active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}>HL</RibbonButton>
                      <RibbonButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Insert horizontal line">—</RibbonButton>
                    </div>
                  </RibbonGroup>

                  <RibbonGroup title="Paragraph">
                    <div className="flex flex-col gap-2">
                      <select
                        value={activeHeading ? String(activeHeading) : "paragraph"}
                        onChange={(e) => {
                          const v = e.target.value === "paragraph" ? "paragraph" : (Number(e.target.value) as HeadingLevel);
                          setHeading(v); setMessage("Paragraph style updated.");
                        }}
                        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                      >
                        <option value="paragraph">Paragraph</option>
                        {headingOptions.map((h) => <option key={h.level} value={h.level}>{h.label}</option>)}
                      </select>
                      <div className="grid grid-cols-3 gap-2">
                        <RibbonButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>⬅</RibbonButton>
                        <RibbonButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>↔</RibbonButton>
                        <RibbonButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>➡</RibbonButton>
                        <RibbonButton active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify">☰</RibbonButton>
                        <RibbonButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</RibbonButton>
                        <RibbonButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</RibbonButton>
                      </div>
                    </div>
                  </RibbonGroup>

                  <RibbonGroup title="Colors">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        Text
                        <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} className="h-10 w-12 cursor-pointer rounded-md border border-slate-300 bg-white p-1" aria-label="Text color" />
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        Highlight
                        <input type="color" defaultValue="#fff176" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} className="h-10 w-12 cursor-pointer rounded-md border border-slate-300 bg-white p-1" aria-label="Highlight color" />
                      </label>
                    </div>
                  </RibbonGroup>
                </div>
              )}

              {/* INSERT */}
              {activeTab === "insert" && (
                <div className="flex flex-wrap items-start gap-3">
                  <RibbonGroup title="Media">
                    <div className="flex flex-col gap-2">
                      <RibbonButton onClick={insertImageUrl}>Image URL</RibbonButton>
                      <input ref={imageInputRef} id="editor-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <RibbonButton onClick={() => imageInputRef.current?.click()}>Upload Image</RibbonButton>
                      <RibbonButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>Divider</RibbonButton>
                      <RibbonButton onClick={insertPageBreak} title="Insert page break">Page Break</RibbonButton>
                    </div>
                  </RibbonGroup>
                  <RibbonGroup title="Objects">
                    <div className="flex flex-col gap-2">
                      <RibbonButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Insert Table</RibbonButton>
                      <RibbonButton onClick={insertLink}>Link</RibbonButton>
                    </div>
                  </RibbonGroup>
                  <RibbonGroup title="Table Rows">
                    <div className="grid grid-cols-2 gap-2">
                      <RibbonButton disabled={!editor.isActive("tableCell") && !editor.isActive("tableHeader")} onClick={() => editor.chain().focus().addRowBefore().run()} title="Add row above">+ Above</RibbonButton>
                      <RibbonButton disabled={!editor.isActive("tableCell") && !editor.isActive("tableHeader")} onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below">+ Below</RibbonButton>
                      <RibbonButton disabled={!editor.isActive("tableCell") && !editor.isActive("tableHeader")} onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">Del Row</RibbonButton>
                      <RibbonButton disabled={!editor.isActive("tableCell") && !editor.isActive("tableHeader")} onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">Del Table</RibbonButton>
                    </div>
                  </RibbonGroup>
                  <RibbonGroup title="Table Cols">
                    <div className="grid grid-cols-2 gap-2">
                      <RibbonButton disabled={!editor.isActive("tableCell") && !editor.isActive("tableHeader")} onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add column left">+ Left</RibbonButton>
                      <RibbonButton disabled={!editor.isActive("tableCell") && !editor.isActive("tableHeader")} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column right">+ Right</RibbonButton>
                      <RibbonButton disabled={!editor.isActive("tableCell") && !editor.isActive("tableHeader")} onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">Del Col</RibbonButton>
                      <RibbonButton disabled={!editor.isActive("tableCell") && !editor.isActive("tableHeader")} onClick={() => editor.chain().focus().mergeOrSplit().run()} title="Merge / split cells">Merge</RibbonButton>
                    </div>
                  </RibbonGroup>
                  <RibbonGroup title="Image Size">
                    <div className="grid grid-cols-2 gap-2">
                      <RibbonButton onClick={() => resizeSelectedImage(240)} disabled={!editor.isActive("imageResize")}>Small</RibbonButton>
                      <RibbonButton onClick={() => resizeSelectedImage(360)} disabled={!editor.isActive("imageResize")}>Medium</RibbonButton>
                      <RibbonButton onClick={() => resizeSelectedImage(540)} disabled={!editor.isActive("imageResize")}>Large</RibbonButton>
                      <RibbonButton onClick={() => resizeSelectedImage(720)} disabled={!editor.isActive("imageResize")}>XL</RibbonButton>
                    </div>
                  </RibbonGroup>
                </div>
              )}

              {/* LAYOUT */}
              {activeTab === "layout" && (
                <div className="flex flex-wrap items-start gap-3">
                  <RibbonGroup title="Page Setup">
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <RibbonButton active={!isLandscape} onClick={() => setIsLandscape(false)}>Portrait</RibbonButton>
                        <RibbonButton active={isLandscape} onClick={() => setIsLandscape(true)}>Landscape</RibbonButton>
                      </div>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        Spacing
                        <select value={paragraphSpacing} onChange={(e) => setParagraphSpacing(Number(e.target.value))} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900">
                          {paragraphSpacingOptions.map((o) => <option key={o.label} value={o.value}>{o.label}px</option>)}
                        </select>
                      </label>
                    </div>
                  </RibbonGroup>
                  <RibbonGroup title="View">
                    <div className="flex flex-col gap-2">
                      <RibbonButton active={showRuler} onClick={() => setShowRuler((v) => !v)}>{showRuler ? "Hide ruler" : "Show ruler"}</RibbonButton>
                      <RibbonButton onClick={() => window.print()}>Print / PDF</RibbonButton>
                    </div>
                  </RibbonGroup>
                </div>
              )}

              {/* REVIEW */}
              {activeTab === "review" && (
                <div className="flex flex-wrap items-start gap-3">
                  <RibbonGroup title="Proofing">
                    <div className="flex flex-col gap-2">
                      <RibbonButton onClick={() => window.alert("Comment tools can be wired here next.")}>Add comment</RibbonButton>
                      <RibbonButton
                        active={spellcheck}
                        onClick={() => { setSpellcheck((v) => !v); setMessage(spellcheck ? "Spell check off." : "Spell check on."); }}
                      >
                        {spellcheck ? "Spell check ✓" : "Spell check"}
                      </RibbonButton>
                    </div>
                  </RibbonGroup>
                  <RibbonGroup title="Editing">
                    <div className="flex flex-col gap-2">
                      <RibbonButton onClick={() => editor.chain().focus().selectAll().run()}>Select all</RibbonButton>
                      <RibbonButton onClick={clearFormatting}>Clear formatting</RibbonButton>
                    </div>
                  </RibbonGroup>
                </div>
              )}

              {/* VIEW */}
              {activeTab === "view" && (
                <div className="flex flex-wrap items-start gap-3">
                  <RibbonGroup title="Layout">
                    <div className="flex flex-col gap-2">
                      <RibbonButton active={showRuler} onClick={() => setShowRuler((v) => !v)}>Ruler</RibbonButton>
                      <RibbonButton active={isLandscape} onClick={() => setIsLandscape((v) => !v)}>Page orientation</RibbonButton>
                    </div>
                  </RibbonGroup>
                  <RibbonGroup title="Zoom">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <RibbonButton onClick={zoomOut} title="Zoom out">−</RibbonButton>
                        <button type="button" onClick={zoomReset} title="Reset to 100%" className="min-w-[3.5rem] rounded-md border border-slate-300 bg-white px-2 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">{zoom}%</button>
                        <RibbonButton onClick={zoomIn} title="Zoom in">+</RibbonButton>
                      </div>
                      <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900">
                        {ZOOM_STEPS.map((z) => <option key={z} value={z}>{z}%</option>)}
                      </select>
                    </div>
                  </RibbonGroup>
                </div>
              )}
            </div>

            {/* Status bar */}
            {statusMessage && (
              <div className="border-t border-slate-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800" role="status">
                {statusMessage}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Page canvas ── */}
      <div className="flex justify-center overflow-auto px-4 pb-10 pt-6">
        <div className="w-full max-w-[calc(100vw-2rem)] overflow-auto">
          {showRuler && (
            <div className="mx-auto mb-2 h-6 w-full max-w-[210mm] rounded-md border border-slate-300 bg-[linear-gradient(90deg,#e5e7eb_0,#e5e7eb_1px,transparent_1px,transparent_10%,#d1d5db_10%,#d1d5db_10.1%,transparent_10.1%,transparent_20%,#e5e7eb_20%,#e5e7eb_21px,transparent_21px)] opacity-80" />
          )}
          <div
            className={["editor-print-area mx-auto rounded-sm", isLandscape ? "is-landscape" : "is-portrait"].join(" ")}
            style={{
              width: isLandscape ? "297mm" : "210mm",
              minHeight: isLandscape ? "210mm" : "297mm",
              fontFamily: "Arial, sans-serif",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              ["--page-padding-x" as string]: isLandscape ? "10mm" : "14mm",
              ["--page-padding-y" as string]: isLandscape ? "10mm" : "16mm",
              ["--paragraph-gap" as string]: `${paragraphSpacing}px`,
            } as React.CSSProperties}
          >
            <EditorContent editor={editor} spellCheck={spellcheck} />
          </div>
        </div>
      </div>

      {/* Image floating toolbar — appears when an image is selected */}
      {imageToolbarPos && (
        <div
          style={{
            position: "fixed",
            top: imageToolbarPos.top,
            left: imageToolbarPos.left,
            transform: "translateX(-50%)",
            zIndex: 9999,
          }}
          onMouseDown={(ev) => ev.preventDefault()}
        >
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-xl">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Position</span>
            {(["left", "center", "right", "inline"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setImagePosition(p)}
                className="rounded px-2 py-1 text-xs font-medium capitalize text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {p === "left" ? "⬅ Left" : p === "center" ? "↔ Center" : p === "right" ? "Right ➡" : "Inline"}
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Size</span>
            {([240, 360, 540, 720] as const).map((w, i) => (
              <button
                key={w}
                type="button"
                onClick={() => resizeSelectedImage(w)}
                className="rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {["S", "M", "L", "XL"][i]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
