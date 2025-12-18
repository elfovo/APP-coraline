'use client';

import { SplitText, BlurText, TextType, ShinyText, CountUp } from '@/components/text-animations';
import SectionWrapper from '@/components/SectionWrapper';

export default function TextAnimationsSection() {
  const textAnimationDemos = [
    {
      id: 'splittext',
      name: 'SplitText',
      description: 'Animation de texte avec GSAP SplitText et ScrollTrigger',
      component: (
        <div className="w-full h-full flex items-center justify-center">
          <SplitText
            text="Hello, you !"
            tag="h1"
            className="text-white text-4xl font-bold"
            splitType="chars"
            delay={70}
            duration={2}
            ease="elastic.out(1, 0.3)"
            from={{ opacity: 0, y: 50 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            onLetterAnimationComplete={() => {}}
          />
        </div>
      )
    },
    {
      id: 'blurtext',
      name: 'BlurText',
      description: 'Animation de texte avec effet de flou progressif',
      component: (
        <div className="w-full h-full flex items-center justify-center">
          <BlurText
            text="Blur Text Animation"
            className="text-white text-4xl font-bold"
            animateBy="words"
            direction="top"
            delay={200}
            threshold={0.1}
            stepDuration={0.35}
            animationFrom={undefined}
            animationTo={undefined}
            onAnimationComplete={undefined}
          />
        </div>
      )
    },
    {
      id: 'texttype',
      name: 'TextType',
      description: 'Animation de frappe avec curseur clignotant',
      component: (
        <div className="w-full h-full flex items-center justify-center">
          <TextType
            text={["Hello, you !", "Welcome to TextType", "Animation de frappe"]}
            as="h1"
            className="text-white text-4xl font-bold"
            typingSpeed={100}
            deletingSpeed={50}
            pauseDuration={2000}
            showCursor={true}
            cursorCharacter="|"
            cursorBlinkDuration={0.5}
            loop={true}
            variableSpeed={undefined}
            onSentenceComplete={undefined}
          />
        </div>
      )
    },
    {
      id: 'shinytext',
      name: 'ShinyText',
      description: 'Texte avec effet de brillance animé',
      component: (
        <div className="w-full h-full flex items-center justify-center">
          <ShinyText
            text="Shiny Text Animation"
            speed={3}
            className="text-white text-4xl font-bold"
            disabled={false}
          />
        </div>
      )
    },
    {
      id: 'countup',
      name: 'CountUp',
      description: 'Animation de compteur numérique avec effet de ressort',
      component: (
        <div className="w-full h-full flex flex-col items-center justify-center gap-8">
          <CountUp
            to={1000}
            from={0}
            duration={2}
            className="text-white text-6xl font-bold"
            separator=","
            onStart={undefined}
            onEnd={undefined}
          />
          <CountUp
            to={99.9}
            from={0}
            duration={3}
            className="text-white text-4xl font-bold"
            delay={0.5}
            onStart={undefined}
            onEnd={undefined}
          />
          <CountUp
            to={1000000}
            from={0}
            duration={4}
            className="text-white text-3xl font-bold"
            delay={1}
            separator=" "
            onStart={undefined}
            onEnd={undefined}
          />
        </div>
      )
    }
  ];

  return (
    <SectionWrapper
      id="text-animations"
      title="Animations de Texte"
      subtitle="Collection d'animations et effets pour le texte"
      demos={textAnimationDemos}
      initialActiveDemo="splittext"
    />
  );
}