// Widths for each semantic column type
const W: Record<string, string> = {
  code:    'w-14',
  short:   'w-20',
  date:    'w-24',
  medium:  'w-36',
  wide:    'w-52',
  amount:  'w-20',
  badge:   'w-16',
  actions: 'w-12',
}

export type ColType = keyof typeof W

interface Props {
  cols: ColType[]
  rows?: number
}

export default function TableSkeleton({ cols, rows = 8 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[#E5E4E0]">
          {cols.map((type, c) => (
            <td key={c} className="px-4 py-[11px]">
              <div className={`skeleton h-[11px] ${W[type]}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
