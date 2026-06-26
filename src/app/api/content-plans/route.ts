import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET /api/content-plans — list current user's saved plans (newest first)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const plans = await db.contentPlan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      plans: plans.map((p) => ({
        id: p.id,
        niche: p.niche,
        audience: p.audience,
        planData: p.planData,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('[content-plans GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/content-plans — save a generated plan
// Body: { niche, audience, planData }  where planData is a JSON-stringifiable array
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { niche, audience, planData } = body;

    if (!niche || !planData) {
      return NextResponse.json(
        { error: 'niche y planData son requeridos' },
        { status: 400 }
      );
    }

    // Serialize planData to string if not already
    const serialized = typeof planData === 'string' ? planData : JSON.stringify(planData);

    const plan = await db.contentPlan.create({
      data: {
        niche,
        audience: audience || '',
        planData: serialized,
        userId: user.id,
      },
    });

    return NextResponse.json({
      plan: {
        id: plan.id,
        niche: plan.niche,
        audience: plan.audience,
        planData: plan.planData,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[content-plans POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/content-plans?id=xxx — delete a saved plan
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    // Make sure the plan belongs to the user before deleting
    const existing = await db.contentPlan.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    await db.contentPlan.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    console.error('[content-plans DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
