import Link from 'next/link'
export default function EmptyState({ message, href, cta }: { message: string; href?: string; cta?: string }) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl p-10 text-center text-[#A8A49D] text-sm">
      {message}{' '}
      {href && cta && <Link href={href} className="text-[#F2682E] font-semibold hover:underline">{cta}</Link>}
    </div>
  )
}
