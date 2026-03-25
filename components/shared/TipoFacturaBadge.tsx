type Tipo = 'A' | 'B' | 'C' | 'E' | 'M'

const styles: Record<Tipo, string> = {
  A: 'bg-[#DBEAFE] text-[#1E3A8A]',
  B: 'bg-[#E8F7EF] text-[#1A5C38]',
  C: 'bg-[#F0EBFB] text-[#3D1F8A]',
  E: 'bg-[#FEF8E1] text-[#7A5500]',
  M: 'bg-[#FEE8E8] text-[#7F1D1D]',
}

export default function TipoFacturaBadge({ tipo }: { tipo: Tipo }) {
  return (
    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-[5px] ${styles[tipo]}`}>
      {tipo}
    </span>
  )
}
