'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SimpleButton, TransparentButton } from '@/components/buttons';
import { OutlineInput } from '@/components/inputs';

type NotificationPrefs = {
  dailyReminder: boolean;
  weeklySummary: boolean;
  caregiverUpdates: boolean;
};

const NOTIFICATION_STORAGE_KEY = 'commocare-notification-prefs';

const preferenceOptions: {
  id: keyof NotificationPrefs;
  title: string;
  description: string;
}[] = [
  {
    id: 'dailyReminder',
    title: 'Rappel quotidien du journal',
    description: 'Notification douce à 20h pour compléter ton entrée.',
  },
  {
    id: 'weeklySummary',
    title: 'Synthèse hebdomadaire',
    description: 'Email récapitulatif chaque dimanche matin.',
  },
  {
    id: 'caregiverUpdates',
    title: 'Alertes accompagnant',
    description: 'Un email quand un proche ajoute une observation.',
  },
];

export default function ProfilPage() {
  const { user, loading, logout, updateUserProfile, deleteAccount } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    dailyReminder: true,
    weeklySummary: true,
    caregiverUpdates: false,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? user.email?.split('@')[0] ?? '');
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedPrefs = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (storedPrefs) {
        setNotificationPrefs((prev) => ({ ...prev, ...JSON.parse(storedPrefs) }));
      }
    } catch (error) {
      console.warn('Impossible de charger les préférences locales', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(notificationPrefs),
    );
  }, [notificationPrefs]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      setProfileError('Le nom affiché est requis.');
      return;
    }
    try {
      setProfileError(null);
      setProfileMessage(null);
      setSavingProfile(true);
      await updateUserProfile(displayName.trim());
      setProfileMessage('Profil mis à jour avec succès.');
    } catch (error) {
      console.error(error);
      setProfileError("Impossible d'enregistrer pour le moment.");
    } finally {
      setSavingProfile(false);
    }
  };

  const togglePreference = (id: keyof NotificationPrefs) => {
    setNotificationPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
    setPrefsMessage(null);
  };

  const handlePreferencesSave = () => {
    setPrefsSaving(true);
    setPrefsMessage(null);
    setTimeout(() => {
      setPrefsSaving(false);
      setPrefsMessage('Préférences synchronisées.');
    }, 500);
  };


  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      setDeleteError(null);
      setDeletingAccount(true);
      await deleteAccount();
      // Rediriger vers la page de connexion après suppression
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      setDeleteError('Impossible de supprimer le compte pour le moment. Veuillez réessayer.');
      setDeletingAccount(false);
    }
  };

  const accountMetadata = useMemo(() => {
    if (!user) {
      return [];
    }
    const formatDate = (dateString?: string | null) => {
      if (!dateString) return 'Non disponible';
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateString));
    };
    return [
      {
        label: 'Dernière connexion',
        value: formatDate(user.metadata?.lastSignInTime),
      },
      {
        label: 'Création du compte',
        value: formatDate(user.metadata?.creationTime),
      },
      {
        label: 'Identifiant Firebase',
        value: user.uid,
      },
    ];
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Paramètres personnels
            </p>
            <h1 className="text-4xl font-bold text-white mt-2">Profil & préférences</h1>
            <p className="text-white/70 max-w-2xl mt-2">
              Mets à jour ton identité, gère les rappels et partage des informations
              utiles avec ton équipe de soins. Ces réglages affectent uniquement ton
              compte CommoCare.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="bg-white/10 border border-white/10 rounded-3xl p-6 xl:col-span-2 space-y-6 backdrop-blur-sm">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Identité & accès
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Informations du compte
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Nom à afficher
                </label>
                <OutlineInput
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    setProfileMessage(null);
                    setProfileError(null);
                  }}
                  placeholder="Ex : Camille Tremblay"
                  variant="white"
                  size="lg"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block">Email</label>
                <OutlineInput
                  value={user.email ?? ''}
                  disabled
                  variant="white"
                  size="lg"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Identifiant patient
                </label>
                <OutlineInput
                  value={user.uid.slice(0, 12) + '…'}
                  disabled
                  variant="white"
                  size="lg"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Statut d’abonnement
                </label>
                <OutlineInput
                  value="Programme Beta · accès complet"
                  disabled
                  variant="white"
                  size="lg"
                />
              </div>
            </div>
            {profileError && (
              <p className="text-sm text-red-400" role="alert">
                {profileError}
              </p>
            )}
            {profileMessage && (
              <p className="text-sm text-emerald-300">{profileMessage}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <SimpleButton
                size="lg"
                onClick={handleProfileSave}
                disabled={savingProfile}
              >
                {savingProfile ? 'Enregistrement...' : 'Mettre à jour'}
              </SimpleButton>
              <SimpleButton
                size="lg"
                variant="outline"
                onClick={() => router.push('/reset-password')}
              >
                Réinitialiser le mot de passe
              </SimpleButton>
            </div>
          </section>

          <aside className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Synthèse rapide
            </p>
            <ul className="space-y-4">
              {accountMetadata.map((item) => (
                <li
                  key={item.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                    {item.label}
                  </p>
                  <p className="text-white font-semibold mt-2 break-words">
                    {item.value}
                  </p>
                </li>
              ))}
            </ul>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-white">
                Besoin d’exporter tes données ?
              </p>
              <p className="text-white/70 text-sm">
                Génére un rapport PDF depuis la section statistique ou contacte le
                support pour un export complet CSV.
              </p>
              <SimpleButton
                size="sm"
                variant="outline"
                onClick={() => router.push('/statistique')}
                className="w-full"
              >
                Ouvrir les exports
              </SimpleButton>
            </div>
          </aside>
        </div>

        <section className="bg-white/10 border border-white/10 rounded-3xl p-6 space-y-5 backdrop-blur-sm">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Notifications personnalisées
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Rappels & partages
            </h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-white/70 text-lg mb-2">
              Bientôt disponible
            </p>
            <p className="text-white/50 text-sm">
              Cette fonctionnalité sera disponible dans une prochaine mise à jour.
            </p>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Zone sensible
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Suppression du compte
              </h2>
              <p className="text-white/70 max-w-2xl mt-1">
                La suppression efface ton journal, les rapports exportés et les codes
                accompagnants. Contacte le support pour confirmer l’opération.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SimpleButton size="lg" onClick={handleLogout}>
                Déconnexion
              </SimpleButton>
              <TransparentButton
                size="lg"
                className="border-red-400 text-red-200 hover:bg-red-500/10"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Suppression en cours...' : 'Supprimer le compte'}
              </TransparentButton>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md bg-black/90 border border-red-500/30 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Confirmer la suppression
              </h2>
              <p className="text-white/70">
                Cette action est irréversible. Toutes tes données seront définitivement supprimées :
              </p>
              <ul className="text-white/60 text-sm mt-3 space-y-1 list-disc list-inside">
                <li>Ton journal et toutes tes entrées</li>
                <li>Tes statistiques et rapports</li>
                <li>Les codes accompagnants</li>
                <li>Ton compte et tes préférences</li>
              </ul>
            </div>
            {deleteError && (
              <p className="text-red-400 text-sm">{deleteError}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <SimpleButton
                variant="outline"
                className="flex-1 bg-transparent text-white border-white/30"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={deletingAccount}
              >
                Annuler
              </SimpleButton>
              <SimpleButton
                className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-500"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? 'Suppression...' : 'Confirmer la suppression'}
              </SimpleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
