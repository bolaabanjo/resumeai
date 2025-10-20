"use client";

import React, { useCallback } from "react"
import { useDropzone } from "react-dropzone"

type Props = {
    onFile: (file: File) => void;
};

export default function Dropzone({ onFile }: Props) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (!acceptedFiles || acceptedFiles.length === 0) return;
            onFile(acceptedFiles[0]);
        },
        [onFile]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "text/plain": [".txt"]
        },
        maxFiles: 1
    });

    return (
        <div
        {...getRootProps()}
        className={`p-4 border-dashed border-2 rounded-3xl text-sm cursor-pointer ${
            isDragActive ? "border-sky-500 bg-sky-50" : "border-zinc-300 bg-black"
        }`}
        >
            <input {...getInputProps()} />
            <p className="m-0">Drag & drop a PDF / DOCX / TXT resume, or click to select a file.</p>
        </div>
    )
}