'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export function LoginModal({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        toast.error('Invalid credentials. Please check your email and password.')
      } else if (res?.ok) {
        toast.success('Welcome back, Admin!')
        onOpenChange(false)
        // Reload to refresh server state cleanly
        setTimeout(() => window.location.reload(), 300)
      }
    } catch (err) {
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base">Connectz Admin Login</DialogTitle>
              <DialogDescription className="text-xs">
                Secure access to product management, inventory, and rules.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email" className="text-xs">Admin email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-800">
            <p className="font-medium mb-0.5">Demo credentials</p>
            <p>Email: <code className="font-mono bg-white/60 px-1 rounded">connectzsalesandservices@gmail.com</code></p>
            <p>Password: <code className="font-mono bg-white/60 px-1 rounded">Connectz@2026</code></p>
            <p className="mt-1 text-emerald-700 italic">You can change these in <code>.env</code> via <code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code>.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Signing in...</> : 'Sign in'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
