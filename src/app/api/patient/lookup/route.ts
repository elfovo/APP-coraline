import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Route API pour rechercher un utilisateur par son ID patient.
 * Cette route utilise Firebase Admin SDK pour contourner les règles de sécurité Firestore.
 * 
 * GET /api/patient/lookup?patientId=123
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientIdParam = searchParams.get('patientId');

    if (!patientIdParam) {
      return NextResponse.json(
        { error: 'Le paramètre patientId est requis' },
        { status: 400 }
      );
    }

    const numericId = Number(patientIdParam);
    if (Number.isNaN(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: 'L\'ID patient doit être un nombre positif' },
        { status: 400 }
      );
    }

    // Utiliser Firebase Admin pour interroger Firestore (contourne les règles de sécurité)
    const db = getAdminDb();
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('patientId', '==', numericId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Aucun patient trouvé pour cet ID' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Retourner uniquement les informations nécessaires (pas de données sensibles)
    return NextResponse.json({
      userId: doc.id,
      displayName: data.displayName ?? null,
      email: data.email ?? null,
      patientId: data.patientId ?? numericId,
    });
  } catch (error: any) {
    console.error('[API] Erreur lors de la recherche du patient:', error);
    const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
    const errorStack = error?.stack || '';
    console.error('[API] Détails de l\'erreur:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la recherche du patient',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

