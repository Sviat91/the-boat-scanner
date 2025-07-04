
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
        "flex flex-col items-center justify-center h-60 border-2 border-dashed rounded cursor-pointer transition-colors " +
        (isDragActive 
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20" 
          : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-blue-900/20")
      }
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <div className="flex flex-col items-center space-y-2 w-full">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-[40%] h-auto object-contain rounded"
          />
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
