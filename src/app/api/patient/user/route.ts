import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';

/**
 * Route API pour récupérer les informations d'un utilisateur (notamment les dates d'accident).
 * Cette route utilise Firebase Admin SDK pour contourner les règles de sécurité Firestore.
 * 
 * GET /api/patient/user?userId=xxx
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

    // Utiliser Firebase Admin pour interroger Firestore (contourne les règles de sécurité)
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const data = userDoc.data();
    
    // Si l'email n'est pas dans Firestore, essayer de le récupérer depuis Firebase Auth
    let email = data?.email || null;
    if (!email) {
      try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        const userRecord = await auth.getUser(userId);
        email = userRecord.email || null;
      } catch (authError) {
        // Si on ne peut pas récupérer depuis Auth, on garde null
        console.warn('[API] Impossible de récupérer l\'email depuis Firebase Auth:', authError);
      }
    }
    
    // Retourner uniquement les informations nécessaires
    // Si displayName est null, on retourne null (le fallback vers email sera fait côté client)
    return NextResponse.json({
      accidentDates: data?.accidentDates || [],
      displayName: data?.displayName || null,
      email: email,
    });
  } catch (error: unknown) {
    console.error('[API] Erreur lors de la récupération de l\'utilisateur:', error);
    const err = error as { message?: string; toString?: () => string } | null;
    const errorMessage = err?.message || err?.toString?.() || 'Erreur inconnue';
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la récupération de l\'utilisateur',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

