'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { SimpleButton, OptionCard, BackButton, NextButton } from '@/components/buttons';
import { PatientIdInput } from '@/components/inputs';
import { buildSeedEntry } from '@/lib/seedEntries';
import { saveDailyEntry } from '@/lib/firestoreEntries';
import { getDbInstance } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { findUserByPatientId } from '@/lib/patientAccess';
import TypingLoadingOverlay from '@/components/loading/TypingLoadingOverlay';

export default function LandingPage() {
  const { user, loading, signInAnonymously } = useAuth();
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);
  const [showPatientIdInput, setShowPatientIdInput] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [infoSequence, setInfoSequence] = useState<number | null>(null);
  const [showAurora, setShowAurora] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedOptionType, setSelectedOptionType] = useState<'visitor' | 'patient' | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [overlayMessages, setOverlayMessages] = useState({
    first: 'Chargement ...',
    second: 'Fini.'
  });
  const [isOverlayProcessing, setIsOverlayProcessing] = useState(false);
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(false);
  const [isCreatingVisitorDemo, setIsCreatingVisitorDemo] = useState(false);

  useEffect(() => {
    // Si déjà connecté, rediriger vers la page d'accueil
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // IMPORTANT: les hooks ne doivent pas être appelés après un early return.
  // Ce useEffect doit rester avant les `return` conditionnels (loading/user).
  useEffect(() => {
    if (infoSequence === null) return;

    const timers: NodeJS.Timeout[] = [];

    // Étape 1 -> Étape 2 après 5 secondes
    if (infoSequence === 1) {
      timers.push(setTimeout(() => setInfoSequence(2), 5000));
    }
    // Étape 2 -> Étape 3 après 5 secondes
    else if (infoSequence === 2) {
      timers.push(setTimeout(() => setInfoSequence(3), 5000));
    }
    // Étape 3 -> Étape 4 après 5 secondes
    else if (infoSequence === 3) {
      timers.push(setTimeout(() => setInfoSequence(4), 5000));
    }
    // Étape 4 -> Fade in du background puis traitement selon le type
    else if (infoSequence === 4) {
      setShowVisitorPrompt(false);
      // Fade in du background après 3 secondes
      timers.push(
        setTimeout(() => {
          if (typeof document !== 'undefined') {
            document.body.setAttribute('data-aurora-visible', 'true');
          }
          setShowAurora(true);
        }, 3000)
      );

      // Traitement selon le type d'option
      timers.push(
        setTimeout(async () => {
          if (selectedOptionType === 'patient') {
            // Pour patient, redirection normale vers register
            router.push('/register');
          } else if (selectedOptionType === 'visitor') {
            // Pour visiteur, afficher l'invite de création de compte démo après la séquence
            setShowVisitorPrompt(true);
          }
        }, 5000)
      );
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [infoSequence, router, selectedOptionType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return null; // Redirection en cours
  }

  const handleContinue = () => {
    setIsTransitioning(false);
    setShowOptions(true);
  };

  const handleOptionClick = (type: 'visitor' | 'patient' | 'doctor') => {
    if (type === 'visitor' || type === 'patient') {
      // Sauvegarder le type d'option sélectionné
      setSelectedOptionType(type);
      setShowVisitorPrompt(false);
      setIsCreatingVisitorDemo(false);
      // Marquer la transition AVANT de masquer les options pour éviter l'affichage du contenu initial
      setIsTransitioning(true);
      // Masquer immédiatement les options
      setShowOptions(false);
      // Fade out du background
      if (typeof document !== 'undefined') {
        document.body.setAttribute('data-aurora-visible', 'false');
      }
      setShowAurora(false);
      // Attendre que les options disparaissent complètement avant de démarrer la séquence
      setTimeout(() => {
        setInfoSequence(1);
      }, 800);
    } else if (type === 'doctor') {
      setShowVisitorPrompt(false);
      setIsCreatingVisitorDemo(false);
      setShowPatientIdInput(true);
    }
  };

  const handleVisitorDemoCreation = async () => {
    if (isCreatingVisitorDemo) return;

    setIsCreatingVisitorDemo(true);
  
    try {
      const userCredential = await signInAnonymously();
      const userId = userCredential.user.uid;

      await generateSeedData(userId);

      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la création du compte anonyme:', error);
      router.push('/register');
    } finally {
      setIsCreatingVisitorDemo(false);
    }
  };

  const generateSeedData = async (userId: string) => {
    const today = new Date();
    let oldestDateISO = '';
    
    // Créer les entrées pour 120 jours
    for (let i = 0; i < 120; i++) {
      const target = new Date(today);
      target.setDate(today.getDate() - i);
      const entry = buildSeedEntry(target, i);
      await saveDailyEntry(userId, entry);
      if (i === 119) {
        oldestDateISO = entry.dateISO;
      }
    }
    
    // Sauvegarder la date d'accident dans Firestore
    const db = getDbInstance();
    await setDoc(doc(db, 'users', userId), {
      accidentDates: [oldestDateISO],
    }, { merge: true });
  };

  const handlePatientIdSubmit = async () => {
    const idToCheck = patientId.trim();
    if (!idToCheck) {
      setPatientError('Merci d\'indiquer un ID patient valide.');
      return;
    }

    setIsLoadingPatient(true);
    setShowLoadingScreen(true);
    setOverlayMessages({
      first: 'Chargement ...',
      second: 'Fini.'
    });
    setIsOverlayProcessing(true);
    setPatientError(null);

    const startTime = Date.now();
    const MIN_LOADING_TIME = 4000; // 4 secondes minimum

    try {
      // 1. Trouver le patient
      const result = await findUserByPatientId(idToCheck);
      
      if (!result) {
        setPatientError('Aucun patient trouvé pour cet ID. Vérifie le numéro saisi.');
        setIsLoadingPatient(false);
        setShowLoadingScreen(false);
        setIsOverlayProcessing(false);
        setRedirectUrl(null);
        return;
      }

      // 2. Précharger les données du patient en parallèle
      const [entriesResponse, userResponse] = await Promise.all([
        fetch(`/api/patient/entries?userId=${encodeURIComponent(result.userId)}&limit=400`),
        fetch(`/api/patient/user?userId=${encodeURIComponent(result.userId)}`)
      ]);

      let entriesData = null;
      let userData = null;

      if (entriesResponse.ok) {
        entriesData = await entriesResponse.json();
      }

      if (userResponse.ok) {
        userData = await userResponse.json();
      }

      // 3. Stocker les données dans sessionStorage pour la page acces-sante
      // Utiliser userData?.displayName qui vient directement de Firestore
      const displayNameToStore = userData?.displayName || result.displayName || null;
      console.log('Landing page - Données à stocker:', {
        userId: result.userId,
        displayName: displayNameToStore,
        userDataDisplayName: userData?.displayName,
        resultDisplayName: result.displayName,
        email: result.email
      });
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('patientData', JSON.stringify({
          userId: result.userId,
          displayName: displayNameToStore,
          email: result.email || null,
          entries: entriesData?.entries || [],
          accidentDates: userData?.accidentDates || [],
          timestamp: Date.now()
        }));
        console.log('Landing page - Données stockées dans sessionStorage');
      }

      // 4. Calculer le temps écoulé et attendre le minimum
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      
      // 5. Stocker l'URL de redirection et indiquer que le chargement est terminé
      // TypingLoadingOverlay gérera l'affichage de "Fini." puis la redirection
      setRedirectUrl(`/acces-sante?patientId=${idToCheck}`);
      setIsLoadingPatient(false); // Le chargement est terminé, mais on garde showLoadingScreen pour afficher "Fini."
      setIsOverlayProcessing(false);
    } catch (error: unknown) {
      console.error("Erreur lors de la vérification de l'ID patient:", error);
      setPatientError('Impossible de vérifier l\'ID patient pour le moment.');
      setIsLoadingPatient(false);
      setShowLoadingScreen(false);
      setIsOverlayProcessing(false);
      setRedirectUrl(null);
    }
  };

  const handleBack = () => {
    setShowVisitorPrompt(false);
    setIsCreatingVisitorDemo(false);

    if (showPatientIdInput) {
      setShowPatientIdInput(false);
      setPatientError(null);
      setPatientId('');
      setIsLoadingPatient(false);
      setShowLoadingScreen(false);
      setIsOverlayProcessing(false);
      setRedirectUrl(null);
    } else if (showOptions) {
      setShowOptions(false);
    } else if (infoSequence !== null) {
      setInfoSequence(null);
      setIsTransitioning(false);
      // Réafficher le background
      if (typeof document !== 'undefined') {
        document.body.setAttribute('data-aurora-visible', 'true');
      }
      setShowAurora(true);
      setShowOptions(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent">
      {/* Écran de chargement */}
      <AnimatePresence>
        {showLoadingScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TypingLoadingOverlay 
              isLoading={isOverlayProcessing}
              redirectTo={redirectUrl || undefined}
              firstMessage={overlayMessages.first}
              secondMessage={overlayMessages.second}
              onLoadingComplete={() => {
                setShowLoadingScreen(false);
                setRedirectUrl(null);
                setIsOverlayProcessing(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu principal avec fade out pendant le chargement */}
      <motion.div
        className="relative z-10 w-full max-w-6xl px-4 py-8 pb-24"
        animate={{
          opacity: showLoadingScreen ? 0 : 1,
          pointerEvents: showLoadingScreen ? 'none' : 'auto'
        }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {infoSequence !== null && (
            // Séquence d'informations
            <>
              {infoSequence === 1 && (
                <motion.div
                  key="info-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-6 w-full max-w-3xl mx-auto"
                >
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed"
                  >
                    Chaque année,
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
                    className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-relaxed"
                  >
                    <span className="font-extrabold" style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)' }}>155 000 personnes</span>
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.4, ease: 'easeOut' }}
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed"
                  >
                    se rendent aux urgences en France pour une commotion cérébrale.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2.2, ease: 'easeOut' }}
                    className="text-sm md:text-base text-white/60 mt-4"
                  >
                    Source : Ministère des Sports - INSEP
                  </motion.p>
                </motion.div>
              )}

              {infoSequence === 2 && (
                <motion.div
                  key="info-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="w-full max-w-2xl mx-auto"
                >
                  <div className="bg-transparent rounded-3xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">
                      Origine des commotions cérébrales
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Accident sportif */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="text-white/90 font-medium"
                          >
                            Accident sportif
                          </motion.span>
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="text-white font-bold text-xl"
                          >
                            30%
                          </motion.span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '30%' }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 0.8 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            style={{
                              boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4)',
                            }}
                          />
                        </div>
                      </motion.div>
                      
                      {/* Accident du quotidien */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.2 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 1.3 }}
                            className="text-white/90 font-medium"
                          >
                            Accident du quotidien
                          </motion.span>
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1.5 }}
                            className="text-white font-bold text-xl"
                          >
                            70%
                          </motion.span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '70%' }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 1.7 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{
                              boxShadow: '0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(236, 72, 153, 0.6), 0 0 60px rgba(236, 72, 153, 0.4)',
                            }}
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {infoSequence === 3 && (
                <motion.div
                  key="info-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-6 w-full max-w-3xl mx-auto"
                >
                  <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed"
                  >
                    <span className="font-extrabold" style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)' }}>30%</span> des personnes gardent des séquelles
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
                    className="text-xl md:text-2xl text-white/80"
                  >
                    encore <span className="font-extrabold" style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)' }}>3 mois après</span> l&apos;accident
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1, ease: 'easeOut' }}
                    className="text-sm md:text-base text-white/60 mt-4"
                  >
                    Source : Santé publique France 2016
                  </motion.p>
                </motion.div>
              )}

              {infoSequence === 4 && (
                <motion.div
                  key="info-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="text-center space-y-6 w-full max-w-3xl mx-auto"
                >
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed">
                    La commotion cérébrale est <span className="font-extrabold" style={{ textShadow: '0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)' }}>sérieuse</span>, mais un suivi adapté fait toute la différence.
                  </p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
                    className="text-lg md:text-xl text-white/80 mt-4"
                  >
                    CommoCare vous accompagne dans votre rétablissement au quotidien.
                  </motion.p>

                  <div className="mt-10 w-full min-h-[180px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {selectedOptionType === 'visitor' && showVisitorPrompt && (
                        <motion.div
                          key="visitor-prompt"
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="space-y-4 text-center max-w-2xl"
                        >
                          <p className="text-base md:text-lg text-white/80">
                            Lancez la création d&apos;un compte démo pour explorer l&apos;interface complète avec 120 jours de données générées automatiquement.
                          </p>
                          <SimpleButton
                            onClick={handleVisitorDemoCreation}
                            disabled={isCreatingVisitorDemo || showLoadingScreen}
                            className="px-6 py-3 text-base min-w-[220px]"
                          >
                            {isCreatingVisitorDemo ? 'Création en cours...' : 'Créer la démo'}
                          </SimpleButton>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {!showOptions && !showPatientIdInput && infoSequence === null && !isTransitioning && showAurora && (
            // Contenu initial centré
            <motion.div
              key="initial-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-center space-y-8 w-full"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
              >
                CommoCare
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto"
              >
                Suivi quotidien du rétablissement post-commotion
              </motion.p>

              {/* Fonctionnalités principales */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto mt-8 mb-8"
              >
                {/* Journal quotidien */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10"
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/20">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white mb-2">Journal quotidien</h3>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                    Suivez vos symptômes et votre progression jour après jour
                  </p>
                </motion.div>

                {/* Statistiques */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10"
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/20">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white mb-2">Statistiques</h3>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                    Visualisez votre évolution avec des graphiques détaillés
                  </p>
                </motion.div>

                {/* Ressources */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10"
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center border border-white/20">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white mb-2">Ressources</h3>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                    Accédez à des guides et conseils pour votre rétablissement
                  </p>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8, ease: 'easeOut' }}
                className="flex justify-center"
              >
                <SimpleButton
                  onClick={handleContinue}
                  className="px-8 py-4 text-lg min-w-[200px]"
                >
                  Continuer
                </SimpleButton>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="text-sm text-white/60 mt-8"
              >
                Gérez votre rétablissement au quotidien avec un suivi personnalisé
              </motion.p>
            </motion.div>
          )}

          {showOptions && !showPatientIdInput && infoSequence === null && (
            // Options avec texte en haut
            <motion.div
              key="options-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-8 lg:gap-12 w-full"
            >
              {/* Texte en haut */}
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="w-full max-w-3xl text-center space-y-6"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Qui êtes-vous ?
                </h2>
                <p className="text-lg text-white/80 leading-relaxed">
                  Sélectionnez votre profil pour accéder à l&apos;application adaptée à vos besoins
                </p>
              </motion.div>

              {/* Options en bas */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                className="w-full max-w-2xl gap-4 flex flex-col"
              >
                <OptionCard
                  title="Visiteur"
                  description="Je ne suis pas réellement blessé et je souhaite découvrir l&apos;application"
                  onClick={() => handleOptionClick('visitor')}
                  delay={0.4}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

                <OptionCard
                  title="Patient"
                  description="J&apos;ai une commotion cérébrale et je veux suivre mon rétablissement au quotidien"
                  onClick={() => handleOptionClick('patient')}
                  delay={0.6}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                <OptionCard
                  title="Professionnel de santé"
                  description="Médecin ou autre professionnel pour suivre l&apos;évolution de la commotion de mon patient"
                  onClick={() => handleOptionClick('doctor')}
                  delay={0.8}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
              </motion.div>

            </motion.div>
          )}

          {showPatientIdInput && (
            // Étape pour professionnel de santé
            <motion.div
              key="patient-id-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center gap-8 w-full"
            >
              {/* Texte au-dessus */}
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className="w-full max-w-2xl text-center space-y-6"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Accès au suivi patient
                </h2>
                <p className="text-lg text-white/80 leading-relaxed">
                  Entrez l&apos;ID patient de votre patient pour accéder à son suivi et suivre l&apos;évolution de sa commotion cérébrale.
                </p>
              </motion.div>

              {/* Champ de saisie en dessous */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                className="w-full max-w-2xl"
              >
                <PatientIdInput
                  value={patientId}
                  onChange={setPatientId}
                  onSubmit={handlePatientIdSubmit}
                  delay={0.1}
                />

                {patientError && !showLoadingScreen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 text-center"
                  >
                    {patientError}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Barre de navigation fixe en bas */}
      {(showOptions || showPatientIdInput || infoSequence !== null) && !showLoadingScreen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-xl border-t border-white/10"
        >
          <div className="w-full max-w-6xl mx-auto flex items-center justify-center">
            <div className="flex items-center gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <BackButton onClick={handleBack} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <NextButton 
                  onClick={showPatientIdInput ? handlePatientIdSubmit : undefined}
                  disabled={showPatientIdInput ? (!patientId.trim() || isLoadingPatient) : (infoSequence !== null ? true : true)}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}


