'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Images,
  Upload,
  Trash2,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Copy,
} from 'lucide-react'

type Foto = {
  id: string
  nome: string
  signed_url: string | null
  tamanho_kb: number
  created_at: string
}

export default function FotosPage() {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [deletando, setDeletando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarFotos()
  }, [])

  async function carregarFotos() {
    setCarregando(true)
    try {
      const res = await fetch('/api/fotos')
      const data = await res.json()
      setFotos(data.photos ?? [])
    } catch {
      setErro('Erro ao carregar fotos')
    } finally {
      setCarregando(false)
    }
  }

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErro('Apenas imagens são aceitas')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErro('Imagem muito grande. Máximo 10 MB.')
      return
    }

    setEnviando(true)
    setErro(null)

    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/fotos/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagem_base64: base64, nome: file.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setFotos((prev) => [data.photo, ...prev])
      setSucesso('Foto adicionada ao banco!')
      setTimeout(() => setSucesso(null), 3000)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar foto')
    } finally {
      setEnviando(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [])

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  async function handleDeletar(id: string) {
    if (!confirm('Remover esta foto do banco?')) return
    setDeletando(id)
    try {
      const res = await fetch(`/api/fotos?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setFotos((prev) => prev.filter((f) => f.id !== id))
    } catch {
      setErro('Erro ao remover foto')
    } finally {
      setDeletando(null)
    }
  }

  async function copiarUrl(url: string, id: string) {
    await navigator.clipboard.writeText(url)
    setCopiado(id)
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iara-600 to-accent-purple flex items-center justify-center">
            <Images className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f1f1f8]">Banco de Fotos</h1>
            <p className="text-sm text-[#6b6b8a]">
              Salve suas fotos preferidas para usar nos geradores de thumbnail, carrossel e mídia kit
            </p>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {erro && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/20 border border-red-700/30 text-red-400 mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{erro}</span>
          <button onClick={() => setErro(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {sucesso && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-900/20 border border-green-700/30 text-green-400 mb-6">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{sucesso}</span>
        </div>
      )}

      {/* Área de upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#2a2a4a] hover:border-iara-500/60 rounded-xl p-8 text-center cursor-pointer transition-all group mb-8"
      >
        {enviando ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-iara-400 animate-spin" />
            <p className="text-sm text-[#9b9bb5]">Enviando foto...</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-[#3a3a5a] group-hover:text-iara-400 mx-auto mb-3 transition-colors" />
            <p className="text-sm text-[#6b6b8a] group-hover:text-[#9b9bb5] transition-colors">
              Arraste ou <span className="text-iara-400">clique para adicionar</span> fotos ao seu banco
            </p>
            <p className="text-xs text-[#3a3a5a] mt-1">JPG, PNG, WEBP — até 10 MB por foto</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files ?? []).forEach((f) => handleFile(f))
          }}
        />
      </div>

      {/* Galeria */}
      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-iara-400 animate-spin" />
        </div>
      ) : fotos.length === 0 ? (
        <div className="text-center py-16 text-[#4a4a6a]">
          <Images className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Seu banco está vazio. Adicione fotos acima.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#9b9bb5]">
              {fotos.length} foto{fotos.length !== 1 ? 's' : ''} no banco
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative group rounded-xl overflow-hidden bg-[#0f0f20] border border-[#1a1a2e] aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.signed_url ?? ''}
                  alt={foto.nome}
                  className="w-full h-full object-cover"
                />
                {/* Overlay ao hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-xs text-white text-center truncate w-full px-1">{foto.nome}</p>
                  <p className="text-xs text-[#9b9bb5]">{foto.tamanho_kb} KB</p>
                  <div className="flex gap-2 mt-1">
                    {/* Copiar URL */}
                    <button
                      onClick={(e) => { e.stopPropagation(); if (foto.signed_url) copiarUrl(foto.signed_url, foto.id) }}
                      title="Copiar URL"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {copiado === foto.id
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <Copy className="w-4 h-4 text-white" />
                      }
                    </button>
                    {/* Deletar */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletar(foto.id) }}
                      title="Remover"
                      className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-colors"
                      disabled={deletando === foto.id}
                    >
                      {deletando === foto.id
                        ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                        : <Trash2 className="w-4 h-4 text-red-400" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
