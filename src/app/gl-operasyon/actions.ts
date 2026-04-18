'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/auth-cache'
import { revalidatePath } from 'next/cache'

export async function adminUserAction(userId: string, action: 'approve' | 'reject' | 'delete') {
  // 1. Authorization check
  const { user } = await getAuthUser()
  const adminEmailsVar = process.env.ADMIN_EMAILS || 'abdullah.celik1409@gmail.com'
  const authorizedEmails = adminEmailsVar.split(',').map(e => e.trim().toLowerCase())

  if (!user || !authorizedEmails.includes(user.email?.toLowerCase() || "")) {
    throw new Error('Unauthorized')
  }

  const supabase = createAdminClient()

  try {
    if (action === 'delete') {
      // DELETE User from Auth (this cascade deletes profile if set up, or we delete profile manually)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
      if (deleteError) throw deleteError
    } else {
      // UPDATE Status
      const statusValue = action === 'approve' ? 'onaylandi' : 'reddedildi'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ hesap_durumu: statusValue })
        .eq('id', userId)
      
      if (updateError) throw updateError
    }

    revalidatePath('/gl-operasyon')
    return { success: true }
  } catch (err) {
    console.error('Admin Action Error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Bir hata oluştu' }
  }
}
