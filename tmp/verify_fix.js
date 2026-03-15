const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pjmcaqbiqzyfsioivhml.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbWNhcWJpcXp5ZnNpb2l2aG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzNDQ4MywiZXhwIjoyMDgwNjEwNDgzfQ.MTF1U3Qn1zIqswhwLPWX4f8AC5-LXfZJoUK0Ze4y0bM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('Checking leave_management column...')
  const { data, error } = await supabase
    .schema('bpm-anec-global')
    .from('leave_management')
    .select('id, created_at')
    .limit(1)

  if (error) {
    console.error('Column check failed:', error.message)
    console.log('HINT: If this fails, the user needs to run: ALTER TABLE "bpm-anec-global".leave_management ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();')
  } else {
    console.log('Column created_at exists! Sample:', data)
  }
}

checkData()
