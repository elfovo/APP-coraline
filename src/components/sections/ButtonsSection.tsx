'use client';

import { 
  SimpleButton, GradientButton, OutlineButton, CancelButton, BackButton, BackOutlineButton, IconButton,
  NextButton, MenuButton, ToggleButton, SwitchButton,
  SquareButton, SquareButtonFilled 
} from '@/components/buttons';
import SectionWrapper from '@/components/SectionWrapper';

export default function ButtonsSection() {
  const buttonDemos = [
    {
      id: 'simple',
      name: 'SimpleButton',
      description: 'Bouton blanc moderne et minimaliste',
      component: (
        <div className="flex justify-center items-center">
          <SimpleButton size="lg">
            Bouton Simple
          </SimpleButton>
        </div>
      )
    },
    {
      id: 'gradient',
      name: 'GradientButton',
      description: 'Bouton avec dégradé bleu',
      component: (
        <div className="flex justify-center items-center">
          <GradientButton size="lg" gradient="blue">
            Bouton Gradient
          </GradientButton>
        </div>
      )
    },
    {
      id: 'outline',
      name: 'OutlineButton',
      description: 'Bouton avec bordure blanche',
      component: (
        <div className="flex justify-center items-center">
          <OutlineButton size="lg" variant="white">
            Bouton Outline
          </OutlineButton>
        </div>
      )
    },
    {
      id: 'cancel',
      name: 'CancelButton',
      description: 'Bouton rond avec croix pour annuler',
      component: (
        <div className="flex justify-center items-center">
          <CancelButton size="lg" />
        </div>
      )
    },
    {
      id: 'back',
      name: 'BackButton',
      description: 'Bouton rond avec chevron pour retour',
      component: (
        <div className="flex justify-center items-center">
          <BackButton size="lg" />
        </div>
      )
    },
    {
      id: 'backoutline',
      name: 'BackOutlineButton',
      description: 'Bouton outline avec texte "Retour"',
      component: (
        <div className="flex justify-center items-center">
          <BackOutlineButton size="lg" variant="white" />
        </div>
      )
    },
    {
      id: 'icon',
      name: 'IconButton',
      description: 'Bouton rond avec icône Instagram',
      component: (
        <div className="flex justify-center items-center">
          <IconButton size="lg" icon="instagram" />
        </div>
      )
    },
    {
      id: 'square',
      name: 'SquareButton',
      description: 'Bouton avec bordure blanche et bords carrés',
      component: (
        <div className="flex justify-center items-center">
          <SquareButton size="lg" variant="white">
            Bouton Square
          </SquareButton>
        </div>
      )
    },
    {
      id: 'squarefilled',
      name: 'SquareButtonFilled',
      description: 'Bouton blanc plein avec bords carrés',
      component: (
        <div className="flex justify-center items-center">
          <SquareButtonFilled size="lg" variant="white">
            Bouton Square Filled
          </SquareButtonFilled>
        </div>
      )
    },
    {
      id: 'next',
      name: 'NextButton',
      description: 'Bouton rond avec chevron vers la droite',
      component: (
        <div className="flex justify-center items-center">
          <NextButton size="lg" />
        </div>
      )
    },
    {
      id: 'menu',
      name: 'MenuButton',
      description: 'Bouton hamburger avec 3 lignes',
      component: (
        <div className="flex justify-center items-center">
          <MenuButton size="lg" />
        </div>
      )
    },
    {
      id: 'toggle',
      name: 'ToggleButton',
      description: 'Bouton on/off avec état',
      component: (
        <div className="flex justify-center items-center">
          <ToggleButton size="lg" />
        </div>
      )
    },
    {
      id: 'switch',
      name: 'SwitchButton',
      description: 'Switch on/off avec animation',
      component: (
        <div className="flex justify-center items-center">
          <SwitchButton size="lg" />
        </div>
      )
    }
  ];

  return (
    <SectionWrapper
      id="buttons"
      title="Boutons"
      subtitle="Collection de boutons modernes et interactifs"
      demos={buttonDemos}
      initialActiveDemo="simple"
    />
  );
}