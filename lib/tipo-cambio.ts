export function getTipoCambioUSD(): number {
  const raw = process.env.TIPO_CAMBIO_USD_ARS
  if (!raw) throw new Error('TIPO_CAMBIO_USD_ARS no configurada')
  const value = Number(raw)
  if (isNaN(value) || value <= 0) throw new Error('TIPO_CAMBIO_USD_ARS debe ser un número positivo')
  return value
}
