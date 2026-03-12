# Role-Based Access Control (RBAC) Documentation

This document outlines the available roles, department codes, and access permissions in the BPM Integration system.

## 1. Roles & Department Mappings

| Role Group       | Admin Role        | Employee Role                            | Dept Code   | Access Path                |
| :--------------- | :---------------- | :--------------------------------------- | :---------- | :------------------------- |
| **Global Admin** | `admin`           | N/A                                      | N/A         | `/core/transaction3/admin` |
| **HR Dept 1**    | `hr1_admin`       | `hr1_employee`                           | `HR_DEPT1`  | `/hr/dept1`                |
| **HR Dept 2**    | `hr2_admin`       | `hr2_employee`                           | `HR_DEPT2`  | `/hr/dept2`                |
| **HR Dept 3**    | `hr3_admin`       | `hr3_employee`                           | `HR_DEPT3`  | `/hr/dept3`                |
| **HR Dept 4**    | `hr4_admin`       | `hr4_employee`                           | `HR_DEPT4`  | `/hr/dept4`                |
| **Finance**      | `finance_admin`   | `finance_employee`                       | `FINANCE`   | `/finance`                 |
| **Logistics 1**  | `logistic1_admin` | `logistic1_employee`                     | `LOG_DEPT1` | `/logistic/dept1`          |
| **Logistics 2**  | `logistic2_admin` | `logistic2_employee`, `logistic2_driver` | `LOG_DEPT2` | `/logistic/dept2`          |

## 2. Access Rules (Sidebar Submodules)

### HR1 Items

- **HR1 Admin**: All HR1 modules.
- **HR1 Employee**: Applicant, Onboarding, Performance.

### HR2 Items

- **HR2 Admin**: All HR2 modules.
- **HR2 Employee**: Learning, Training, Succession, (HR1) Performance.

### HR3 Items

- **HR3 Admin**: All HR3 modules.
- **HR3 Employee**: Attendance, Timesheet, Shift, (HR1) Performance.

### HR4 Items

- **HR4 Admin**: All HR4 modules.
- **HR4 Employee**: HCM, Payroll, Performance, Compensation.

### Shared Integration Modules (Visible to ALL Employees)

- **HR2**: Training, Learning.
- **HR3**: Leave, Claims, Shifts.
- **HR4**: Payroll, Benefits.

## 3. Manual Role Assignment Script (SAFE)

Use this script to assign a role to a specific user. This version is **non-destructive** and will not affect other users.

```sql
DO $$
DECLARE
  v_target_email TEXT := 'user@example.com'; -- CHANGE THIS
  v_new_role     TEXT := 'hr1_admin';       -- Choose from the table above
  v_dept_code    TEXT := 'HR_DEPT1';         -- Choose from the table above
  v_dept_id      UUID;
  v_role_id      UUID;
  v_legacy_role  TEXT;
BEGIN
  -- 1. Ensure all mandatory roles exist (Safe: will not delete anything)
  INSERT INTO "bpm-anec-global".roles (name) VALUES
    ('hr1_admin'), ('hr1_employee'),
    ('hr2_admin'), ('hr2_employee'),
    ('hr3_admin'), ('hr3_employee'),
    ('hr4_admin'), ('hr4_employee'),
    ('logistic1_admin'), ('logistic1_employee'),
    ('logistic2_admin'), ('logistic2_employee'), ('logistic2_driver'),
    ('finance_admin'), ('finance_employee')
  ON CONFLICT (name) DO NOTHING;

  -- 2. Get the IDs for the target Department and Role
  SELECT id INTO v_dept_id FROM "bpm-anec-global".departments WHERE code = v_dept_code;
  SELECT id INTO v_role_id FROM "bpm-anec-global".roles WHERE name = v_new_role;

  -- 3. Validation
  IF v_dept_id IS NULL THEN
     RAISE EXCEPTION 'Department code % not found', v_dept_code;
  END IF;
  IF v_role_id IS NULL THEN
     RAISE EXCEPTION 'Role % not found', v_new_role;
  END IF;

  -- 4. Determine legacy fallback group (for frontend logic compatibility)
  v_legacy_role := CASE
    WHEN v_new_role LIKE 'hr%' THEN 'hr'
    WHEN v_new_role LIKE 'finance%' THEN 'finance'
    WHEN v_new_role LIKE 'logistic%' THEN 'logistics'
    ELSE v_new_role
  END;

  -- 5. Update ONLY the target user
  UPDATE "bpm-anec-global".profiles
  SET
    role_id = v_role_id,
    role = v_legacy_role,
    department_id = v_dept_id
  WHERE email = v_target_email;

  RAISE NOTICE 'Successfully updated % to role % in dept %', v_target_email, v_new_role, v_dept_code;
END $$;
```
