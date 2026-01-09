export interface HighlightCard {
  title: string;
  description: string;
  action: () => void;
  badge: string;
  variant: 'completed' | 'default';
  disabled?: boolean;
}





