import React, { useId, useMemo } from "react";
import { Images, UploadCloud, X } from "lucide-react";
import "./ImagePickerField.css";

const ImagePickerField = ({
  label,
  hint,
  previews = [],
  onPick,
  onRemove,
  multiple = true,
}) => {
  const inputId = useId();
  const hasImages = previews.length > 0;
  const summaryText = useMemo(() => {
    if (!hasImages) return "Belum ada gambar dipilih";
    return `${previews.length} gambar dipilih`;
  }, [hasImages, previews.length]);

  return (
    <div className="image-picker">
      <div className="image-picker-header">
        <div>
          <div className="image-picker-label">{label}</div>
          {hint ? <div className="image-picker-hint">{hint}</div> : null}
        </div>
        <div className="image-picker-count">{summaryText}</div>
      </div>

      <label className="image-picker-dropzone" htmlFor={inputId}>
        <UploadCloud size={18} />
        <span>{multiple ? "Pilih beberapa gambar" : "Pilih satu gambar"}</span>
        <small>PNG, JPG, WEBP</small>
      </label>
      <input
        id={inputId}
        type="file"
        multiple={multiple}
        accept="image/*"
        className="image-picker-input"
        onChange={onPick}
      />

      {hasImages ? (
        <div className="image-picker-grid">
          {previews.map((url, index) => (
            <div className="image-picker-item" key={`${url}-${index}`}>
              <img src={url} alt={`${label} ${index + 1}`} />
              <button
                type="button"
                className="image-picker-remove"
                onClick={() => onRemove(index)}
                aria-label={`Hapus gambar ${index + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="image-picker-empty">
          <Images size={16} />
          Preview akan muncul di sini
        </div>
      )}
    </div>
  );
};

export default ImagePickerField;
