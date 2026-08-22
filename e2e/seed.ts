// One-time (idempotent) test-fixture seeding: creates the E2E test account
// directly via the Supabase admin API — no signup form, no email
// confirmation, no manual onboarding click-through. Run with:
//   npm run test:seed
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

const url = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.TEST_USER_EMAIL
const password = process.env.TEST_USER_PASSWORD

if (!url || !serviceRoleKey || !email || !password) {
  console.error(
    'Missing one of VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD in .env.test'
  )
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data: existing, error: listError } = await admin.auth.admin.listUsers()
  if (listError) throw listError

  let userId = existing.users.find((u) => u.email === email)?.id

  if (userId) {
    console.log(`Test user already exists (${email}), reusing it.`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) throw error
    userId = data.user.id
    console.log(`Created test user ${email}.`)
  }

  // Skips the onboarding wizard for this account, same as completing it
  // manually would — ProtectedRoute checks this flag on every route.
  const { error: profileError } = await admin
    .from('business_profiles')
    .upsert(
      { user_id: userId, onboarding_completed: true, business_name: 'E2E Test User', tax_rate: 20, savings_rate: 10 },
      { onConflict: 'user_id' }
    )
  if (profileError) throw profileError

  console.log('Seed complete — test account is ready to log in, onboarding already marked done.')
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
