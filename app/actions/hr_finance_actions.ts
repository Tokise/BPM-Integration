"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { resend } from "@/lib/resend";
import { revalidatePath } from "next/cache";
import { generateAndSendOTP } from "./auth_otp";

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

export async function sendPayrollOTP(userId: string, email: string) {
  return await generateAndSendOTP(userId, email);
}

export async function disbursePayroll(payrollId: string, otp: string, userId: string) {
  const supabase = createAdminClient();

  // 1. Verify OTP using the standard user_otps table
  const { data: otpData, error: fetchError } = await supabase
    .schema("bpm-anec-global")
    .from("user_otps")
    .select("*")
    .eq("user_id", userId)
    .eq("otp_code", otp.toUpperCase())
    .eq("is_verified", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !otpData) {
    throw new Error("Invalid or expired verification code.");
  }

  // 2. Mark OTP as verified
  await supabase
    .schema("bpm-anec-global")
    .from("user_otps")
    .update({ is_verified: true })
    .eq("id", otpData.id);

  // 3. Update Payroll Status
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

export async function approvePayrollBudget(payrollId: string, otp: string, userId: string) {
  const supabase = createAdminClient();

  // 1. Verify OTP using the standard user_otps table
  const { data: otpData, error: fetchError } = await supabase
    .schema("bpm-anec-global")
    .from("user_otps")
    .select("*")
    .eq("user_id", userId)
    .eq("otp_code", otp.toUpperCase())
    .eq("is_verified", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !otpData) {
    throw new Error("Invalid or expired verification code.");
  }

  // 2. Mark OTP as verified
  await supabase
    .schema("bpm-anec-global")
    .from("user_otps")
    .update({ is_verified: true })
    .eq("id", otpData.id);

  // 3. Update Payroll Status
  const { error: payrollError } = await supabase
    .schema("bpm-anec-global")
    .from("payroll_management")
    .update({ 
      status: "budget_approved"
    })
    .eq("id", payrollId);
  if (payrollError) throw payrollError;

  // 4. Update ap_ar entry
  const { error: financeError } = await supabase
    .schema("bpm-anec-global")
    .from("ap_ar")
    .update({ status: "cleared" })
    .like("entity_name", `Payroll Budget Request - ${payrollId}`);
  
  if (financeError) throw financeError;

  revalidatePath("/finance");
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

/**
 * PHILIPPINE TAXATION & STATUTORY HELPERS
 */

export async function calculatePHStatutory(baseSalary: number) {
  // 1. SSS (Approx 4.5% for employee share, capped)
  const sss = Math.min(baseSalary * 0.045, 1350); 
  
  // 2. PhilHealth (4% total, 2% employee share)
  const philhealth = (baseSalary * 0.04) / 2;
  
  // 3. Pag-IBIG (HDMF) - ₱100 if <= ₱1,500; else 2% or flat ₱200 for high earners
  const pagibig = baseSalary > 5000 ? 200 : 100;
  
  return { sss, philhealth, pagibig, total: sss + philhealth + pagibig };
}

export async function calculatePHWHT(taxableIncome: number) {
  // TRAIN Law 2023 onwards (Approx Monthly)
  // Monthly tax table:
  // <= 20,833: 0%
  // 20,833 - 33,333: 15% of excess over 20,833
  // 33,333 - 66,667: 1,875 + 20% over 33,333
  // ... simplified for demo:
  if (taxableIncome <= 20833) return 0;
  if (taxableIncome <= 33333) return (taxableIncome - 20833) * 0.15;
  if (taxableIncome <= 66667) return 1875 + (taxableIncome - 33333) * 0.20;
  return 8541.67 + (taxableIncome - 66667) * 0.25;
}

/**
 * SYNC PAYROLL DATA FROM HR3 & HR4
 */
export async function syncPayrollCalculations() {
  const supabase = createAdminClient();
  
  // 1. Fetch Employees, Attendance (HR3), and Claims (HR4)
  const { data: employees } = await supabase
    .schema("bpm-anec-global")
    .from("profiles")
    .select("id, full_name, email")
    .is("is_archived", false);

  const { data: timesheets } = await supabase
    .schema("bpm-anec-global")
    .from("timesheet_management")
    .select("*")
    .eq("status", "Approved");

  const { data: claims } = await supabase
    .schema("bpm-anec-global")
    .from("claims_reimbursement")
    .select("*")
    .eq("status", "approved");

  const { data: compensations } = await supabase
    .schema("bpm-anec-global")
    .from("employee_compensation")
    .select("*");

  if (!employees) return { success: false, error: "No employees found" };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Timezone-safe date formatting (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const payPeriodStart = formatDate(new Date(year, month, 1));
  const payPeriodEnd = formatDate(new Date(year, month + 1, 0));

  // 1b. Fetch Existing Records for this period
  const { data: existingRecords } = await supabase
    .schema("bpm-anec-global")
    .from("payroll_management")
    .select("employee_id, status")
    .eq("pay_period_end", payPeriodEnd);

  // Filter out employees who already have ANY processed record (not "pending")
  const filteredEmployees = employees.filter(emp => {
    const empRecords = existingRecords?.filter(r => r.employee_id === emp.id) || [];
    const hasProcessed = empRecords.some(r => r.status !== "pending");
    return !hasProcessed;
  });

  const payrollData = await Promise.all(filteredEmployees.map(async emp => {
    const comp = compensations?.find(c => c.employee_id === emp.id);
    const baseSalary = Number(comp?.base_salary || 25000);
    
    // Calculate OT from timesheets
    const empTimesheets = timesheets?.filter(t => t.employee_id === emp.id) || [];
    const otHours = empTimesheets.reduce((acc, curr) => acc + (Number(curr.ot_hours) || 0), 0);
    const otPay = (baseSalary / 160) * 1.25 * otHours;

    // Calculate Additions from Claims
    const empClaims = claims?.filter(c => c.employee_id === emp.id) || [];
    const totalClaims = empClaims.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // Statutory Deductions
    const statutory = await calculatePHStatutory(baseSalary);
    
    // Taxable Income (Base + OT - SSS/PH/PIB)
    const taxableIncome = (baseSalary + otPay) - statutory.total;
    const withholdingTax = await calculatePHWHT(taxableIncome);

    const netPay = (baseSalary + otPay + totalClaims) - (statutory.total + withholdingTax);

    return {
      employee_id: emp.id,
      base_salary: baseSalary,
      ot_pay: otPay,
      additions: totalClaims + otPay,
      deductions: statutory.total + withholdingTax,
      tax_deduction: withholdingTax,
      net_pay: netPay,
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      status: "pending"
    };
  }));

  // 2. Clear existing pending for this period and insert new
  await supabase
    .schema("bpm-anec-global")
    .from("payroll_management")
    .delete()
    .eq("status", "pending")
    .eq("pay_period_end", payPeriodEnd);

  const { error } = await supabase
    .schema("bpm-anec-global")
    .from("payroll_management")
    .insert(payrollData);

  if (error) throw error;
  
  revalidatePath("/hr/dept4/payroll");
  return { success: true };
}
