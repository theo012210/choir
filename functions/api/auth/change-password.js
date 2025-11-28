import bcrypt from 'bcryptjs';

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { email, currentPassword, newPassword } = body;

  if (!email || !currentPassword || !newPassword) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Verify user and current password
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return new Response(JSON.stringify({ error: 'Incorrect current password' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update password in database
    await env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
      .bind(hashedPassword, user.id)
      .run();

    return new Response(JSON.stringify({ message: 'Password updated successfully' }), { 
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
