'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/auth-cache'

/**
 * Üretilen URL'in güvenli olması için sunucu tarafında yetki kontrolü yapar
 * ve sadece 5 dakika geçerli bir imzalı URL döndürür.
 * 
 * @param filePath Bucket içindeki dosya yolu
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function getSecureDocumentUrl(filePath: string) {
  try {
    // 1. Oturum Kontrolü
    const { user } = await getAuthUser()
    
    if (!user || !user.email) {
      return { success: false, error: 'Oturum açılmamış.' }
    }

    // 2. Yetki Kontrolü (Admin E-posta)
    const adminEmailsEnv = process.env.ADMIN_EMAILS || 'abdullah.celik1409@gmail.com'
    const authorizedEmails = adminEmailsEnv.split(',').map(e => e.trim().toLowerCase())
    
    if (!authorizedEmails.includes(user.email.toLowerCase())) {
      console.warn(`Yetkisiz erişim denemesi: ${user.email} -> ${filePath}`)
      return { success: false, error: 'Bu işlem için yetkiniz yok.' }
    }

    // 3. Dosya yolunu temizle (Eğer tam URL gelmişse sadece path kısmını al)
    let cleanPath = filePath
    if (filePath.includes('/verifications/')) {
      cleanPath = filePath.split('/verifications/').pop() || filePath
    }

    // 4. Supabase Admin Client ile imzalı URL oluşturma
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .storage
      .from('verifications')
      .createSignedUrl(cleanPath, 300) // 5 dakika (300 saniye)

    if (error) {
      console.error('Storage Hatası:', error)
      return { success: false, error: 'Dosya erişim hatası: ' + error.message }
    }

    if (!data?.signedUrl) {
      return { success: false, error: 'URL oluşturulamadı.' }
    }

    return { success: true, url: data.signedUrl }
  } catch (err) {
    console.error('getSecureDocumentUrl Hatası:', err)
    return { success: false, error: 'Sunucu tarafında bir hata oluştu.' }
  }
}
