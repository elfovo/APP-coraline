'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { SimpleButton, TransparentButton } from '@/components/buttons';
import { OutlineInput } from '@/components/inputs';
import SwitchButton from '@/components/buttons/SwitchButton';
import { getDbInstance } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getPatientId, generateNextPatientId, initializeUserDocument } from '@/lib/firestoreEntries';
import Toast from '@/components/profil/Toast';
import DeleteAccountModal from '@/components/profil/DeleteAccountModal';
import AccidentDatesManager from '@/components/profil/AccidentDatesManager';
import {
  CalendarIcon,
  ChartIcon,
  UsersIcon,
  ClockIcon,
  SparklesIcon,
  KeyIcon,
  UserIcon,
  MailIcon,
  IdCardIcon,
  SaveIcon,
  LockIcon,
} from '@/components/profil/icons';
import { formatDate } from '@/lib/dateUtils';

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
  const { user, loading: authLoading } = useRequireAuth();
  const { logout, updateUserProfile, deleteAccount, reauthenticateUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [accidentDates, setAccidentDates] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
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
  
  const [patientId, setPatientId] = useState<number | null>(null);
  const [loadingPatientId, setLoadingPatientId] = useState(false);
  const [generatingPatientId, setGeneratingPatientId] = useState(false);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? user.email?.split('@')[0] ?? '');
    loadAccidentDate();
    loadPatientId();
  }, [user]);
  
  const loadPatientId = async () => {
    if (!user) return;
    try {
      setLoadingPatientId(true);
      const id = await getPatientId(user.uid);
      setPatientId(id);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'ID patient:', error);
    } finally {
      setLoadingPatientId(false);
    }
  };
  
  const handleGeneratePatientId = async () => {
    if (!user) return;
    try {
      setGeneratingPatientId(true);
      setToastMessage(null);
      const newPatientId = await generateNextPatientId();
      await initializeUserDocument(user.uid, newPatientId);
      setPatientId(newPatientId);
      setToastMessage(`ID patient créé : ${newPatientId}`);
      setToastType('success');
    } catch (error: unknown) {
      console.error('Erreur lors de la génération de l\'ID patient:', error);
      const err = error as { message?: string } | null;
      const errorMessage = err?.message || 'Erreur lors de la création de l\'ID patient. Veuillez réessayer.';
      setToastMessage(errorMessage);
      setToastType('error');
    } finally {
      setGeneratingPatientId(false);
    }
  };

  const loadAccidentDate = async () => {
    if (!user) return;
    try {
      const db = getDbInstance();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.accidentDates && Array.isArray(data.accidentDates)) {
          setAccidentDates(data.accidentDates);
        } else if (data.accidentDate) {
          // Migration depuis l'ancien format (une seule date)
          setAccidentDates([data.accidentDate]);
        }
      }
    } catch (error) {
      console.warn('Impossible de charger les dates d\'accident:', error);
    }
  };

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

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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
      setToastMessage('Le nom affiché est requis.');
      setToastType('error');
      return;
    }
    try {
      setProfileError(null);
      setProfileMessage(null);
      setSavingProfile(true);
      const trimmedDisplayName = displayName.trim();
      
      // Mettre à jour le displayName dans Firebase Auth
      await updateUserProfile(trimmedDisplayName);
      
      // Sauvegarder aussi le displayName dans Firestore pour que les professionnels de santé puissent y accéder
      const db = getDbInstance();
      await setDoc(doc(db, 'users', user.uid), {
        displayName: trimmedDisplayName,
        accidentDates: accidentDates.filter(date => date.trim() !== ''),
      }, { merge: true });
      
      setToastMessage('Profil mis à jour avec succès.');
      setToastType('success');
    } catch (error) {
      console.error(error);
      setToastMessage("Impossible d'enregistrer pour le moment.");
      setToastType('error');
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

  const handleDeleteAccount = async (password?: string) => {
    if (!user) return;
    
    try {
      setDeleteError(null);
      setDeletingAccount(true);
      
      // Détecter le provider
      const providerId = user.providerData[0]?.providerId;
      const isEmailPassword = providerId === 'password';
      
      // Si c'est un provider OAuth (Google/Apple), ré-authentifier via popup d'abord
      if (!isEmailPassword) {
        try {
          await reauthenticateUser();
        } catch (reauthError: unknown) {
          const err = reauthError as { code?: string } | null;
          if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/popup-blocked') {
            setDeleteError('La ré-authentification a été annulée. Veuillez réessayer.');
            setDeletingAccount(false);
            return;
          }
          throw reauthError;
        }
      }
      
      // Supprimer le compte (avec mot de passe si nécessaire)
      await deleteAccount(password);
      router.push('/login');
    } catch (error: unknown) {
      console.error('Erreur lors de la suppression du compte:', error);
      
      let errorMessage = 'Impossible de supprimer le compte pour le moment. Veuillez réessayer.';
      const err = error as { code?: string; message?: string } | null;
      
      if (err?.code === 'auth/requires-recent-login') {
        errorMessage = 'Une ré-authentification est requise. Veuillez réessayer.';
      } else if (err?.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect. Veuillez réessayer.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setDeleteError(errorMessage);
      setDeletingAccount(false);
    }
  };

  const accountMetadata = useMemo(() => {
    if (!user) {
      return [];
    }
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
    ];
  }, [user]);

  if (authLoading) {
    return <LoadingSpinner />;
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
      <Toast message={toastMessage} type={toastType} />

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
                      <IdCardIcon className="w-5 h-5" /> ID patient
                    </label>
                    {loadingPatientId ? (
                      <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60">
                        Chargement...
                      </div>
                    ) : patientId !== null ? (
                      <OutlineInput
                        value={patientId.toString()}
                        disabled
                        variant="white"
                        size="lg"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <OutlineInput
                          value="Non défini"
                          disabled
                          variant="white"
                          size="lg"
                          className="flex-1"
                        />
                        <SimpleButton
                          size="md"
                          onClick={handleGeneratePatientId}
                          disabled={generatingPatientId}
                        >
                          {generatingPatientId ? 'Création...' : 'Créer'}
                        </SimpleButton>
                      </div>
                    )}
                  </div>
                  
                  <AccidentDatesManager
                    dates={accidentDates}
                    onDatesChange={(dates) => {
                      setAccidentDates(dates);
                      setProfileMessage(null);
                      setProfileError(null);
                    }}
                    onToast={(message, type) => {
                      setToastMessage(message);
                      setToastType(type);
                    }}
                  />
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
                accompagnants. Contacte le support pour confirmer l&apos;opération.
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

      <DeleteAccountModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteAccount}
        isDeleting={deletingAccount}
        error={deleteError}
        requiresPassword={user?.providerData[0]?.providerId === 'password'}
      />
    </div>
  );
}
