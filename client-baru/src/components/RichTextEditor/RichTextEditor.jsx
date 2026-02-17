import React, { useEffect, useMemo, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

let isResizeModuleRegistered = false;

const RichTextEditor = ({ value, onChange, onImageUpload, editorRef }) => {
  const editorContainerRef = useRef(null);
  const quillInstanceRef = useRef(null);
  const isApplyingExternalValueRef = useRef(false);
  const latestImageHandlerRef = useRef(onImageUpload);

  latestImageHandlerRef.current = onImageUpload;

  const toolbarConfig = useMemo(
    () => [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const mountNode = editorContainerRef.current;

    const initEditor = async () => {
      try {
        if (!mountNode || quillInstanceRef.current) return;

        if (typeof window !== "undefined") {
          window.Quill = Quill;
        }

        if (!isResizeModuleRegistered) {
          const hasResizeModule = Boolean(Quill.imports?.["modules/imageResize"]);
          if (!hasResizeModule) {
            const resizeModule = await import("quill-image-resize-module");
            const ImageResize = resizeModule.default || resizeModule;
            Quill.register("modules/imageResize", ImageResize);
          }
          isResizeModuleRegistered = true;
        }

        if (!isMounted) return;

        const quill = new Quill(mountNode, {
          theme: "snow",
          modules: {
            toolbar: {
              container: toolbarConfig,
              handlers: {
                image: () => {
                  if (typeof latestImageHandlerRef.current === "function") {
                    latestImageHandlerRef.current();
                  }
                },
              },
            },
            imageResize: {
              parchment: Quill.import("parchment"),
            },
          },
          formats: [
            "header",
            "bold",
            "italic",
            "underline",
            "strike",
            "list",
            "bullet",
            "color",
            "background",
            "align",
            "link",
            "image",
          ],
        });

        quillInstanceRef.current = quill;

        if (editorRef) {
          editorRef.current = {
            getEditor: () => quill,
          };
        }

        const initialHtml = value || "";
        quill.clipboard.dangerouslyPasteHTML(initialHtml);

        quill.on("text-change", () => {
          if (isApplyingExternalValueRef.current) return;
          const html = quill.root.innerHTML;
          if (typeof onChange === "function") onChange(html);
        });
      } catch (error) {
        console.error("Gagal inisialisasi Quill editor:", error);
      }
    };

    initEditor();

    return () => {
      isMounted = false;
      if (editorRef) editorRef.current = null;
      if (mountNode) mountNode.innerHTML = "";
      quillInstanceRef.current = null;
    };
    // Inisialisasi editor harus sekali agar toolbar tidak dobel di React StrictMode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (!quill) return;

    const currentHtml = quill.root.innerHTML;
    const nextHtml = value || "";
    if (currentHtml === nextHtml) return;

    const selection = quill.getSelection();
    isApplyingExternalValueRef.current = true;
    quill.clipboard.dangerouslyPasteHTML(nextHtml);
    if (selection) {
      quill.setSelection(selection.index, selection.length, "silent");
    }
    isApplyingExternalValueRef.current = false;
  }, [value]);

  return (
    <div style={{ background: "#fff", borderRadius: "8px" }}>
      <div ref={editorContainerRef} />
    </div>
  );
};

export default RichTextEditor;
