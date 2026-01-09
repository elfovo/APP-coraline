import ResourceCard from '@/components/content/ResourceCard';
import type { Resource } from './constants';

interface ResourceSectionProps {
  title: string;
  description: string;
  resources: Resource[];
  category: 'Blessé' | 'Accompagnant';
}

export default function ResourceSection({
  title,
  description,
  resources,
  category,
}: ResourceSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl text-white font-semibold">{title}</h2>
        <p className="text-white/70">{description}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.title} category={category} {...resource} />
        ))}
      </div>
    </section>
  );
}





