export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;
  const body = await request.json();
  const { title, date, description, status, visibleTo } = body;

  try {
    await env.DB.prepare('UPDATE plans SET title = ?, date = ?, description = ?, status = ?, visibleTo = ? WHERE id = ?')
      .bind(title, date, description, status, JSON.stringify(visibleTo), id)
      .run();

    return new Response(JSON.stringify({ id, ...body }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;

  try {
    await env.DB.prepare('DELETE FROM plans WHERE id = ?')
      .bind(id)
      .run();

    return new Response(JSON.stringify({ message: 'Plan deleted successfully' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
