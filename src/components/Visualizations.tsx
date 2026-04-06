import { useMemo } from 'react'

export function CircularGauge({
  value,
  max = 100,
  label,
  subLabel,
  colorClass = 'text-sky-500',
  trackClass = 'text-slate-200/50',
  size = 120,
  strokeWidth = 10,
}: {
  value: number
  max?: number
  label?: string
  subLabel?: string
  colorClass?: string
  trackClass?: string
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const clamped = Math.min(Math.max(value, 0), max)
  const offset = circumference - (clamped / max) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90 transform" width={size} height={size}>
        <circle
          className={trackClass}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`transition-all duration-1000 ease-out ${colorClass}`}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label && <span className="font-display text-2xl font-bold tracking-tight text-slate-800">{label}</span>}
        {subLabel && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{subLabel}</span>}
      </div>
    </div>
  )
}

export function SparkTrendline({
  data,
  width = 200,
  height = 40,
  color = '#0ea5e9',
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
}) {
  const path = useMemo(() => {
    if (data.length < 2) return ''
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const step = width / (data.length - 1)

    const points = data.map((val, i) => {
      const x = i * step
      const y = height - ((val - min) / range) * (height - 4) // leave 4px padding
      return `${x},${y}`
    })
    
    // Create a smooth bezier curve
    let d = `M ${points[0]}`
    for (let i = 1; i < data.length; i++) {
        // Just line-to for simple sparkline, curving is complex without D3
        d += ` L ${points[i]}`
    }
    return d
  }, [data, width, height])

  return (
    <svg width={width} height={height} className="overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />
    </svg>
  )
}
