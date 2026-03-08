"use client";
import EmployeePerformancePage from "@/app/hr/dept1/performance/page";
import { useUser } from "@/context/UserContext";

export default function HrDept4PerformancePage() {
  const { profile } = useUser();

  // Robust checking for department code
  const deptObj = Array.isArray(
    profile?.department,
  )
    ? profile?.department[0]
    : profile?.department;
  const deptCode = deptObj?.code;

  let backUrl = "/hr/dept4"; // default Fallback

  if (deptCode?.startsWith("HR_DEPT")) {
    const deptNumber = deptCode
      .split("_")[1]
      .toLowerCase();
    backUrl = `/hr/${deptNumber}`;
  }

  return (
    <EmployeePerformancePage
      backUrl={backUrl}
      title="HR Performance Evaluation"
    />
  );
}
