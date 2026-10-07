import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Download, ExternalLink, Share2 } from 'lucide-react';
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
  const [shareFeedback, setShareFeedback] = useState('');
  const [, params] = useRoute('/publication/:id');
  const data = usePublicCmsData();
  const project: PublicCmsItem | null =
    data.projects.find((p) => String(p.id) === params?.id) ?? null;
  const projectTechnologies = Array.isArray(project?.data.technologies)
    ? project.data.technologies.map(String).join(' · ')
    : String(project?.data.technologies ?? '');
  const liveUrl = typeof project?.data.liveUrl === 'string' ? project.data.liveUrl.trim() : '';

  const shareProject = async () => {
    if (!project) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: project.title, url });
        setShareFeedback('Lien partagé.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareFeedback('Lien copié.');
      } else {
        window.prompt('Copiez le lien du projet :', url);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setShareFeedback('Impossible de partager le lien.');
      }
    }
    window.setTimeout(() => setShareFeedback(''), 2500);
  };

  useSeoMeta({
    title: project?.title ?? (params?.id ? `Publication ${params.id}` : 'Publication'),
    description: String(project?.data.description ?? 'Consultez les projets et réalisations de Landry Kayoyo dans les domaines des systèmes, réseaux et infrastructure.'),
    path: params?.id ? `/publication/${params.id}` : '/publication',
    noindex: !data.loading && !project,
    image:
      project?.data.coverImage && typeof project.data.coverImage === 'string'
        ? project.data.coverImage
        : defaultCover,
  });

  if (!project && data.loading)
    return (
      <main className="publication-page publication-loading-page" aria-live="polite" aria-busy="true">
        <header className="publication-page-header">
          <a className="publication-back" href="/projets">
            <ArrowDownRight size={16} /> Retour aux publications
          </a>
          <span className="publication-page-index">PUBLICATION</span>
        </header>
        <div className="publication-loading-skeleton" aria-hidden="true">
          <span />
          <i />
          <i />
          <b />
        </div>
      </main>
    );

  if (!project)
    return (
      <main className="publication-page publication-page-state">
        <h1>Publication introuvable</h1>
        <a className="button button-accent" href="/projets">
          Retour aux publications <ArrowUpRight size={16} />
        </a>
      </main>
    );

  return (
    <main className="publication-page">
      <header className="publication-page-header">
        <a className="publication-back" href="/projets">
          <ArrowDownRight size={16} /> Retour aux publications
        </a>
        <span className="publication-page-index">
          PUBLICATION / {String(project.id).padStart(2, '0')}
        </span>
      </header>

      <section className="publication-page-hero">
        {typeof project.data.coverImage === 'string' && project.data.coverImage ? (
          <img
            className="publication-page-cover"
            src={project.data.coverImage}
            alt={`Couverture du projet ${project.title} – Landry Kayoyo, infrastructure IT et réseaux`}
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className="publication-page-cover-placeholder" role="img" aria-label={`Visuel du projet ${project.title}`}>
            <span>LANDRY / NET <i /> PUBLICATION</span>
            <strong>{String(project.data.category ?? 'SYSTÈMES & RÉSEAUX')}</strong>
            <small>{project.title}</small>
          </div>
        )}
        <SectionKicker index="03">Publication détaillée</SectionKicker>
        <h1>{project.title}</h1>
        <p className="publication-page-lead">{String(project.data.description ?? '')}</p>
        <div className="publication-page-actions">
          {liveUrl && (
            <a className="button button-accent" href={liveUrl} target="_blank" rel="noopener noreferrer">
              Voir le projet en ligne <ExternalLink size={16} />
            </a>
          )}
          <button className="button button-outline publication-share-button" type="button" onClick={() => void shareProject()}>
            <Share2 size={16} /> Partager le projet
          </button>
          {shareFeedback && <span className="publication-share-feedback" role="status">{shareFeedback}</span>}
        </div>
      </section>

      <section className="publication-page-body">
        {typeof project.data.context === 'string' && project.data.context.trim() && (
          <div className="publication-page-block">
            <span>Contexte</span>
            <p>{project.data.context}</p>
          </div>
        )}
        {typeof project.data.details === 'string' && project.data.details.trim() && (
          <div className="publication-page-block">
            <span>Détails</span>
            <p>{project.data.details}</p>
          </div>
        )}
        {projectTechnologies && (
          <div className="publication-page-block">
            <span>Technologies</span>
            <p>{projectTechnologies}</p>
          </div>
        )}
        {typeof project.data.category === 'string' && (
          <div className="publication-page-block">
            <span>Catégorie</span>
            <p>{project.data.category}</p>
          </div>
        )}
        {typeof project.data.description === 'string' && project.data.description.trim() &&
          ![project.data.context, project.data.details].some((field) => typeof field === 'string' && field.trim() === project.data.description) && (
            <div className="publication-page-block">
              <span>Résumé</span>
              <p>{project.data.description}</p>
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
  const profile = data.profile ?? {};

  const getProfileText = (...keys: string[]) => {
    for (const key of keys) {
      const value = profile[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  };

  const profileName = getProfileText('name', 'fullName', 'displayName', 'full_name') || 'Landry Kayoyo';
  const profileTitle = getProfileText('jobTitle', 'title', 'role', 'poste', 'position') || 'Administrateur systèmes et réseaux';
  const profileDescription =
    getProfileText('bio', 'about', 'description', 'summary', 'intro') ||
    'Landry Kayoyo, sous la marque Landry Net, est administrateur systèmes et réseaux, spécialisé dans les infrastructures IT, la sécurité informatique, le monitoring, les réseaux et l’optimisation des services numériques.';
  const cvUrl = getProfileText('cvUrl', 'cv_url', 'resumeUrl', 'resume_url', 'cv', 'resume');

  useSeoMeta({
    title: `À propos | ${profileName}`,
    description: profileDescription,
    path: '/a-propos',
    image: profileImage,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: profileName,
        jobTitle: profileTitle,
        description: profileDescription,
      },
    },
  });

  useEffect(() => {
    if (!['#competences', '#technologies', '#parcours'].includes(window.location.hash)) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(window.location.hash.slice(1))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data.loading]);

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
            {profileName}
            <br />
            <em>Landry Net.</em>
          </h1>
          <p>{profileDescription}</p>
          {cvUrl && (
            <a className="button button-accent about-cv-button" href={cvUrl} target="_blank" rel="noreferrer">
              <Download size={16} /> Télécharger mon CV
            </a>
          )}
        </div>
        <img
          src={profileImage}
          alt={`Portrait professionnel de ${profileName}, ${profileTitle}`}
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

      {!data.loading && (
        <section id="parcours" className="about-timeline">
          <div className="about-timeline-heading">
            <SectionKicker index="05">Parcours</SectionKicker>
            <h2>Formation &amp;<br /><em>expériences.</em></h2>
            <p>Les étapes de mon parcours, avec leur contexte et leurs détails.</p>
          </div>
          <div className="about-timeline-list">
            {data.timeline.length > 0 ? data.timeline
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
              .map((item) => (
                <article className="about-timeline-entry" key={item.id}>
                  <div className="path-marker">
                    <span>{String(item.data.date ?? '') || '—'}</span>
                    <i />
                  </div>
                  <div className="path-copy">
                    <span className="path-type">{String(item.data.category ?? 'Parcours')}</span>
                    <h3>{item.title}</h3>
                    {typeof item.data.institution === 'string' && item.data.institution && <p>{item.data.institution}</p>}
                    {typeof item.data.description === 'string' && item.data.description && (
                      <p className="about-timeline-description">{item.data.description}</p>
                    )}
                  </div>
                </article>
              )) : (
                <article className="about-timeline-entry">
                  <div className="path-marker"><span>2026</span><i /></div>
                  <div className="path-copy">
                    <span className="path-type">Formation supérieure</span>
                    <h3>Administration Systèmes &amp; Réseaux</h3>
                    <p>Université Don Bosco de Lubumbashi</p>
                    <p className="about-timeline-description">
                      Projet de fin de cycle : mise en place d’une haute disponibilité des services,
                      architecture réseau robuste et optimisation de l’infrastructure IT.
                    </p>
                  </div>
                </article>
              )}
          </div>
        </section>
      )}

      {!data.loading && data.certifications.length > 0 && (
        <section className="about-skills">
          <div className="about-technologies-heading">
            <SectionKicker index="04">Certifications</SectionKicker>
            <h2>Certifications professionnelles</h2>
          </div>
          <div className="about-certification-list">
            {data.certifications.map((certification, index) => {
              const certificateUrl = typeof certification.data.url === 'string' ? certification.data.url : '';
              const documentUrl = typeof certification.data.documentUrl === 'string' ? certification.data.documentUrl : '';

              return (
                <article className="about-certification-item" key={certification.id}>
                  <div className="about-certification-header">
                    <span className="about-certification-index">{String(index + 1).padStart(2, '0')}</span>
                    <div className="about-certification-copy">
                      <h3>{certification.title}</h3>
                      {typeof certification.data.issuer === 'string' && certification.data.issuer && <p>{certification.data.issuer}</p>}
                      {typeof certification.data.date === 'string' && certification.data.date && <p>{certification.data.date}</p>}
                      {typeof certification.data.description === 'string' && certification.data.description && (
                        <p>{certification.data.description}</p>
                      )}
                    </div>
                  </div>

                  {(certificateUrl || documentUrl) && (
                    <div className="about-certification-actions">
                      {certificateUrl && (
                        <a className="about-certification-link" href={certificateUrl} target="_blank" rel="noreferrer">
                          Voir le certificat ↗
                        </a>
                      )}
                      {documentUrl && (
                        <a className="about-certification-link about-certification-link-secondary" href={documentUrl} target="_blank" rel="noreferrer">
                          Ouvrir le document ↗
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

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
    <main className="collection-page about-page services-page">
      <header className="collection-header">
        <a className="publication-back" href="/#about">
          <ArrowDownRight size={16} /> Retour au portfolio
        </a>
        <span>LANDRY NET</span>
      </header>
      <section className="collection-hero collection-hero-projects services-hero">
        <SectionKicker index="04">Services IT</SectionKicker>
        <h1>
          Des solutions concrètes
          <br />
          <em>pour vos systèmes et réseaux.</em>
        </h1>
        <p>
          De la conception à l’exploitation, découvrez les services proposés pour créer des
          infrastructures fiables, sécurisées et adaptées à vos besoins.
        </p>
        {!data.loading && serviceGroups.length > 0 && (
          <span className="services-count">{data.services.length} prestations disponibles</span>
        )}
      </section>
      <section className="services-list-section" aria-label="Liste des services">
        {data.loading ? (
          <div className="collection-loading">
            <span className="collection-spinner" />
            Chargement des services...
          </div>
        ) : serviceGroups.length === 0 ? (
          <p className="collection-empty">Aucun service publié pour le moment.</p>
        ) : (
          <div className="services-grid">
            {serviceGroups.map((group, groupIndex) => (
              <article className="service-category-card" key={group.label}>
                <header className="service-category-heading">
                  <span>{String(groupIndex + 1).padStart(2, '0')}</span>
                  <span>{group.items.length} {group.items.length === 1 ? 'prestation' : 'prestations'}</span>
                </header>
                <h2>{group.label}</h2>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.id} className="service-offer">
                      <h3>{item.title}</h3>
                      {typeof item.data.description === 'string' && item.data.description.trim() && (
                        <p>{item.data.description}</p>
                      )}
                      {typeof item.data.context === 'string' && item.data.context.trim() && (
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
      {!data.loading && serviceGroups.length > 0 && (
        <section className="services-contact-cta">
          <div>
            <span>Un besoin spécifique ?</span>
            <h2>Parlons de votre infrastructure.</h2>
          </div>
          <a className="button button-accent" href="/#contact">
            Décrire mon besoin <ArrowUpRight size={16} />
          </a>
        </section>
      )}
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
        {data.loading ? (
          <div className="collection-loading" aria-live="polite" aria-busy="true">
            <span className="collection-spinner" /> Chargement des projets...
          </div>
        ) : data.projects.length === 0 ? (
          <p className="collection-empty">Aucun projet publié pour le moment.</p>
        ) : (
          data.projects.map((project, index) => (
            <a
              className="project-list-item"
              href={`/publication/${project.id}`}
              key={project.id}
            >
              {typeof project.data.coverImage === 'string' && project.data.coverImage ? (
                <div className="project-list-visual">
                  <img src={project.data.coverImage} alt={`Illustration du projet ${project.title}`} loading="lazy" fetchPriority="low" decoding="async" />
                </div>
              ) : (
                <div className="project-list-visual project-list-visual-placeholder" aria-hidden="true">
                  <span>LANDRY / NET <i /> PROJET {String(index + 1).padStart(2, '0')}</span>
                  <strong>SYSTÈMES<br />&amp; RÉSEAUX</strong>
                  <small>{String(project.data.category ?? 'Étude de cas')}</small>
                </div>
              )}
              <span className="project-list-number">{String(index + 1).padStart(2, '0')}</span>
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
