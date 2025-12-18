import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

/**
 * Route API pour récupérer les entrées d'un patient.
 * Cette route utilise Firebase Admin SDK pour contourner les règles de sécurité Firestore.
 * 
 * GET /api/patient/entries?userId=xxx&limit=400
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json(
        { error: 'Le paramètre userId est requis' },
        { status: 400 }
      );
    }

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 1000) : 400;

    // Utiliser Firebase Admin pour interroger Firestore (contourne les règles de sécurité)
    const db = getAdminDb();
    const entriesRef = db.collection('users').doc(userId).collection('entries');
    
    const snapshot = await entriesRef
      .orderBy('dateISO', 'desc')
      .limit(limit)
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('[API] Erreur lors de la récupération des entrées:', error);
    const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la récupération des entrées',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}



