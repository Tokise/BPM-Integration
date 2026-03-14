import { createAdminClient } from "./app/actions/hr_finance_actions"; // This won't work easily due to imports
// I will just use the code from createAdminClient
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'bpm-anec-global'
    }
  }
)

async function checkSchema() {
  const tables = ['payroll_management', 'compensation_management', 'claims_reimbursement', 'attendance', 'timesheet_management', 'profiles'];
  
  for (const table of tables) {
    console.log(`--- ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(Object.keys(data[0]).join(', '));
    } else {
      console.log('No data found to inspect columns');
    }
  }
}

checkSchema();
