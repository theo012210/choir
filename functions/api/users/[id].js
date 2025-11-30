import bcrypt from 'bcryptjs';

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;

  try {
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ message: 'User deleted' }), { 
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

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;
  const body = await request.json();
  const { newPassword } = body;

  if (!newPassword) {
    return new Response(JSON.stringify({ error: 'New password is required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
      .bind(hashedPassword, id)
      .run();

    return new Response(JSON.stringify({ message: 'Password reset successfully' }), { 
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
