import { useEffect, useState, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowDownRight, ArrowUpRight, Boxes, CheckCircle2, ChevronDown, Cpu, GraduationCap, Menu, Network, Radar, Send, Server, ShieldCheck, Terminal, X } from 'lucide-react';
import profileImage from '@assets/landry-kayoyo-profile.jpeg';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { type ReactNode } from 'react';

const queryClient = new QueryClient();

type FormStatus = 'idle' | 'loading' | 'success' | 'error';
type ContactFields = { nom: string; email: string; sujet: string; message: string };
type ContactErrors = Partial<Record<keyof ContactFields, string>>;

const navItems = [
  { label: 'Accueil', href: '#top' },
  { label: 'À propos', href: '#about' },
  { label: 'Compétences', href: '#expertise' },
  { label: 'Projets', href: '#project' },
  { label: 'Parcours', href: '#parcours' },
  { label: 'Contact', href: '#contact' },
];

const expertise = [
  { icon: Server, number: '01', title: 'Systèmes', text: 'Windows Server, Linux / Ubuntu Server, Active Directory et services réseau.' },
  { icon: Network, number: '02', title: 'Réseaux', text: 'TCP/IP, DHCP, DNS, VLAN, VPN, FortiGate et GNS3 pour relier les services.' },
  { icon: Activity, number: '03', title: 'Observabilité', text: 'Prometheus, Grafana, Windows Exporter, Zabbix et Nagios pour suivre les signaux.' },
  { icon: Boxes, number: '04', title: 'Infrastructure', text: 'WSFC, Storage Replica, iSCSI, SAN, virtualisation et Docker.' },
  { icon: ShieldCheck, number: '05', title: 'Cybersécurité', text: 'Une approche défensive intégrée aux choix réseau et infrastructure.' },
  { icon: Terminal, number: '06', title: 'Développement', text: 'Node.js, React, React Native, Laravel, Django, PHP, MySQL et MariaDB.' },
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
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.65, delay, ease: [0.21, 0.72, 0.31, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<ContactFields>({ nom: '', email: '', sujet: '', message: '' });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
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
    window.setTimeout(() => setStatus('success'), 850);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.86)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 lg:px-10">
          <a href="#top" data-testid="link-brand" onClick={closeMenu} className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-primary/40 bg-primary text-sm font-bold text-primary-foreground shadow-[4px_4px_0_hsl(var(--accent))]">LK</span>
            <span className="font-display text-lg font-semibold tracking-tight">Landry<span className="text-primary">.Net</span></span>
          </a>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
            {navItems.map((item) => <a key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replace('à ', '')}`} className="font-mono-ui text-[11px] font-semibold uppercase text-muted-foreground transition-colors hover:text-primary">{item.label}</a>)}
          </nav>
          <a href="#contact" data-testid="link-header-contact" className="hidden items-center gap-2 border border-foreground/15 px-4 py-2 font-mono-ui text-[11px] font-semibold uppercase tracking-wider transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground sm:flex">
            Écrire à Landry <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <button type="button" data-testid="button-mobile-menu" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center border border-foreground/15 md:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-5 py-5 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
              {navItems.map((item, index) => <a key={item.href} href={item.href} onClick={closeMenu} data-testid={`link-mobile-nav-${index}`} className="border-b border-border/70 py-4 font-display text-2xl">{item.label}<span className="ml-2 text-primary">↗</span></a>)}
              <a href="#contact" onClick={closeMenu} data-testid="link-mobile-contact" className="mt-4 flex items-center justify-between bg-primary px-4 py-3 font-mono-ui text-xs uppercase text-primary-foreground">Démarrer une conversation <ArrowUpRight className="h-4 w-4" /></a>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative isolate flex min-h-[760px] items-center overflow-hidden border-b border-border pt-[72px]">
          <div className="pointer-events-none absolute inset-0 -z-10 section-grid opacity-60" />
          <div className="pointer-events-none absolute -right-32 top-24 -z-10 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1240px] items-center gap-16 px-5 py-20 lg:grid-cols-[1.06fr_.94fr] lg:px-10 lg:py-28">
            <div>
              <Reveal>
                <div className="mb-7 flex items-center gap-3 font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-primary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Systèmes · Réseaux · Fiabilité
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="max-w-3xl font-display text-[clamp(3.6rem,8vw,7.2rem)] font-semibold leading-[.91] tracking-[-.065em] text-balance">
                  La stabilité<br /><span className="text-primary">n’arrive pas</span><br />par hasard.
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="mt-9 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                  Landry Kayoyo, professionnellement <strong className="font-semibold text-foreground">Landry Net</strong>. Administrateur systèmes et réseaux, je construis des infrastructures lisibles, performantes et sécurisées.
                </p>
              </Reveal>
              <Reveal delay={0.24}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <a href="#project" data-testid="link-hero-project" className="group inline-flex items-center gap-3 bg-primary px-5 py-3.5 font-mono-ui text-xs font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:-translate-y-1">Voir le projet central <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" /></a>
                  <a href="#about" data-testid="link-hero-about" className="inline-flex items-center gap-2 px-2 py-3.5 font-mono-ui text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">En savoir plus <ArrowDownRight className="h-4 w-4" /></a>
                </div>
              </Reveal>
              <Reveal delay={0.32} className="mt-16">
                <div className="flex flex-wrap gap-x-8 gap-y-3 border-l-2 border-accent pl-4 font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Disponible pour échanger</span>
                  <span>Lubumbashi · RDC</span>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.16} className="relative mx-auto w-full max-w-[470px] lg:ml-auto">
              <div className="absolute -left-5 top-8 h-full w-full border border-primary/30" />
              <div className="relative aspect-[.83] overflow-hidden bg-[hsl(var(--sidebar))]">
                <img src={profileImage} alt="Landry Kayoyo lors d'une présentation technique" data-testid="img-profile" className="h-full w-full object-cover object-[42%_center] grayscale-[18%] contrast-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sidebar)/.8)] via-transparent to-transparent" />
                <div className="absolute left-5 top-5 flex items-center gap-2 border border-white/20 bg-[hsl(var(--sidebar)/.72)] px-3 py-2 font-mono-ui text-[9px] uppercase tracking-widest text-white backdrop-blur-sm"><Radar className="h-3 w-3 text-accent" /> Profil actif</div>
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                  <div><p className="font-display text-2xl font-semibold">Landry Kayoyo</p><p className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.18em] text-white/65">Landry Net</p></div>
                  <span className="font-mono-ui text-[10px] text-accent">LK / 01</span>
                </div>
              </div>
            </Reveal>
          </div>
          <a href="#about" data-testid="link-scroll-cue" className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-3 font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground md:flex"><span className="h-px w-10 bg-border" /> Dérouler <ChevronDown className="h-3 w-3" /></a>
        </section>

        <section id="about" className="border-b border-border bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]">
          <div className="mx-auto grid max-w-[1240px] gap-14 px-5 py-24 lg:grid-cols-[.76fr_1.24fr] lg:px-10 lg:py-32">
            <Reveal>
              <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--sidebar-primary))]">/ 01 — À propos</p>
              <h2 className="mt-6 max-w-sm font-display text-4xl font-semibold leading-tight tracking-[-.04em] md:text-5xl">L’infrastructure comme discipline.</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="max-w-2xl text-[hsl(var(--sidebar-foreground)/.72)]">
                <p className="text-xl leading-relaxed text-[hsl(var(--sidebar-foreground)/.92)] md:text-2xl">Je m’intéresse à ce qui doit fonctionner, même quand personne ne le regarde.</p>
                <p className="mt-7 max-w-xl leading-8">Mon travail se situe au croisement des systèmes, des réseaux et de la sécurité. J’aborde chaque environnement avec une même exigence : comprendre ses dépendances, réduire son opacité et construire une base sur laquelle on peut compter.</p>
                <div className="mt-10 grid gap-6 border-t border-[hsl(var(--sidebar-border))] pt-7 sm:grid-cols-2">
                  <div><p className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-primary))]">Formation</p><p className="mt-2 font-display text-lg">Université Don Bosco de Lubumbashi</p></div>
                  <div><p className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-primary))]">Approche</p><p className="mt-2 font-display text-lg">Observer. Structurer. Sécuriser.</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="expertise" className="border-b border-border px-5 py-24 lg:px-10 lg:py-32">
          <div className="mx-auto max-w-[1240px]">
            <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-primary">/ 02 — Expertise</p><h2 className="mt-5 max-w-2xl font-display text-5xl font-semibold leading-none tracking-[-.055em] md:text-7xl">Une vision complète<br /><span className="text-muted-foreground">de la fiabilité.</span></h2></div>
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">Les briques d’une infrastructure solide ne vivent pas en silos. Elles se répondent.</p>
            </Reveal>
            <div className="mt-16 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
              {expertise.map((item, index) => {
                const Icon = item.icon;
                return <Reveal key={item.number} delay={index * 0.05} className="border-b border-r border-border">
                  <div data-testid={`card-expertise-${item.number}`} className="group relative min-h-[250px] overflow-hidden p-6 transition-colors hover:bg-primary hover:text-primary-foreground md:p-8">
                    <div className="flex items-start justify-between"><Icon className="h-6 w-6 text-primary transition-colors group-hover:text-accent" /><span className="font-mono-ui text-[10px] text-muted-foreground group-hover:text-primary-foreground/55">{item.number}</span></div>
                    <h3 className="mt-16 font-display text-2xl font-semibold">{item.title}</h3>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground group-hover:text-primary-foreground/70">{item.text}</p>
                    <ArrowUpRight className="absolute bottom-7 right-7 h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent" />
                  </div>
                </Reveal>;
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-[hsl(var(--secondary)/.45)] px-5 py-20 lg:px-10">
          <div className="mx-auto max-w-[1240px]">
            <Reveal className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4"><Cpu className="h-5 w-5 text-primary" /><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em]">Technologies & terrains de jeu</p></div>
               <div className="grid w-full max-w-4xl gap-5 md:grid-cols-2 lg:grid-cols-3">
                 {technologyGroups.map((group) => (
                   <div key={group.label}>
                     <p className="mb-2 font-mono-ui text-[9px] font-bold uppercase tracking-[.16em] text-primary">{group.label}</p>
                     <div className="flex flex-wrap gap-2">
                       {group.items.map((tech, index) => <span key={tech} data-testid={`tag-technology-${group.label}-${index}`} className="border border-border bg-background px-3 py-2 font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary">{tech}</span>)}
                     </div>
                   </div>
                 ))}
               </div>
            </Reveal>
          </div>
        </section>

        <section id="project" className="relative overflow-hidden border-b border-border bg-[hsl(var(--accent))] px-5 py-24 lg:px-10 lg:py-32">
          <div className="pointer-events-none absolute right-[-8%] top-[-24%] h-[620px] w-[620px] rounded-full border border-[hsl(var(--accent-foreground)/.12)]" />
          <div className="pointer-events-none absolute right-[2%] top-[-14%] h-[430px] w-[430px] rounded-full border border-[hsl(var(--accent-foreground)/.12)]" />
          <div className="mx-auto max-w-[1240px]">
            <Reveal><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--accent-foreground)/.62)]">/ 03 — Projet de fin de cycle</p></Reveal>
            <div className="mt-10 grid items-end gap-12 lg:grid-cols-[1fr_.66fr]">
              <Reveal delay={0.08}><h2 className="max-w-4xl font-display text-5xl font-semibold leading-[.94] tracking-[-.06em] text-[hsl(var(--accent-foreground))] md:text-8xl">Un cluster<br />Windows Server<br /><span className="text-[hsl(var(--accent-foreground)/.5)]">pour relier.</span></h2></Reveal>
              <Reveal delay={0.16}><div className="border-l-2 border-[hsl(var(--accent-foreground)/.35)] pl-6 text-[hsl(var(--accent-foreground)/.75)]"><p className="text-lg leading-8">Projet réalisé dans le contexte de la CNSS, avec une réflexion autour de la continuité et de l’organisation des services entre <strong className="text-[hsl(var(--accent-foreground))]">Kinshasa et Lubumbashi</strong>.</p><a href="#contact" data-testid="link-project-discuss" className="mt-8 inline-flex items-center gap-2 font-mono-ui text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--accent-foreground))] underline decoration-[hsl(var(--accent-foreground)/.35)] underline-offset-8 transition-colors hover:decoration-[hsl(var(--accent-foreground))]">En discuter <ArrowUpRight className="h-4 w-4" /></a></div></Reveal>
            </div>
            <Reveal delay={0.2} className="mt-20">
              <div className="grid border border-[hsl(var(--accent-foreground)/.22)] bg-[hsl(var(--accent)/.6)] sm:grid-cols-3">
                <div className="border-b border-[hsl(var(--accent-foreground)/.22)] p-6 sm:border-b-0 sm:border-r"><p className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--accent-foreground)/.55)]">Cadre</p><p className="mt-3 font-display text-xl text-[hsl(var(--accent-foreground))]">CNSS</p></div>
                <div className="border-b border-[hsl(var(--accent-foreground)/.22)] p-6 sm:border-b-0 sm:border-r"><p className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--accent-foreground)/.55)]">Technologie centrale</p><p className="mt-3 font-display text-xl text-[hsl(var(--accent-foreground))]">Windows Server</p></div>
                <div className="p-6"><p className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--accent-foreground)/.55)]">Périmètre</p><p className="mt-3 font-display text-xl text-[hsl(var(--accent-foreground))]">Kinshasa — Lubumbashi</p></div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="parcours" className="border-b border-border px-5 py-24 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1240px] gap-16 lg:grid-cols-[.65fr_1.35fr]">
            <Reveal><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-primary">/ 04 — Parcours</p><h2 className="mt-6 font-display text-5xl font-semibold leading-[.95] tracking-[-.055em] md:text-6xl">Apprendre<br /><span className="text-muted-foreground">en construisant.</span></h2></Reveal>
            <Reveal delay={0.12}>
              <div className="relative border-l border-border pl-8">
                <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-primary">Formation</p>
                <h3 className="mt-4 font-display text-2xl font-semibold">Université Don Bosco de Lubumbashi</h3>
                <p className="mt-4 max-w-xl leading-7 text-muted-foreground">Un parcours universitaire qui nourrit une approche à la fois technique, structurée et tournée vers les systèmes réels.</p>
              </div>
              <div className="mt-12 flex items-center gap-4 border-t border-border pt-8 text-muted-foreground"><GraduationCap className="h-5 w-5 text-primary" /><span className="font-mono-ui text-[10px] uppercase tracking-widest">Fondations solides, pratique concrète</span></div>
            </Reveal>
          </div>
        </section>

        <section id="contact" className="bg-[hsl(var(--sidebar))] px-5 py-24 text-[hsl(var(--sidebar-foreground))] lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-[1240px] gap-16 lg:grid-cols-[.83fr_1.17fr]">
            <Reveal>
              <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--sidebar-primary))]">/ 05 — Contact</p>
              <h2 className="mt-6 max-w-md font-display text-5xl font-semibold leading-[.94] tracking-[-.055em] md:text-7xl">Parlons du système.</h2>
              <p className="mt-8 max-w-sm leading-7 text-[hsl(var(--sidebar-foreground)/.62)]">Une question technique, une idée à structurer ou un environnement à mieux comprendre ? Laissez un message.</p>
              <div className="mt-12 flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.5)]"><span className="h-2 w-2 rounded-full bg-[hsl(var(--sidebar-primary))]" /> Réponse à venir</div>
            </Reveal>
            <Reveal delay={0.12}>
              {status === 'success' ? (
                <div data-testid="status-contact-success" className="flex min-h-[390px] flex-col justify-center border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.55)] p-8 md:p-12">
                  <CheckCircle2 className="h-9 w-9 text-[hsl(var(--sidebar-primary))]" />
                  <h3 className="mt-7 font-display text-3xl font-semibold">Message préparé.</h3>
                  <p className="mt-4 max-w-md leading-7 text-[hsl(var(--sidebar-foreground)/.65)]">Merci, {form.nom}. Ce formulaire fonctionne côté interface uniquement : aucune destination de contact n’a été configurée, votre message n’est donc pas transmis.</p>
                   <button type="button" data-testid="button-contact-reset" onClick={() => { setForm({ nom: '', email: '', sujet: '', message: '' }); setStatus('idle'); }} className="mt-8 inline-flex w-fit items-center gap-2 border border-[hsl(var(--sidebar-border))] px-4 py-3 font-mono-ui text-[10px] uppercase tracking-widest transition-colors hover:border-[hsl(var(--sidebar-primary))] hover:text-[hsl(var(--sidebar-primary))]">Écrire un autre message <ArrowUpRight className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <form onSubmit={submitContact} noValidate className="space-y-6" data-testid="form-contact">
                  {status === 'error' && Object.keys(errors).length > 0 && <div data-testid="status-contact-error" role="alert" className="flex items-start gap-3 border border-[hsl(var(--destructive)/.5)] bg-[hsl(var(--destructive)/.1)] p-4 text-sm text-[hsl(var(--sidebar-foreground))]"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--destructive))]" /> Vérifiez les champs signalés avant d’envoyer.</div>}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block"><span className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.55)]">Nom</span><input data-testid="input-contact-name" value={form.nom} onChange={(event) => updateField('nom', event.target.value)} aria-invalid={Boolean(errors.nom)} className="mt-2 w-full border-0 border-b border-[hsl(var(--sidebar-border))] bg-transparent px-0 py-3 text-base outline-none transition-colors placeholder:text-[hsl(var(--sidebar-foreground)/.28)] focus:border-[hsl(var(--sidebar-primary))]" placeholder="Votre nom" />{errors.nom && <span className="mt-2 block text-xs text-[hsl(var(--accent))]">{errors.nom}</span>}</label>
                     <label className="block"><span className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.55)]">E-mail</span><input type="email" data-testid="input-contact-email" value={form.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(errors.email)} className="mt-2 w-full border-0 border-b border-[hsl(var(--sidebar-border))] bg-transparent px-0 py-3 text-base outline-none transition-colors placeholder:text-[hsl(var(--sidebar-foreground)/.28)] focus:border-[hsl(var(--sidebar-primary))]" placeholder="vous@exemple.com" />{errors.email && <span className="mt-2 block text-xs text-[hsl(var(--accent))]">{errors.email}</span>}</label>
                  </div>
                   <label className="block"><span className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.55)]">Sujet</span><input data-testid="input-contact-subject" value={form.sujet} onChange={(event) => updateField('sujet', event.target.value)} aria-invalid={Boolean(errors.sujet)} className="mt-2 w-full border-0 border-b border-[hsl(var(--sidebar-border))] bg-transparent px-0 py-3 text-base outline-none transition-colors placeholder:text-[hsl(var(--sidebar-foreground)/.28)] focus:border-[hsl(var(--sidebar-primary))]" placeholder="Ce dont vous voulez parler" />{errors.sujet && <span className="mt-2 block text-xs text-[hsl(var(--accent))]">{errors.sujet}</span>}</label>
                  <label className="block"><span className="font-mono-ui text-[10px] uppercase tracking-widest text-[hsl(var(--sidebar-foreground)/.55)]">Message</span><textarea data-testid="input-contact-message" value={form.message} onChange={(event) => updateField('message', event.target.value)} aria-invalid={Boolean(errors.message)} rows={5} className="mt-2 w-full resize-none border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.35)] px-4 py-3 text-base outline-none transition-colors placeholder:text-[hsl(var(--sidebar-foreground)/.28)] focus:border-[hsl(var(--sidebar-primary))]" placeholder="Quelques lignes pour donner le contexte..." />{errors.message && <span className="mt-2 block text-xs text-[hsl(var(--accent))]">{errors.message}</span>}</label>
                  <button type="submit" disabled={status === 'loading'} data-testid="button-contact-submit" className="group inline-flex items-center gap-3 bg-[hsl(var(--sidebar-primary))] px-5 py-3.5 font-mono-ui text-xs font-bold uppercase tracking-wider text-[hsl(var(--sidebar-primary-foreground))] transition-transform hover:-translate-y-1 disabled:cursor-wait disabled:opacity-60">{status === 'loading' ? 'Préparation…' : 'Préparer le message'} <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
                  <p className="font-mono-ui text-[9px] uppercase leading-5 tracking-widest text-[hsl(var(--sidebar-foreground)/.38)]">Aucune adresse ou destination n’est affichée ici. L’envoi réel nécessite une configuration de contact.</p>
                </form>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-5 py-7 text-[hsl(var(--sidebar-foreground)/.45)] lg:px-10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 font-mono-ui text-[9px] uppercase tracking-[.16em] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Landry Kayoyo — Landry Net</span><a href="#top" data-testid="link-back-top" className="flex items-center gap-2 transition-colors hover:text-[hsl(var(--sidebar-primary))]">Retour en haut <ChevronDown className="h-3 w-3 rotate-180" /></a></div>
      </footer>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
