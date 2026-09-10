import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Menu,
  Send,
  X,
} from 'lucide-react';
import profileImage from '@assets/landry-kayoyo-profile.jpeg';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type FormStatus = 'idle' | 'loading' | 'success' | 'error';
type ContactFields = { nom: string; email: string; sujet: string; message: string };
type ContactErrors = Partial<Record<keyof ContactFields, string>>;

const navItems = [
  { label: 'À propos', href: '#about' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Projet', href: '#project' },
  { label: 'Parcours', href: '#parcours' },
  { label: 'Contact', href: '#contact' },
];

const expertise = [
  {
    number: '01',
    title: 'Systèmes',
    description: 'Administration et structuration d’environnements Windows Server et Linux.',
    tools: 'Active Directory · services réseau · haute disponibilité',
  },
  {
    number: '02',
    title: 'Réseaux',
    description: 'Conception et administration de réseaux lisibles, stables et sécurisés.',
    tools: 'TCP/IP · DHCP · DNS · VLAN · VPN · FortiGate · GNS3',
  },
  {
    number: '03',
    title: 'Monitoring',
    description: 'Observer les ressources, comprendre les signaux et anticiper les incidents.',
    tools: 'Prometheus · Grafana · Windows Exporter · Zabbix · Nagios',
  },
  {
    number: '04',
    title: 'Infrastructure',
    description: 'Faire évoluer les services avec des briques d’infrastructure cohérentes.',
    tools: 'WSFC · Storage Replica · iSCSI · SAN · virtualisation · Docker',
  },
  {
    number: '05',
    title: 'Développement',
    description: 'Utiliser le code pour automatiser, relier et mieux comprendre les systèmes.',
    tools: 'Node.js · React · React Native · Laravel · Django · PHP · MySQL · MariaDB',
  },
];

const technologyGroups = [
  { label: 'Systèmes', items: ['Windows Server', 'Linux / Ubuntu Server', 'Active Directory'] },
  { label: 'Réseaux', items: ['TCP/IP', 'DHCP', 'DNS', 'VLAN', 'VPN', 'FortiGate', 'GNS3'] },
  { label: 'Monitoring', items: ['Prometheus', 'Grafana', 'Windows Exporter', 'Zabbix', 'Nagios'] },
  { label: 'Infrastructure', items: ['WSFC', 'Storage Replica', 'iSCSI', 'SAN', 'Virtualisation', 'Docker'] },
  { label: 'Développement', items: ['Node.js', 'React', 'React Native', 'Laravel', 'Django', 'PHP', 'MySQL', 'MariaDB'] },
];

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.65, delay, ease: [0.21, 0.72, 0.31, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<ContactFields>({ nom: '', email: '', sujet: '', message: '' });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');

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

  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: ContactErrors = {};

    if (form.nom.trim().length < 2) nextErrors.nom = 'Indiquez votre nom.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Indiquez une adresse e-mail valide.';
    if (form.sujet.trim().length < 3) nextErrors.sujet = 'Ajoutez un sujet.';
    if (form.message.trim().length < 12) nextErrors.message = 'Votre message doit contenir au moins 12 caractères.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('error');
      return;
    }

    setStatus('loading');
    window.setTimeout(() => {
      try {
        window.localStorage.setItem('landry-contact-draft', JSON.stringify({ ...form, savedAt: new Date().toISOString() }));
        setStatus('success');
      } catch {
        setStatus('error');
      }
    }, 500);
  };

  const resetForm = () => {
    setForm({ nom: '', email: '', sujet: '', message: '' });
    setErrors({});
    setStatus('idle');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <header className="site-header">
        <div className="shell flex h-[76px] items-center justify-between">
          <a href="#top" onClick={closeMenu} className="brand" aria-label="Retour à l'accueil">
            <span className="brand-mark">LK</span>
            <span>Landry<span className="brand-dot">.</span>Net</span>
          </a>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="nav-link">{item.label}</a>
            ))}
          </nav>

          <a href="#contact" className="header-cta hidden md:inline-flex">
            Me contacter <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            className="menu-button md:hidden"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu md:hidden">
            <nav className="shell flex flex-col" aria-label="Navigation mobile">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={closeMenu} className="mobile-link">
                  {item.label}
                  <ArrowUpRight className="h-4 w-4 text-primary" />
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-glow" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <Reveal>
                <SectionLabel>Landry Kayoyo — Landry Net</SectionLabel>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="hero-title">
                  Des systèmes<br />
                  <span>qui tiennent.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="hero-lead">
                  Administrateur systèmes et réseaux, je conçois, déploie et administre des infrastructures fiables, performantes et sécurisées.
                </p>
              </Reveal>
              <Reveal delay={0.24} className="hero-actions">
                <a href="#project" className="button-primary">
                  Voir le projet <ArrowDownRight className="h-4 w-4" />
                </a>
                <a href="#about" className="button-link">
                  Découvrir le parcours <ArrowDownRight className="h-4 w-4" />
                </a>
              </Reveal>
            </div>

            <Reveal delay={0.12} className="hero-portrait-wrap">
              <div className="portrait-frame">
                <img src={profileImage} alt="Landry Kayoyo lors d'une présentation technique" className="portrait-image" />
                <div className="portrait-shade" />
                <div className="portrait-caption">
                  <span>Landry Kayoyo</span>
                  <small>Administration systèmes & réseaux</small>
                </div>
              </div>
              <div className="portrait-index">01 / 05</div>
            </Reveal>
          </div>
          <a href="#about" className="scroll-cue">
            <span>Défiler</span>
            <ChevronDown className="h-4 w-4" />
          </a>
        </section>

        <section id="about" className="section-dark">
          <div className="shell about-grid">
            <Reveal>
              <SectionLabel>01 — À propos</SectionLabel>
              <h2 className="display-heading">Comprendre avant<br /><em>d’administrer.</em></h2>
            </Reveal>
            <Reveal delay={0.1} className="about-copy">
              <p className="large-copy">Je m’intéresse aux systèmes qui doivent rester fiables, même quand personne ne les regarde.</p>
              <p>Mon approche relie administration, réseau, infrastructure et sécurité. Chaque environnement mérite d’être compris dans son ensemble : ses dépendances, ses points de rupture et les choix qui le rendent plus clair.</p>
              <div className="about-detail">
                <div>
                  <span className="detail-label">Formation</span>
                  <strong>Administration Systèmes & Réseaux</strong>
                  <small>Université Don Bosco de Lubumbashi</small>
                </div>
                <div>
                  <span className="detail-label">Méthode</span>
                  <strong>Observer. Structurer. Sécuriser.</strong>
                  <small>Une base claire avant chaque décision technique.</small>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="expertise" className="section-light">
          <div className="shell">
            <Reveal className="section-intro">
              <div>
                <SectionLabel>02 — Expertise</SectionLabel>
                <h2 className="display-heading">Une pratique<br /><em>transversale.</em></h2>
              </div>
              <p>Des compétences qui se complètent pour construire des environnements lisibles et durables.</p>
            </Reveal>

            <div className="expertise-list">
              {expertise.map((item, index) => (
                <Reveal key={item.number} delay={index * 0.04}>
                  <article className="expertise-row">
                    <span className="expertise-number">{item.number}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <span className="expertise-tools">{item.tools}</span>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="project" className="project-section">
          <div className="project-orbit project-orbit-one" />
          <div className="project-orbit project-orbit-two" />
          <div className="shell">
            <Reveal>
              <SectionLabel>03 — Projet sélectionné</SectionLabel>
            </Reveal>
            <div className="project-grid">
              <Reveal delay={0.08}>
                <h2 className="project-title">Haute disponibilité<br /><span>Windows Server.</span></h2>
              </Reveal>
              <Reveal delay={0.16} className="project-summary">
                <p>Projet de fin de cycle consacré à la mise en place d’une haute disponibilité des services au moyen d’un cluster étendu.</p>
                <p>Réflexion menée dans le contexte de la CNSS, autour d’une architecture multi-sites Kinshasa — Lubumbashi.</p>
                <a href="#contact" className="project-link">Échanger sur le projet <ArrowUpRight className="h-4 w-4" /></a>
              </Reveal>
            </div>
            <Reveal delay={0.2} className="project-meta">
              <div><span>Technologies</span><strong>WSFC · Storage Replica · iSCSI · SAN · PowerShell</strong></div>
              <div><span>Focus</span><strong>Réplication · continuité de service · infrastructure</strong></div>
            </Reveal>
          </div>
        </section>

        <section className="section-dark technology-section">
          <div className="shell">
            <Reveal className="section-intro section-intro-dark">
              <div>
                <SectionLabel>Technologies</SectionLabel>
                <h2 className="display-heading">Les outils<br /><em>du quotidien.</em></h2>
              </div>
              <p>Une sélection organisée par domaine, sans surévaluer le niveau d’expertise.</p>
            </Reveal>
            <div className="technology-grid">
              {technologyGroups.map((group) => (
                <Reveal key={group.label} className="technology-group">
                  <span className="detail-label">{group.label}</span>
                  <ul>
                    {group.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="parcours" className="section-light">
          <div className="shell about-grid">
            <Reveal>
              <SectionLabel>04 — Parcours</SectionLabel>
              <h2 className="display-heading">Apprendre en<br /><em>construisant.</em></h2>
            </Reveal>
            <Reveal delay={0.1} className="timeline">
              <span className="timeline-line" />
              <article className="timeline-entry">
                <span className="timeline-dot" />
                <span className="detail-label">Formation</span>
                <h3>Administration Systèmes & Réseaux</h3>
                <p>Université Don Bosco de Lubumbashi</p>
                <span className="timeline-project">Projet de fin de cycle — haute disponibilité avec cluster étendu Windows Server.</span>
              </article>
            </Reveal>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="shell contact-grid">
            <Reveal>
              <SectionLabel>05 — Contact</SectionLabel>
              <h2 className="display-heading">Un système à<br /><em>structurer ?</em></h2>
              <p className="contact-intro">Présentez le contexte. Un message clair est le meilleur point de départ pour une discussion utile.</p>
            </Reveal>
            <Reveal delay={0.1}>
              {status === 'success' ? (
                <div className="contact-success" role="status" aria-live="polite">
                  <CheckCircle2 className="h-7 w-7 text-primary" />
                  <h3>Brouillon enregistré.</h3>
                  <p>Votre message a été conservé sur cet appareil. Le canal de réception devra être configuré pour permettre un envoi réel.</p>
                  <button type="button" onClick={resetForm} className="button-outline">Écrire un autre message <ArrowUpRight className="h-4 w-4" /></button>
                </div>
              ) : (
                <form onSubmit={submitContact} noValidate className="contact-form">
                  {status === 'error' && Object.keys(errors).length > 0 && (
                    <div className="form-error" role="alert">Vérifiez les champs signalés avant de continuer.</div>
                  )}
                  <div className="form-row">
                    <label><span>Nom</span><input value={form.nom} onChange={(event) => updateField('nom', event.target.value)} aria-invalid={Boolean(errors.nom)} placeholder="Votre nom" />{errors.nom && <small>{errors.nom}</small>}</label>
                    <label><span>E-mail</span><input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(errors.email)} placeholder="vous@exemple.com" />{errors.email && <small>{errors.email}</small>}</label>
                  </div>
                  <label><span>Sujet</span><input value={form.sujet} onChange={(event) => updateField('sujet', event.target.value)} aria-invalid={Boolean(errors.sujet)} placeholder="Ce dont vous voulez parler" />{errors.sujet && <small>{errors.sujet}</small>}</label>
                  <label><span>Message</span><textarea value={form.message} onChange={(event) => updateField('message', event.target.value)} aria-invalid={Boolean(errors.message)} rows={5} placeholder="Quelques lignes de contexte..." />{errors.message && <small>{errors.message}</small>}</label>
                  <button type="submit" className="button-primary" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Enregistrement…' : 'Enregistrer le message'}
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Landry Kayoyo — Landry Net</span>
          <a href="#top">Retour en haut <ChevronDown className="h-3.5 w-3.5 rotate-180" /></a>
        </div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;