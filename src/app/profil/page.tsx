'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SimpleButton, TransparentButton } from '@/components/buttons';
import { OutlineInput } from '@/components/inputs';
import SwitchButton from '@/components/buttons/SwitchButton';

type NotificationPrefs = {
  dailyReminder: boolean;
  weeklySummary: boolean;
  caregiverUpdates: boolean;
};

const NOTIFICATION_STORAGE_KEY = 'commocare-notification-prefs';

// Composants d'icônes SVG
const CalendarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MailIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IdCardIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
);

const StarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const SaveIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const LockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const WarningIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const preferenceOptions: {
  id: keyof NotificationPrefs;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'dailyReminder',
    title: 'Rappel quotidien',
    description: 'Notification douce à 20h pour compléter ton entrée du journal.',
    icon: <CalendarIcon className="w-6 h-6 text-white" />,
  },
  {
    id: 'weeklySummary',
    title: 'Synthèse hebdomadaire',
    description: 'Email récapitulatif chaque dimanche matin avec tes statistiques.',
    icon: <ChartIcon className="w-6 h-6 text-white" />,
  },
  {
    id: 'caregiverUpdates',
    title: 'Alertes accompagnant',
    description: 'Un email quand un proche ajoute une observation sur ton suivi.',
    icon: <UsersIcon className="w-6 h-6 text-white" />,
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
      setTimeout(() => setProfileMessage(null), 3000);
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
      setTimeout(() => setPrefsMessage(null), 3000);
    }, 500);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      setDeleteError(null);
      setDeletingAccount(true);
      await deleteAccount();
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
        icon: <ClockIcon className="w-5 h-5 text-white/70" />,
      },
      {
        label: 'Création du compte',
        value: formatDate(user.metadata?.creationTime),
        icon: <SparklesIcon className="w-5 h-5 text-white/70" />,
      },
      {
        label: 'Identifiant',
        value: user.uid.slice(0, 8) + '...',
        icon: <KeyIcon className="w-5 h-5 text-white/70" />,
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

  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-transparent pt-16 pb-24">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header avec avatar */}
        <header className="relative overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 sm:p-12 backdrop-blur-sm">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-12 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400/30 to-indigo-500/30 border-4 border-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-2xl backdrop-blur-sm">
                {userInitials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-4 border-black/20"></div>
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-2">
                  Mon profil
                </p>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {displayName || 'Utilisateur'}
                </h1>
                <p className="text-white/70 mt-2 text-lg">{user.email}</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                  <span className="text-sm text-white/80">Programme Beta</span>
                </div>
                <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                  <span className="text-sm text-white/80">Accès complet</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {/* Section principale - Informations du compte */}
          <section className="space-y-6">
            {/* Informations personnelles */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-8 backdrop-blur-sm">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-400/10 blur-2xl" />
              </div>
              
              <div className="relative z-10 space-y-6">
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                    Identité & accès
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Informations du compte
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                      <UserIcon className="w-5 h-5" /> Nom à afficher
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
                  
                  <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                      <MailIcon className="w-5 h-5" /> Email
                    </label>
                    <OutlineInput
                      value={user.email ?? ''}
                      disabled
                      variant="white"
                      size="lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                      <IdCardIcon className="w-5 h-5" /> Identifiant patient
                    </label>
                    <OutlineInput
                      value={user.uid.slice(0, 12) + '…'}
                      disabled
                      variant="white"
                      size="lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                      <StarIcon className="w-5 h-5" /> Statut
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
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
                    <p className="text-sm text-red-300" role="alert">
                      {profileError}
                    </p>
                  </div>
                )}
                
                {profileMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
                    <p className="text-sm text-emerald-300">{profileMessage}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <SimpleButton
                    size="lg"
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="flex items-center gap-2"
                  >
                    <SaveIcon className="w-5 h-5" />
                    {savingProfile ? 'Enregistrement...' : 'Mettre à jour'}
                  </SimpleButton>
                  <SimpleButton
                    size="lg"
                    variant="outline"
                    onClick={() => router.push('/reset-password')}
                    className="flex items-center gap-2"
                  >
                    <LockIcon className="w-5 h-5" />
                    Réinitialiser le mot de passe
                  </SimpleButton>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 sm:p-8 backdrop-blur-sm">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl" />
              </div>
              
              {/* Overlay grisé pour indiquer que c'est pas encore disponible */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 rounded-3xl flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2 px-4">
                  <p className="text-white/90 text-lg font-semibold">Bientôt disponible</p>
                  <p className="text-white/60 text-sm">Cette fonctionnalité sera disponible dans une prochaine mise à jour</p>
                </div>
              </div>
              
              <div className="relative z-10 space-y-6 opacity-40">
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                    Notifications
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    Rappels & partages
                  </h2>
                </div>

                <div className="space-y-4">
                  {preferenceOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">{option.icon}</div>
                          <h3 className="text-white font-semibold">
                            {option.title}
                          </h3>
                        </div>
                        <p className="text-white/60 text-sm">
                          {option.description}
                        </p>
                      </div>
                      <SwitchButton
                        initialState={notificationPrefs[option.id]}
                        onToggle={() => togglePreference(option.id)}
                        size="md"
                        disabled={true}
                      />
                    </div>
                  ))}
                </div>

                {prefsMessage && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
                    <p className="text-sm text-emerald-300">{prefsMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>

        {/* Section suppression du compte - pleine largeur */}
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
                accompagnants. Contacte le support pour confirmer l'opération.
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
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowDeleteConfirm(false)} 
          />
          <div className="relative w-full max-w-md bg-gradient-to-br from-black/95 via-black/90 to-black/95 border border-red-500/30 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <WarningIcon className="w-8 h-8 text-red-400" />
                <h2 className="text-2xl font-semibold text-white">
                  Confirmer la suppression
                </h2>
              </div>
              <p className="text-white/70">
                Cette action est irréversible. Toutes tes données seront définitivement supprimées :
              </p>
              <ul className="text-white/60 text-sm space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>Ton journal et toutes tes entrées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>Tes statistiques et rapports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>Les codes accompagnants</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>Ton compte et tes préférences</span>
                </li>
              </ul>
            </div>
            {deleteError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-300 text-sm">{deleteError}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <SimpleButton
                variant="outline"
                className="flex-1 bg-transparent text-white border-white/30 hover:bg-white/10"
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
