import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import AdminApp from './admin';
import { motion, useReducedMotion } from 'framer-motion';
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
import { Route, Switch, Router as WouterRouter, useRoute } from 'wouter';
import brandLogo from '@assets/brand-logo.png';
import presentationImage from '@assets/hero-presentation.jpeg';
import profileImage from '@assets/profile-portrait.jpeg';
import diplomaImage from '@assets/diploma-ceremony.jpeg';
import seatedPresentationImage from '@assets/field-transmission.jpeg';
import writingPresentationImage from '@assets/field-method.jpeg';

const queryClient = new QueryClient();

type FormStatus = 'idle' | 'loading' | 'success' | 'error';
type ContactFields = { nom: string; email: string; sujet: string; message: string };
type ContactErrors = Partial<Record<keyof ContactFields, string>>;
type PublicCmsItem = { id: number; title: string; data: Record<string, unknown>; sortOrder: number };
type PublicCmsData = { skills: PublicCmsItem[]; technologies: PublicCmsItem[]; projects: PublicCmsItem[]; timeline: PublicCmsItem[]; socials: PublicCmsItem[] };

const navItems = [
  { label: 'À propos', href: '#about' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Publications', href: '#publications' },
  { label: 'Terrain', href: '#terrain' },
  { label: 'Parcours', href: '#parcours' },
];

function usePublicCmsData() {
  const [data, setData] = useState<PublicCmsData>({ skills: [], technologies: [], projects: [], timeline: [], socials: [] });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/content`)
      .then((response) => response.ok ? response.json() : null)
      .then((nextData: PublicCmsData | null) => {
        if (nextData) setData(nextData);
      })
      .catch(() => undefined);
  }, []);

  return data;
}

const expertise = [
  {
    number: '01',
    title: 'Systèmes',
    short: 'Administrer les fondations.',
    description: 'Windows Server et Linux pensés comme des fondations documentées : annuaire, services réseau, durcissement et politiques qui restent compréhensibles.',
    tools: 'Active Directory · GPO · PowerShell · Ubuntu Server',
    icon: Server,
  },
  {
    number: '02',
    title: 'Réseaux',
    short: 'Rendre chaque flux lisible.',
    description: 'Des architectures réseau claires, segmentées et testables, de la topologie TCP/IP au firewall en passant par les VLAN et les accès distants.',
    tools: 'TCP/IP · DHCP · DNS · VLAN · VPN · FortiGate',
    icon: Network,
  },
  {
    number: '03',
    title: 'Monitoring',
    short: 'Voir avant l’incident.',
    description: 'Une observation utile ne remonte pas seulement des chiffres : elle relie les signaux à un contexte et donne une direction quand la pression monte.',
    tools: 'Prometheus · Grafana · Zabbix · Nagios',
    icon: Activity,
  },
  {
    number: '04',
    title: 'Infrastructure',
    short: 'Préparer la continuité.',
    description: 'Concevoir des briques qui absorbent la panne : clustering, réplication, stockage partagé et virtualisation au service de la continuité.',
    tools: 'WSFC · Storage Replica · iSCSI · SAN · Docker',
    icon: ShieldCheck,
  },
  {
    number: '05',
    title: 'Développement',
    short: 'Automatiser ce qui se répète.',
    description: 'Le code comme un levier d’exploitation : scripts, interfaces et services pour supprimer les gestes manuels et rapprocher les équipes.',
    tools: 'Node.js · React · Laravel · Django · MySQL',
    icon: Terminal,
  },
];

const stackGroups = [
  { label: 'Fondations', items: ['Windows Server', 'Linux / Ubuntu', 'Active Directory'] },
  { label: 'Connectivité', items: ['TCP/IP · DHCP · DNS', 'VLAN · VPN', 'FortiGate'] },
  { label: 'Observabilité', items: ['Prometheus', 'Grafana', 'Zabbix'] },
  { label: 'Automatisation', items: ['PowerShell', 'Node.js · React', 'Docker'] },
];

const fieldNotes = [
  {
    number: '01',
    label: 'Transmission',
    title: 'Rendre le complexe lisible.',
    description: 'Présenter, documenter et transmettre : une infrastructure devient solide quand elle peut être comprise par toute une équipe.',
    image: seatedPresentationImage,
    className: 'field-note-large',
  },
  {
    number: '02',
    label: 'Méthode',
    title: 'Observer avant d’agir.',
    description: 'Chaque décision technique commence par le contexte, les contraintes et une lecture précise du terrain.',
    image: writingPresentationImage,
    className: 'field-note-tall',
  },
];

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionKicker({ index, children, dark = false }: { index: string; children: ReactNode; dark?: boolean }) {
  return (
    <div className={`section-kicker ${dark ? 'section-kicker-dark' : ''}`}>
      <span>{index}</span>
      <span className="kicker-line" />
      <span>{children}</span>
    </div>
  );
}

function Home() {
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
        icon: [Server, Network, Activity, ShieldCheck, Terminal][index % 5],
      }));
  const publicExpertise = cmsExpertise.length > 0
    ? [...cmsExpertise, ...expertise].slice(0, 4)
    : expertise.slice(0, 4);
  const publicStackGroups = cmsData.technologies.length > 0
    ? cmsData.technologies.reduce<{ label: string; items: string[] }[]>((groups, item) => {
        const label = String(item.data.category ?? 'Technologies');
        const group = groups.find((candidate) => candidate.label === label);
        if (group) group.items.push(item.title);
        else groups.push({ label, items: [item.title] });
        return groups;
      }, [])
    : stackGroups;
  const publicProjects = cmsData.projects.slice().sort((first, second) => second.id - first.id).slice(0, 3);
  const publicSocials = cmsData.socials.filter((item) => typeof item.data.url === 'string' && item.data.url.trim().length > 0);
  const socialIcons = { github: Github, linkedin: Linkedin, instagram: Instagram, website: Globe2 };

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
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== 'idle') setStatus('idle');
  };

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: ContactErrors = {};
    if (form.nom.trim().length < 2) nextErrors.nom = 'Indiquez votre nom.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Indiquez une adresse e-mail valide.';
    if (form.sujet.trim().length < 3) nextErrors.sujet = 'Ajoutez un sujet.';
    if (form.message.trim().length < 12) nextErrors.message = 'Décrivez votre contexte en quelques mots.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/contact`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(details?.error ?? 'Contact request failed');
      }
      setStatus('success');
    } catch (error) {
      setErrors({ message: error instanceof Error ? error.message : 'Envoi impossible pour le moment.' });
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
      <header className="site-header">
        <a href="#top" className="brand-lockup" onClick={closeMenu} data-testid="link-home">
          <span className="brand-logo"><img src={brandLogo} alt="Landry Net" /></span>
          <span className="brand-wordmark">LANDRY <b>NET</b></span>
        </a>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {navItems.map((item, index) => (
            <a key={item.href} href={item.href} data-testid={`link-nav-${index}`}>{item.label}<sup>0{index + 1}</sup></a>
          ))}
        </nav>
        <a href="#contact" className="header-contact" data-testid="link-header-contact">
          <span>Parlons projet</span><ArrowUpRight size={16} />
        </a>
        <button type="button" className="menu-toggle" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} data-testid="button-menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {menuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-top"><span>Navigation</span><span>LK / 01</span></div>
            <nav aria-label="Navigation mobile">
              {[...navItems, { label: 'Contact', href: '#contact' }].map((item, index) => (
                <a key={item.href} href={item.href} onClick={closeMenu} data-testid={`link-mobile-${index}`}>
                  <span>0{index + 1}</span>{item.label}<ArrowUpRight size={18} />
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          <div className="hero-inner shell">
            <div className="hero-copy">
              <Reveal><p className="eyebrow">Landry Kayoyo <span>/</span> Administrateur IT</p></Reveal>
              <Reveal delay={0.08}><h1 id="hero-title">La fiabilité<br /><em>se construit.</em></h1></Reveal>
              <Reveal delay={0.16}>
                <p className="hero-intro">Je relie systèmes, réseaux et code pour bâtir des infrastructures qui restent lisibles, observables et disponibles.</p>
              </Reveal>
              <Reveal delay={0.24} className="hero-actions">
                <a href="#terrain" className="button button-accent" data-testid="link-hero-terrain">Voir mon approche <ArrowDownRight size={17} /></a>
                <a href="#about" className="text-link" data-testid="link-hero-about">Mon approche <ChevronRight size={16} /></a>
              </Reveal>
              <Reveal delay={0.3} className="hero-footnote">
                <span className="status-dot" /> Disponible pour des environnements à structurer
              </Reveal>
            </div>
            <Reveal delay={0.15} className="hero-visual">
              <div className="visual-index">01 <span>—</span> 05</div>
              <div className="portrait-card">
                <img src={presentationImage} alt="Landry Kayoyo lors d'une présentation technique" width="900" height="1169" fetchPriority="high" decoding="async" />
                <div className="portrait-overlay" />
                <div className="portrait-note"><span>LANDRY / NET</span><small>Architecture & exploitation</small></div>
                <div className="visual-stamp"><Cpu size={15} /><span>IT<br />SYSTEMS</span></div>
              </div>
              <div className="visual-caption">Lubumbashi, RDC <span>—</span> 2025</div>
            </Reveal>
          </div>
          <a href="#about" className="scroll-note" data-testid="link-scroll-about"><span>Défiler pour explorer</span><ChevronDown size={16} /></a>
        </section>

        <section id="about" className="about-section section-dark">
          <div className="shell about-layout">
            <Reveal><SectionKicker index="01">À propos</SectionKicker></Reveal>
            <Reveal delay={0.08} className="about-main">
              <h2>Un bon système<br /><span>se laisse comprendre.</span></h2>
              <div className="about-columns">
                <p className="lead-copy">Je travaille au point de rencontre entre l’exploitation quotidienne et les décisions qui engagent une infrastructure.</p>
                <div className="body-copy">
                  <p>Mon rôle : clarifier les dépendances, réduire les angles morts et mettre en place des bases qui tiennent dans la durée — avant qu’un incident ne les rende visibles.</p>
                  <a href="/a-propos" className="text-link text-link-light" data-testid="link-about-page">En savoir plus sur mon approche <ArrowUpRight size={16} /></a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="expertise" className="expertise-section section-paper">
          <div className="shell">
            <Reveal className="section-heading">
              <div><SectionKicker index="02">Champ d’action</SectionKicker><h2>Les systèmes<br /><em>en profondeur.</em></h2></div>
              <div className="section-heading-aside"><p>Une pratique transversale, du paquet réseau à l’interface d’exploitation.</p><a className="page-inline-link" href="/a-propos#technologies">Voir plus <ArrowUpRight size={16} /></a></div>
            </Reveal>
            <div className="expertise-layout expertise-layout-list-only">
              <div className="expertise-list" role="list">
                {publicExpertise.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Reveal key={item.number} delay={index * 0.04}>
                      <a className="expertise-item" href="/a-propos#competences" data-testid={`link-expertise-${index}`}>
                        <span className="expertise-item-number">{item.number}</span>
                        <span className="expertise-item-title">{item.title}</span>
                        <span className="expertise-item-short">{item.short}</span>
                        <Icon size={19} strokeWidth={1.4} />
                      </a>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {publicProjects.length > 0 && (
          <section id="publications" className="publications-section section-paper">
            <div className="shell">
              <Reveal className="section-heading">
                <div><SectionKicker index="03">Publications</SectionKicker><h2>Les projets<br /><em>en pratique.</em></h2></div>
                <p>Retrouvez les projets publiés depuis l’espace d’administration.</p>
              </Reveal>
              <div className="publication-grid">
                {publicProjects.map((project, index) => (
                  <Reveal key={project.id} delay={index * 0.06} className="publication-card">
                    <a href={`/publication/${project.id}`}>
                      <span className="publication-number">0{index + 1}</span>
                      <span className="publication-title">{project.title}</span>
                      <span className="publication-summary">{String(project.data.description ?? 'Publication à découvrir.')}</span>
                      <span className="publication-link">Voir le détail <ArrowUpRight size={16} /></span>
                    </a>
                  </Reveal>
                ))}
              </div>
              <a className="page-inline-link" href="/projets">Voir tous les projets <ArrowUpRight size={16} /></a>
            </div>
          </section>
        )}

        <section className="stack-section section-dark">
          <div className="shell">
            <Reveal className="stack-heading"><SectionKicker index="04">Boîte à outils</SectionKicker><h2>Les bons outils.<br /><em>Au bon moment.</em></h2><a className="page-inline-link page-inline-link-light" href="/a-propos#technologies">Voir toutes les technologies <ArrowUpRight size={16} /></a></Reveal>
            <div className="stack-grid">
              {publicStackGroups.map((group, index) => (
                <Reveal key={group.label} delay={index * 0.06} className="stack-group">
                  <span className="stack-index">0{index + 1}</span><h3>{group.label}</h3>
                  <ul>{group.items.map((item) => <li key={item}><span />{item}</li>)}</ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="terrain" className="terrain-section section-paper">
          <div className="shell">
              <Reveal className="terrain-heading">
              <div><SectionKicker index="05">Sur le terrain</SectionKicker><h2>La technique<br /><em>reste humaine.</em></h2></div>
              <p>Une présence professionnelle, entre transmission, observation et action. Ces images racontent la manière dont je travaille : avec précision, curiosité et sens du collectif.</p>
            </Reveal>
            <div className="field-notes">
              {fieldNotes.map((note, index) => (
                <Reveal key={note.number} delay={index * 0.06} className={`field-note ${note.className}`}>
                  <figure>
                    <img src={note.image} alt={note.title} width="1200" height="800" loading="lazy" decoding="async" />
                    <figcaption><span>{note.number} / {note.label}</span><strong>{note.title}</strong></figcaption>
                  </figure>
                  <p>{note.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="parcours" className="path-section section-paper">
          <div className="shell path-layout">
            <Reveal><SectionKicker index="06">Parcours</SectionKicker><h2>Apprendre<br /><em>en construisant.</em></h2></Reveal>
            <Reveal delay={0.1} className="path-content">
              <div className="path-marker"><span>2023</span><i /></div>
              <div className="path-copy"><span className="path-type">Formation supérieure</span><h3>Administration<br />Systèmes & Réseaux</h3><p>Université Don Bosco de Lubumbashi</p><small>Projet de fin de cycle — mise en place d’une haute disponibilité des services au moyen d’un cluster étendu.</small></div>
              <div className="diploma-card"><img src={diplomaImage} alt="Landry Kayoyo lors de sa remise de diplôme" width="700" height="850" loading="lazy" decoding="async" /><div><span>COLLATION<br />DES GRADES</span><strong>UDBL / 2023</strong></div></div>
            </Reveal>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="shell contact-layout">
            <Reveal><SectionKicker index="07" dark>Contact</SectionKicker><h2>Un système<br /><em>à structurer ?</em></h2><p className="contact-copy">Décrivez le contexte, le niveau d’urgence et ce qui doit rester debout. La première réponse commence ici.</p><div className="contact-direct"><span>Écrire directement</span><a href="mailto:hello@landrynet.dev" data-testid="link-email">hello@landrynet.dev <ArrowUpRight size={15} /></a></div></Reveal>
            <Reveal delay={0.12}>
              {status === 'success' ? (
                <div className="contact-success" role="status" aria-live="polite" data-testid="status-contact-success"><CheckCircle2 size={26} /><span>Message enregistré</span><h3>Le contexte est posé.</h3><p>Votre brouillon est conservé sur cet appareil. Merci pour la clarté — c’est déjà un bon début de projet.</p><button type="button" className="button button-outline" onClick={resetForm} data-testid="button-reset-contact">Écrire un autre message <ArrowUpRight size={16} /></button></div>
              ) : (
                <form className="contact-form" onSubmit={submitContact} noValidate>
                  {status === 'error' && Object.keys(errors).length > 0 && <div className="form-error" role="alert" data-testid="status-contact-error">Quelques champs demandent votre attention.</div>}
                  <div className="form-row">
                    <label><span>Votre nom</span><input data-testid="input-contact-name" value={form.nom} onChange={(event) => updateField('nom', event.target.value)} aria-invalid={Boolean(errors.nom)} placeholder="Nom et prénom" />{errors.nom && <small>{errors.nom}</small>}</label>
                    <label><span>E-mail</span><input data-testid="input-contact-email" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(errors.email)} placeholder="vous@exemple.com" />{errors.email && <small>{errors.email}</small>}</label>
                  </div>
                  <label><span>Sujet</span><input data-testid="input-contact-subject" value={form.sujet} onChange={(event) => updateField('sujet', event.target.value)} aria-invalid={Boolean(errors.sujet)} placeholder="Infrastructure, réseau, automatisation..." />{errors.sujet && <small>{errors.sujet}</small>}</label>
                  <label><span>Contexte</span><textarea data-testid="input-contact-message" rows={5} value={form.message} onChange={(event) => updateField('message', event.target.value)} aria-invalid={Boolean(errors.message)} placeholder="Ce qui existe, ce qui bloque, ce qui doit changer..." />{errors.message && <small>{errors.message}</small>}</label>
                  <button type="submit" className="button button-accent form-submit" disabled={status === 'loading'} data-testid="button-submit-contact">{status === 'loading' ? 'Enregistrement…' : 'Envoyer le contexte'}<Send size={16} /></button>
                </form>
              )}
            </Reveal>
          </div>
        </section>
      </main>


      <footer className="site-footer">
        <div className="shell footer-top">
          <div className="footer-availability"><span className="status-dot status-dot-blue" /> Disponible pour des environnements à structurer</div>
          <nav className="footer-nav" aria-label="Navigation du pied de page">{navItems.slice(0, 4).map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
        </div>
        <div className="shell footer-inner">
          <a href="#top" className="footer-brand" data-testid="link-footer-home"><img src={brandLogo} alt="" width="40" height="40" loading="lazy" decoding="async" />LANDRY NET</a>
          <div className="footer-context"><span>Architecture IT / systèmes / réseaux</span><span>Lubumbashi, RDC</span></div>
          {publicSocials.length > 0 && <nav className="footer-socials" aria-label="Réseaux sociaux">{publicSocials.map((social) => { const label = social.title.replace(/^\[TEST\]\s*/i, ''); const key = String(social.data.icon ?? label).toLowerCase(); const Icon = Object.entries(socialIcons).find(([name]) => key.includes(name))?.[1] ?? ExternalLink; return <a key={social.id} href={String(social.data.url)} target="_blank" rel="noreferrer" aria-label={label} title={label}><Icon size={15} /><span>{label}</span></a>; })}</nav>}
          <div className="footer-end"><span>© {new Date().getFullYear()} Landry Kayoyo</span><a href="#top" className="footer-back" aria-label="Retour en haut" title="Retour en haut" data-testid="link-footer-top"><ArrowUp size={17} /></a></div>
        </div>
      </footer>
    </div>
  );
}

function PublicationPage() {
  const [, params] = useRoute('/publication/:id');
  const [project, setProject] = useState<PublicCmsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/content`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: PublicCmsData | null) => {
        const match = data?.projects.find((item) => String(item.id) === params?.id);
        setProject(match ?? null);
      })
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <main className="publication-page publication-page-state">Chargement de la publication...</main>;
  if (!project) return <main className="publication-page publication-page-state"><h1>Publication introuvable</h1><a className="button button-accent" href="/#publications">Retour aux publications <ArrowUpRight size={16} /></a></main>;

  return <main className="publication-page">
    <header className="publication-page-header"><a className="publication-back" href="/#publications"><ArrowDownRight size={16} /> Retour aux publications</a><span className="publication-page-index">PUBLICATION / {String(project.id).padStart(2, '0')}</span></header>
    <section className="publication-page-hero"><SectionKicker index="03">Publication détaillée</SectionKicker><h1>{project.title}</h1><p className="publication-page-lead">{String(project.data.description ?? '')}</p></section>
    <section className="publication-page-body">
      {typeof project.data.context === 'string' && <div className="publication-page-block"><span>Contexte</span><p>{project.data.context}</p></div>}
      {typeof project.data.details === 'string' && <div className="publication-page-block"><span>Détails</span><p>{project.data.details}</p></div>}
      {typeof project.data.technologies === 'string' && <div className="publication-page-block"><span>Technologies</span><p>{project.data.technologies}</p></div>}
      {typeof project.data.category === 'string' && <div className="publication-page-block"><span>Catégorie</span><p>{project.data.category}</p></div>}
    </section>
  </main>;
}

function AboutPage() {
  const data = usePublicCmsData();

  useEffect(() => {
    if (window.location.hash !== '#competences') return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('competences')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const allSkills = data.skills.length > 0
    ? [...data.skills, ...expertise.slice(data.skills.length).map((item) => ({
        id: Number(item.number) + 100,
        title: item.title,
        data: { description: item.description, tools: item.tools, category: item.title },
        sortOrder: Number(item.number),
      }))]
    : expertise.map((item) => ({
        id: Number(item.number),
        title: item.title,
        data: { description: item.description, tools: item.tools, category: item.title },
        sortOrder: Number(item.number),
      }));
  const skillGroups = allSkills.length > 0
    ? allSkills.reduce<{ label: string; items: PublicCmsItem[] }[]>((result, item) => {
        const label = String(item.data.category ?? 'Compétences');
        const group = result.find((candidate) => candidate.label === label);
        if (group) group.items.push(item);
        else result.push({ label, items: [item] });
        return result;
      }, [])
    : [];
  const groups = data.technologies.length > 0
    ? data.technologies.reduce<{ label: string; items: PublicCmsItem[] }[]>((result, item) => {
        const label = String(item.data.category ?? 'Technologies');
        const group = result.find((candidate) => candidate.label === label);
        if (group) group.items.push(item);
        else result.push({ label, items: [item] });
        return result;
      }, [])
    : stackGroups.map((group) => ({ label: group.label, items: group.items.map((title, index) => ({ id: index, title, data: {} as Record<string, unknown>, sortOrder: index })) }));

  return <main className="collection-page about-page">
    <header className="collection-header"><a className="publication-back" href="/#about"><ArrowDownRight size={16} /> Retour au portfolio</a><span>LANDRY / NET</span></header>
    <section className="about-page-hero"><div><SectionKicker index="01">À propos de moi</SectionKicker><h1>Landry Kayoyo<br /><em>Landry Net.</em></h1><p>Administrateur systèmes et réseaux, je travaille au point de rencontre entre l’exploitation quotidienne et les décisions qui engagent une infrastructure.</p></div><img src={profileImage} alt="Portrait de Landry Kayoyo" width="900" height="1200" fetchPriority="high" decoding="async" /></section>
    <section className="about-page-content"><div><span>Ma manière de travailler</span><h2>Clarifier.<br />Structurer.<br /><em>Sécuriser.</em></h2></div><div><p>Mon rôle est de clarifier les dépendances, réduire les angles morts et mettre en place des bases qui tiennent dans la durée.</p><p>Je m’intéresse aux systèmes, aux réseaux, à l’observabilité, à la haute disponibilité et au développement comme levier d’exploitation.</p></div></section>
    <section id="competences" className="about-skills"><div className="about-technologies-heading"><SectionKicker index="02">Compétences</SectionKicker><h2>Ce que je peux<br /><em>structurer.</em></h2><p>Une présentation synthétique des compétences, sans niveau inventé ni détail artificiel.</p></div><div className="skill-groups">{skillGroups.map((group) => <article className="skill-group" key={group.label}><h3>{group.label}</h3><ul>{group.items.map((item) => <li key={item.id}><strong>{item.title}</strong>{typeof item.data.description === 'string' && <p>{item.data.description}</p>}</li>)}</ul></article>)}</div></section>
    <section id="technologies" className="about-technologies"><div className="about-technologies-heading"><SectionKicker index="03">Boîte à outils</SectionKicker><h2>Les technologies<br /><em>que j’utilise.</em></h2><p>Une sélection organisée des outils qui accompagnent les systèmes, les réseaux, l’observabilité et le développement.</p></div><div className="technology-groups">{groups.map((group, index) => <article className="technology-group" key={group.label}><span>0{index + 1}</span><h3>{group.label}</h3><ul>{group.items.map((item) => <li key={item.id}><strong>{item.title}</strong>{typeof item.data.description === 'string' && <p>{item.data.description}</p>}</li>)}</ul></article>)}</div></section>
  </main>;
}

function ProjectsPage() {
  const data = usePublicCmsData();
  return <main className="collection-page"><header className="collection-header"><a className="publication-back" href="/#publications"><ArrowDownRight size={16} /> Retour au portfolio</a><span>LANDRY / NET</span></header><section className="collection-hero collection-hero-projects"><SectionKicker index="03">Publications</SectionKicker><h1>Tous les projets<br /><em>en pratique.</em></h1><p>Les projets publiés depuis l’espace d’administration, présentés avec leur contexte et leurs technologies.</p></section><section className="project-list">{data.projects.length === 0 ? <p className="collection-empty">Aucun projet publié pour le moment.</p> : data.projects.map((project, index) => <a className="project-list-item" href={`/publication/${project.id}`} key={project.id}><span>0{index + 1}</span><div><h2>{project.title}</h2><p>{String(project.data.description ?? '')}</p></div><ArrowUpRight size={21} /></a>)}</section></main>;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/a-propos" component={AboutPage} /><Route path="/projets" component={ProjectsPage} /><Route path="/publication/:id" component={PublicationPage} /><Route component={NotFound} /></Switch>;
}

function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ErrorBoundary><Router /></ErrorBoundary>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;