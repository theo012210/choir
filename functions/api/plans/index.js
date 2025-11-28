export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare('SELECT * FROM plans').all();
    const plans = results.map(plan => ({
      ...plan,
      visibleTo: JSON.parse(plan.visibleTo)
    }));
    return new Response(JSON.stringify(plans), { 
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
  const { title, date, description, status, visibleTo } = body;

  try {
    const result = await env.DB.prepare('INSERT INTO plans (title, date, description, status, visibleTo) VALUES (?, ?, ?, ?, ?)')
      .bind(title, date, description, status, JSON.stringify(visibleTo))
      .run();

    const newPlan = {
      id: result.meta.last_row_id,
      ...body
    };

    return new Response(JSON.stringify(newPlan), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
