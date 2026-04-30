import { CustomerModeProvider } from "@/components/providers/customer-mode-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { OfferNotification } from "@/components/cars/offer-notification"
import { GlobalMessageToast } from "@/components/chat/message-toast"
import { getAuthUser, getProfile } from "@/lib/supabase/auth-cache"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Dashboard - GaleriLink",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ⚡ Perf: Memoized auth — same call in page.tsx won't hit Supabase again
  const { user } = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  // ⚡ Perf: Memoized profile — deduplicated across layout + page
  const { profile } = await getProfile(user.id)

  if (profile) {
    // Note: 'beklemede' users are no longer redirected to /waiting-approval.
    // They are allowed to see the dashboard but with blurred content.
    
    // Admin kullanıcılar ödeme duvarını bypass eder
    const adminEmailsVar = process.env.ADMIN_EMAILS || 'abdullah.celik1409@gmail.com'
    const adminEmails = adminEmailsVar.replace(/['"]+/g, '').split(',').map(e => e.trim().toLowerCase())
    if (!adminEmails.includes('abdullah.celik1409@gmail.com')) {
      adminEmails.push('abdullah.celik1409@gmail.com')
    }
    const isAdmin = adminEmails.includes(user.email?.toLowerCase() || '')

    const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    if (!isAdmin && (profile.subscription_status === 'expired' || (trialEndsAt && trialEndsAt < new Date()))) {
      redirect('/subscription')
    }
  }

  return (
    <CustomerModeProvider>
      <div className="flex min-h-screen bg-muted/40 w-full relative">
        <Sidebar className="hidden w-64 border-r bg-card md:flex" />
        <div className="flex flex-1 flex-col w-full min-w-0">
          <Header profile={profile} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto w-full max-w-full">
            {children}
          </main>
        </div>
        <OfferNotification userId={user.id} />
        <GlobalMessageToast />
      </div>
    </CustomerModeProvider>
  )
}
