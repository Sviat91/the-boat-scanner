
import { useDropzone } from "react-dropzone";

interface UploadBoxProps {
  onFileSelected: (file: File) => void;
  previewUrl?: string | null;
}

const UploadBox = ({ onFileSelected, previewUrl }: UploadBoxProps) => {
  console.log('UploadBox rendering with previewUrl:', previewUrl);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: ([file]) => {
      console.log('File dropped:', file);
      if (file) onFileSelected(file);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={
        "flex flex-col items-center justify-center h-60 rounded cursor-pointer transition-colors " +
        (isDragActive 
          ? "bg-blue-50 dark:bg-blue-900/20" 
          : "hover:bg-blue-50 dark:hover:bg-blue-900/20")
      }
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <div className="flex flex-col items-center w-full h-full space-y-4">
          <div className="flex items-center justify-center w-full h-32 md:h-40 overflow-hidden bg-slate-800 rounded mt-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400">Click or drop to change image</p>
        </div>
      ) : (
        <>
          <p className="text-slate-500 dark:text-slate-400 text-center px-4">
            {isDragActive ? "Drop the image here…" : "Upload or drag a photo of the boat"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">JPG, PNG up to 10 MB</p>
        </>
      )}
    </div>
  );
};

export default UploadBox;
