const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pjmcaqbiqzyfsioivhml.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbWNhcWJpcXp5ZnNpb2l2aG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzNDQ4MywiZXhwIjoyMDgwNjEwNDgzfQ.MTF1U3Qn1zIqswhwLPWX4f8AC5-LXfZJoUK0Ze4y0bM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('--- Profiles ---')
  const { data: profiles, error: pError } = await supabase
    .schema('bpm-anec-global')
    .from('profiles')
    .select('id, full_name, role, department:departments!profiles_department_id_fkey(code)')
    .limit(5)
  
  if (pError) console.error(pError)
  else console.log(profiles)

  console.log('\n--- Leave Requests ---')
  const { data: leaves, error: lError } = await supabase
    .schema('bpm-anec-global')
    .from('leave_management')
    .select('id, employee_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (lError) console.error(lError)
  else console.log(leaves)
}

checkData()
