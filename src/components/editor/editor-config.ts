import { Extension, Node, mergeAttributes, type AnyExtension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import Document from "@tiptap/extension-document";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import StarterKit from "@tiptap/starter-kit";
import ImageResize from "tiptap-extension-resize-image";

export type RibbonTab = "home" | "insert" | "layout" | "review" | "view";

export const ribbonTabs: Array<{ id: RibbonTab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "insert", label: "Insert" },
  { id: "layout", label: "Layout" },
  { id: "review", label: "Review" },
  { id: "view", label: "View" },
];

export const fontFamilyOptions = [
  { label: "Aptos", value: '"Aptos", Arial, sans-serif' },
  { label: "Calibri", value: '"Calibri", "Aptos", Arial, sans-serif' },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Cambria", value: '"Cambria", Georgia, serif' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
  { label: "Noto Sans Devanagari", value: '"Noto Sans Devanagari", Arial, sans-serif' },
];

export const fontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72].map(
  (size) => ({
    label: `${size}`,
    value: `${size}px`,
  }),
);

export const paragraphSpacingOptions = [0, 1, 2, 4, 6, 8, 12, 16, 20].map((spacing) => ({
  label: `${spacing}`,
  value: spacing,
}));

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ── Page Break node ─────────────────────────────────────────────────────────
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "page-break", class: "page-break-node" })];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name }),
    } as Record<string, unknown>;
  },
});

// ── True Pagination Architecture ──

export const PaginatedDocument = Document.extend({
  content: "page+",
});

export const Page = Node.create({
  name: "page",
  group: "block",
  content: "block+",
  parseHTML() { return [{ tag: 'div[data-type="page"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "page", class: "page-node" }), 0];
  },
});

export const PaginationPlugin = Extension.create({
  name: "pagination",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("pagination"),
        view() {
          return {
            update: (view) => {
              setTimeout(() => { if (!view.isDestroyed) balancePages(view); }, 100);
            },
          };
        },
      }),
    ];
  },
});

function balancePages(view: any) {
  const state = view.state;
  const tr = state.tr;
  let modified = false;
  const doc = state.doc;

  let offset = 0;
  for (let i = 0; i < doc.childCount; i++) {
    const page = doc.child(i);
    const pagePos = offset;
    offset += page.nodeSize;

    const dom = view.nodeDOM(pagePos) as HTMLElement;
    if (!dom) continue;

    if (dom.scrollHeight > dom.clientHeight && page.childCount > 1) {
      const lastChild = page.lastChild!;
      const lastChildPos = pagePos + page.nodeSize - lastChild.nodeSize - 1;

      tr.delete(lastChildPos, lastChildPos + lastChild.nodeSize);

      if (i < doc.childCount - 1) {
        tr.insert(offset - lastChild.nodeSize, lastChild);
      } else {
        const newPage = state.schema.nodes.page.create(null, [lastChild]);
        tr.insert(offset - lastChild.nodeSize, newPage);
      }
      modified = true;
      break;
    }
  }

  if (!modified) {
    offset = 0;
    for (let i = 0; i < doc.childCount; i++) {
      const page = doc.child(i);
      const pagePos = offset;
      offset += page.nodeSize;

      const dom = view.nodeDOM(pagePos) as HTMLElement;
      if (!dom) continue;

      if (dom.scrollHeight <= dom.clientHeight && i < doc.childCount - 1) {
        const nextPage = doc.child(i + 1);
        if (nextPage.childCount > 0) {
          const nextDom = view.nodeDOM(offset) as HTMLElement;
          const firstChildDom = nextDom?.firstElementChild as HTMLElement;

          if (firstChildDom) {
            const freeSpace = dom.clientHeight - dom.scrollHeight;
            if (freeSpace > firstChildDom.offsetHeight + 10) {
              const firstChild = nextPage.firstChild!;
              const firstChildPos = offset + 1;
              tr.delete(firstChildPos, firstChildPos + firstChild.nodeSize);
              tr.insert(pagePos + page.nodeSize - 1, firstChild);
              modified = true;
              break;
            }
          }
        }
      }

      if (page.childCount === 0 && doc.childCount > 1) {
        tr.delete(pagePos, pagePos + page.nodeSize);
        modified = true;
        break;
      }
    }
  }

  if (modified) {
    view.dispatch(tr);
  }
}

export function createEditorExtensions(): AnyExtension[] {
  return [
    PaginatedDocument,
    Page,
    PaginationPlugin,
    StarterKit.configure({
      document: false,
    }),
    Underline,
    TextStyle,
    FontFamily,
    FontSize,
    Color,
    Highlight.configure({ multicolor: true }),
    Typography,
    Superscript,
    Subscript,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    ImageResize.configure({
      inline: false,
      allowBase64: true,
      minWidth: 120,
      maxWidth: 1400,
    }),
    Table.configure({
      resizable: true,
    }),
    PageBreak,
    TableRow,
    TableHeader,
    TableCell,
  ] as AnyExtension[];
}
