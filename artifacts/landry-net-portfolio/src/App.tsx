import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Menu,
  Network,
  Send,
  Server,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import brandLogo from '@assets/web-app-manifest-512x512_1789029553744.png';
import presentationImage from '@assets/IMG_7917.JPG_1789029578939.jpeg';
import diplomaImage from '@assets/WhatsApp_Image_2026-08-08_at_15.31.48_(1)_1789029615897.jpeg';
import seatedPresentationImage from '@assets/IMG_7913.JPG_1789030226227.jpeg';
import writingPresentationImage from '@assets/IMG_7934.JPG_1789030226229.jpeg';
import celebrationImage from '@assets/IMG_7942.JPG_1789030226230.jpeg';
import portraitCelebrationImage from '@assets/IMG_7944.JPG_1789030226232.jpeg';

const queryClient = new QueryClient();

type FormStatus = 'idle' | 'loading' | 'success' | 'error';
type ContactFields = { nom: string; email: string; sujet: string; message: string };
type ContactErrors = Partial<Record<keyof ContactFields, string>>;

const navItems = [
  { label: 'À propos', href: '#about' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Terrain', href: '#terrain' },
  { label: 'Parcours', href: '#parcours' },
];

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
  {
    number: '03',
    label: 'Collectif',
    title: 'Construire avec les autres.',
    description: 'La technique prend sa valeur quand elle soutient les personnes, les usages et les objectifs du quotidien.',
    image: celebrationImage,
    className: 'field-note-wide',
  },
  {
    number: '04',
    label: 'Présence',
    title: 'Rester proche du réel.',
    description: 'Une pratique professionnelle se mesure dans l’action : écouter, ajuster et laisser derrière soi une base plus claire.',
    image: portraitCelebrationImage,
    className: 'field-note-portrait',
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
  const [activeExpertise, setActiveExpertise] = useState(0);
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
    if (form.message.trim().length < 12) nextErrors.message = 'Décrivez votre contexte en quelques mots.';
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
    }, 550);
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
                <img src={presentationImage} alt="Landry Kayoyo lors d'une présentation technique" />
                <div className="portrait-overlay" />
                <div className="portrait-note"><span>LANDRY / NET</span><small>Architecture & exploitation</small></div>
              </div>
              <div className="visual-stamp"><Cpu size={15} /><span>IT<br />SYSTEMS</span></div>
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
                  <a href="#expertise" className="text-link text-link-light" data-testid="link-about-expertise">Découvrir les expertises <ArrowDownRight size={16} /></a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.14} className="about-aside">
              <div className="aside-number">01<span>/</span>03</div>
              <div className="aside-rule" />
              <p>Observer.<br /><em>Structurer.</em><br />Sécuriser.</p>
            </Reveal>
          </div>
        </section>

        <section id="expertise" className="expertise-section section-paper">
          <div className="shell">
            <Reveal className="section-heading">
              <div><SectionKicker index="02">Champ d’action</SectionKicker><h2>Les systèmes<br /><em>en profondeur.</em></h2></div>
              <p>Une pratique transversale, du paquet réseau à l’interface d’exploitation.</p>
            </Reveal>
            <div className="expertise-layout">
              <div className="expertise-list" role="list">
                {expertise.map((item, index) => {
                  const Icon = item.icon;
                  const active = index === activeExpertise;
                  return (
                    <Reveal key={item.number} delay={index * 0.04}>
                      <button type="button" className={`expertise-item ${active ? 'is-active' : ''}`} onClick={() => setActiveExpertise(index)} aria-expanded={active} data-testid={`button-expertise-${index}`}>
                        <span className="expertise-item-number">{item.number}</span>
                        <span className="expertise-item-title">{item.title}</span>
                        <span className="expertise-item-short">{item.short}</span>
                        <Icon size={19} strokeWidth={1.4} />
                      </button>
                    </Reveal>
                  );
                })}
              </div>
              <Reveal className="expertise-detail">
                <div className="detail-top">
                  <span>DOMAINE / {expertise[activeExpertise].number}</span>
                  {(() => {
                    const ActiveIcon = expertise[activeExpertise].icon;
                    return <ActiveIcon size={26} />;
                  })()}
                </div>
                <h3>{expertise[activeExpertise].title}</h3>
                <p>{expertise[activeExpertise].description}</p>
                <div className="detail-tools"><span>Écosystème</span><strong>{expertise[activeExpertise].tools}</strong></div>
                <div className="detail-corner">LANDRY<br />NET</div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="stack-section section-dark">
          <div className="shell">
            <Reveal className="stack-heading"><SectionKicker index="03">Boîte à outils</SectionKicker><h2>Peu d’outils.<br /><em>Bien choisis.</em></h2></Reveal>
            <div className="stack-grid">
              {stackGroups.map((group, index) => (
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
              <div><SectionKicker index="04">Sur le terrain</SectionKicker><h2>La technique<br /><em>reste humaine.</em></h2></div>
              <p>Une présence professionnelle, entre transmission, observation et action. Ces images racontent la manière dont je travaille : avec précision, curiosité et sens du collectif.</p>
            </Reveal>
            <div className="field-notes">
              {fieldNotes.map((note, index) => (
                <Reveal key={note.number} delay={index * 0.06} className={`field-note ${note.className}`}>
                  <figure>
                    <img src={note.image} alt={note.title} loading={index === 0 ? 'eager' : 'lazy'} />
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
            <Reveal><SectionKicker index="05">Parcours</SectionKicker><h2>Apprendre<br /><em>en construisant.</em></h2></Reveal>
            <Reveal delay={0.1} className="path-content">
              <div className="path-marker"><span>2023</span><i /></div>
              <div className="path-copy"><span className="path-type">Formation supérieure</span><h3>Administration<br />Systèmes & Réseaux</h3><p>Université Don Bosco de Lubumbashi</p><small>Projet de fin de cycle — mise en place d’une haute disponibilité des services au moyen d’un cluster étendu.</small></div>
              <div className="diploma-card"><img src={diplomaImage} alt="Landry Kayoyo lors de sa remise de diplôme" /><div><span>COLLATION<br />DES GRADES</span><strong>UDBL / 2023</strong></div></div>
            </Reveal>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="shell contact-layout">
            <Reveal><SectionKicker index="06" dark>Contact</SectionKicker><h2>Un système<br /><em>à structurer ?</em></h2><p className="contact-copy">Décrivez le contexte, le niveau d’urgence et ce qui doit rester debout. La première réponse commence ici.</p><div className="contact-direct"><span>Écrire directement</span><a href="mailto:hello@landrynet.dev" data-testid="link-email">hello@landrynet.dev <ArrowUpRight size={15} /></a></div></Reveal>
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
        <div className="shell footer-inner"><a href="#top" className="footer-brand" data-testid="link-footer-home"><img src={brandLogo} alt="" />LANDRY NET</a><span>Architecture IT / systèmes / réseaux</span><a href="#top" className="footer-back" data-testid="link-footer-top">Retour en haut <ArrowUpRight size={14} /></a></div>
      </footer>
    </div>
  );
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ErrorBoundary><Router /></ErrorBoundary>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;