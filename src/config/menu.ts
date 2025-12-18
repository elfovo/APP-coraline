import { colors } from '@/lib/colors';

export const getMenuConfig = () => {
  return {
    items: [
      {
        label: 'Accueil',
        href: '#home',
        ariaLabel: 'Accueil',
        rotation: -8,
        hoverStyles: { bgColor: colors.menu.hover, textColor: colors.primary.white }
      },
      {
        label: 'Backgrounds',
        href: '#backgrounds',
        ariaLabel: 'Backgrounds',
        rotation: 8,
        hoverStyles: { bgColor: colors.menu.hover, textColor: colors.primary.white }
      },
      {
        label: 'Boutons',
        href: '#buttons',
        ariaLabel: 'Boutons',
        rotation: 8,
        hoverStyles: { bgColor: colors.menu.hover, textColor: colors.primary.white }
      },
      {
        label: 'Layouts',
        href: '#layouts',
        ariaLabel: 'Layouts',
        rotation: -8,
        hoverStyles: { bgColor: colors.menu.hover, textColor: colors.primary.white }
      },
      {
        label: 'Navigation',
        href: '#navigation',
        ariaLabel: 'Navigation',
        rotation: -8,
        hoverStyles: { bgColor: colors.menu.hover, textColor: colors.primary.white }
      },
      {
        label: 'Animations',
        href: '#animations',
        ariaLabel: 'Animations',
        rotation: 8,
        hoverStyles: { bgColor: colors.menu.hover, textColor: colors.primary.white }
      },
      {
        label: 'Texte',
        href: '#text-animations',
        ariaLabel: 'Animations de Texte',
        rotation: -8,
        hoverStyles: { bgColor: colors.menu.hover, textColor: colors.primary.white }
      }
    ],
    logo: '/logo.svg',
    useFixedPosition: true,
    menuBg: colors.menu.background,
    menuContentColor: colors.menu.text
  };
};