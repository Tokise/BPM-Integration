"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { resend } from "@/lib/resend";

export async function updateLeaveStatusAction(
  id: string,
  status: string,
  employeeEmail?: string,
  employeeName?: string,
  leaveType?: string,
  period?: string
) {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("leave_management")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    // Send Email Notification
    if (employeeEmail && process.env.RESEND_API_KEY) {
      const subject = `Leave Request ${status.toUpperCase()} - ANEC Global`;
      const emailContent = `Dear ${employeeName},\n\nYour ${leaveType} leave request for the period ${period} has been ${status}.\n\nPlease check your HR portal for more details.\n\nBest regards,\nHR Department\nANEC Global`;

      await resend.emails.send({
        from: "HR Notifications <notifications@bsit3219na.online>",
        to: employeeEmail,
        subject: subject,
        text: emailContent,
      });
    }

    revalidatePath("/hr/dept3/leave");
    revalidatePath("/hr/dept1");
    revalidatePath("/hr/dept2");
    return { success: true };
  } catch (error: any) {
    console.error("Leave status update error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitLeaveRequestAction(data: {
  employee_id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}) {
  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("leave_management")
      .insert([{
        ...data,
        status: "pending"
      }]);

    if (error) throw error;

    revalidatePath("/hr/dept3/leave");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
