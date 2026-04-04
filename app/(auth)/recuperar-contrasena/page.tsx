'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nueva-contrasena`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      setError('No se pudo enviar el email. Verificá la dirección ingresada.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-[10px] bg-[#F2682E] flex items-center justify-center">
              <span className="text-white font-display font-extrabold text-[16px]">N</span>
            </div>
            <span className="font-display text-[22px] font-extrabold text-[#18181B] tracking-tight">Nube Gestión</span>
          </div>
          <p className="text-[13px] text-[#A8A49D]">Recuperá tu contraseña</p>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-xl shadow-sm overflow-hidden">
          {sent ? (
            <div className="p-6 flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center mx-auto">
                <span className="text-[#4EBB7F] text-xl">✓</span>
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-[#18181B]">Email enviado</p>
                <p className="text-[12.5px] text-[#A8A49D] mt-1">
                  Revisá tu casilla <span className="font-semibold text-[#18181B]">{email}</span> y seguí las instrucciones para restablecer tu contraseña.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="bg-[#FEE8E8] border border-[#FECACA] rounded-[9px] px-3 py-2.5 text-[12.5px] font-semibold text-[#7F1D1D]">
                  {error}
                </div>
              )}
              <p className="text-[12.5px] text-[#A8A49D]">
                Ingresá tu email y te enviamos un link para restablecer tu contraseña.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] tracking-[0.1em] uppercase text-[#A8A49D] font-medium">Email</label>
                <input
                  type="email" required
                  className="w-full h-9 px-3 rounded-[9px] border border-[#E5E4E0] bg-[#F9F9F8] text-[13px] text-[#18181B] placeholder:text-[#A8A49D] focus:outline-none focus:border-[#F2682E] focus:bg-white transition-colors"
                  placeholder="tu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full h-10 rounded-[9px] bg-[#F2682E] text-white text-[13px] font-bold shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperación'}
              </button>
            </form>
          )}
          <div className="border-t border-[#E5E4E0] px-6 py-4 text-center">
            <Link href="/login" className="text-[12.5px] font-semibold text-[#F2682E] hover:underline">
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}