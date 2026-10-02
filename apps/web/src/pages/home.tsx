import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowDownRight,
  ArrowUp,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  ExternalLink,
  Github,
  Globe2,
  Instagram,
  Linkedin,
  Menu,
  Network,
  Send,
  Server,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { Reveal, SectionKicker } from '@/components/reveal';
import { DiplomaCollage, FieldNotesCarousel } from '@/components/terrain';
import { useSeoMeta } from '@/hooks/use-seo-meta';
import { usePublicCmsData } from '@/hooks/use-public-cms-data';
import {
  navItems,
  defaultCover,
  contactEmail,
  siteUrl,
  apiBaseUrl,
} from '@/lib/data';
import brandLogo from '@assets/optimized/brand-logo.webp';
import presentationImage from '@assets/optimized/hero-presentation.webp';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';
type ContactFields = { nom: string; email: string; sujet: string; message: string };
type ContactErrors = Partial<Record<keyof ContactFields, string>>;

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
  website: Globe2,
};

const iconMap = [Server, Network, Activity, ShieldCheck, Terminal] as const;

export default function Home() {
  useSeoMeta({
    title: 'Landry Kayoyo | Administrateur systèmes et réseaux',
    description:
      "Landry Kayoyo, administrateur systèmes et réseaux, accompagne les entreprises dans l\u2019infrastructure IT, la sécurité et le monitoring à Lubumbashi.",
    path: '/',
    image: defaultCover,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Landry Net',
        url: siteUrl,
        description:
          'Portfolio de Landry Kayoyo, sous la marque Landry Net, administrateur systèmes et réseaux.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Landry Kayoyo',
        jobTitle: 'Administrateur systèmes et réseaux',
        url: siteUrl,
        sameAs: ['https://www.linkedin.com', 'https://github.com'],
        knowsAbout: ['Infrastructure IT', 'Réseaux', 'Sécurité', 'Monitoring', 'Automatisation'],
      },
    ],
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<ContactFields>({ nom: '', email: '', sujet: '', message: '' });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const cmsData = usePublicCmsData();

  const cmsExpertise = cmsData.skills.map((item, index) => ({
    number: String(index + 1).padStart(2, '0'),
    title: item.title,
    short: String(item.data.short ?? ''),
    description: String(item.data.description ?? ''),
    tools: String(item.data.tools ?? ''),
    icon: iconMap[index % 5],
  }));
  const publicExpertise = cmsExpertise.slice(0, 4);

  const publicStackGroups =
    cmsData.technologies.length > 0
      ? cmsData.technologies.reduce<{ label: string; items: string[] }[]>((groups, item) => {
          const label = String(item.data.category ?? 'Technologies');
          const group = groups.find((c) => c.label === label);
          if (group) group.items.push(item.title);
          else groups.push({ label, items: [item.title] });
          return groups;
        }, [])
      : [];

  const publicProjects = cmsData.projects
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice(0, 6);
  const publicTimeline = cmsData.timeline.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const diplomaTimelineIndex = Math.max(0, publicTimeline.findIndex((item) => {
    const educationDetails = `${item.title} ${item.data.category ?? ''} ${item.data.institution ?? ''}`.toLowerCase();
    return educationDetails.includes('don bosco') || educationDetails.includes('udbl') || educationDetails.includes('formation supérieure');
  }));
  const publicSocials = cmsData.socials.filter(
    (item) => typeof item.data.url === 'string' && item.data.url.trim().length > 0
  );

  useEffect(() => {
    if (window.location.hash !== '#publications' || publicProjects.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('publications')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [publicProjects.length]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const updateField = (field: keyof ContactFields, value: string) => {
    setForm((c) => ({ ...c, [field]: value }));
    setErrors((c) => ({ ...c, [field]: undefined }));
    if (status !== 'idle') setStatus('idle');
  };

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: ContactErrors = {};
    if (form.nom.trim().length < 2) nextErrors.nom = 'Indiquez votre nom.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      nextErrors.email = 'Indiquez une adresse e-mail valide.';
    if (form.sujet.trim().length < 3) nextErrors.sujet = 'Ajoutez un sujet.';
    if (form.message.trim().length < 12)
      nextErrors.message = 'Décrivez votre contexte en quelques mots.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const response = await fetch(`${apiBaseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const details = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(details?.error ?? 'Contact request failed');
      }
      setStatus('success');
    } catch (error) {
      setErrors({
        message: error instanceof Error ? error.message : 'Envoi impossible pour le moment.',
      });
      setStatus('error');
    }
  };

  const resetForm = () => {
    setForm({ nom: '', email: '', sujet: '', message: '' });
    setErrors({});
    setStatus('idle');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site">
      {/* ── Header ── */}
      <header className="site-header">
        <div className="site-header-inner shell">
          <a href="#top" className="brand-lockup" onClick={closeMenu} data-testid="link-home">
            <span className="brand-logo">
              <img
                src={brandLogo}
                alt="Logo Landry Net, Landry Kayoyo, infrastructure IT et systèmes fiables"
              />
            </span>
            <span className="brand-wordmark">LANDRY NET</span>
          </a>

          <nav className="desktop-nav" aria-label="Navigation principale">
            {navItems.map((item, index) => (
              <a key={item.href} href={item.href} data-testid={`link-nav-${index}`}>
                {item.label}
                <sup>0{index + 1}</sup>
              </a>
            ))}
          </nav>

          <a href="#contact" className="header-contact" data-testid="link-header-contact">
            <span>Parlons projet</span>
            <ArrowUpRight size={16} />
          </a>

          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            data-testid="button-menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Mobile Menu (outside header to avoid backdrop-filter stacking context) ── */}
      <AnimatePresence>
        {menuOpen && (
          <>

                <motion.div
                  className="mobile-menu-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={closeMenu}
                />
                <motion.div
                  className="mobile-menu"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mobile-menu-header">
                    <a href="#top" className="brand-lockup" onClick={closeMenu}>
                      <span className="brand-logo">
                        <img src={brandLogo} alt="Logo Landry Net" />
                      </span>
                      <span className="brand-wordmark">LANDRY NET</span>
                    </a>
                    <button type="button" className="mobile-menu-close" onClick={closeMenu} aria-label="Fermer le menu">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mobile-menu-body">
                    <div className="mobile-menu-label">Navigation</div>
                    <nav aria-label="Navigation mobile">
                      {[...navItems, { label: 'Contact', href: '#contact' }].map((item, index) => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={closeMenu}
                          data-testid={`link-mobile-${index}`}
                        >
                          <span>0{index + 1}</span>
                          {item.label}
                          <ArrowUpRight size={20} />
                        </a>
                      ))}
                    </nav>
                    <div className="mobile-menu-footer">
                      <a href="#contact" className="mobile-menu-cta" onClick={closeMenu}>
                        Parlons projet <ArrowUpRight size={16} />
                      </a>
                    </div>
                  </div>
                </motion.div>
          </>
        )}
      </AnimatePresence>

      <main id="top">

        {/* ── Hero ── */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          <div className="hero-inner shell">
            <div className="hero-copy">
              <Reveal>
                <p className="eyebrow">
                  Landry Net <span>/</span> Infrastructure IT
                </p>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 id="hero-title">
                  Infrastructure IT
                  <br />
                  <em>pour les entreprises.</em>
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="hero-intro">
                  Landry Kayoyo aide les entreprises à structurer, sécuriser et optimiser leurs
                  systèmes, réseaux et services critiques.
                </p>
              </Reveal>
              <Reveal delay={0.24} className="hero-actions">
                <a
                  href="#terrain"
                  className="button button-accent"
                  data-testid="link-hero-terrain"
                >
                  Voir mon approche <ArrowDownRight size={17} />
                </a>
                <a href="#about" className="text-link" data-testid="link-hero-about">
                  Mon approche <ChevronRight size={16} />
                </a>
              </Reveal>
              <Reveal delay={0.3} className="hero-footnote">
                <span className="status-dot" /> Disponible pour des environnements à structurer
              </Reveal>
            </div>

            <Reveal delay={0.15} className="hero-visual">
              <div className="visual-index">
                01 <span>—</span> 05
              </div>
              <div className="portrait-card">
                <img
                  src={presentationImage}
                  alt="Landry Kayoyo lors d'une présentation technique en infrastructure IT, systèmes et réseaux"
                  width="900"
                  height="1169"
                  fetchPriority="high"
                  decoding="async"
                />
                <div className="portrait-overlay" />
                <div className="portrait-note">
                  <span>LANDRY NET</span>
                  <small>Architecture &amp; exploitation</small>
                </div>
                <div className="visual-stamp">
                  <Cpu size={15} />
                  <span>
                    IT
                    <br />
                    SYSTEMS
                  </span>
                </div>
              </div>
              <div className="visual-caption">
                Lubumbashi, RDC <span>—</span> 2025
              </div>
            </Reveal>
          </div>
          <a href="#about" className="scroll-note" data-testid="link-scroll-about">
            <span>Défiler pour explorer</span>
            <ChevronDown size={16} />
          </a>
        </section>

        {/* ── About ── */}
        <section id="about" className="about-section section-dark">
          <div className="shell about-layout">
            <Reveal>
              <SectionKicker index="01">À propos</SectionKicker>
            </Reveal>
            <Reveal delay={0.08} className="about-main">
              <h2>
                Systèmes &amp; réseaux,
                <br />
                <span>avec une infrastructure fiable.</span>
              </h2>
              <div className="about-columns">
                <p className="lead-copy">
                  Landry Kayoyo, sous la marque Landry Net, accompagne les organisations dans la
                  conception, la sécurisation et l&apos;optimisation de leurs systèmes, réseaux et
                  services critiques.
                </p>
                <div className="body-copy">
                  <p>
                    Mon rôle consiste à clarifier les dépendances, réduire les angles morts et
                    poser des fondations solides pour la disponibilité, la sécurité, le monitoring
                    et la continuité des activités.
                  </p>
                  <a
                    href="/a-propos"
                    className="text-link text-link-light"
                    data-testid="link-about-page"
                  >
                    En savoir plus sur mon approche <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Expertise ── */}
        <section id="expertise" className="expertise-section section-paper">
          <div className="shell">
            <Reveal className="section-heading">
              <div>
                <SectionKicker index="02">Compétences</SectionKicker>
                <h2>
                  Infrastructure IT,
                  <br />
                  <em>sécurité et réseaux.</em>
                </h2>
              </div>
              <div className="section-heading-aside">
                <p>
                  Des solutions d&apos;administration système, de sécurité informatique, de
                  monitoring et d&apos;automatisation adaptées aux environnements critiques.
                </p>
                <a className="page-inline-link" href="/a-propos#competences">
                  Voir plus <ArrowUpRight size={16} />
                </a>
              </div>
            </Reveal>
            <div className="expertise-layout expertise-layout-list-only">
              <div className="expertise-list" role="list">
                {publicExpertise.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Reveal key={item.number} delay={index * 0.04}>
                      <div className="expertise-item" data-testid={`item-expertise-${index}`}>
                        <span className="expertise-item-number">{item.number}</span>
                        <span className="expertise-item-title">{item.title}</span>
                        <span className="expertise-item-short">{item.short}</span>
                        <Icon size={19} strokeWidth={1.4} />
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Publications ── */}
        {publicProjects.length > 0 && (
          <section id="publications" className="publications-section section-paper">
            <div className="shell">
              <Reveal className="section-heading">
                <div>
                  <SectionKicker index="03">Publications</SectionKicker>
                  <h2>
                    Les projets
                    <br />
                    <em>en pratique.</em>
                  </h2>
                </div>
                <p>Retrouvez les projets publiés depuis l&apos;espace d&apos;administration.</p>
              </Reveal>
              <div className="publication-grid">
                {publicProjects.map((project, index) => (
                  <Reveal key={project.id} delay={index * 0.06} className="publication-card">
                    <a href={`/publication/${project.id}`}>
                      <img
                        className={`publication-cover${typeof project.data.coverImage === 'string' && project.data.coverImage ? '' : ' is-placeholder-cover'}`}
                        src={
                          typeof project.data.coverImage === 'string' && project.data.coverImage
                            ? project.data.coverImage
                            : defaultCover
                        }
                        alt={`Projet ${project.title} de Landry Kayoyo, infrastructure IT, systèmes et réseaux`}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="publication-number">0{index + 1}</span>
                      <span className="publication-title">{project.title}</span>
                      <span className="publication-summary">
                        {String(project.data.description ?? 'Publication à découvrir.')}
                      </span>
                      <span className="publication-link">
                        Voir le détail <ArrowUpRight size={16} />
                      </span>
                    </a>
                  </Reveal>
                ))}
              </div>
              <a className="page-inline-link" href="/projets">
                Voir tous les projets <ArrowUpRight size={16} />
              </a>
            </div>
          </section>
        )}

        {/* ── Services showcase ── */}
        <section className="services-showcase section-paper">
          <div className="shell">
            <Reveal className="section-heading">
              <div>
                <SectionKicker index="04">Services</SectionKicker>
                <h2>
                  Solutions IT pour
                  <br />
                  <em>des infrastructures fiables.</em>
                </h2>
              </div>
              <a className="page-inline-link" href="/services">
                Voir tous les services <ArrowUpRight size={16} />
              </a>
            </Reveal>
            <div className="stack-grid">
              {[
                {
                  label: 'Infrastructure IT',
                  items: [
                    'Administration système',
                    'Virtualisation',
                    'Haute disponibilité',
                    'Protection des données',
                  ],
                },
                {
                  label: 'Réseaux & sécurité',
                  items: [
                    'Architecture réseau',
                    'Sécurité informatique',
                    'VPN',
                    'Pare-feu et segmentation',
                  ],
                },
                {
                  label: 'Monitoring & observabilité',
                  items: ['Supervision', 'Alerting', 'Performance', 'Disponibilité'],
                },
                {
                  label: 'Automatisation',
                  items: ['Scripts', 'Déploiement', 'Optimisation', 'Support technique'],
                },
              ].map((group, index) => (
                <Reveal key={group.label} delay={index * 0.06} className="stack-group">
                  <span className="stack-index">0{index + 1}</span>
                  <h3>{group.label}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>
                        <span />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stack ── */}
        <section className="stack-section section-dark">
          <div className="shell">
            <Reveal className="stack-heading">
              <SectionKicker index="05">Boîte à outils</SectionKicker>
              <h2>
                Les bons outils.
                <br />
                <em>Au bon moment.</em>
              </h2>
              <a className="page-inline-link page-inline-link-light" href="/a-propos#technologies">
                Voir toutes les technologies <ArrowUpRight size={16} />
              </a>
            </Reveal>
            <div className="stack-grid">
              {publicStackGroups.map((group, index) => (
                <Reveal key={group.label} delay={index * 0.06} className="stack-group">
                  <span className="stack-index">0{index + 1}</span>
                  <h3>{group.label}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>
                        <span />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Terrain ── */}
        <section id="terrain" className="terrain-section section-paper">
          <div className="shell">
            <Reveal className="terrain-heading">
              <div>
                <SectionKicker index="05">Sur le terrain</SectionKicker>
                <h2>
                  Mission IT,
                  <br />
                  <em>continuité et observabilité.</em>
                </h2>
              </div>
              <p>
                Une présence professionnelle orientée infrastructure, sécurité, réseaux et
                optimisation des services. Ces images illustrent l&apos;approche de Landry Kayoyo :
                précision, analyse, collaboration et maintien de la continuité opérationnelle.
              </p>
            </Reveal>
            <FieldNotesCarousel />
          </div>
        </section>

        {/* ── Parcours ── */}
        <section id="parcours" className="path-section section-paper">
          <div className="shell path-layout">
            <Reveal>
              <SectionKicker index="06">Parcours</SectionKicker>
              <h2>
                Formation en
                <br />
                <em>systèmes &amp; réseaux.</em>
              </h2>
            </Reveal>
            <div className="path-list">
              {publicTimeline.length > 0 ? publicTimeline.map((item, index) => (
              <Reveal
                key={item.id}
                delay={0.1 + index * 0.06}
                className={`path-content${index === diplomaTimelineIndex ? ' path-content-featured' : ''}`}
              >
                <div className="path-marker">
                  <span>{String(item.data.date ?? "") || "—"}</span>
                  <i />
                </div>
                <div className="path-copy">
                  <span className="path-type">{String(item.data.category ?? "Parcours")}</span>
                  <h3>{item.title}</h3>
                  {typeof item.data.institution === "string" && <p>{item.data.institution}</p>}
                  {typeof item.data.description === "string" && <small>{item.data.description}</small>}
                </div>
                {index === diplomaTimelineIndex && <DiplomaCollage />}
              </Reveal>
            )) : (
              <Reveal delay={0.1} className="path-content">
                <div className="path-marker">
                  <span>2026</span>
                  <i />
                </div>
                <div className="path-copy">
                  <span className="path-type">Formation supérieure</span>
                  <h3>
                    Administration
                    <br />
                    Systèmes &amp; Réseaux
                  </h3>
                  <p>Université Don Bosco de Lubumbashi</p>
                  <small>
                    Projet de fin de cycle — mise en place d&apos;une haute disponibilité des
                    services, architecture réseau robuste et optimisation de l&apos;infrastructure IT.
                  </small>
                </div>
                <DiplomaCollage />
              </Reveal>
            )}
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <section id="contact" className="contact-section">
          <div className="shell contact-layout">
            <Reveal>
              <SectionKicker index="07" dark>
                Contact
              </SectionKicker>
              <h2>
                Un système
                <br />
                <em>à structurer ?</em>
              </h2>
              <p className="contact-copy">
                Décrivez le contexte, le niveau d&apos;urgence et ce qui doit rester debout. La
                première réponse commence ici.
              </p>
              <div className="contact-direct">
                <span>Écrire directement</span>
                <a href={`mailto:${contactEmail}`} data-testid="link-email">
                  {contactEmail} <ArrowUpRight size={15} />
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              {status === 'success' ? (
                <div
                  className="contact-success"
                  role="status"
                  aria-live="polite"
                  data-testid="status-contact-success"
                >
                  <CheckCircle2 size={26} />
                  <span>Message envoyé</span>
                  <h3>Merci{form.nom.trim() ? `, ${form.nom.trim()}` : ''}.</h3>
                  <p>
                    Votre message a bien été envoyé. Je vous répondrai à l&apos;adresse{' '}
                    <strong>{form.email}</strong> dès que possible.
                  </p>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={resetForm}
                    data-testid="button-reset-contact"
                  >
                    Écrire un autre message <ArrowUpRight size={16} />
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={submitContact} noValidate>
                  <div className="contact-form-intro">
                    <span>Votre demande</span>
                    <p>Quelques détails suffisent pour comprendre votre besoin et les prochaines étapes.</p>
                  </div>
                  {status === 'error' && Object.keys(errors).length > 0 && (
                    <div
                      className="form-error"
                      role="alert"
                      data-testid="status-contact-error"
                    >
                      Quelques champs demandent votre attention.
                    </div>
                  )}
                  <div className="form-row">
                    <label>
                      <span>Votre nom</span>
                      <input
                        data-testid="input-contact-name"
                        name="nom"
                        autoComplete="name"
                        required
                        value={form.nom}
                        onChange={(e) => updateField('nom', e.target.value)}
                        aria-invalid={Boolean(errors.nom)}
                        aria-describedby={errors.nom ? 'contact-name-error' : undefined}
                        placeholder="Nom et prénom"
                      />
                      {errors.nom && <small id="contact-name-error">{errors.nom}</small>}
                    </label>
                    <label>
                      <span>E-mail</span>
                      <input
                        data-testid="input-contact-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'contact-email-error' : undefined}
                        placeholder="vous@exemple.com"
                      />
                      {errors.email && <small id="contact-email-error">{errors.email}</small>}
                    </label>
                  </div>
                  <label>
                    <span>Sujet</span>
                    <input
                      data-testid="input-contact-subject"
                      name="sujet"
                      autoComplete="off"
                      required
                      value={form.sujet}
                      onChange={(e) => updateField('sujet', e.target.value)}
                      aria-invalid={Boolean(errors.sujet)}
                      aria-describedby={errors.sujet ? 'contact-subject-error' : undefined}
                      placeholder="Infrastructure, réseau, automatisation..."
                    />
                    {errors.sujet && <small id="contact-subject-error">{errors.sujet}</small>}
                  </label>
                  <label>
                    <span>Contexte</span>
                    <textarea
                      data-testid="input-contact-message"
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => updateField('message', e.target.value)}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      placeholder="Ce qui existe, ce qui bloque, ce qui doit changer..."
                    />
                    {errors.message && <small id="contact-message-error">{errors.message}</small>}
                  </label>
                  <button
                    type="submit"
                    className="button button-accent form-submit"
                    disabled={status === 'loading'}
                    data-testid="button-submit-contact"
                  >
                    {status === 'loading' ? 'Envoi en cours…' : 'Envoyer ma demande'}
                    <Send size={16} />
                  </button>
                </form>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="shell footer-top">
          <div className="footer-availability">
            <span className="status-dot status-dot-blue" /> Disponible pour des environnements à
            structurer
          </div>
          <nav className="footer-nav" aria-label="Navigation du pied de page">
            {navItems.slice(0, 4).map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="shell footer-inner">
          <div className="footer-identity">
            <a href="#top" className="footer-brand" data-testid="link-footer-home">
              <img
                src={brandLogo}
                alt="Logo Landry Net, Landry Kayoyo, expertise IT et infrastructure"
                width="40"
                height="40"
                loading="lazy"
                decoding="async"
              />
              LANDRY NET
            </a>
            <div className="footer-context">
              <span>Architecture IT · Systèmes · Réseaux</span>
              <span>Lubumbashi, RDC</span>
            </div>
          </div>
          {publicSocials.length > 0 && (
            <nav className="footer-socials" aria-label="Réseaux sociaux">
              {publicSocials.map((social) => {
                const label = social.title.replace(/^\[TEST\]\s*/i, '');
                const key = String(social.data.icon ?? label).toLowerCase();
                const Icon =
                  Object.entries(socialIcons).find(([name]) => key.includes(name))?.[1] ??
                  ExternalLink;
                return (
                  <a
                    key={social.id}
                    href={String(social.data.url)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                  >
                    <Icon size={15} />
                    <span>{label}</span>
                  </a>
                );
              })}
            </nav>
          )}
          <div className="footer-end">
            <span>© {new Date().getFullYear()} Landry Kayoyo</span>
            <a
              href="#top"
              className="footer-back"
              aria-label="Retour en haut"
              title="Retour en haut"
              data-testid="link-footer-top"
            >
              <ArrowUp size={17} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
