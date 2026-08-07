"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { MediaPicker } from "@/components/admin/media/media-picker";

/**
 * The visual editor.
 *
 * Writes ordinary HTML — headings, lists, links, images, tables — which is
 * what the rest of the CMS already stores and renders. Nothing here needs a
 * new format, a compile step, or a change to how a page is served.
 *
 * What it will not do is hold a pasted layout: TipTap has a schema and drops
 * anything outside it, silently. The page builder decides which mode to open
 * in and warns before switching; this component is only responsible for the
 * content it is given.
 */

/** A toolbar button that knows whether its mark is currently on. */
function ToolButton({ onClick, active, disabled, title, children }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
      onMouseDown={(e) => e.preventDefault()} // keep the selection
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={!!active}
    >
      {children}
    </Button>
  );
}

const Divider = () => <span className="mx-1 h-6 w-px shrink-0 bg-border" />;

export function RichTextEditor({ value, onChange, placeholder }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");

  const editor = useEditor({
    // Rendering on the server would produce markup React then disagrees with
    // on hydration; the editor is admin-only, so waiting for the client costs
    // nothing anybody sees.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Configured separately below, so switch off the bundled copies rather
        // than register each extension twice.
        link: false,
        underline: false,
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        // Anything else — javascript:, data: — has no business in a link, and
        // the server would strip it on save anyway.
        protocols: ["http", "https", "mailto", "tel"],
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder || "Write the page…",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "cms-page min-h-[320px] max-w-none px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => {
      // An empty document serialises as "<p></p>"; treat that as nothing, or
      // every untouched page saves a stray paragraph.
      const html = e.isEmpty ? "" : e.getHTML();
      onChange?.(html);
    },
  });

  // Content replaced from outside — switching modes, or restoring a revision.
  // Guarded, because writing back the editor's own output would move the
  // cursor to the start on every keystroke.
  useEffect(() => {
    if (!editor) return;
    const incoming = value || "";
    if (incoming !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[380px] rounded-lg border bg-muted/30" aria-busy="true" />
    );
  }

  const applyLink = () => {
    const href = linkHref.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
    setLinkHref("");
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
        <ToolButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolButton>

        <Divider />

        <ToolButton
          title="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Subheading"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolButton>

        <Divider />

        <ToolButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolButton>

        <Divider />

        <ToolButton
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Align centre"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolButton>

        <Divider />

        <ToolButton
          title="Link"
          active={editor.isActive("link")}
          onClick={() => {
            setLinkHref(editor.getAttributes("link")?.href || "");
            setLinkOpen(true);
          }}
        >
          <Link2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Remove link"
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Link2Off className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Insert image" onClick={() => setPickerOpen(true)}>
          <ImagePlus className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon className="h-4 w-4" />
        </ToolButton>

        <Divider />

        <ToolButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolButton>
      </div>

      <EditorContent editor={editor} />

      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(asset) => {
          editor
            .chain()
            .focus()
            .setImage({ src: asset.url, alt: asset.altText || asset.originalName || "" })
            .run();
        }}
      />

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="href">Address</Label>
            <Input
              id="href"
              value={linkHref}
              onChange={(e) => setLinkHref(e.target.value)}
              placeholder="/pages/maldives/huraa-guide  or  https://…"
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
            />
            <p className="text-xs text-muted-foreground">
              Leave it empty to remove the link.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyLink}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
