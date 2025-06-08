
import { useDropzone } from "react-dropzone";

interface UploadBoxProps {
  onFileSelected: (file: File) => void;
  previewUrl?: string | null;
}

const UploadBox = ({ onFileSelected, previewUrl }: UploadBoxProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: ([file]) => file && onFileSelected(file),
  });

  return (
    <div
      {...getRootProps()}
      className={
        "flex flex-col items-center justify-center h-60 border-2 border-dashed rounded cursor-pointer transition-colors " +
        (isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50")
      }
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <div className="space-y-2">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-20 h-16 object-cover rounded mx-auto"
          />
          <p className="text-sm text-blue-600">Click or drop to change image</p>
        </div>
      ) : (
        <>
          <p className="text-slate-500 text-center px-4">
            {isDragActive ? "Drop the image here…" : "Upload or drag a photo of your dream boat"}
          </p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 10 MB</p>
        </>
      )}
    </div>
  );
};

export default UploadBox;
