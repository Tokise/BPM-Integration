
import { createAdminClient } from "./utils/supabase/admin";

async function diag() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .schema("bpm-anec-global")
    .from("recruitment_management")
    .select("*");
    
  if (error) {
    console.error("Error fetching jobs:", error);
  } else {
    console.log("Jobs found:", data.length);
    console.log("Statuses:", data.map(j => j.status));
  }
}

diag();
