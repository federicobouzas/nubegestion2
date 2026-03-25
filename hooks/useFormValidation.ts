import { useState } from 'react'

export type FieldErrors = Record<string, string>

export function useFormValidation() {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [showModal, setShowModal] = useState(false)

  function validate(rules: Record<string, { value: any; message: string; label?: string }[]>): boolean {
    const newErrors: FieldErrors = {}
    for (const field in rules) {
      for (const rule of rules[field]) {
        const val = rule.value
        const isEmpty =
          val === null || val === undefined ||
          (typeof val === 'string' && val.trim() === '') ||
          (typeof val === 'number' && (isNaN(val) || val <= 0))
        if (isEmpty) {
          newErrors[field] = rule.message
          break
        }
      }
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      setShowModal(true)
      return false
    }
    return true
  }

  function clearError(field: string) {
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  function clearAll() { setErrors({}); setShowModal(false) }

  // setErrors exportado para poder inyectar errores externos (ej: stock)
  return { errors, setErrors, showModal, setShowModal, validate, clearError, clearAll }
}
