const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pjmcaqbiqzyfsioivhml.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbWNhcWJpcXp5ZnNpb2l2aG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzNDQ4MywiZXhwIjoyMDgwNjEwNDgzfQ.MTF1U3Qn1zIqswhwLPWX4f8AC5-LXfZJoUK0Ze4y0bM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCols() {
  const { data, error } = await supabase
    .schema('bpm-anec-global')
    .from('leave_management')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Columns:', Object.keys(data[0] || {}))
  }
}

checkCols()
