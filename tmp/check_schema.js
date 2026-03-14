const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pjmcaqbiqzyfsioivhml.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqbWNhcWJpcXp5ZnNpb2l2aG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTAzNDQ4MywiZXhwIjoyMDgwNjEwNDgzfQ.MTF1U3Qn1zIqswhwLPWX4f8AC5-LXfZJoUK0Ze4y0bM',
  {
    db: {
      schema: 'bpm-anec-global'
    }
  }
);

async function checkSchema() {
  const tables = ['payroll_management', 'compensation_management', 'claims_reimbursement', 'attendance', 'timesheet_management', 'profiles'];
  
  for (const table of tables) {
    console.log(`--- ${table} ---`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`Error fetching ${table}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(Object.keys(data[0]).join(', '));
      } else {
        console.log('No data found to inspect columns');
      }
    } catch (e) {
      console.error(`Catch error for ${table}:`, e.message);
    }
  }
}

checkSchema();
