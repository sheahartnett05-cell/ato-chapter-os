import { useRef, useState } from 'react'
import { PenLine, Trash2 } from 'lucide-react'

function isSignatureDataUrl(value: string) {
  return value.startsWith('data:image')
}

export function SignatureCell({
  value,
  onChange,
}: {
  value: string | boolean | number
  onChange: (v: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [open, setOpen] = useState(false)

  const strValue = String(value ?? '')

  const startDraw = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    drawing.current = true
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (x: number, y: number) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(canvas.toDataURL('image/png'))
    setOpen(false)
  }

  const clearSignature = () => {
    onChange('')
    setOpen(false)
  }

  if (isSignatureDataUrl(strValue) && !open) {
    return (
      <div className="flex items-center gap-2">
        <img src={strValue} alt="Signature" className="h-10 max-w-[140px] object-contain" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Re-sign
        </button>
        <button
          type="button"
          onClick={clearSignature}
          className="text-neutral-400 hover:text-red-600"
          aria-label="Clear signature"
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-sm border border-dashed border-black/15 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-accent/40 hover:text-accent"
      >
        <PenLine size={13} />
        Sign here
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={240}
        height={72}
        className="cursor-crosshair rounded-sm border border-black/10 bg-white touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          const { x, y } = pointerPos(e)
          startDraw(x, y)
        }}
        onPointerMove={(e) => {
          const { x, y } = pointerPos(e)
          draw(x, y)
        }}
        onPointerUp={() => {
          drawing.current = false
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={saveSignature}
          className="rounded-sm bg-accent px-2.5 py-1 text-xs font-semibold text-white"
        >
          Save
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-sm border border-black/10 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
        >
          Clear pad
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-sm px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
