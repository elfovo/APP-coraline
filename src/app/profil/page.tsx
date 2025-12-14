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
const CARE_TEAM_STORAGE_KEY = 'commocare-care-team-draft';

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

const deviceSessions = [
  {
    id: 'iphone',
    label: 'iPhone 15 · Santé iCloud',
    location: 'Montréal, QC',
    lastActive: 'il y a 2 h',
    trusted: true,
  },
  {
    id: 'macbook',
    label: 'MacBook Air M3',
    location: 'Montréal, QC',
    lastActive: 'hier · 21 h 05',
    trusted: true,
  },
  {
    id: 'clinic',
    label: 'Tablette clinique',
    location: 'Clinique NeuroRéadapt · QC',
    lastActive: 'il y a 6 j',
    trusted: false,
  },
];

export default function ProfilPage() {
  const { user, loading, logout, updateUserProfile } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    dailyReminder: true,
    weeklySummary: true,
    caregiverUpdates: false,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<string | null>(null);

  const [careTeamDraft, setCareTeamDraft] = useState({
    therapistEmail: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [careTeamMessage, setCareTeamMessage] = useState<string | null>(null);

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
      const storedCareTeam = window.localStorage.getItem(CARE_TEAM_STORAGE_KEY);
      if (storedCareTeam) {
        setCareTeamDraft((prev) => ({ ...prev, ...JSON.parse(storedCareTeam) }));
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
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      CARE_TEAM_STORAGE_KEY,
      JSON.stringify(careTeamDraft),
    );
  }, [careTeamDraft]);

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

  const handleCareTeamSave = () => {
    setCareTeamMessage(null);
    setTimeout(() => {
      setCareTeamMessage('Brouillon conservé localement.');
    }, 200);
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
          <div className="flex flex-wrap gap-3">
            <SimpleButton
              size="md"
              variant="outline"
              onClick={() => window.open('mailto:support@commocare.app')}
            >
              Contacter le support
            </SimpleButton>
            <SimpleButton size="md" onClick={handleLogout}>
              Déconnexion
            </SimpleButton>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white/10 border border-white/10 rounded-3xl p-6 space-y-5 backdrop-blur-sm">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Notifications personnalisées
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Rappels & partages
              </h2>
            </div>
            <div className="space-y-4">
              {preferenceOptions.map((pref) => {
                const active = notificationPrefs[pref.id];
                return (
                  <button
                    key={pref.id}
                    onClick={() => togglePreference(pref.id)}
                    className={`w-full text-left border rounded-2xl p-4 transition-all ${
                      active
                        ? 'border-white/40 bg-white/10'
                        : 'border-white/10 bg-black/30 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-medium">{pref.title}</p>
                        <p className="text-white/70 text-sm mt-1">
                          {pref.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          active
                            ? 'bg-emerald-400/20 text-emerald-200'
                            : 'bg-white/5 text-white/60'
                        }`}
                      >
                        {active ? 'Activé' : 'Inactif'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            {prefsMessage && (
              <p className="text-sm text-emerald-300">{prefsMessage}</p>
            )}
            <SimpleButton
              size="lg"
              onClick={handlePreferencesSave}
              disabled={prefsSaving}
              className="w-full md:w-auto"
            >
              {prefsSaving ? 'Synchronisation…' : 'Enregistrer les préférences'}
            </SimpleButton>
          </section>

          <section className="bg-white/10 border border-white/10 rounded-3xl p-6 space-y-5 backdrop-blur-sm">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Équipe de soins & urgences
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Contacts clés
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Email du thérapeute principal
                </label>
                <OutlineInput
                  value={careTeamDraft.therapistEmail}
                  onChange={(event) =>
                    setCareTeamDraft((prev) => ({
                      ...prev,
                      therapistEmail: event.target.value,
                    }))
                  }
                  placeholder="therapeute@clinique.com"
                  variant="white"
                  size="lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">
                    Personne à contacter
                  </label>
                  <OutlineInput
                    value={careTeamDraft.emergencyContact}
                    onChange={(event) =>
                      setCareTeamDraft((prev) => ({
                        ...prev,
                        emergencyContact: event.target.value,
                      }))
                    }
                    placeholder="Ex : Alex (partenaire)"
                    variant="white"
                    size="lg"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-sm mb-2 block">
                    Téléphone
                  </label>
                  <OutlineInput
                    value={careTeamDraft.emergencyPhone}
                    onChange={(event) =>
                      setCareTeamDraft((prev) => ({
                        ...prev,
                        emergencyPhone: event.target.value,
                      }))
                    }
                    placeholder="+1 555 123 4567"
                    variant="white"
                    size="lg"
                  />
                </div>
              </div>
            </div>
            {careTeamMessage && (
              <p className="text-sm text-white/70">{careTeamMessage}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <SimpleButton size="lg" onClick={handleCareTeamSave}>
                Sauvegarder ce rappel
              </SimpleButton>
              <SimpleButton
                size="lg"
                variant="outline"
                onClick={() => router.push('/accompagnant')}
              >
                Partager avec un accompagnant
              </SimpleButton>
            </div>
          </section>
        </div>

        <section className="bg-black/40 border border-white/10 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Sécurité des appareils
            </p>
            <h2 className="text-2xl text-white font-semibold">
              Sessions actives & appareils approuvés
            </h2>
            <p className="text-white/70 max-w-3xl">
              Déconnecte les appareils que tu ne reconnais pas. Les codes de ton
              accompagnant expirent automatiquement après 30 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deviceSessions.map((device) => (
              <div
                key={device.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2"
              >
                <p className="text-white font-semibold">{device.label}</p>
                <p className="text-white/60 text-sm">{device.location}</p>
                <p className="text-white/60 text-sm">
                  Dernière activité : {device.lastActive}
                </p>
                <SimpleButton
                  size="sm"
                  variant={device.trusted ? 'outline' : 'default'}
                  onClick={() =>
                    console.info(`Gestion de l’appareil ${device.id}`)
                  }
                  className="w-full"
                >
                  {device.trusted ? 'Déconnecter' : 'Rendre de confiance'}
                </SimpleButton>
              </div>
            ))}
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
            <TransparentButton
              size="lg"
              className="border-red-400 text-red-200 hover:bg-red-500/10"
              onClick={() => window.open('mailto:support@commocare.app')}
            >
              Demander la suppression
            </TransparentButton>
          </div>
        </section>
      </div>
    </div>
  );

}
