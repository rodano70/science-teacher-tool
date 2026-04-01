import { useEffect } from 'react'

// Keeps a textarea ref sized to its content.
// When active transitions to true, also focuses the element.
// Safe to call when active=false — if the textarea is not mounted, ref.current is null.
export function useAutoSizeTextarea(ref, value, active) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (active) el.focus()
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [active, value]) // eslint-disable-line react-hooks/exhaustive-deps
}
