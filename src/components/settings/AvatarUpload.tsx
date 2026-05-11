'use client'

import { useState, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Camera, Upload, RotateCw, Check, X, Loader2, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AvatarUploadProps {
  currentUrl: string | null
  displayName: string
  onUpload: (url: string) => void
}

// Generate cropped image blob from canvas
async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
  rotation: number
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const size = Math.max(croppedAreaPixels.width, croppedAreaPixels.height)
  canvas.width = size
  canvas.height = size

  ctx.translate(size / 2, size / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-size / 2, -size / 2)

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0, 0, size, size
  )

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92))
}

// Preset avatar illustrations (using DiceBear API)
const AVATAR_PRESETS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Zara',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Omar',
]

type Step = 'menu' | 'crop' | 'presets'

export default function AvatarUpload({ currentUrl, displayName, onUpload }: AvatarUploadProps) {
  const [step, setStep] = useState<Step | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const onCropComplete = useCallback((_: unknown, pixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(pixels)
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // GIFs skip the crop step — upload directly
    if (file.type === 'image/gif') {
      setUploading(true)
      setError(null)
      setStep(null)
      const fd = new FormData()
      fd.append('file', file, file.name)
      fetch('/api/upload-avatar', { method: 'POST', body: fd })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error)
          onUpload(data.url)
        })
        .catch((err) => setError(err.message))
        .finally(() => setUploading(false))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setStep('crop')
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
    }
    reader.readAsDataURL(file)
  }

  async function handleCropConfirm() {
    if (!imageSrc || !croppedAreaPixels) return
    setUploading(true)
    setError(null)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      const fd = new FormData()
      fd.append('file', blob, 'avatar.jpg')
      const res = await fetch('/api/upload-avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      onUpload(data.url)
      setStep(null)
      setImageSrc(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handlePresetSelect(url: string) {
    setUploading(true)
    setError(null)
    try {
      // Fetch the SVG and upload it
      const res = await fetch(url)
      const blob = await res.blob()
      const fd = new FormData()
      fd.append('file', blob, 'avatar.svg')
      const uploadRes = await fetch('/api/upload-avatar', { method: 'POST', body: fd })
      const data = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(data.error ?? 'Upload failed')
      onUpload(data.url)
      setStep(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Avatar display + click to change */}
      <div className="relative inline-block">
        <Avatar className="w-24 h-24 cursor-pointer" onClick={() => setStep('menu')}>
          {currentUrl
            ? <img src={currentUrl} alt={displayName} className="w-24 h-24 rounded-full object-cover" />
            : <AvatarFallback className="text-2xl font-semibold w-24 h-24"
                style={{ backgroundColor: 'var(--color-hostl-100)', color: 'var(--color-hostl-700)' }}>
                {initials}
              </AvatarFallback>
          }
        </Avatar>
        <button
          onClick={() => setStep('menu')}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          <Camera size={14} />
        </button>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" className="hidden" onChange={handleFileSelect} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileSelect} />

      {/* Menu modal */}
      {step === 'menu' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'oklch(0 0 0 / 0.5)' }}
          onClick={() => setStep(null)}>
          <div className="rounded-2xl w-full max-w-sm overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--color-border-subtle)' }}>
              <h3 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
                Change profile picture
              </h3>
              <button onClick={() => setStep(null)} className="p-1 rounded-full"
                style={{ color: 'var(--color-muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Current avatar preview */}
            <div className="flex justify-center py-6"
              style={{ backgroundColor: 'var(--color-surface)' }}>
              <Avatar className="w-28 h-28">
                {currentUrl
                  ? <img src={currentUrl} alt={displayName} className="w-28 h-28 rounded-full object-cover" />
                  : <AvatarFallback className="text-3xl font-semibold w-28 h-28"
                      style={{ backgroundColor: 'var(--color-hostl-100)', color: 'var(--color-hostl-700)' }}>
                      {initials}
                    </AvatarFallback>
                }
              </Avatar>
            </div>

            {/* Options */}
            <div className="p-2">
              {[
                { icon: Smile,  label: 'Browse illustrations', action: () => setStep('presets') },
                { icon: Upload, label: 'Upload from device',   action: () => fileInputRef.current?.click() },
                { icon: Camera, label: 'Take a picture',       action: () => cameraInputRef.current?.click() },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm text-left transition-colors"
                  style={{ color: 'var(--color-foreground)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Icon size={18} style={{ color: 'var(--color-muted-foreground)' }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Crop modal */}
      {step === 'crop' && imageSrc && (
        <div className="fixed inset-0 z-[9999] flex flex-col"
          style={{ backgroundColor: 'oklch(0.08 0 0)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ backgroundColor: 'oklch(0.12 0 0)' }}>
            <button onClick={() => { setStep('menu'); setImageSrc(null) }}
              className="p-2 rounded-full" style={{ color: 'white' }}>
              <X size={20} />
            </button>
            <span className="text-white font-medium">Crop & rotate</span>
            <div className="w-10" />
          </div>

          {/* Cropper */}
          <div className="flex-1 relative">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Controls */}
          <div className="shrink-0 px-6 py-4 space-y-3"
            style={{ backgroundColor: 'oklch(0.12 0 0)' }}>
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/60 w-10">Zoom</span>
              <input type="range" min={1} max={3} step={0.01} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-white" />
            </div>

            {/* Rotate + confirm */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white"
                style={{ backgroundColor: 'oklch(0.20 0 0)' }}>
                <RotateCw size={15} /> Rotate
              </button>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <Button onClick={handleCropConfirm} disabled={uploading}
                className="gap-2 rounded-full"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {uploading ? 'Uploading…' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Presets modal */}
      {step === 'presets' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'oklch(0 0 0 / 0.5)' }}
          onClick={() => setStep('menu')}>
          <div className="rounded-2xl w-full max-w-sm overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--color-border-subtle)' }}>
              <button onClick={() => setStep('menu')} className="p-1" style={{ color: 'var(--color-muted-foreground)' }}>
                <X size={18} />
              </button>
              <h3 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
                Choose illustration
              </h3>
              <div className="w-6" />
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {AVATAR_PRESETS.map((url) => (
                <button key={url} onClick={() => handlePresetSelect(url)}
                  disabled={uploading}
                  className="aspect-square rounded-full overflow-hidden border-2 transition-all"
                  style={{ borderColor: 'var(--color-border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
                  <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {uploading && (
              <div className="flex items-center justify-center gap-2 pb-4 text-sm"
                style={{ color: 'var(--color-muted-foreground)' }}>
                <Loader2 size={14} className="animate-spin" /> Uploading…
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
