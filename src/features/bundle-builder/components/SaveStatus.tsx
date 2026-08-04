import { AlertCircle, CheckCircle2, Cloud, CloudOff } from 'lucide-react'

import type { SaveState } from '../view-models'

interface SaveStatusProps {
  state: SaveState
}

const statusCopy: Record<SaveState, string> = {
  idle: 'Not saved yet',
  restored: 'Saved system restored',
  unsaved: 'You have unsaved changes',
  saved: 'Your system is saved',
  error: 'We could not save your system',
}

export function SaveStatus({ state }: SaveStatusProps) {
  const Icon =
    state === 'saved' || state === 'restored'
      ? CheckCircle2
      : state === 'error'
        ? AlertCircle
        : state === 'unsaved'
          ? CloudOff
          : Cloud

  return (
    <p
      className="sr-only"
      aria-live="polite"
      data-testid="save-status"
    >
      <Icon aria-hidden="true" size={14} />
      {statusCopy[state]}
    </p>
  )
}
