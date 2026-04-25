import { useMemo, useRef, useCallback } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Props = {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
};

export function ArticleRichEditor({ id, value, onChange, className, placeholder }: Props) {
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const quill = quillRef.current?.getEditor();
      if (!quill) return;
      try {
        const { url } = await api.uploadImage(file);
        const range = quill.getSelection(true);
        const index = range?.index ?? Math.max(0, quill.getLength() - 1);
        quill.insertEmbed(index, "image", url, "user");
        quill.setSelection(index + 1, 0, "silent");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "فشل رفع الصورة");
      }
    };
    input.click();
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          [{ size: ["small", false, "large", "huge"] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ script: "sub" }, { script: "super" }],
          [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          [{ direction: "rtl" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler],
  );

  /** Quill uses one `list` format (values ordered | bullet); `bullet` is not a separate format name. */
  const formats = [
    "header",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "indent",
    "align",
    "direction",
    "blockquote",
    "code-block",
    "link",
    "image",
  ];

  return (
    <div
      id={id}
      className={cn(
        "article-rich-editor flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-md border border-input bg-background",
        className,
      )}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="flex min-h-0 flex-1 flex-col [&_.ql-container]:flex [&_.ql-container]:min-h-0 [&_.ql-container]:min-h-[380px] [&_.ql-container]:flex-1 [&_.ql-container]:flex-col [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[360px] [&_.ql-editor]:flex-1 [&_.ql-editor]:border-0 [&_.ql-editor]:px-3 [&_.ql-editor]:py-3 [&_.ql-editor]:text-base [&_.ql-toolbar]:sticky [&_.ql-toolbar]:top-0 [&_.ql-toolbar]:z-10 [&_.ql-toolbar]:shrink-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-border [&_.ql-toolbar]:bg-muted/40"
      />
    </div>
  );
}
