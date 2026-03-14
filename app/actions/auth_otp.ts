"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { resend } from "@/lib/resend";
import { revalidatePath } from "next/cache";

/**
 * Generates a 6-character alphanumeric OTP and sends it via email.
 */
export async function generateAndSendOTP(userId: string, email: string) {
  const supabase = createAdminClient();
  
  // 1. Generate alphanumeric OTP
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // 2. Set expiry (10 minutes)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // 3. Save to database
  const { error: dbError } = await supabase
    .schema("bpm-anec-global")
    .from("user_otps")
    .insert({
      user_id: userId,
      otp_code: otp,
      expires_at: expiresAt,
      is_verified: false
    });

  if (dbError) {
    console.error("Error saving OTP to bpm-anec-global.user_otps:", dbError);
    return { success: false, error: `Failed to generate security code: ${dbError.message}` };
  }

  // 4. Send Email via Resend
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not set. Simulating OTP email send:", { otp, email });
    } else {
      await resend.emails.send({
        from: "Security Auth <auth@bsit3219na.online>",
        to: email,
        subject: "Your Security Verification Code",
        text: `Your security verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
      });
    }
    return { success: true };
  } catch (emailError: any) {
    console.error("Error sending OTP email:", emailError);
    return { success: false, error: "Failed to send verification code. Please try again." };
  }
}

/**
 * Verifies the OTP provided by the user.
 */
export async function verifyOTPAction(userId: string, code: string) {
  const supabase = createAdminClient();
  
  // 1. Check for the latest unverified OTP that matches the code and hasn't expired
  const { data: otpData, error: fetchError } = await supabase
    .schema("bpm-anec-global")
    .from("user_otps")
    .select("*")
    .eq("user_id", userId)
    .eq("otp_code", code.toUpperCase())
    .eq("is_verified", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !otpData) {
    return { success: false, error: "Invalid or expired verification code." };
  }

  // 2. Mark as verified
  const { error: updateError } = await supabase
    .schema("bpm-anec-global")
    .from("user_otps")
    .update({ is_verified: true })
    .eq("id", otpData.id);

  if (updateError) {
    return { success: false, error: "Verification failed. Please try again." };
  }

  // 3. Log Attendance and Timesheet automatically on success
  await automateAttendance(userId);

  return { success: true };
}

/**
 * Automatically logs attendance and updates timesheet upon successful login.
 */
async function automateAttendance(userId: string) {
  const supabase = createAdminClient();
  
  try {
    // 1. Attendance - Check for existing record today to prevent duplicates
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", userId)
      .gte("check_in", `${today}T00:00:00Z`)
      .lte("check_in", `${today}T23:59:59Z`)
      .maybeSingle();

    if (!existingAttendance) {
      const { error: attError } = await supabase
        .from("attendance")
        .insert({
          employee_id: userId,
          check_in: new Date().toISOString(),
          status: "Online Now"
        });
      
      if (attError) {
        console.error("Error inserting attendance:", attError);
      }
    } else {
      console.log("Attendance record already exists for today, skipping insertion.");
    }

    // Timesheet - Check if a week entry exists for this user
    const weekStarting = new Date();
    weekStarting.setDate(weekStarting.getDate() - weekStarting.getDay()); // Start of week (Sunday)
    const weekStr = weekStarting.toISOString().split('T')[0];

    const { data: existingTimesheet, error: tsFetchError } = await supabase
      .from("timesheet_management")
      .select("*")
      .eq("employee_id", userId)
      .eq("week_starting", weekStr)
      .maybeSingle();

    if (tsFetchError) {
      console.error("Error fetching timesheet:", tsFetchError);
    }

    if (!existingTimesheet) {
      const { error: tsInsertError } = await supabase
        .from("timesheet_management")
        .insert({
          employee_id: userId,
          week_starting: weekStr,
          total_hours: 0,
          status: "active"
        });
      
      if (tsInsertError) {
        console.error("Error inserting timesheet:", tsInsertError);
      }
    }

    revalidatePath("/hr/dept3/attendance");
    revalidatePath("/hr/dept3/timesheet");
  } catch (error) {
    console.error("Fatal error in automateAttendance:", error);
  }
}
