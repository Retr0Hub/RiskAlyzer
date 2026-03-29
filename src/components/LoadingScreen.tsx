export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 px-6">
      <div className="rounded-3xl border border-white/50 bg-white/30 p-8 shadow-xl backdrop-blur-xl">
        <img
          src="/loading.gif"
          alt=""
          width={72}
          height={72}
          className="mx-auto block h-[72px] w-[72px] object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div
          className="mx-auto mt-2 h-10 w-10 animate-spin rounded-full border-4 border-white/70 border-t-sky-700"
          aria-hidden
        />
        <p className="mt-4 text-center font-display text-sm font-semibold text-slate-800">{label}</p>
      </div>
    </div>
  )
}
