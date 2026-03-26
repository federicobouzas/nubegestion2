'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', empresa: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.nombre, form.empresa)
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full h-9 px-3 rounded-[9px] border border-[#E5E4E0] bg-[#F9F9F8] text-[13px] text-[#18181B] placeholder:text-[#A8A49D] focus:outline-none focus:border-[#F2682E] focus:bg-white transition-colors"
  const labelCls = "font-mono text-[10px] tracking-[0.1em] uppercase text-[#A8A49D] font-medium"

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-[10px] bg-[#F2682E] flex items-center justify-center">
              <span className="text-white font-display font-extrabold text-[16px]">N</span>
            </div>
            <span className="font-display text-[22px] font-extrabold text-[#18181B] tracking-tight">Nube Gestión</span>
          </div>
          <p className="text-[13px] text-[#A8A49D]">Creá tu cuenta gratis</p>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3">
            {error && (
              <div className="bg-[#FEE8E8] border border-[#FECACA] rounded-[9px] px-3 py-2.5 text-[12.5px] font-semibold text-[#7F1D1D]">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Tu nombre</label>
                <input className={inputCls} placeholder="Juan" value={form.nombre} onChange={e => set('nombre', e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Empresa</label>
                <input className={inputCls} placeholder="Mi Empresa SRL" value={form.empresa} onChange={e => set('empresa', e.target.value)} required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} placeholder="tu@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Contraseña</label>
              <input type="password" className={inputCls} placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Confirmar contraseña</label>
              <input type="password" className={inputCls} placeholder="Repetí la contraseña" value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full h-10 rounded-[9px] bg-[#F2682E] text-white text-[13px] font-bold shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
          <div className="border-t border-[#E5E4E0] px-6 py-4 text-center">
            <span className="text-[12.5px] text-[#A8A49D]">¿Ya tenés cuenta? </span>
            <Link href="/login" className="text-[12.5px] font-semibold text-[#F2682E] hover:underline">Iniciá sesión</Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#A8A49D] mt-4">
          Al registrarte aceptás los términos de uso y la política de privacidad.
        </p>
      </div>
    </div>
  )
}
