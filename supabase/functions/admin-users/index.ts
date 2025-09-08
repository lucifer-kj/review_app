import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type AdminUserOp =
  | { op: 'invite'; email: string; role: string; tenantId?: string }
  | { op: 'role'; userId: string; role: string }
  | { op: 'deactivate'; userId: string };

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as AdminUserOp;
    // TODO: Verify JWT and super_admin role; perform DB ops; audit log.
    return new Response(JSON.stringify({ ok: true, payload }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (_e) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid request' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});


