export async function POST() {
  const response = Response.json({ success: true }, { status: 200 });
  response.headers.set('Set-Cookie', 
    'cobroo_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  return response;
}
