"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { resend } from "@/lib/resend";

export async function onboardEmployee(formData: {
  email: string;
  fullName: string;
  role: string;
  departmentId: string;
}) {
  const supabase = createAdminClient();

  try {
    // 1. Create the user and send invitation via Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      formData.email,
      {
        data: {
          full_name: formData.fullName,
        },
        // You can specify a redirectTo URL here if needed
        // redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    );

    if (authError) throw authError;

    if (userData.user) {
      // 2. Update the profile entry
      // We'll update the role and department_id
      const { error: profileError } = await supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .update({
          role: formData.role,
          department_id: formData.departmentId,
        })
        .eq("id", userData.user.id);

      if (profileError) throw profileError;
    }

    revalidatePath("/hr/dept1/onboarding");
    return { success: true };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { success: false, error: error.message };
  }
}

export async function submitApplicantEvaluation(
  employeeId: string,
  employeeName: string,
  evaluatorId: string,
  performanceLevel: string,
  competencyScores: Record<string, number>
) {
  const supabase = createAdminClient();
  try {
    // Save to competency management
    // 1. Insert into centralized performance_results
    const totalScore = competencyScores.tech + competencyScores.comm + competencyScores.ps + competencyScores.eng;
    const averageScore = totalScore / 4;

    const { error: evalError } = await supabase
      .schema("bpm-anec-global")
      .from("performance_results")
      .insert({
        employee_id: employeeId,
        evaluator_id: evaluatorId,
        tech_score: competencyScores.tech,
        comm_score: competencyScores.comm,
        ps_score: competencyScores.ps,
        eng_score: competencyScores.eng,
        avg_score: averageScore,
        comments: performanceLevel || "",
      });

    if (evalError) throw evalError;
    
    // 2. Mark as evaluated on profile
    await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .update({ is_evaluated: true })
      .eq("id", employeeId);
    
    // 3. Auto-generate social recognition for high performance
    if (averageScore >= 4) {
       await supabase
        .schema("bpm-anec-global")
        .from("social_recognition")
        .insert({
          giver_id: evaluatorId,
          receiver_id: employeeId,
          message: `Outstanding performance recognized! Achievement unlocked with an average score of ${averageScore.toFixed(1)}/5. Keep up the excellent work!`,
          points: Math.floor((averageScore / 5) * 100),
        });
    }

    revalidatePath("/hr/dept1/performance");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function startEvaluationPeriod() {
  const supabase = createAdminClient();
  try {
    // 1. Fetch all users except sellers
    const { data: users, error: fetchError } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("id")
      .neq("role", "seller");

    if (fetchError) throw fetchError;
    if (!users || users.length === 0) return { success: true };

    // 2. Insert notifications
    const notifications = users.map(user => ({
      user_id: user.id,
      title: "Performance Evaluation Open",
      message: "A new performance evaluation period has started. It will close in 7 days.",
      type: "system",
      is_read: false
    }));

    const { error: insertError } = await supabase
      .schema("bpm-anec-global")
      .from("notifications")
      .insert(notifications);

    if (insertError) throw insertError;

    revalidatePath("/hr/dept1/performance");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to start evaluation period:", error);
    return { success: false, error: error.message };
  }
}

export async function updateApplicantStatus(
  applicantId: string,
  newStatus: string,
  applicantEmail: string,
  applicantName: string,
  interviewDate?: string,
  interviewTime?: string,
  interviewLocation?: string
) {
  const supabase = createAdminClient();
  try {
    // 1. Update the database
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("applicant_management")
      .update({ status: newStatus })
      .eq("id", applicantId);

    if (error) throw error;
    
    revalidatePath("/hr/dept1/applicants");

    // 2. Attempt to send email
    let emailContent = "";
    let emailSubject = "";
    if (newStatus === "screening") {
      emailSubject = "Your Application is under Review";
      emailContent = `Hi ${applicantName}, we have received your application and will be screening your profile shortly.`;
    } else if (newStatus === "interview") {
      emailSubject = "Interview Invitation - ANEC Global";
      emailContent = `Hi ${applicantName}, we would like to invite you for an interview on ${interviewDate} at ${interviewTime}. Location/Link: ${interviewLocation}.`;
    } else if (newStatus === "job offered") {
      emailSubject = "Job Offer Extended - ANEC Global";
      emailContent = `Congratulations ${applicantName}, we are extending a job offer to you! Please check your email for the detailed offer letter.`;
    } else if (newStatus === "hired") {
      emailSubject = "Welcome to ANEC Global!";
      emailContent = `Welcome to the team, ${applicantName}! We are excited to have you onboard.`;
    }
    
    if (emailContent && applicantEmail) {
      if (!process.env.RESEND_API_KEY) {
         console.warn("RESEND_API_KEY is not set. Simulating email send:", { emailSubject, applicantEmail, emailContent });
      } else {
         await resend.emails.send({
           from: "HR Notifications <onboarding@bsit3219na.online>",
           to: applicantEmail,
           subject: emailSubject,
           text: emailContent,
         });
      }
    }

    return { success: true, emailSent: emailContent };
  } catch (error: any) {
    console.error("Status update error:", error);
    return { success: false, error: error.message };
  }
}

export async function generateAutoRecognition() {
  const supabase = createAdminClient();
  try {
    // 1. Fetch all performance results with high scores (>= 4.0)
    const { data: results, error: fetchError } = await supabase
      .schema("bpm-anec-global")
      .from("performance_results")
      .select(`
        id,
        employee_id,
        evaluator_id,
        avg_score,
        profiles:profiles!employee_id(full_name)
      `)
      .gte("avg_score", 4.0);

    if (fetchError) throw fetchError;
    if (!results || results.length === 0) return { success: true, count: 0 };

    let createdCount = 0;
    for (const res of results) {
      // 2. Check if recognition already exists for this specific result/employee combo
      const { data: existing } = await supabase
        .schema("bpm-anec-global")
        .from("social_recognition")
        .select("id")
        .eq("receiver_id", res.employee_id)
        .ilike("message", `%${res.avg_score.toFixed(1)}/5%`)
        .limit(1);

      if (!existing || existing.length === 0) {
        // 3. Insert new recognition
        const { error: insertError } = await supabase
          .schema("bpm-anec-global")
          .from("social_recognition")
          .insert({
            giver_id: res.evaluator_id,
            receiver_id: res.employee_id,
            message: `Outstanding performance recognized! Achievement unlocked with an average score of ${Number(res.avg_score).toFixed(1)}/5. Keep up the excellent work!`,
            points: Math.floor((Number(res.avg_score) / 5) * 100),
          });

        if (!insertError) createdCount++;
      }
    }

    revalidatePath("/hr/dept1/recognition");
    return { success: true, count: createdCount };
  } catch (error: any) {
    console.error("Auto-recognition error:", error);
    return { success: false, error: error.message };
  }
}
