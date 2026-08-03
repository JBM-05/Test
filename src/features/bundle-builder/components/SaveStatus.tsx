import { AlertCircle, CheckCircle2, Cloud, CloudOff } from 'lucide-react'

export type SaveState = 'idle' | 'restored' | 'unsaved' | 'saved' | 'error'

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
      className={[
        'mt-2 flex min-h-5 items-center justify-center gap-1.5 text-xs xl:mt-0.5 xl:text-[9px]',
        state === 'error' ? 'text-[#ad1f3d]' : 'text-[#5f5866]',
      ].join(' ')}
      aria-live="polite"
      data-testid="save-status"
    >
      <Icon aria-hidden="true" size={14} />
      {statusCopy[state]}
    </p>
  )
}
