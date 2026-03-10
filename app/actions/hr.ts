"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { resend } from "@/lib/resend";

export async function onboardEmployee(formData: {
  email: string;
  fullName: string;
  roleId: string;
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
      }
    );

    if (authError) throw authError;

    if (userData.user) {
      // 2. Update the profile entry
      const { error: profileError } = await supabase
        .schema("bpm-anec-global")
        .from("profiles")
        .update({
          role_id: formData.roleId,
          department_id: formData.departmentId,
        })
        .eq("id", userData.user.id);

      if (profileError) throw profileError;

      await logTransaction({
        userId: (await supabase.auth.getUser()).data.user?.id || null,
        action: "onboard_employee",
        entityType: "profile",
        entityId: userData.user.id,
        details: { email: formData.email, role_id: formData.roleId },
      });
    }

    revalidatePath("/hr/dept1/onboarding");
    revalidatePath("/hr/dept4/hcm");
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
    const { data: users, error: userError } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("id")
      .not("role", "ilike", "seller");

    if (userError) throw userError;

    // 1. Clear previous evaluation results to start fresh
    const { error: clearError } = await supabase
      .schema("bpm-anec-global")
      .from("performance_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records
    
    if (clearError) throw clearError;

    // 2. Reset evaluation status for all profiles
    const { error: updateProfilesError } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .update({ is_evaluated: false })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all records

    if (updateProfilesError) throw updateProfilesError;

    if (users && users.length > 0) {
      const notifications = users.map((u) => ({
        user_id: u.id,
        title: "Performance Evaluation Open",
        message: "The 1-week performance evaluation period has started. Please evaluate your colleagues.",
        type: "system"
      }));

      const { error: insertError } = await supabase
        .schema("bpm-anec-global")
        .from("notifications")
        .insert(notifications);
      
      if (insertError) throw insertError;
    }

    // Revalidate all performance pages across departments
    const paths = [
      "/hr/dept1/performance",
      "/hr/dept2/performance",
      "/hr/dept3/performance",
      "/hr/dept4/performance",
      "/logistic/performance",
      "/finance/performance",
    ];
    paths.forEach(p => revalidatePath(p));

    return { success: true };
  } catch (error: any) {
    console.error("Start evaluation period error:", error);
    return { success: false, error: error.message };
  }
}

export async function endEvaluationPeriod() {
  const supabase = createAdminClient();
  try {
    const { data: users, error: userError } = await supabase
      .schema("bpm-anec-global")
      .from("profiles")
      .select("id")
      .not("role", "ilike", "seller");

    if (userError) throw userError;

    if (users && users.length > 0) {
      const notifications = users.map((u) => ({
        user_id: u.id,
        title: "Performance Evaluation Closed",
        message: "The performance evaluation period has ended. Results are being processed.",
        type: "system"
      }));

      const { error: insertError } = await supabase
        .schema("bpm-anec-global")
        .from("notifications")
        .insert(notifications);
      
      if (insertError) throw insertError;
    }

    // Revalidate all performance pages across departments
    const paths = [
      "/hr/dept1/performance",
      "/hr/dept2/performance",
      "/hr/dept3/performance",
      "/hr/dept4/performance",
      "/logistic/performance",
      "/finance/performance",
    ];
    paths.forEach(p => revalidatePath(p));

    return { success: true };
  } catch (error: any) {
    console.error("End evaluation period error:", error);
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
  interviewLocation?: string,
  assignedRoleId?: string,
  assignedDeptId?: string
) {
  const supabase = createAdminClient();
  try {
    // 1. Update the database
    const updatePayload: any = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (assignedRoleId) updatePayload.assigned_role_id = assignedRoleId;
    if (assignedDeptId) updatePayload.assigned_department_id = assignedDeptId;

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("applicant_management")
      .update(updatePayload)
      .eq("id", applicantId);

    if (error) throw error;

    await logTransaction({
      userId: (await supabase.auth.getUser()).data.user?.id || null,
      action: `applicant_status_${newStatus}`,
      entityType: "applicant",
      entityId: applicantId,
      details: { email: applicantEmail, name: applicantName },
    });
    
    revalidatePath("/hr/dept1/applicants");
    revalidatePath("/hr/dept1/recruitment");

    // 2. Attempt to send email
    let emailContent = "";
    let emailSubject = "";
    if (newStatus === "screening") {
      emailSubject = "Your Application is under Review - ANEC Global";
      emailContent = `Dear ${applicantName},\n\nThank you for applying to ANEC Global. We have successfully received your application and our team is currently reviewing your profile.\n\nWe appreciate your interest in joining us and will keep you updated on the next steps of the selection process.\n\nBest regards,\nHR Department\nANEC Global`;
    } else if (newStatus === "interview") {
      emailSubject = "Interview Invitation - ANEC Global";
      emailContent = `Dear ${applicantName},\n\nWe are pleased to invite you for an interview for the position you applied for at ANEC Global.\n\nDetails of your interview:\nDate: ${interviewDate}\nTime: ${interviewTime}\nLocation/Meeting Link: ${interviewLocation}\n\nPlease confirm your availability or let us know if you require any rescheduling. We look forward to speaking with you.\n\nBest regards,\nHR Department\nANEC Global`;
    } else if (newStatus === "job offered") {
      emailSubject = "Job Offer - Congratulations from ANEC Global!";
      emailContent = `Dear ${applicantName},\n\nCongratulations! We are thrilled to officially offer you a position at ANEC Global. Your skills and experience make you a great fit for our team.\n\nPlease check your email for the detailed offer letter and instructions on how to accept it. If you have any questions, feel free to reach out to us.\n\nWe look forward to welcoming you aboard.\n\nBest regards,\nHR Department\nANEC Global`;
    } else if (newStatus === "hired") {
      emailSubject = "Welcome to the Team, ANEC Global!";
      emailContent = `Dear ${applicantName},\n\nWelcome to ANEC Global! We are incredibly excited to have you join our team.\n\nYour onboarding process will begin shortly. You will receive further details regarding your account setup, first-day schedule, and necessary documentation.\n\nOnce again, welcome aboard!\n\nBest regards,\nHR Department\nANEC Global`;
    } else if (newStatus === "rejected") {
      emailSubject = "Update on Your Application - ANEC Global";
      emailContent = `Dear ${applicantName},\n\nThank you for taking the time to apply for a role at ANEC Global and for your interest in joining our team.\n\nAfter careful consideration of your application and qualifications, we regret to inform you that we will not be moving forward with your candidacy at this time. The decision was difficult as we received applications from many highly qualified candidates.\n\nWe sincerely appreciate the effort you invested in the hiring process. We will keep your resume on file and may reach out if a future opening better aligns with your skills and experience.\n\nWe wish you the very best of luck in your job search and in your future professional endeavors.\n\nBest regards,\nHR Department\nANEC Global`;
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
    let createdCount = 0;

    // 1. Sync Performance Recognition
    const { data: perfResults } = await supabase
      .schema("bpm-anec-global")
      .from("performance_results")
      .select(`id, employee_id, evaluator_id, avg_score, created_at`)
      .gte("avg_score", 4.0);

    if (perfResults) {
      for (const res of perfResults) {
        const evalDate = new Date(res.created_at).toISOString().split('T')[0];
        const { data: existing } = await supabase
          .schema("bpm-anec-global")
          .from("social_recognition")
          .select("id")
          .eq("receiver_id", res.employee_id)
          .eq("category", "Performance")
          .gte("created_at", `${evalDate}T00:00:00`)
          .lte("created_at", `${evalDate}T23:59:59`)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase
            .schema("bpm-anec-global")
            .from("social_recognition")
            .insert({
              giver_id: res.evaluator_id,
              receiver_id: res.employee_id,
              title: "Employee of the Month (Performance)",
              category: "Performance",
              message: `Outstanding performance recognized! Achievement unlocked with an average score of ${Number(res.avg_score).toFixed(1)}/5. Keep up the excellent work!`,
              points: Math.floor((Number(res.avg_score) / 5) * 100),
              created_at: res.created_at
            });
          createdCount++;
        }
      }
    }

    // 2. Sync Succession/Promotion Recognition
    const { data: successionPlans } = await supabase
      .schema("bpm-anec-global")
      .from("succession_planning")
      .select("*")
      .ilike("readiness_status", "Ready Now");

    if (successionPlans) {
      for (const plan of successionPlans) {
        const { data: existing } = await supabase
          .schema("bpm-anec-global")
          .from("social_recognition")
          .select("id")
          .eq("receiver_id", plan.potential_successor)
          .eq("category", "Promotion")
          .eq("title", `Promotion Readiness: ${plan.position_title}`)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase
            .schema("bpm-anec-global")
            .from("social_recognition")
            .insert({
              receiver_id: plan.potential_successor,
              giver_id: plan.potential_successor,
              title: `Promotion Readiness: ${plan.position_title}`,
              category: "Promotion",
              message: `Recognized for achieving "Ready Now" status for the ${plan.position_title} position!`,
              points: 150,
              created_at: plan.created_at || new Date().toISOString()
            });
          createdCount++;
        }
      }
    }

    revalidatePath("/hr/dept1/recognition");
    revalidatePath("/hr/dept2/recognition");
    return { success: true, count: createdCount };
  } catch (error: any) {
    console.error("Auto-recognition error:", error);
    return { success: false, error: error.message };
  }
}

export async function notifyEmployeeEnrollment(
  employeeId: string,
  employeeEmail: string,
  employeeName: string,
  courseTitle: string,
  type: "course" | "training"
) {
  const supabase = createAdminClient();
  try {
    // 1. Create System Notification
    await supabase
      .schema("bpm-anec-global")
      .from("notifications")
      .insert({
        user_id: employeeId,
        title: `New ${type === "course" ? "Learning" : "Training"} Assignment`,
        message: `You have been enrolled in: ${courseTitle}. Please check your dashboard for details.`,
        type: "system",
        is_read: false
      });

    // 2. Send Email
    if (employeeEmail && process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "HR Notifications <notifications@bsit3219na.online>",
        to: employeeEmail,
        subject: `Enrollment Notification: ${courseTitle}`,
        text: `Dear ${employeeName},\n\nYou have been successfully enrolled in the following ${type}: ${courseTitle}.\n\nPlease log in to the HR portal to begin your session.\n\nBest regards,\nHR Department`
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Notification error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  newStatus: string
) {
  const supabase = createAdminClient();
  try {
    const { data: enrollment, error: fetchError } = await supabase
      .schema("bpm-anec-global")
      .from("training_management")
      .select("*, profiles!training_management_employee_id_fkey(full_name)")
      .eq("id", enrollmentId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("training_management")
      .update({ 
        status: newStatus,
        completed_at: newStatus === "Completed" ? new Date().toISOString() : null,
        completion_date: newStatus === "Completed" ? new Date().toISOString().split('T')[0] : null
      })
      .eq("id", enrollmentId);

    if (error) throw error;
    
    // Auto-recognize on completion
    if (newStatus === "Completed" && enrollment) {
      // Robust detection of Course (Learning) vs Training
      // We check learning_management table which stores the course blueprints
      const { data: checkTable } = await supabase
        .schema("bpm-anec-global")
        .from("learning_management") 
        .select("id")
        .eq("id", enrollment.course_id)
        .single();

      const isCourse = !!checkTable;
      const title = isCourse ? "Learning Certificate Achievement" : "Training Completion Achievement";
      const category = isCourse ? "Learning" : "Training";
      
      const { error: recognitionError } = await supabase
        .schema("bpm-anec-global")
        .from("social_recognition")
        .insert({
          receiver_id: enrollment.employee_id,
          giver_id: enrollment.employee_id, 
          title: title,
          category: category,
          message: `Successfully completed the ${isCourse ? 'course' : 'training'}: ${enrollment.course_name || enrollment.training_name || 'Department Program'}.`,
          points: isCourse ? 50 : 75,
        });

      if (recognitionError) {
        console.error("Failed to create automated recognition:", recognitionError);
        // We don't throw here to ensure the enrollment status update itself isn't rolled back or failed in the eyes of the user, 
        // but we log it for debugging.
      }
    }

    revalidatePath("/hr/dept2/learning");
    revalidatePath("/hr/dept2/training");
    revalidatePath("/hr/dept1/recognition");
    revalidatePath("/hr/dept2/recognition");
    return { success: true };
  } catch (error: any) {
    console.error("Update enrollment status error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBlueprintStatus(
  type: "course" | "training",
  id: string,
  status: string
) {
  const supabase = createAdminClient();
  try {
    const table = type === "course" ? "learning_management" : "training_events";
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from(table)
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/hr/dept2/learning");
    revalidatePath("/hr/dept2/training");
    return { success: true };
  } catch (error: any) {
    console.error(`Update ${type} blueprint status error:`, error);
    return { success: false, error: error.message };
  }
}

export async function updateSuccessionStatus(id: string, newStatus: string) {
  const supabase = createAdminClient();
  try {
    const { data: plan, error: fetchError } = await supabase
      .schema("bpm-anec-global")
      .from("succession_planning")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("succession_planning")
      .update({ readiness_status: newStatus })
      .eq("id", id);

    if (error) throw error;

    // Auto-recognize if Ready Now
    if (newStatus === "Ready Now" && plan) {
      await supabase
        .schema("bpm-anec-global")
        .from("social_recognition")
        .insert({
          receiver_id: plan.potential_successor,
          giver_id: plan.potential_successor,
          title: `Promotion Readiness: ${plan.position_title}`,
          category: "Promotion",
          message: `Recognized for achieving "Ready Now" status for the ${plan.position_title} position!`,
          points: 150,
        });
    }

    revalidatePath("/hr/dept2/succession");
    revalidatePath("/hr/dept2/recognition");
    return { success: true };
  } catch (error: any) {
    console.error("Update succession status error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCompetencyLevel(id: string, newLevel: string) {
  const supabase = createAdminClient();
  try {
    const { error } = await supabase
      .schema("bpm-anec-global")
      .from("competency_management")
      .update({ 
        proficiency_level: newLevel,
        last_evaluation: new Date().toISOString().split('T')[0]
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/hr/dept2/competency");
    return { success: true };
  } catch (error: any) {
    console.error("Update competency level error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches the top 5 performers globally.
 * Uses createAdminClient to bypass RLS for public leaderboard display.
 */
export async function getPerformanceLeaderboard() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .schema("bpm-anec-global")
      .from("performance_results")
      .select(`
        id,
        avg_score,
        receiver:employee_id (
          full_name,
          avatar_url,
          role
        )
      `)
      .order("avg_score", { ascending: false })
      .limit(5);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Get leaderboard error:", error);
    return { success: false, error: error.message };
  }
}

// --- Auditing ---
export async function logTransaction({
  userId,
  action,
  entityType,
  entityId,
  details,
}: {
  userId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .schema("bpm-anec-global")
    .from("audit_logs")
    .insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  if (error) console.error("Audit log error:", error);
}

export async function archiveEmployee(id: string, isArchived: boolean) {
  const supabase = createAdminClient();
  const { error: profileError } = await supabase
    .schema("bpm-anec-global")
    .from("profiles")
    .update({ is_archived: isArchived })
    .eq("id", id);

  if (profileError) return { success: false, error: profileError.message };

  await logTransaction({
    userId: (await supabase.auth.getUser()).data.user?.id || null,
    action: isArchived ? "archive_employee" : "unarchive_employee",
    entityType: "profile",
    entityId: id,
  });

  revalidatePath("/hr/dept4/hcm");
  return { success: true };
}

export async function deleteEmployee(id: string) {
  const supabase = createAdminClient();
  const { error: authError } = await supabase.auth.admin.deleteUser(id);

  if (authError) return { success: false, error: authError.message };

  await logTransaction({
    userId: (await supabase.auth.getUser()).data.user?.id || null,
    action: "delete_employee",
    entityType: "profile",
    entityId: id,
  });

  revalidatePath("/hr/dept4/hcm");
  return { success: true };
}

export async function updateEmployee(
  id: string,
  data: {
    fullName: string;
    roleId: string;
    departmentId: string;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .schema("bpm-anec-global")
    .from("profiles")
    .update({
      full_name: data.fullName,
      role_id: data.roleId,
      department_id: data.departmentId,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await logTransaction({
    userId: (await supabase.auth.getUser()).data.user?.id || null,
    action: "update_employee",
    entityType: "profile",
    entityId: id,
    details: data,
  });

  revalidatePath("/hr/dept4/hcm");
  revalidatePath("/hr/dept1/onboarding");
  revalidatePath("/hr");
  return { success: true };
}

export async function createRole(name: string, description?: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .schema("bpm-anec-global")
    .from("roles")
    .insert([{ name, description }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logTransaction({
    userId: (await supabase.auth.getUser()).data.user?.id || null,
    action: "create_role",
    entityType: "role",
    entityId: data.id,
    details: { name },
  });

  revalidatePath("/hr/dept4/hcm");
  revalidatePath("/hr/dept1/onboarding");
  revalidatePath("/hr/dept3");
  revalidatePath("/core/transaction3/admin/hcm");
  revalidatePath("/core/transaction3/admin/audit");
  return { success: true };
}

export async function createDepartment(name: string, code: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .schema("bpm-anec-global")
    .from("departments")
    .insert([{ name, code }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logTransaction({
    userId: (await supabase.auth.getUser()).data.user?.id || null,
    action: "create_department",
    entityType: "department",
    entityId: data.id,
    details: { name, code },
  });

  revalidatePath("/hr/dept4/hcm");
  revalidatePath("/hr/dept1/onboarding");
  revalidatePath("/hr/dept1/recruitment");
  revalidatePath("/hr/dept3");
  revalidatePath("/core/transaction3/admin/hcm");
  revalidatePath("/core/transaction3/admin/audit");
  return { success: true };
}
