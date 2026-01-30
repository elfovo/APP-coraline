import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ENTOURAGE_COMMENTS_SUBCOLLECTION = 'entourageComments';

/**
 * POST /api/entourage/comment
 * Body: { patientId: string, dateISO: string, comment: string }
 * Enregistre un commentaire de l'entourage pour un patient et une date donnée.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const patientIdParam = body?.patientId;
    const dateISO = body?.dateISO;
    const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';

    if (!patientIdParam) {
      return NextResponse.json(
        { error: 'patientId est requis' },
        { status: 400 }
      );
    }

    const numericId = Number(patientIdParam);
    if (Number.isNaN(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: 'patientId doit être un nombre positif' },
        { status: 400 }
      );
    }

    if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      return NextResponse.json(
        { error: 'dateISO invalide (attendu YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('patientId', '==', numericId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Patient introuvable pour cet ID' },
        { status: 404 }
      );
    }

    const userId = snapshot.docs[0].id;
    const commentRef = usersRef.doc(userId).collection(ENTOURAGE_COMMENTS_SUBCOLLECTION).doc(dateISO);

    await commentRef.set({
      dateISO,
      comment: comment || '',
      createdAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ ok: true, dateISO });
  } catch (error: unknown) {
    console.error('[API] Erreur POST /api/entourage/comment:', error);
    const err = error as { message?: string } | null;
    return NextResponse.json(
      { error: err?.message ?? 'Erreur serveur' },
      { status: 500 }
    );
  }
}
