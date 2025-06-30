"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Paperclip, X, FileText, ImageIcon, File, Upload } from "lucide-react"

interface UploadedFile {
  id: string
  file: File
  type: "image" | "document" | "other"
  preview?: string
  content?: string
}

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSizePerFile?: number // in MB
}

export function FileUpload({ onFilesChange, maxFiles = 5, maxSizePerFile = 10 }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (file: File): "image" | "document" | "other" => {
    if (file.type.startsWith("image/")) return "image"
    if (
      file.type.includes("pdf") ||
      file.type.includes("document") ||
      file.type.includes("text") ||
      file.type.includes("spreadsheet") ||
      file.type.includes("presentation")
    ) {
      return "document"
    }
    return "other"
  }

  const getFileIcon = (type: "image" | "document" | "other") => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "document":
        return <FileText className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  const readFileContent = async (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === "string") {
          resolve(result)
        } else {
          resolve(undefined)
        }
      }
      reader.onerror = () => resolve(undefined)

      if (file.type.startsWith("text/") || file.type === "application/json") {
        reader.readAsText(file)
      } else if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const processFiles = async (files: FileList) => {
    const newFiles: UploadedFile[] = []

    for (let i = 0; i < files.length && newFiles.length + uploadedFiles.length < maxFiles; i++) {
      const file = files[i]

      // Check file size
      if (file.size > maxSizePerFile * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is ${maxSizePerFile}MB.`)
        continue
      }

      const type = getFileType(file)
      const content = await readFileContent(file)

      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + i,
        file,
        type,
        content,
        preview: type === "image" ? content : undefined,
      }

      newFiles.push(uploadedFile)
    }

    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      processFiles(files)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files) {
      processFiles(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter((f) => f.id !== fileId)
    setUploadedFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop files here, or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Supports images, documents, and text files (max {maxSizePerFile}MB each, {maxFiles} files total)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.json,.csv,.md"
        />
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attached Files ({uploadedFiles.length})
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {uploadedFiles.map((file) => (
              <Card key={file.id} className="p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {file.preview ? (
                    <img
                      src={file.preview || "/placeholder.svg"}
                      alt={file.file.name}
                      className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {file.type}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.file.size)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
