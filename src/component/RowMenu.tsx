import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import Button from './Button'

import './RowMenu.css'

const PANEL_WIDTH = 144
const VIEWPORT_GUTTER = 8
const TRIGGER_GAP = 4

type RowMenuProps = {
  label: string
  onEdit?: () => void
  onRemove: () => Promise<void>
}

function RowMenu({ label, onEdit, onRemove }: RowMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)

  function handleToggle() {
    if (!isOpen) {
      setActionError('')
      const bounds = buttonRef.current?.getBoundingClientRect()
      const panelHeight = onEdit ? 96 : 56
      if (bounds) {
        const openAbove =
          window.innerHeight - bounds.bottom < panelHeight + VIEWPORT_GUTTER &&
          bounds.top > panelHeight + VIEWPORT_GUTTER
        const preferredTop = openAbove ? bounds.top - panelHeight - TRIGGER_GAP : bounds.bottom + TRIGGER_GAP

        setPosition({
          top: Math.max(
            VIEWPORT_GUTTER,
            Math.min(preferredTop, window.innerHeight - panelHeight - VIEWPORT_GUTTER),
          ),
          left: Math.max(
            VIEWPORT_GUTTER,
            Math.min(bounds.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - VIEWPORT_GUTTER),
          ),
        })
      }
    }

    setIsOpen((open) => !open)
  }

  function openConfirmDialog() {
    setIsOpen(false)
    setActionError('')
    const dialog = confirmDialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }

  function closeConfirmDialog() {
    const dialog = confirmDialogRef.current
    if (dialog?.open) {
      dialog.close()
    }
    setActionError('')
    buttonRef.current?.focus()
  }

  async function handleConfirmRemove() {
    setIsRemoving(true)
    setActionError('')

    try {
      await onRemove()
      closeConfirmDialog()
    } catch {
      setActionError('Tidak dapat menghapus transaksi. Coba lagi.')
    } finally {
      setIsRemoving(false)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    panelRef.current?.querySelector('button')?.focus()

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (
        target instanceof Node &&
        !buttonRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    function handleViewportChange() {
      setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [isOpen])

  return (
    <div className="row-menu">
      <Button
        ref={buttonRef}
        className="transaction-menu-trigger"
        variant="ghost"
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </Button>
      {isOpen
        ? createPortal(
              <div
                ref={panelRef}
                className="transaction-menu"
                role="group"
                aria-label={label}
                style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
              >
                {onEdit && (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      onEdit()
                    }}
                  >
                    Edit
                  </Button>
                )}
                <Button variant="ghost-destructive" type="button" onClick={openConfirmDialog}>
                  Hapus
                </Button>
              </div>,
            document.body,
          )
        : null}

      <dialog
        ref={confirmDialogRef}
        className="confirm-dialog"
        aria-labelledby="confirm-dialog-title"
        onCancel={(event) => {
          event.preventDefault()
          closeConfirmDialog()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeConfirmDialog()
        }}
      >
        <div className="confirm-dialog__content">
          <div className="confirm-dialog__header">
            <h3 className="confirm-dialog__title" id="confirm-dialog-title">
              Hapus transaksi?
            </h3>
          </div>
          <p className="confirm-dialog__description">
            Transaksi ini akan dihapus secara permanen dan tidak dapat dikembalikan.
          </p>
          {actionError ? (
            <p className="confirm-dialog__error" role="alert">
              {actionError}
            </p>
          ) : null}
          <div className="confirm-dialog__actions">
            <Button
              variant="secondary"
              type="button"
              disabled={isRemoving}
              onClick={closeConfirmDialog}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={isRemoving}
              onClick={handleConfirmRemove}
            >
              {isRemoving ? 'Menghapus…' : 'Hapus'}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  )
}

export default RowMenu
