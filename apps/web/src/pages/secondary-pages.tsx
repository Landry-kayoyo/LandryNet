import { useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useRoute } from 'wouter';
import { SectionKicker } from '@/components/reveal';
import { useSeoMeta } from '@/hooks/use-seo-meta';
import { usePublicCmsData } from '@/hooks/use-public-cms-data';
import { defaultCover } from '@/lib/data';
import type { PublicCmsItem } from '@/hooks/use-public-cms-data';
import profileImage from '@assets/optimized/profile-portrait.webp';

// ---------------------------------------------------------------------------
// PublicationPage
// ---------------------------------------------------------------------------
export function PublicationPage() {
  const [, params] = useRoute('/publication/:id');
  const data = usePublicCmsData();
  const project: PublicCmsItem | null =
    data.projects.find((p) => String(p.id) === params?.id) ?? null;

  useSeoMeta({
    title: params?.id ? `Publication ${params.id}` : 'Publication',
    description:
      'Consultez les projets et réalisations de Landry Kayoyo dans les domaines des systèmes, réseaux et infrastructure.',
    path: params?.id ? `/publication/${params.id}` : '/publication',
    image:
      project?.data.coverImage && typeof project.data.coverImage === 'string'
        ? project.data.coverImage
        : defaultCover,
  });

  if (!project)
    return (
      <main className="publication-page publication-page-state">
        <h1>Publication introuvable</h1>
        <a className="button button-accent" href="/#publications">
          Retour aux publications <ArrowUpRight size={16} />
        </a>
      </main>
    );

  return (
    <main className="publication-page">
      <header className="publication-page-header">
        <a className="publication-back" href="/#publications">
          <ArrowDownRight size={16} /> Retour aux publications
        </a>
        <span className="publication-page-index">
          PUBLICATION / {String(project.id).padStart(2, '0')}
        </span>
      </header>

      <section className="publication-page-hero">
        <img
          className="publication-page-cover"
          src={
            typeof project.data.coverImage === 'string' && project.data.coverImage
              ? project.data.coverImage
              : defaultCover
          }
          alt={`Couverture du projet ${project.title} – Landry Kayoyo, infrastructure IT et réseaux`}
          fetchPriority="high"
          decoding="async"
        />
        <SectionKicker index="03">Publication détaillée</SectionKicker>
        <h1>{project.title}</h1>
        <p className="publication-page-lead">{String(project.data.description ?? '')}</p>
      </section>

      <section className="publication-page-body">
        {typeof project.data.context === 'string' && (
          <div className="publication-page-block">
            <span>Contexte</span>
            <p>{project.data.context}</p>
          </div>
        )}
        {typeof project.data.details === 'string' && (
          <div className="publication-page-block">
            <span>Détails</span>
            <p>{project.data.details}</p>
          </div>
        )}
        {typeof project.data.technologies === 'string' && (
          <div className="publication-page-block">
            <span>Technologies</span>
            <p>{project.data.technologies}</p>
          </div>
        )}
        {typeof project.data.category === 'string' && (
          <div className="publication-page-block">
            <span>Catégorie</span>
            <p>{project.data.category}</p>
          </div>
        )}
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// AboutPage
// ---------------------------------------------------------------------------
export function AboutPage() {
  const data = usePublicCmsData();

  useSeoMeta({
    title: 'À propos | Landry Kayoyo',
    description:
      "Découvrez le profil et l\u2019approche de Landry Kayoyo en infrastructure IT, systèmes, réseaux et sécurité informatique.",
    path: '/a-propos',
    image: profileImage,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: 'Landry Kayoyo',
        jobTitle: 'Administrateur systèmes et réseaux',
        description:
          'Expert en infrastructure, sécurité, réseaux et observabilité pour des environnements critiques.',
      },
    },
  });

  useEffect(() => {
    if (!['#competences', '#technologies'].includes(window.location.hash)) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(window.location.hash.slice(1))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const allSkills =
    data.skills.length > 0
      ? data.skills
      : [];

  const skillGroups = allSkills.reduce<{ label: string; items: PublicCmsItem[] }[]>(
    (result, item) => {
      const label = String(item.data.category ?? 'Compétences');
      const group = result.find((c) => c.label === label);
      if (group) group.items.push(item);
      else result.push({ label, items: [item] });
      return result;
    },
    []
  );

  const technologyGroups =
    data.technologies.length > 0
      ? data.technologies.reduce<{ label: string; items: PublicCmsItem[] }[]>((result, item) => {
          const label = String(item.data.category ?? 'Technologies');
          const group = result.find((c) => c.label === label);
          if (group) group.items.push(item);
          else result.push({ label, items: [item] });
          return result;
        }, [])
      : [];

  return (
    <main className="collection-page about-page">
      <header className="collection-header">
        <a className="publication-back" href="/#about">
          <ArrowDownRight size={16} /> Retour au portfolio
        </a>
        <span>LANDRY / NET</span>
      </header>

      <section className="about-page-hero">
        <div>
          <SectionKicker index="01">À propos de moi</SectionKicker>
          <h1>
            Landry Kayoyo
            <br />
            <em>Landry Net.</em>
          </h1>
          <p>
            Landry Kayoyo, sous la marque Landry Net, est administrateur systèmes et réseaux,
            spécialisé dans les infrastructures IT, la sécurité informatique, le monitoring, les
            réseaux et l&apos;optimisation des services numériques.
          </p>
        </div>
        <img
          src={profileImage}
          alt="Portrait professionnel de Landry Kayoyo, expert en infrastructure IT, réseaux et sécurité informatique"
          width="900"
          height="1200"
          fetchPriority="high"
          decoding="async"
        />
      </section>

      <section className="about-page-content">
        <div>
          <span>Ma manière de travailler</span>
          <h2>
            Clarifier.
            <br />
            Structurer.
            <br />
            <em>Sécuriser.</em>
          </h2>
        </div>
        <div>
          <p>
            Mon rôle est de clarifier les dépendances, réduire les angles morts et mettre en place
            des bases robustes pour la fiabilité, la disponibilité et la sécurité des
            infrastructures IT.
          </p>
          <p>
            Je m&apos;intéresse aux systèmes, aux réseaux, à l&apos;observabilité, à
            l&apos;administration système, à la haute disponibilité et au développement comme levier
            d&apos;exploitation.
          </p>
        </div>
      </section>

      {skillGroups.length > 0 && (
        <section id="competences" className="about-skills">
          <div className="about-technologies-heading">
            <SectionKicker index="02">Compétences</SectionKicker>
            <h2>
              Ce que je peux
              <br />
              <em>structurer.</em>
            </h2>
            <p>
              Une présentation synthétique des compétences, sans niveau inventé ni détail artificiel.
            </p>
          </div>
          <div className="skill-groups">
            {skillGroups.map((group) => (
              <article className="skill-group" key={group.label}>
                <h3>{group.label}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      {typeof item.data.description === 'string' && (
                        <p>{item.data.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {technologyGroups.length > 0 && (
        <section id="technologies" className="about-technologies">
          <div className="about-technologies-heading">
            <SectionKicker index="03">Boîte à outils</SectionKicker>
            <h2>
              Les technologies
              <br />
              <em>que j&apos;utilise.</em>
            </h2>
            <p>
              Une sélection organisée des outils qui accompagnent les systèmes, les réseaux,
              l&apos;observabilité et le développement.
            </p>
          </div>
          <div className="technology-groups">
            {technologyGroups.map((group, index) => (
              <article className="technology-group" key={group.label}>
                <span>0{index + 1}</span>
                <h3>{group.label}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      {typeof item.data.description === 'string' && (
                        <p>{item.data.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// ServicesPage
// ---------------------------------------------------------------------------
export function ServicesPage() {
  const data = usePublicCmsData();

  useSeoMeta({
    title: 'Services IT | Landry Net',
    description:
      "Services d'infrastructure IT, réseaux, sécurité et monitoring pour des environnements professionnels fiables.",
    path: '/services',
    image: defaultCover,
  });

  const serviceGroups = data.services.reduce<{ label: string; items: PublicCmsItem[] }[]>(
    (result, item) => {
      const label = String(item.data.category ?? 'Services');
      const group = result.find((c) => c.label === label);
      if (group) group.items.push(item);
      else result.push({ label, items: [item] });
      return result;
    },
    []
  );

  return (
    <main className="collection-page about-page">
      <header className="collection-header">
        <a className="publication-back" href="/#about">
          <ArrowDownRight size={16} /> Retour au portfolio
        </a>
        <span>LANDRY NET</span>
      </header>
      <section className="collection-hero collection-hero-projects">
        <SectionKicker index="04">Services</SectionKicker>
        <h1>
          Solutions IT
          <br />
          <em>pour des infrastructures fiables.</em>
        </h1>
        <p>
          Landry Kayoyo, sous la marque Landry Net, propose des services d&apos;administration
          système, réseaux, sécurité et monitoring pour des environnements professionnels exigeants.
        </p>
      </section>
      <section className="about-skills">
        {data.loading ? (
          <div className="collection-loading">
            <span className="collection-spinner" />
            Chargement des services...
          </div>
        ) : serviceGroups.length === 0 ? (
          <p className="collection-empty">Aucun service publié pour le moment.</p>
        ) : (
          <div className="skill-groups">
            {serviceGroups.map((group) => (
              <article className="skill-group" key={group.label}>
                <h3>{group.label}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      {typeof item.data.description === 'string' && (
                        <p>{item.data.description}</p>
                      )}
                      {typeof item.data.context === 'string' && item.data.context && (
                        <p className="service-context">{item.data.context}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// ProjectsPage
// ---------------------------------------------------------------------------
export function ProjectsPage() {
  const data = usePublicCmsData();

  useSeoMeta({
    title: 'Projets | Landry Net',
    description:
      'Consultez les projets et réalisations de Landry Kayoyo en infrastructure IT, réseaux et sécurité informatique.',
    path: '/projets',
    image: defaultCover,
  });

  return (
    <main className="collection-page">
      <header className="collection-header">
        <a className="publication-back" href="/#publications">
          <ArrowDownRight size={16} /> Retour au portfolio
        </a>
        <span>LANDRY NET</span>
      </header>
      <section className="collection-hero collection-hero-projects">
        <SectionKicker index="03">Publications</SectionKicker>
        <h1>
          Tous les projets
          <br />
          <em>en pratique.</em>
        </h1>
        <p>
          Les projets publiés depuis l&apos;espace d&apos;administration, présentés avec leur
          contexte et leurs technologies.
        </p>
      </section>
      <section className="project-list">
        {data.projects.length === 0 ? (
          <p className="collection-empty">Aucun projet publié pour le moment.</p>
        ) : (
          data.projects.map((project, index) => (
            <a
              className="project-list-item"
              href={`/publication/${project.id}`}
              key={project.id}
            >
              <img
                src={
                  typeof project.data.coverImage === 'string' && project.data.coverImage
                    ? project.data.coverImage
                    : defaultCover
                }
                alt={`Projet ${project.title} de Landry Kayoyo, infrastructure IT, réseaux et systèmes`}
                loading="lazy"
                decoding="async"
              />
              <span>0{index + 1}</span>
              <div>
                <h2>{project.title}</h2>
                <p>{String(project.data.description ?? '')}</p>
              </div>
              <ArrowUpRight size={21} />
            </a>
          ))
        )}
      </section>
    </main>
  );
}
