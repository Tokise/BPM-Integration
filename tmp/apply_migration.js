const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pjmcaqbiqzyfsioivhml.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbWNhcWJpcXp5ZnNpb2l2aG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzNDQ4MywiZXhwIjoyMDgwNjEwNDgzfQ.MTF1U3Qn1zIqswhwLPWX4f8AC5-LXfZJoUK0Ze4y0bM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('Adding created_at to leave_management...')
  
  // Since I don't have a direct SQL executor, I'll try to use a RPC or just assume the user will run it if I can't.
  // Wait, I can use the supabase-js to run raw SQL if enabled, but usually it's not.
  // However, I can try to insert a record with a custom field, but that won't work for adding a column.
  
  // Actually, I should just tell the user to run the SQL or provide a way to do it.
  // But wait! Many of these environments have a specific helper or I can use a migrations folder.
  
  console.log('Note: I have updated the schema.sql file. Please ensure this is applied to your database.')
  console.log('SQL to run: ALTER TABLE "bpm-anec-global".leave_management ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();')
}

applyMigration()
