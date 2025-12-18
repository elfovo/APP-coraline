'use client'

import { useState, useRef } from 'react'

interface PDFFile {
  id: string
  file: File
}

interface PDFDropZoneProps {
  onFilesChange?: (files: File[]) => void
  className?: string
}

const PDFDropZone = ({ onFilesChange, className = '' }: PDFDropZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const MAX_FILES = 5

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const addFiles = (files: File[]) => {
    const newPdfFiles = files
      .filter(file => file.type === 'application/pdf')
      .filter(file => !pdfFiles.some(pdf => pdf.file.name === file.name && pdf.file.size === file.size))
      .slice(0, MAX_FILES - pdfFiles.length)
      .map(file => ({
        id: `${file.name}-${file.size}-${Date.now()}`,
        file
      }))

    if (newPdfFiles.length > 0) {
      const updatedFiles = [...pdfFiles, ...newPdfFiles]
      setPdfFiles(updatedFiles)
      onFilesChange?.(updatedFiles.map(pdf => pdf.file))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (pdfFiles.length < MAX_FILES) {
      fileInputRef.current?.click()
    }
  }

  const removeFile = (id: string) => {
    const updatedFiles = pdfFiles.filter(pdf => pdf.id !== id)
    setPdfFiles(updatedFiles)
    onFilesChange?.(updatedFiles.map(pdf => pdf.file))
  }

  const isFull = pdfFiles.length >= MAX_FILES

  return (
    <div
      className={`pdf-drop-zone ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        width: 'min(90vw, 500px)',
        minHeight: 'min(50vh, 400px)',
        maxWidth: '500px',
        border: '2px dashed #ffffff',
        borderRadius: '20px',
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isFull ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        opacity: isDragOver ? 0.8 : 1,
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
        position: 'relative',
        overflow: 'hidden',
        padding: 'min(4vw, 20px)',
        gap: 'min(3vw, 16px)'
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      
      {pdfFiles.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#ffffff' }}>
          <div style={{ fontSize: 'min(12vw, 64px)', marginBottom: 'min(4vw, 24px)' }}>📁</div>
          <div style={{ fontSize: 'min(4vw, 20px)', fontWeight: 'bold', marginBottom: 'min(2vw, 12px)' }}>
            Glissez vos emplois du temps ici
          </div>
          <div style={{ fontSize: 'min(3vw, 16px)', opacity: 0.8 }}>
            ou cliquez pour sélectionner
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'min(2vw, 12px)' }}>
          <div style={{ textAlign: 'center', color: '#ffffff', marginBottom: 'min(3vw, 16px)' }}>
            <div style={{ fontSize: 'min(3.5vw, 18px)', fontWeight: 'bold' }}>
              Emplois du temps sélectionnés ({pdfFiles.length})
            </div>
          </div>
          
          {pdfFiles.map((pdfFile) => (
            <div
              key={pdfFile.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'min(2vw, 12px)',
                padding: 'min(2vw, 12px) min(3vw, 16px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'min(2vw, 12px)', color: '#ffffff' }}>
                <div style={{ fontSize: 'min(4vw, 24px)' }}>📄</div>
                <div>
                  <div style={{ fontSize: 'min(2.5vw, 14px)', fontWeight: 'bold' }}>
                    {pdfFile.file.name}
                  </div>
                  <div style={{ fontSize: 'min(2vw, 12px)', opacity: 0.7 }}>
                    {(pdfFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(pdfFile.id)
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: 'min(1.5vw, 8px)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: 'min(1.5vw, 8px)',
                  fontSize: 'min(3vw, 16px)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                ✕
              </button>
            </div>
          ))}
          
          {!isFull && (
            <div style={{ textAlign: 'center', color: '#ffffff', opacity: 0.8, fontSize: 'min(2.5vw, 14px)' }}>
              Cliquez pour ajouter d&apos;autres emplois du temps
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PDFDropZone
