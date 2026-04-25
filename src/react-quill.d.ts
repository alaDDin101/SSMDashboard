declare module "react-quill" {
  import type * as React from "react";

  export interface QuillEditor {
    getLength(): number;
    getSelection(focus?: boolean): { index: number; length: number } | null;
    insertEmbed(index: number, type: string, value: unknown, source?: string): void;
    setSelection(index: number, length: number, source?: string): void;
  }

  export interface ReactQuillProps {
    theme?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (content: string, delta: unknown, source: string, editor: QuillEditor) => void;
    modules?: Record<string, unknown>;
    formats?: string[];
    placeholder?: string;
    className?: string;
  }

  export default class ReactQuill extends React.Component<ReactQuillProps> {
    getEditor(): QuillEditor;
    focus(): void;
    blur(): void;
  }
}
