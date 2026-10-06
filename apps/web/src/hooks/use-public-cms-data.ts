import { useEffect, useState } from 'react';
import { apiBaseUrl } from '@/lib/data';

export type PublicCmsItem = {
  id: number;
  title: string;
  data: Record<string, unknown>;
  sortOrder: number;
};

export type PublicCmsData = {
  profile: Record<string, unknown>;
  skills: PublicCmsItem[];
  technologies: PublicCmsItem[];
  projects: PublicCmsItem[];
  timeline: PublicCmsItem[];
  socials: PublicCmsItem[];
  services: PublicCmsItem[];
  certifications: PublicCmsItem[];
};

export function usePublicCmsData(): PublicCmsData & { loading: boolean } {
  const [data, setData] = useState<PublicCmsData>({
    profile: {},
    skills: [],
    technologies: [],
    projects: [],
    timeline: [],
    socials: [],
    services: [],
    certifications: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBaseUrl}/content`)
      .then((response) => (response.ok ? response.json() : null))
      .then((nextData: PublicCmsData | null) => {
        if (nextData) setData(nextData);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return { ...data, loading };
}
