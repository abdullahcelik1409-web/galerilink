import { createAdminClient } from "../src/lib/supabase/admin"

async function debug() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, ad_soyad, vergi_levhasi_url")
    .not("vergi_levhasi_url", "is", null)
    .limit(1)

  console.log(JSON.stringify(data, null, 2))
}

debug()
