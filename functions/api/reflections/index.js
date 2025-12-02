export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');

  if (!date) {
    return new Response(JSON.stringify({ error: 'Date parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const reflection = await env.DB.prepare('SELECT * FROM reflections WHERE date = ?').bind(date).first();
    
    return new Response(JSON.stringify(reflection || null), { 
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

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { date, good, bad, updatedBy } = body;

  if (!date) {
    return new Response(JSON.stringify({ error: 'Date is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();

  try {
    // Check if exists
    const existing = await env.DB.prepare('SELECT id FROM reflections WHERE date = ?').bind(date).first();

    if (existing) {
      await env.DB.prepare('UPDATE reflections SET good = ?, bad = ?, updatedBy = ?, updatedAt = ? WHERE date = ?')
        .bind(good, bad, updatedBy, now, date)
        .run();
    } else {
      await env.DB.prepare('INSERT INTO reflections (date, good, bad, updatedBy, updatedAt) VALUES (?, ?, ?, ?, ?)')
        .bind(date, good, bad, updatedBy, now)
        .run();
    }

    const updated = await env.DB.prepare('SELECT * FROM reflections WHERE date = ?').bind(date).first();

    return new Response(JSON.stringify(updated), { 
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
