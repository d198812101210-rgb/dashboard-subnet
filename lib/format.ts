const TB = 1e12

export function formatBlock(value: number): string {
  return value.toLocaleString("en-US")
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US")
}

export function formatStake(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatStakeCompact(value: number): string {
  if (Math.abs(value) >= 10000) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })
  }
  return formatStake(value)
}

export function formatEmission(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

export function formatTb(bytes: number, digits = 1): string {
  return (bytes / TB).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatRatio(value: number, digits = 2): string {
  return `${(value * 100).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

export function formatLatency(ms: number): string {
  return `${Math.round(ms).toLocaleString("en-US")} ms`
}

export function formatMbps(mbps: number): string {
  return `${Math.round(mbps).toLocaleString("en-US")} Mbps`
}

export function shortHotkey(hotkey: string): string {
  if (hotkey.length <= 14) return hotkey
  return `${hotkey.slice(0, 6)}…${hotkey.slice(-4)}`
}
