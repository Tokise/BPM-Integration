"use client";

import { createClient } from "@/utils/supabase/client";

/**
 * HR Actions with Finance Integration
 */

export async function processPayroll(payrollId: string, employeeId: string, amount: number, payPeriodEnd: string) {
  const supabase = createClient();
  
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

export async function approveClaim(claimId: string, employeeId: string, amount: number) {
  const supabase = createClient();

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

  return claim;
}
