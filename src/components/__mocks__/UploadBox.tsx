import React from 'react';

interface Props {
  onFileSelected?: (file: File) => void;
  previewUrl?: string | null;
}

const UploadBox: React.FC<Props> = ({ onFileSelected, previewUrl }) => (
  <div data-testid="upload-box">
    <input
      type="file"
      aria-label="upload"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file && onFileSelected) {
          onFileSelected(file);
        }
      }}
    />
    {previewUrl && <img src={previewUrl} alt="preview" />}
    <span>Drag and drop</span>
  </div>
);

export default UploadBox;