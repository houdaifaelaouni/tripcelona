"use client";

/**
 * Image picker for the media upload form, built on the Untitled UI file
 * uploader (MIT, © 2025 Untitled UI, vendored in src/components/uui). The
 * chosen file is copied into a real <input type="file" name="file"> so the
 * server action receives it as before.
 */
import { useRef, useState } from "react";
import {
  FileListItemProgressFill,
  FileUploadDropZone,
} from "@/components/uui/application/file-upload/file-upload-base";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const MAX = 10 * 1024 * 1024;

export function MediaDropzone({ required = true }: { required?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();

  function pick(files: FileList) {
    const f = files[0];
    if (!f || !input.current) return;
    const dt = new DataTransfer();
    dt.items.add(f);
    input.current.files = dt.files;
    setFile(f);
    setError(undefined);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-secondary">Imagen</p>
      <FileUploadDropZone
        accept={ACCEPT}
        maxSize={MAX}
        allowsMultiple={false}
        hint="JPG, PNG, WebP, AVIF o GIF (máx. 10 MB)"
        onDropFiles={pick}
        onDropUnacceptedFiles={() => setError("Ese formato no se admite.")}
        onSizeLimitExceed={() => setError("La imagen pesa más de 10 MB.")}
      />
      <input
        ref={input}
        name="file"
        type="file"
        accept={ACCEPT}
        required={required}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => e.target.files && pick(e.target.files)}
      />
      {error && (
        <p role="alert" className="text-sm text-error-primary">
          {error}
        </p>
      )}
      {file && (
        <ul>
          <FileListItemProgressFill
            name={file.name}
            size={file.size}
            progress={100}
            type={file.type.includes("png") ? "png" : file.type.includes("gif") ? "gif" : "jpg"}
            onDelete={() => {
              setFile(null);
              if (input.current) input.current.value = "";
            }}
          />
        </ul>
      )}
    </div>
  );
}
