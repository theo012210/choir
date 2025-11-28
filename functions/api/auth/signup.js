export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { name, email, password, role } = body;

  try {
    const existingUser = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
    }

    const result = await env.DB.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
      .bind(name, email, password, role)
      .run();

    const newUser = {
      id: result.meta.last_row_id,
      name,
      email,
      role
    };

    return new Response(JSON.stringify(newUser), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
