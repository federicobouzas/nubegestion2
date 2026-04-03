import fs from 'fs'
import path from 'path'

function loadTemplate(name: string): string {
  const filePath = path.join(process.cwd(), 'emails', 'templates', name)
  return fs.readFileSync(filePath, 'utf-8')
}

function replace(html: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, String(value)),
    html,
  )
}

export function getBienvenidaEmail(vars: { nombre: string; email: string }): string {
  return replace(loadTemplate('bienvenida.html'), vars)
}

export function getFollowupDia3Email(vars: {
  nombre: string
  facturas_usadas: number
  pasos_completados: number
}): string {
  return replace(loadTemplate('followup-dia3.html'), vars)
}

export function getUpgradeProEmail(vars: {
  nombre: string
  facturas_usadas: number
  limite_plan: number
}): string {
  return replace(loadTemplate('upgrade-pro.html'), vars)
}

export function getConfirmacionEmailEmail(vars: { nombre: string; confirmation_url: string }): string {
  return replace(loadTemplate('confirmacion-email.html'), vars)
}

export function getRecuperoPasswordEmail(vars: { nombre: string; reset_url: string }): string {
  return replace(loadTemplate('recupero-password.html'), vars)
}

export function getFollowupDia7Email(vars: { nombre: string; email: string }): string {
  return replace(loadTemplate('followup-dia7.html'), vars)
}

export function getResumenMensualEmail(vars: {
  nombre: string
  email: string
  empresa: string
  mes_nombre: string
  anio: number
  facturas_emitidas: number
  facturas_compra: number
  total_facturado: number
  total_cobros: number
  total_pagos: number
  saldo_cierre: number
  saldo_clientes: number
  saldo_proveedores: number
}): string {
  return replace(loadTemplate('resumen-mensual.html'), vars)
}

export function getReciboPagoEmail(vars: {
  nombre: string
  comprobante_id: string
  plan_nombre: string
  periodo: string
  metodo_pago: string
  fecha_pago: string
  monto: number
  proxima_fecha: string
}): string {
  return replace(loadTemplate('recibo-pago.html'), vars)
}

export function getPagoFallidoEmail(vars: {
  nombre: string
  plan_nombre: string
  monto: number
  metodo_pago: string
  motivo_fallo: string
  dias_gracia: number
}): string {
  return replace(loadTemplate('pago-fallido.html'), vars)
}
