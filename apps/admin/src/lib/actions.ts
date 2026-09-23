import { unstable_rethrow } from 'next/navigation'
import { ActionError } from './actionError'

export { ActionError }

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

// The shape client components accept as a prop for a wrapped server action.
export type Action<Args extends unknown[] = [FormData], T = void> = (...args: Args) => Promise<ActionResult<T>>

// Production Next.js hides thrown server-action messages behind a crash page, so every action reports failure as data instead.
export function defineAction<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) {
  return async (...args: Args): Promise<ActionResult<T>> => {
    try {
      return { ok: true, data: await fn(...args) }
    } catch (e) {
      // redirect() and notFound() work by throwing, so they must pass through untouched.
      unstable_rethrow(e)
      if (e instanceof ActionError) return { ok: false, error: e.message }
      console.error('Server action failed', e)
      return { ok: false, error: 'Something went wrong. Please try again.' }
    }
  }
}
