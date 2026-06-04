import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Query real resource usage stats from the database
    const waSent = queryOne("SELECT COUNT(*) as count FROM reminders WHERE user_id = ? AND channel = 'whatsapp'", [user.id]);
    const vehCount = queryOne("SELECT COUNT(*) as count FROM charges WHERE user_id = ? AND vehicle_info IS NOT NULL AND vehicle_info != ''", [user.id]);
    const contractsCount = queryOne("SELECT COUNT(*) as count FROM charges WHERE user_id = ? AND contract_text IS NOT NULL AND contract_text != ''", [user.id]);

    return Response.json({ 
      user,
      usage: {
        whatsappSent: waSent?.count || 0,
        vehicles: vehCount?.count || 0,
        aiContracts: contractsCount?.count || 0
      }
    }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, business_name, pix_key, pix_key_type, phone, plan, score_limit_good, score_limit_regular, avatar_url } = body;

    const currentName = name !== undefined ? name : user.name;
    const currentBusinessName = business_name !== undefined ? business_name : user.business_name;
    const currentPixKey = pix_key !== undefined ? pix_key : user.pix_key;
    const currentPixKeyType = pix_key_type !== undefined ? pix_key_type : user.pix_key_type;
    const currentPhone = phone !== undefined ? phone : user.phone;
    const currentPlan = plan !== undefined ? plan : user.plan;
    const currentScoreLimitGood = score_limit_good !== undefined ? parseFloat(score_limit_good) : user.score_limit_good;
    const currentScoreLimitRegular = score_limit_regular !== undefined ? parseFloat(score_limit_regular) : user.score_limit_regular;
    const currentAvatarUrl = avatar_url !== undefined ? avatar_url : user.avatar_url;

    if (plan !== undefined && !['starter', 'crescimento', 'cobra_pro', 'trial'].includes(plan)) {
      return Response.json({ error: 'Plano inválido' }, { status: 400 });
    }

    run(
      `UPDATE users SET 
        name = ?, 
        business_name = ?, 
        pix_key = ?, 
        pix_key_type = ?, 
        phone = ?, 
        plan = ?, 
        score_limit_good = ?,
        score_limit_regular = ?,
        avatar_url = ?,
        updated_at = datetime('now') 
       WHERE id = ?`,
      [
        currentName,
        currentBusinessName,
        currentPixKey,
        currentPixKeyType,
        currentPhone,
        currentPlan,
        currentScoreLimitGood,
        currentScoreLimitRegular,
        currentAvatarUrl,
        user.id
      ]
    );

    const updatedUser = queryOne(
      `SELECT id, name, email, role, phone, pix_key, pix_key_type, business_name, business_description, plan, plan_expires_at, status, onboarding_completed, score_limit_good, score_limit_regular, avatar_url, created_at 
       FROM users WHERE id = ?`,
      [user.id]
    );

    return Response.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

