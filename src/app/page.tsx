'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSetupStore } from '@/lib/cctv/setup-store'
import { CustomerView } from '@/components/cctv/CustomerView'
import { AdminView } from '@/components/admin/AdminView'
import { LoginModal } from '@/components/admin/LoginModal'
import { Cctv, LayoutDashboard, Shield, LogOut, MessageCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCatalog } from '@/lib/cctv/hooks'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '917809465102'
const WHATSAPP_DISPLAY = '+91 78094 65102'
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi Connectz team! I'm interested in your CCTV products and need some help with my setup."
)

export default function Home() {
  const { data: session, status } = useSession()
  const view = useSetupStore((s) => s.view)
  const setView = useSetupStore((s) => s.setView)
  const { data } = useCatalog()
  const [loginOpen, setLoginOpen] = useState(false)
  const [whatsappOpen, setWhatsappOpen] = useState(false)

  const cameraCount = data?.products.filter((p) => p.productType.includes('CAMERA')).length || 0
  const totalProducts = data?.products.length || 0

  function handleAdminClick() {
    if (session) {
      setView('admin')
    } else {
      setLoginOpen(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setView('customer')} className="flex items-center gap-2 hover:opacity-90 transition">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white">
                <Cctv className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h1 className="text-base md:text-lg font-bold leading-tight">Connectz</h1>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">CCTV Catalog & Setup Builder</p>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">{totalProducts} products</Badge>
              <Badge variant="outline" className="text-[10px]">{cameraCount} cameras</Badge>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Database-driven</Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* WhatsApp support */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex"
              >
                <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden md:inline">WhatsApp Support</span>
                  <span className="md:hidden">Support</span>
                </Button>
              </a>

              <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
                <Button
                  size="sm"
                  variant={view === 'customer' ? 'default' : 'ghost'}
                  onClick={() => setView('customer')}
                  className={view === 'customer' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  <Cctv className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Customer</span>
                </Button>
                <Button
                  size="sm"
                  variant={view === 'admin' ? 'default' : 'ghost'}
                  onClick={handleAdminClick}
                  className={view === 'admin' ? 'bg-slate-800 hover:bg-slate-900 text-white' : ''}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </div>

              {session && view === 'admin' && (
                <div className="hidden md:flex items-center gap-2 pl-2 border-l">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground leading-tight">Signed in as</p>
                    <p className="text-xs font-medium leading-tight truncate max-w-[160px]">{session.user?.email}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="Sign out"
                    onClick={() => { signOut({ redirect: false }); setView('customer'); toast.success('Signed out') }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-4">
        {view === 'customer' ? <CustomerView /> : <AdminView />}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-emerald-600" />
              <span>Connectz CCTV Platform · Demo with realistic seed data · Supabase-compatible Prisma schema</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span>10 brands</span>
              <span>·</span>
              <span>8 categories</span>
              <span>·</span>
              <span>2 warehouses</span>
              <span>·</span>
              <span>2 suppliers</span>
              <span>·</span>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                <MessageCircle className="h-3 w-3" /> {WHATSAPP_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-40 group"
        onMouseEnter={() => setWhatsappOpen(true)}
        onMouseLeave={() => setWhatsappOpen(false)}
        aria-label="Chat on WhatsApp"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebd5a] shadow-lg flex items-center justify-center text-white transition-colors">
            <MessageCircle className="h-7 w-7" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          {whatsappOpen && (
            <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-md border px-3 py-2 whitespace-nowrap text-xs">
              <p className="font-semibold text-slate-900">Chat with us on WhatsApp</p>
              <p className="text-muted-foreground">{WHATSAPP_DISPLAY}</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Quick product help & support</p>
            </div>
          )}
        </div>
      </a>

      {/* Login modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
