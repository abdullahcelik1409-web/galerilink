import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  try {
    const { action, id } = await request.json()

    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    if (!adminEmails.includes(user.email?.toLowerCase() || "")) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Use Service Role to bypass RLS limitations
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (action === 'approve') {
      const { error } = await supabaseAdmin
        .from('car_taxonomy')
        .update({ status: 'approved' })
        .eq('id', id)

      if (error) throw error
      
      revalidateTag('taxonomy')
      return NextResponse.json({ success: true, message: 'Approved successfully' })
    }

    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('car_taxonomy')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error
      
      revalidateTag('taxonomy')
      return NextResponse.json({ success: true, message: 'Rejected successfully (Hidden from UI)' })
    }

  } catch (error: any) {
    console.error('Taxonomy Action Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
