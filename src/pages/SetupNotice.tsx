import { Settings2 } from 'lucide-react'

/** Shown when the Firebase .env values are missing, so the app fails gracefully. */
export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-md p-7 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Settings2 size={26} />
        </div>
        <h1 className="text-lg font-semibold text-slate-100">Almost there</h1>
        <p className="mt-2 text-sm text-slate-400">
          Firebase isn't configured yet. Copy{' '}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">.env.example</code>{' '}
          to{' '}
          <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">.env</code>, fill in
          your Firebase web config, then restart the dev server.
        </p>
      </div>
    </div>
  )
}
