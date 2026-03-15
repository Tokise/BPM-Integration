"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Handles secure clock-out by updating attendance and calculating hours for the timesheet.
 */
export async function clockOutAction(employeeId: string, attendanceId?: string) {
  const supabase = createAdminClient();
  const checkOutTime = new Date();
  const checkOutIso = checkOutTime.toISOString();

  try {
    // 1. Fetch or verify the attendance record
    let targetId = attendanceId;
    
    if (!targetId) {
      const { data: activeAtt, error: findError } = await supabase
        .from("attendance")
        .select("id")
        .eq("employee_id", employeeId)
        .is("check_out", null)
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) throw findError;
      if (!activeAtt) {
        // No active session found, nothing to clock out
        return { success: true, message: "No active session found" };
      }
      targetId = activeAtt.id;
    }

    const { data: attendance, error: fetchError } = await supabase
      .from("attendance")
      .select("check_in, employee_id")
      .eq("id", targetId)
      .single();

    if (fetchError || !attendance) {
      throw new Error("Attendance record not found");
    }

    // 2. Update attendance record with check_out
    const { error: updateAttError } = await supabase
      .from("attendance")
      .update({
        check_out: checkOutIso,
        status: "Clocked Out"
      })
      .eq("id", targetId);

    if (updateAttError) throw updateAttError;

    // 3. Calculate hours worked based on shift
    const checkIn = new Date(attendance.check_in);
    const checkOut = checkOutTime;
    
    // Fetch employee's shift
    const { data: shift } = await supabase
      .from("shift_schedule_management")
      .select("*")
      .eq("employee_id", employeeId)
      .limit(1)
      .maybeSingle();

    let hoursWorked = 0;
    let regularHours = 0;
    let otHours = 0;

    if (shift) {
      // Basic 8-hour shift logic as requested
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const totalHours = Math.max(0, diffMs / (1000 * 60 * 60));
      
      // Calculate based on shift basis (always 8 hrs of work basis)
      regularHours = Math.min(totalHours, 8);
      otHours = Math.max(0, totalHours - 8);
      hoursWorked = totalHours;
    } else {
      // Fallback if no shift assigned
      const diffMs = checkOut.getTime() - checkIn.getTime();
      hoursWorked = Math.max(0, diffMs / (1000 * 60 * 60));
      regularHours = Math.min(hoursWorked, 8);
      otHours = Math.max(0, hoursWorked - 8);
    }

    // 4. Update the current week's timesheet
    const weekStarting = new Date();
    weekStarting.setDate(weekStarting.getDate() - weekStarting.getDay()); // Sunday
    const weekStr = weekStarting.toISOString().split('T')[0];

    // Get existing total_hours
    const { data: timesheet, error: tsFetchError } = await supabase
      .from("timesheet_management")
      .select("id, total_hours, ot_hours")
      .eq("employee_id", employeeId)
      .eq("week_starting", weekStr)
      .maybeSingle();

    if (tsFetchError) throw tsFetchError;

    if (timesheet) {
      const newTotal = Number(timesheet.total_hours || 0) + regularHours;
      const newOT = Number(timesheet.ot_hours || 0) + otHours;
      const { error: tsUpdateError } = await supabase
        .from("timesheet_management")
        .update({ 
          total_hours: newTotal,
          ot_hours: newOT 
        })
        .eq("id", timesheet.id);
      
      if (tsUpdateError) throw tsUpdateError;
    } else {
      await supabase
        .from("timesheet_management")
        .insert({
          employee_id: employeeId,
          week_starting: weekStr,
          total_hours: regularHours,
          ot_hours: otHours,
          status: "active"
        });
    }

    revalidatePath("/hr/dept3/attendance");
    revalidatePath("/hr/dept3/timesheets");
    revalidatePath("/hr/dept3");
    
    return { success: true };
  } catch (error: any) {
    console.error("Clock out error:", error);
    return { success: false, error: error.message };
  }
}
