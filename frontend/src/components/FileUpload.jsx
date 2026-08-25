import React, { useState, useCallback } from 'react';
import { toast } from './ToastProvider';

export function FileUpload({ onUpload, accept = 'image/*,.pdf,.txt', maxSize = 5 * 1024 * 1024, multiple = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const fileList = Array.from(files);

    for (const file of fileList) {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 5MB limit.`);
        continue;
      }

      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress(p => Math.min(p + 10, 90));
        }, 200);

        await onUpload?.(formData, file);

        clearInterval(progressInterval);
        setProgress(100);
        toast.success(`${file.name} uploaded successfully!`);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    }
  };

  return (
    <div
      className={`file-upload-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={uploading}
      />
      <label htmlFor="file-upload">
        {uploading ? (
          <>
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <span>Uploading... {progress}%</span>
          </>
        ) : (
          <>
            <span className="upload-icon">📁</span>
            <span>Drag & drop files here or click to browse</span>
            <small>Max 5MB • Images, PDF, TXT</small>
          </>
        )}
      </label>
    </div>
  );
}
