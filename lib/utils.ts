const IRREGULARES: Record<string, string> = {
  unidad: 'unidades',
  par: 'pares',
  mes: 'meses',
  rol: 'roles',
  vez: 'veces',
}

export function pluralize(n: number, singular: string, plural?: string): string {
  const p = plural ?? IRREGULARES[singular.toLowerCase()] ?? singular + 's'
  return `${n} ${n === 1 ? singular : p}`
}
