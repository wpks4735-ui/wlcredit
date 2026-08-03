import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_ROLES = new Set(["super_admin", "finance"]);
const FUNCTION_VERSION = "33.2-finance-hr-role";

/**
 * Frontend may send "staff", but the existing staff_profiles constraint
 * normally stores "customer_service".
 */
const ROLE_MAP: Record<string, string> = {
  staff: "customer_service",
  customer_service: "customer_service",
  finance: "finance",
  super_admin: "super_admin",
};
const ALLOWED_ROLES = new Set(["customer_service", "finance", "super_admin"]);
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  customer_service: {
    applications_view: true, applications_claim: true, applications_approve: true, applications_reject: true,
    customers_view: true, customers_create: true, customers_edit: true, customers_files_view: true,
    customers_files_upload: true, customers_files_delete: false, loans_view: true, loans_create: true,
    loans_edit: true, banks_manage: false, banks_assign: false, contacts_manage: false, contacts_assign: false,
    payments_view: true, payments_approve_partial: true, payments_approve_renew: true,
    payments_approve_settle: true, payments_reject: true, reports_view: true, staff_manage: false,
    settings_manage: false, company_view: false, company_manage: false, payroll_view: false, payroll_manage: false,
  },
  finance: {
    applications_view: false, applications_claim: false, applications_approve: false, applications_reject: false,
    customers_view: true, customers_create: false, customers_edit: false, customers_files_view: true,
    customers_files_upload: false, customers_files_delete: false, loans_view: true, loans_create: false,
    loans_edit: false, banks_manage: true, banks_assign: false, contacts_manage: false, contacts_assign: false,
    payments_view: true, payments_approve_partial: false, payments_approve_renew: false,
    payments_approve_settle: false, payments_reject: false, reports_view: true, staff_manage: true,
    settings_manage: false, company_view: true, company_manage: true, payroll_view: true, payroll_manage: true,
  },
  super_admin: {},
};


function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeRole(value: unknown): string {
  const input = normalizeText(value).toLowerCase();
  return ROLE_MAP[input] ?? input;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  let createdUserId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(
        {
          ok: false,
          error:
            "Edge Function secrets are incomplete. SUPABASE_URL, SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY), and SUPABASE_SERVICE_ROLE_KEY are required.",
        },
        500,
      );
    }

    const authorization = request.headers.get("Authorization") ?? "";
    if (!authorization.toLowerCase().startsWith("bearer ")) {
      return json({ ok: false, error: "Not authenticated" }, 401);
    }

    // Verify the person calling the function.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user: callerUser },
      error: callerAuthError,
    } = await callerClient.auth.getUser();

    if (callerAuthError || !callerUser) {
      console.error("Caller authentication failed", callerAuthError);
      return json({ ok: false, error: "Not authenticated" }, 401);
    }

    // Service role is used only inside this server-side function.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: callerProfile, error: callerProfileError } =
      await adminClient
        .from("staff_profiles")
        .select("user_id, role, is_active")
        .eq("user_id", callerUser.id)
        .maybeSingle();

    if (callerProfileError) {
      console.error("Unable to read caller profile", callerProfileError);
      return json(
        {
          ok: false,
          error: `Unable to verify staff profile: ${callerProfileError.message}`,
        },
        500,
      );
    }

    if (!callerProfile) {
      return json(
        { ok: false, error: "Staff profile not found for current login" },
        403,
      );
    }

    const callerRole = normalizeRole(callerProfile.role);

    if (callerProfile.is_active === false) {
      return json({ ok: false, error: "This staff account is disabled" }, 403);
    }

    if (!ADMIN_ROLES.has(callerRole)) {
      console.error("Admin access denied", {
        user_id: callerUser.id,
        database_role: callerProfile.role,
        normalized_role: callerRole,
      });

      return json(
        {
          ok: false,
          error: `Staff administration access required. Current role: ${
            callerRole || "unknown"
          }`,
        },
        403,
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON request body" }, 400);
    }

    const action = normalizeText(body.action || "create_account").toLowerCase();

    if (action === "version" || action === "health") {
      return json({ ok: true, version: FUNCTION_VERSION });
    }

    if (["production_reset", "production-reset", "reset_production", "reset"].includes(action)) {
      if (callerRole !== "super_admin") {
        return json({ ok: false, error: "Only Super Admin can reset production data." }, 403);
      }
      if (normalizeText(body.confirmation) !== "RESET WL CREDIT") {
        return json({ ok: false, error: "Invalid reset confirmation." }, 400);
      }

      // Clear every object recursively through the Storage API. Direct deletion
      // from storage.objects is intentionally never used.
      const buckets = ["loan-applications", "payment-receipts", "customer-documents", "company-receipts"];
      const listAllPaths = async (bucket: string, prefix = ""): Promise<string[]> => {
        const paths: string[] = [];
        let offset = 0;
        while (true) {
          const { data: entries, error } = await adminClient.storage.from(bucket).list(prefix, {
            limit: 100,
            offset,
            sortBy: { column: "name", order: "asc" },
          });
          if (error) {
            const message = String(error.message || "");
            if (message.toLowerCase().includes("bucket") || message.toLowerCase().includes("not found")) return paths;
            throw new Error(`Unable to list ${bucket}: ${message}`);
          }
          if (!entries?.length) break;
          for (const entry of entries) {
            const path = prefix ? `${prefix}/${entry.name}` : entry.name;
            // Storage folders have no id; files do.
            if (entry.id) paths.push(path);
            else paths.push(...await listAllPaths(bucket, path));
          }
          if (entries.length < 100) break;
          offset += entries.length;
        }
        return paths;
      };

      for (const bucket of buckets) {
        try {
          const paths = await listAllPaths(bucket);
          for (let i = 0; i < paths.length; i += 100) {
            const { error } = await adminClient.storage.from(bucket).remove(paths.slice(i, i + 100));
            if (error) throw new Error(`Unable to clear ${bucket}: ${error.message}`);
          }
        } catch (error) {
          return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
        }
      }

      const { data: resetData, error: resetError } = await adminClient.rpc("production_reset_data", {
        p_confirmation: "RESET WL CREDIT",
      });
      if (resetError) return json({ ok: false, error: resetError.message }, 400);
      return json({ ok: true, message: "Production data reset successfully.", result: resetData, version: FUNCTION_VERSION });
    }

    if (action === "delete" || action === "delete_account" || action === "delete_employee") {
      const targetUserId = normalizeText(body.user_id || body.employee_user_id || body.target_user_id);
      const employeeId = normalizeText(body.employee_id || body.id);

      if (!employeeId && !targetUserId) {
        return json({ ok: false, error: "Employee ID or user ID is required." }, 400);
      }
      if (targetUserId && targetUserId === callerUser.id) {
        return json({ ok: false, error: "You cannot delete your own login account." }, 400);
      }

      let employee: any = null;
      if (employeeId) {
        const { data, error } = await adminClient.from("employees").select("*").eq("id", employeeId).maybeSingle();
        if (error) return json({ ok: false, error: `Unable to read employee: ${error.message}` }, 500);
        employee = data;
      } else if (targetUserId) {
        const { data, error } = await adminClient.from("employees").select("*").eq("staff_user_id", targetUserId).maybeSingle();
        if (error) return json({ ok: false, error: `Unable to read employee: ${error.message}` }, 500);
        employee = data;
      }

      const resolvedUserId = targetUserId || normalizeText(employee?.staff_user_id);
      let targetProfile: any = null;
      if (resolvedUserId) {
        const { data, error } = await adminClient.from("staff_profiles").select("user_id, username, role").eq("user_id", resolvedUserId).maybeSingle();
        if (error) return json({ ok: false, error: `Unable to read employee account: ${error.message}` }, 500);
        targetProfile = data;
        const targetRole = normalizeRole(targetProfile?.role);
        if (targetRole === "super_admin" && callerRole !== "super_admin") {
          return json({ ok: false, error: "Only Super Admin can delete a Super Admin account." }, 403);
        }
        if (callerRole === "finance" && !["customer_service", "finance"].includes(targetRole)) {
          return json({ ok: false, error: "Finance can only manage Customer Service and Finance accounts." }, 403);
        }
      }

      // Delete dependent company records first so old databases without cascade rules also work.
      if (employee?.id || employeeId) {
        const idToDelete = employee?.id || employeeId;
        for (const table of ["salary_advances", "payroll_records", "attendance_records"]) {
          const { error: dependentError } = await adminClient.from(table).delete().eq("employee_id", idToDelete);
          if (dependentError) return json({ ok: false, error: `Unable to delete ${table}: ${dependentError.message}` }, 400);
        }
        const { error } = await adminClient.from("employees").delete().eq("id", idToDelete);
        if (error) return json({ ok: false, error: `Unable to delete employee profile: ${error.message}` }, 400);
      }

      if (resolvedUserId) {
        const { error: profileDeleteError } = await adminClient.from("staff_profiles").delete().eq("user_id", resolvedUserId);
        if (profileDeleteError) return json({ ok: false, error: `Unable to delete staff profile: ${profileDeleteError.message}` }, 400);
        const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(resolvedUserId);
        if (authDeleteError && !String(authDeleteError.message || "").toLowerCase().includes("not found")) {
          return json({ ok: false, error: `Unable to delete login account: ${authDeleteError.message}` }, 400);
        }
      }

      return json({
        ok: true,
        message: resolvedUserId ? "Employee account deleted successfully." : "Employee record deleted successfully.",
        user_id: resolvedUserId || null,
        employee_id: employee?.id || employeeId || null,
        username: targetProfile?.username || null,
      });
    }

    if (action === "update" || action === "update_account" || action === "update_employee") {
      const targetUserId = normalizeText(body.user_id || body.target_user_id);
      if (!targetUserId) {
        return json({ ok: false, error: "User ID is required." }, 400);
      }

      const { data: targetProfile, error: targetProfileError } = await adminClient
        .from("staff_profiles")
        .select("user_id, role, username, auth_email")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (targetProfileError) return json({ ok: false, error: targetProfileError.message }, 500);
      if (!targetProfile) return json({ ok: false, error: "Staff account not found." }, 404);

      const oldRole = normalizeRole(targetProfile.role);
      const newRole = normalizeRole(body.role || oldRole);
      if (!ALLOWED_ROLES.has(newRole)) return json({ ok: false, error: "Role must be customer_service, finance, or super_admin." }, 400);
      if (oldRole === "super_admin" && callerRole !== "super_admin") {
        return json({ ok: false, error: "Admin cannot modify a Super Admin account." }, 403);
      }
      if (newRole === "super_admin" && callerRole !== "super_admin") {
        return json({ ok: false, error: "Only Super Admin can assign the Super Admin role." }, 403);
      }
      if (callerRole === "finance" && (!["customer_service", "finance"].includes(oldRole) || !["customer_service", "finance"].includes(newRole))) {
        return json({ ok: false, error: "Finance can only modify Customer Service and Finance accounts." }, 403);
      }
      if (targetUserId === callerUser.id && body.is_active === false) {
        return json({ ok: false, error: "You cannot disable your own account." }, 400);
      }

      const username = normalizeText(body.username || targetProfile.username).toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        return json({ ok: false, error: "Username must contain 3–30 lowercase letters, numbers, or underscores only." }, 400);
      }
      if (!Object.values(ROLE_MAP).includes(newRole)) {
        return json({ ok: false, error: `Invalid staff role: ${newRole}` }, 400);
      }

      const { data: duplicate } = await adminClient
        .from("staff_profiles")
        .select("user_id")
        .eq("username", username)
        .neq("user_id", targetUserId)
        .maybeSingle();
      if (duplicate) return json({ ok: false, error: "Username already exists." }, 409);

      const email = `${username}@staff.wlcredit.local`;
      const password = String(body.password ?? "");
      const authUpdate: Record<string, unknown> = {};
      if (email !== targetProfile.auth_email) authUpdate.email = email;
      if (password) {
        if (password.length < 8) return json({ ok: false, error: "Password must be at least 8 characters." }, 400);
        authUpdate.password = password;
      }
      if (Object.keys(authUpdate).length) {
        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(targetUserId, authUpdate);
        if (authUpdateError) return json({ ok: false, error: `Unable to update login account: ${authUpdateError.message}` }, 400);
      }

      const profilePatch = {
        full_name: normalizeText(body.full_name || username),
        username,
        auth_email: email,
        role: newRole,
        permissions: typeof body.permissions === "object" && body.permissions ? body.permissions : (DEFAULT_PERMISSIONS[newRole] ?? {}),
        is_active: body.is_active !== false,
        updated_at: new Date().toISOString(),
      };
      const { error: profileUpdateError } = await adminClient
        .from("staff_profiles")
        .update(profilePatch)
        .eq("user_id", targetUserId);
      if (profileUpdateError) return json({ ok: false, error: `Unable to update staff profile: ${profileUpdateError.message}` }, 400);

      await adminClient.from("employees").update({
        full_name: profilePatch.full_name,
        updated_by: callerUser.id,
      }).eq("staff_user_id", targetUserId);

      return json({ ok: true, message: "Staff account updated successfully.", user_id: targetUserId, username, role: newRole, version: FUNCTION_VERSION });
    }

    if (!["create", "create_account", "create_employee"].includes(action)) {
      return json({ ok: false, error: `Unsupported action: ${action}`, version: FUNCTION_VERSION }, 400);
    }

    const username = normalizeText(body.username).toLowerCase();
    const password = String(body.password ?? "");
    const requestedRole = normalizeText(body.role || "staff").toLowerCase();
    const databaseRole = normalizeRole(requestedRole);

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return json(
        {
          ok: false,
          error:
            "Username must contain 3–30 lowercase letters, numbers, or underscores only.",
        },
        400,
      );
    }

    if (password.length < 8) {
      return json(
        {
          ok: false,
          error: "Password must be at least 8 characters.",
        },
        400,
      );
    }

    if (!Object.values(ROLE_MAP).includes(databaseRole)) {
      return json(
        {
          ok: false,
          error: `Invalid staff role: ${requestedRole}`,
        },
        400,
      );
    }

    if (databaseRole === "super_admin" && callerRole !== "super_admin") {
      return json(
        {
          ok: false,
          error: "Only Super Admin can create another Super Admin.",
        },
        403,
      );
    }
    if (callerRole === "finance" && !["customer_service", "finance"].includes(databaseRole)) {
      return json({ ok: false, error: "Finance can only create Customer Service and Finance accounts." }, 403);
    }

    const email = `${username}@staff.wlcredit.local`;

    // Prevent duplicate username before creating the Auth user.
    const { data: existingProfile, error: existingProfileError } =
      await adminClient
        .from("staff_profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

    if (existingProfileError) {
      return json(
        {
          ok: false,
          error: `Unable to check username: ${existingProfileError.message}`,
        },
        500,
      );
    }

    if (existingProfile) {
      return json({ ok: false, error: "Username already exists." }, 409);
    }

    const { data: createdAuth, error: createAuthError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          full_name: username,
        },
      });

    if (createAuthError || !createdAuth.user) {
      console.error("Auth account creation failed", createAuthError);
      return json(
        {
          ok: false,
          error:
            createAuthError?.message || "Unable to create employee login account.",
        },
        400,
      );
    }

    createdUserId = createdAuth.user.id;

    const { error: profileInsertError } = await adminClient
      .from("staff_profiles")
      .insert({
        user_id: createdUserId,
        full_name: username,
        username,
        auth_email: email,
        role: databaseRole,
        permissions: typeof body.permissions === "object" && body.permissions ? body.permissions : (DEFAULT_PERMISSIONS[databaseRole] ?? {}),
        is_active: true,
        updated_at: new Date().toISOString(),
      });

    if (profileInsertError) {
      throw new Error(
        `Unable to create staff profile: ${profileInsertError.message}`,
      );
    }

    // Create an empty employee profile. The employee completes it in "My HR".
    const { data: employee, error: employeeInsertError } = await adminClient
      .from("employees")
      .insert({
        full_name: username,
        basic_salary: 0,
        employment_status: "active",
        staff_user_id: createdUserId,
        created_by: callerUser.id,
        updated_by: callerUser.id,
      })
      .select("id, employee_code")
      .single();

    if (employeeInsertError) {
      throw new Error(
        `Unable to create employee profile: ${employeeInsertError.message}`,
      );
    }

    return json(
      {
        ok: true,
        message: "Employee account created successfully.",
        username,
        role: requestedRole,
        database_role: databaseRole,
        user_id: createdUserId,
        employee_id: employee.id,
        employee_code: employee.employee_code,
      },
      200,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected request failure";

    console.error("staff-admin error", error);

    // Remove any partially-created Auth/profile record.
    if (createdUserId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (supabaseUrl && serviceRoleKey) {
          const cleanupClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          });

          await cleanupClient
            .from("employees")
            .delete()
            .eq("staff_user_id", createdUserId);

          await cleanupClient
            .from("staff_profiles")
            .delete()
            .eq("user_id", createdUserId);

          await cleanupClient.auth.admin.deleteUser(createdUserId);
        }
      } catch (cleanupError) {
        console.error("Cleanup failed", cleanupError);
      }
    }

    return json({ ok: false, error: message }, 400);
  }
});
