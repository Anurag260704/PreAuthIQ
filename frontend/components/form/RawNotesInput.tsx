interface RawNotesInputProps {
  value: string
  onChange: (v: string) => void
}

export function RawNotesInput({ value, onChange }: RawNotesInputProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={5}
        className="premium-textarea font-mono text-xs"
        placeholder="H&P excerpts · consult notes · imaging impressions · discharge summaries…"
      />
    </div>
  )
}