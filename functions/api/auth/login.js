export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { email, password } = body;

  try {
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND password = ?')
      .bind(email, password)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
