import { login } from '../actions'
import { getProfile } from '@/lib/auth/session'
import { landingPageFor } from '@/lib/auth/roles'
import { redirect } from 'next/navigation'
import { FormError, TextField } from '@/components/form-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const profile = await getProfile()

  if (profile) {
    redirect(landingPageFor(profile.role))
  }

  const search = await searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col">
      <Card className="w-full max-w-md shadow-lg p-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold uppercase tracking-widest text-matte-black">Admin Login</CardTitle>
          <CardDescription>Sign in to Alusea ERP</CardDescription>
        </CardHeader>
        <CardContent>
          {/* login only ever redirects, so it stays a plain form action and reports failures through ?error=. */}
          <form className="animate-in w-full" action={login}>
            <FieldGroup>
              <TextField label="Email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
              <TextField label="Password" name="password" type="password" required placeholder="••••••••" autoComplete="current-password" />
              <Button type="submit" className="w-full shadow-md">Sign In</Button>
              <FormError error={search?.error ?? null} className="text-center" />
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400 mt-8 text-center max-w-sm">
        This area is restricted to authorized Alusea personnel only.
      </p>
    </div>
  )
}
