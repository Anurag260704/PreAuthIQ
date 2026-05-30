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
        className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--card-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] font-mono"
        placeholder="Paste clinical notes, H&P, imaging reports, or any unstructured case text here..."
      />
    </div>
  )
}