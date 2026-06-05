import { useMemo } from "react";
import { Plate, PlateContent, usePlateEditor } from "@udecode/plate/react";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, Pilcrow } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PlateValue = any[];

export const EMPTY_VALUE: PlateValue = [
  { type: "p", children: [{ text: "" }] },
];

/**
 * Convert whatever shape we get from the API (string, array, or null)
 * into a valid Plate value (array of nodes). Falls back to wrapping plain
 * text in a single paragraph so old textarea-saved content still renders.
 */
export function normalizePlateValue(raw: unknown): PlateValue {
  if (Array.isArray(raw) && raw.length > 0) {
    const ok = raw.every(
      (n: any) => n && typeof n === "object" && Array.isArray(n.children)
    );
    if (ok) return raw as PlateValue;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return normalizePlateValue(parsed);
    } catch {
      return [{ type: "p", children: [{ text: raw }] }];
    }
  }
  return EMPTY_VALUE;
}

function renderElement({ attributes, children, element }: any) {
  switch (element.type) {
    case "h1":
      return (
        <h1 {...attributes} className="text-3xl font-bold mt-4 mb-2">
          {children}
        </h1>
      );
    case "h2":
      return (
        <h2 {...attributes} className="text-2xl font-semibold mt-3 mb-2">
          {children}
        </h2>
      );
    case "h3":
      return (
        <h3 {...attributes} className="text-xl font-semibold mt-2 mb-2">
          {children}
        </h3>
      );
    default:
      return (
        <p {...attributes} className="leading-7 mb-2">
          {children}
        </p>
      );
  }
}

function renderLeaf({ attributes, children, leaf }: any) {
  let el = children;
  if (leaf.bold) el = <strong>{el}</strong>;
  if (leaf.italic) el = <em>{el}</em>;
  if (leaf.underline) el = <u>{el}</u>;
  return <span {...attributes}>{el}</span>;
}

interface ToolbarProps {
  editor: any;
}

function Toolbar({ editor }: ToolbarProps) {
  const toggleMark = (key: string) => {
    const marks = editor.api.marks() || {};
    if ((marks as any)[key]) editor.tf.removeMark(key);
    else editor.tf.addMark(key, true);
    editor.tf.focus();
  };

  const setBlock = (type: string) => {
    editor.tf.setNodes({ type });
    editor.tf.focus();
  };

  const btn =
    "h-8 w-8 p-0 inline-flex items-center justify-center rounded border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-1 border border-input rounded-md p-1 mb-2 bg-muted/30">
      <Button type="button" variant="ghost" size="sm" className={btn} onClick={() => setBlock("h1")} title="Heading 1">
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} onClick={() => setBlock("h2")} title="Heading 2">
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} onClick={() => setBlock("h3")} title="Heading 3">
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} onClick={() => setBlock("p")} title="Paragraph">
        <Pilcrow className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-6 w-px bg-border" />
      <Button type="button" variant="ghost" size="sm" className={btn} onClick={() => toggleMark("bold")} title="Bold">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} onClick={() => toggleMark("italic")} title="Italic">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" className={btn} onClick={() => toggleMark("underline")} title="Underline">
        <UnderlineIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface Props {
  value: PlateValue;
  onChange?: (value: PlateValue) => void;
  readOnly?: boolean;
  placeholder?: string;
  /** A key that, when changed, forces the editor to remount with new value. */
  resetKey?: string | number;
}

export function PlateEditor({ value, onChange, readOnly, placeholder, resetKey }: Props) {
  // Build a fresh initial value when the resetKey changes (e.g. after fetch).
  const initial = useMemo(() => normalizePlateValue(value), [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = usePlateEditor(
    {
      plugins: [HeadingPlugin, BoldPlugin, ItalicPlugin, UnderlinePlugin],
      value: initial,
    },
    [resetKey]
  );

  if (!editor) return null;

  return (
    <Plate
      editor={editor}
      readOnly={readOnly}
      onValueChange={({ value }: any) => onChange?.(value as PlateValue)}
    >
      {!readOnly && <Toolbar editor={editor} />}
      <PlateContent
        className={
          readOnly
            ? "outline-none"
            : "min-h-[400px] rounded-md border border-input bg-background px-4 py-3 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        }
        placeholder={placeholder ?? "Start writing…"}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
      />
    </Plate>
  );
}
