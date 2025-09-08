import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type AdminOp =
  | { op: 'suspend'; tenantId: string }
  | { op: 'activate'; tenantId: string }
  | { op: 'create'; data: Record<string, unknown> };

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as AdminOp;
    // NOTE: In production, verify JWT and super_admin here.
    // This is a scaffold; implement security before enabling.
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


