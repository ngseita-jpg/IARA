'use client'

import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

interface Props {
  open: boolean
  initialText: string
  onSave: (newText: string) => void
  onClose: () => void
}

/**
 * Bottom-sheet pra editar texto de uma layer no mobile.
 *
 * Substitui o contentEditable inline (que ficava tiny no canvas e o teclado
 * virtual cobria metade). Aqui o user tem um textarea grande, com
 * autofocus + select-all, ocupando 85vh.
 *
 * V1: edita texto PLANO. Formatação (bold/italic/cor/tamanho/fonte) continua
 * sendo aplicada via toolbar "Mais" que já existe. Se runs vinham com
 * formatação por palavra, ela é colapsada — primeira run define o estilo.
 *
 * Por ora, desktop continua usando o contentEditable inline (não interfere).
 */
export function TextEditMobileSheet({ open, initialText, onSave, onClose }: Props) {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setText(initialText)
      // Autofocus + select-all com pequeno delay pro browser montar o sheet
      setTimeout(() => {
        const ta = textareaRef.current
        if (!ta) return
        ta.focus()
        ta.select()
      }, 80)
    }
  }, [open, initialText])

  // Salva no ESC fora do textarea
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onSave(text)
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, text, onSave, onClose])

  if (!open) return null

  function salvar() {
    onSave(text)
    onClose()
  }

  function cancelar() {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end justify-center"
      onClick={cancelar}
      // Garante que o sheet apareça acima de qualquer overlay do canvas editor
      style={{ touchAction: 'none' }}
    >
      <div
        className="w-full max-w-2xl bg-[#0f0f1e] border-t-2 border-iara-600/40 rounded-t-3xl shadow-[0_-24px_60px_-12px_rgba(99,102,241,0.4)] flex flex-col"
        style={{
          maxHeight: '90vh',
          // Compensa safe-area do iOS (notch + home indicator) e teclado virtual
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          touchAction: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle de drag visual */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-[#1a1a2e]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a2e] flex-shrink-0">
          <button
            onClick={cancelar}
            className="px-3 py-1.5 rounded-lg text-sm text-[#9b9bb5] hover:text-[#f1f1f8] hover:bg-white/5 transition min-h-11"
          >
            Cancelar
          </button>
          <p className="text-[11px] font-bold text-[#f1f1f8] uppercase tracking-widest">Editar texto</p>
          <button
            onClick={salvar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg shadow-iara-900/40 hover:scale-[1.02] transition min-h-11"
            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)' }}
          >
            <Check className="w-4 h-4" />
            Salvar
          </button>
        </div>

        {/* Textarea grande */}
        <div className="flex-1 overflow-hidden p-5 min-h-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite seu texto..."
            // Mobile: evita autocorrect/capitalize que mexem no texto enquanto digita
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full h-full min-h-[180px] px-4 py-3 rounded-xl border border-[#1a1a2e] bg-[#0a0a14] text-base leading-relaxed text-[#f1f1f8] placeholder:text-[#5a5a7a] focus:border-iara-500/60 focus:outline-none focus:ring-2 focus:ring-iara-500/20 transition-all resize-none"
          />
        </div>

        {/* Footer dica + contador */}
        <div className="px-5 pb-4 pt-2 flex items-center justify-between text-[10px] text-[#5a5a7a] flex-shrink-0">
          <span>Formatação (cor, tamanho, fonte) no botão &ldquo;Mais&rdquo;</span>
          <span className="tabular">{text.length} caracteres</span>
        </div>
      </div>
    </div>
  )
}
