declare module './StaggeredMenu.jsx' {
  import type { ComponentType } from 'react';

  export type StaggeredMenuItem = {
    label: string;
    link: string;
    ariaLabel?: string;
  };

  export type StaggeredMenuSocialItem = {
    label: string;
    link: string;
  };

  export interface StaggeredMenuProps {
    position?: 'left' | 'right';
    colors?: string[];
    items?: StaggeredMenuItem[];
    socialItems?: StaggeredMenuSocialItem[];
    displaySocials?: boolean;
    displayItemNumbering?: boolean;
    className?: string;
    logoUrl?: string;
    menuButtonColor?: string;
    openMenuButtonColor?: string;
    accentColor?: string;
    changeMenuColorOnOpen?: boolean;
    isFixed?: boolean;
    onMenuOpen?: () => void;
    onMenuClose?: () => void;
  }

  export const StaggeredMenu: ComponentType<StaggeredMenuProps>;
}

declare module '@/components/navigation/StaggeredMenu.jsx' {
  export * from './StaggeredMenu.jsx';
}

export {};


