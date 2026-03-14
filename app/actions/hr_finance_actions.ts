"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { resend } from "@/lib/resend";
import { revalidatePath } from "next/cache";

/**
 * HR Actions with Finance Integration
 */

export async function validatePayroll(payrollId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .schema("bpm-anec-global")
    .from("payroll_management")
    .update({ status: "validated" })
    .eq("id", payrollId);
  if (error) throw error;
  return { success: true };
}

export async function requestPayrollBudget(payrollId: string, amount: number) {
  const supabase = createAdminClient();
  
  // 1. Update status
  const { error: payrollError } = await supabase
    .schema("bpm-anec-global")
    .from("payroll_management")
    .update({ status: "budget_requested" })
    .eq("id", payrollId);
  if (payrollError) throw payrollError;

  // 2. Create entry in ap_ar for Finance to see
  const { error: financeError } = await supabase
    .schema("bpm-anec-global")
    .from("ap_ar")
    .insert({
      type: "payable",
      entity_name: `Payroll Budget Request - ${payrollId}`,
      amount: amount,
      status: "pending_approval", // Specific status for budget requests
      due_date: new Date().toISOString().split('T')[0]
    });
  if (financeError) throw financeError;

  return { success: true };
}

export async function disbursePayroll(payrollId: string, otp: string) {
  // Simple mock OTP check
  if (otp !== "123456") {
    throw new Error("Invalid OTP verification code");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .schema("bpm-anec-global")
    .from("payroll_management")
    .update({ 
      status: "disbursed",
      processed_at: new Date().toISOString()
    })
    .eq("id", payrollId);
  if (error) throw error;

  revalidatePath("/hr/dept4/payroll");
  return { success: true };
}

export async function processPayroll(payrollId: string, employeeId: string, amount: number, payPeriodEnd: string) {
  const supabase = createAdminClient();
  
  // 1. Update Payroll Status to 'processed'
  const { data: payroll, error: payrollError } = await supabase
    .schema("bpm-anec-global")
    .from("payroll_management")
    .update({ 
      status: "processed",
      processed_at: new Date().toISOString()
    })
    .eq("id", payrollId)
    .select()
    .single();

  if (payrollError) throw payrollError;

  // 2. Create AP Entry in Finance
  const { error: financeError } = await supabase
    .schema("bpm-anec-global")
    .from("ap_ar")
    .insert({
      type: "payable",
      entity_name: `Payroll - ${employeeId} (${payPeriodEnd})`,
      amount: amount,
      due_date: payPeriodEnd,
      status: "unpaid"
    });

  if (financeError) throw financeError;

  return payroll;
}

export async function approveClaim(
  claimId: string, 
  employeeId: string, 
  amount: number,
  employeeEmail?: string,
  employeeName?: string,
  claimType?: string
) {
  const supabase = createAdminClient();

  // 1. Update Claim Status
  const { data: claim, error: claimError } = await supabase
    .schema("bpm-anec-global")
    .from("claims_reimbursement")
    .update({ status: "approved" })
    .eq("id", claimId)
    .select()
    .single();

  if (claimError) throw claimError;

  // 2. Create AP Entry in Finance
  const { error: financeError } = await supabase
    .schema("bpm-anec-global")
    .from("ap_ar")
    .insert({
      type: "payable",
      entity_name: `Claim Reimbursement - ${employeeId}`,
      amount: amount,
      due_date: new Date().toISOString().split('T')[0],
      status: "unpaid"
    });

  if (financeError) throw financeError;

  // 3. Send Email Notification
  if (employeeEmail && process.env.RESEND_API_KEY) {
    const subject = `Claim Request APPROVED - ANEC Global`;
    const emailContent = `Dear ${employeeName},\n\nYour ${claimType} claim for ₱${amount.toLocaleString()} has been APPROVED and forwarded to the Finance department for payment processing.\n\nPlease check your HR portal for more details.\n\nBest regards,\nHR Department\nANEC Global`;

    await resend.emails.send({
      from: "HR Notifications <notifications@bsit3219na.online>",
      to: employeeEmail,
      subject: subject,
      text: emailContent,
    });
  }

  revalidatePath("/hr/dept3/claims");
  revalidatePath("/finance");

  return claim;
}

export async function approveTimesheet(
  timesheetId: string,
  employeeId: string,
  hours: number,
  employeeEmail?: string,
  employeeName?: string,
  weekStarting?: string
) {
  const supabase = createAdminClient();
  const hourlyRate = 150; // Standard cycle rate for operational services
  const amount = Number(hours) * hourlyRate;

  // 1. Update Timesheet Status
  const { data: timesheet, error: tsError } = await supabase
    .schema("bpm-anec-global")
    .from("timesheet_management")
    .update({ status: "Approved" })
    .eq("id", timesheetId)
    .select()
    .single();

  if (tsError) throw tsError;

  // 2. Create AP Entry in Finance
  const { error: financeError } = await supabase
    .schema("bpm-anec-global")
    .from("ap_ar")
    .insert({
      type: "payable",
      entity_name: `Payroll - ${employeeName || employeeId} (${weekStarting || 'Standard Cycle'})`,
      amount: amount,
      due_date: new Date().toISOString().split('T')[0],
      status: "unpaid"
    });

  if (financeError) throw financeError;

  // 3. Send Email Notification
  if (employeeEmail && process.env.RESEND_API_KEY) {
    const subject = `Timesheet APPROVED - ANEC Global`;
    const emailContent = `Dear ${employeeName || 'Employee'},\n\nYour timesheet for the week starting ${weekStarting || '---'} has been APPROVED.\n\nSummary:\n- Hours Worked: ${hours.toFixed(2)}h\n- Total Payout: ₱${amount.toLocaleString()}\n\nThis has been forwarded to the Finance department for payroll processing.\n\nBest regards,\nHR Department\nANEC Global`;

    await resend.emails.send({
      from: "HR Notifications <notifications@bsit3219na.online>",
      to: employeeEmail,
      subject: subject,
      text: emailContent,
    });
  }

  revalidatePath("/hr/dept3/timesheets");
  revalidatePath("/finance");

  return timesheet;
}
