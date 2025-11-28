import bcrypt from 'bcryptjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { email, password } = body;

  try {
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return new Response(JSON.stringify(userWithoutPassword), { 
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
