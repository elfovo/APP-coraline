import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

const ENTOURAGE_COMMENTS_SUBCOLLECTION = 'entourageComments';

/**
 * GET /api/patient/entourage-comments?userId=xxx
 * Retourne les commentaires de l'entourage pour un patient (pour affichage calendrier/statistiques).
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Le paramètre userId est requis' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const commentsRef = db
      .collection('users')
      .doc(userId)
      .collection(ENTOURAGE_COMMENTS_SUBCOLLECTION);

    const snapshot = await commentsRef.get();

    const comments = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        dateISO: docSnap.id,
        comment: typeof data?.comment === 'string' ? data.comment : '',
      };
    });

    return NextResponse.json({ comments });
  } catch (error: unknown) {
    console.error('[API] Erreur GET /api/patient/entourage-comments:', error);
    const err = error as { message?: string } | null;
    return NextResponse.json(
      { error: err?.message ?? 'Erreur serveur' },
      { status: 500 }
    );
  }
}
