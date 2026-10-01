import React, {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  BarChart3,
  Bot,
  Briefcase,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Plus,
  Save,
  SendHorizontal,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import "./admin.css";

const API =
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000/api"
    : "/api");
type ContentType = "skill" | "technology" | "project" | "timeline" | "social" | "service";
type Item = {
  id: number;
  type: ContentType;
  title: string;
  data: Record<string, unknown>;
  published: boolean;
  visible: boolean;
  sortOrder: number;
};
type EvolutionPoint = {
  date: string;
  label: string;
  contents: number;
  messages: number;
};
type Counts = {
  projects: number;
  skills: number;
  technologies: number;
  timeline: number;
  socials: number;
  services: number;
  messages: number;
  unreadMessages: number;
  evolution?: EvolutionPoint[];
};

const labels: Record<ContentType, string> = {
  skill: "Compétences",
  technology: "Technologies",
  project: "Projets",
  timeline: "Parcours",
  social: "Réseaux sociaux",
  service: "Services",
};

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok)
    throw new Error(
      (await response.json().catch(() => null))?.error ??
        "Une erreur est survenue.",
    );
  return response.status === 204 ? null : response.json();
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@localhost");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await request("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Connexion impossible.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="admin-login">
      <div className="login-mark">
        <ShieldCheck size={22} /> LANDRY / NET
      </div>
      <section className="login-panel">
        <div className="login-panel-top">
          <span className="login-status-dot" /> Espace sécurisé
        </div>
        <span className="admin-eyebrow">Administration privée</span>
        <h1>Reprendre le contrôle du contenu.</h1>
        <p>Gérez le portfolio depuis une source de données unique.</p>
        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />
          </label>
          {error && <div className="admin-error">{error}</div>}
          <button className="admin-button" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Ouvrir la session"} <ShieldCheck size={16} />
          </button>
        </form>
        <small>Accès réservé à l’administration du portfolio.</small>
      </section>
    </main>
  );
}

type ChatMessage = { role: "user" | "assistant"; text: string; isError?: boolean };

function AiChatBubble({ setNotice }: { setNotice: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Bonjour 👋 Je suis ton assistant IA intégré. Je connais tout ton portfolio et je peux créer ou améliorer ton contenu. Que veux-tu faire ?" }
  ]);
  const endRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    const newMsg: ChatMessage = { role: "user", text };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setThinking(true);

    try {
      // Build messages array in AI SDK format (exclude error messages)
      const history = [...messages, newMsg]
        .filter(m => !m.isError)
        .map(m => ({ role: m.role, content: m.text }));

      const response = await request("/admin/chat", {
        method: "POST",
        body: JSON.stringify({ messages: history }),
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        text: response?.message?.text || "Réponse vide reçue.",
      }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erreur de connexion.";
      setMessages(prev => [...prev, {
        role: "assistant",
        text: `❌ ${errMsg}`,
        isError: true,
      }]);
    } finally {
      setThinking(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", text: "Nouvelle conversation. Comment puis-je t'aider ?" }]);
  };

  return (
    <div className="ai-chat-container">
      {open && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} style={{ color: "var(--admin-lime)" }} />
              <h3>Assistant IA</h3>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="icon-button" onClick={clearChat} title="Nouvelle conversation" aria-label="Effacer">
                <Plus size={16} />
              </button>
              <button className="icon-button" onClick={() => setOpen(false)} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}${msg.isError ? " error" : ""}`}>
                {msg.text}
              </div>
            ))}
            {thinking && (
              <div className="ai-msg assistant" style={{ display: "flex", gap: 5, alignItems: "center", opacity: 0.7 }}>
                <span className="login-status-dot" style={{ width: 8, height: 8, animationDuration: "1s" }} />
                <span className="login-status-dot" style={{ width: 8, height: 8, animationDuration: "1.2s", animationDelay: "0.2s" }} />
                <span className="login-status-dot" style={{ width: 8, height: 8, animationDuration: "1s", animationDelay: "0.4s" }} />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form className="ai-chat-input-area" onSubmit={e => void sendMessage(e)}>
            <input
              type="text"
              placeholder="Ex: Crée un projet React avec description SEO..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={thinking}
            />
            <button type="submit" aria-label="Envoyer" disabled={thinking || !input.trim()}>
              <SendHorizontal size={18} />
            </button>
          </form>
        </div>
      )}
      <button
        className="ai-chat-fab"
        onClick={() => setOpen(!open)}
        aria-label="Ouvrir l'assistant IA"
        title="Assistant IA"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
    </div>
  );
}

function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [section, setSection] = useState<
    "dashboard" | "content" | "profile" | "messages" | "settings" | "ai-settings"
  >("dashboard");
  const [contentType, setContentType] = useState<ContentType>("project");
  const [counts, setCounts] = useState<Counts | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [allTechnologies, setAllTechnologies] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [notice, setNotice] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const refresh = async () => {
    try {
      await request("/admin/session");
      setAuthenticated(true);
      const dashboard = await request("/admin/dashboard");
      setCounts(dashboard.counts);
    } catch {
      setAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (authenticated && section === "content") {
      setLoadingItems(true);
      setItems([]);
      setEditing(null);
      void request(`/admin/items?type=${contentType}`)
        .then(setItems)
        .finally(() => setLoadingItems(false));
      // Toujours charger les technologies pour les suggestions du MultiCombobox
      void request("/admin/items?type=technology").then(setAllTechnologies);
    }
  }, [authenticated, section, contentType]);
  useEffect(() => {
    if (authenticated && section === "messages")
      void request("/admin/messages").then(setMessages);
  }, [authenticated, section]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (checkingAuth) {
    return (
      <div className="admin-login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="login-status-dot" style={{ width: 16, height: 16, animationDuration: '1s' }} />
      </div>
    );
  }
  if (!authenticated) return <Login onLogin={() => void refresh()} />;
  const logout = async () => {
    await request("/admin/logout", { method: "POST" });
    setAuthenticated(false);
  };
  const nav = (next: typeof section) => {
    setSection(next);
    setMobileOpen(false);
  };
  return (
    <div className="admin-app">
      <AiChatBubble setNotice={setNotice} />
      {/* Overlay mobile pour fermer la sidebar en cliquant à côté */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        />
      )}
      <aside className={mobileOpen ? "admin-sidebar is-open" : "admin-sidebar"}>
        <div className="admin-brand">
          <span className="brand-square">L</span>
          <span>
            LANDRY <b>NET</b>
            <small>CONTENT STUDIO</small>
          </span>
        </div>
        {/* Bouton fermer dans la sidebar elle-même */}
        <button
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        >
          <X size={20} />
        </button>
        <nav>
          <button
            className={section === "dashboard" ? "is-active" : ""}
            onClick={() => nav("dashboard")}
          >
            <LayoutDashboard size={17} /> Vue d'ensemble
          </button>
          <button
            className={section === "content" ? "is-active" : ""}
            onClick={() => nav("content")}
          >
            <FolderKanban size={17} /> Contenus
          </button>
          <button
            className={section === "profile" ? "is-active" : ""}
            onClick={() => nav("profile")}
          >
            <UserRound size={17} /> Profil public
          </button>
          <button
            className={section === "messages" ? "is-active" : ""}
            onClick={() => nav("messages")}
          >
            <Mail size={17} /> Messages{" "}
            {counts?.unreadMessages ? (
              <b className="nav-count">{counts.unreadMessages}</b>
            ) : null}
          </button>
          <button
            className={section === "settings" ? "is-active" : ""}
            onClick={() => nav("settings")}
          >
            <Settings size={17} /> Paramètres
          </button>
          <button
            className={section === "ai-settings" ? "is-active" : ""}
            onClick={() => nav("ai-settings")}
          >
            <Sparkles size={17} /> Paramètres IA
          </button>
        </nav>
        <button className="admin-logout" onClick={logout}>
          <LogOut size={17} /> Déconnexion
        </button>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div>
            <span className="admin-eyebrow">Workspace / {section}</span>
            <h2>
              {section === "dashboard"
                ? "Vue d'ensemble"
                : section === "content"
                  ? labels[contentType]
                  : section === "messages"
                    ? "Boîte de réception"
                    : section === "profile"
                      ? "Profil public"
                      : section === "settings"
                        ? "Paramètres du site"
                        : "Paramètres IA"}
            </h2>
          </div>
          <a href="/" target="_blank" rel="noreferrer" className="view-site">
            Voir le site ↗
          </a>
        </header>
        {notice && <div className="admin-notice">{notice}</div>}
        {section === "dashboard" && (
          <Dashboard counts={counts} onMessages={() => nav("messages")} />
        )}
        {section === "content" && (
          <ContentManager
            type={contentType}
            setType={setContentType}
            items={items}
            allTechnologies={allTechnologies}
            loading={loadingItems}
            editing={editing}
            setEditing={setEditing}
            setNotice={setNotice}
            reload={() => {
              setLoadingItems(true);
              void request(`/admin/items?type=${contentType}`)
                .then(setItems)
                .finally(() => setLoadingItems(false));
              void request("/admin/items?type=technology").then(setAllTechnologies);
            }}
          />
        )}
        {section === "profile" && (
          <SingletonEditor
            endpoint="profile"
            title="Informations affichées sur le portfolio"
            setNotice={setNotice}
          />
        )}
        {section === "settings" && (
          <SingletonEditor
            endpoint="settings"
            title="Réglages publics et SEO"
            setNotice={setNotice}
          />
        )}
        {section === "ai-settings" && (
          <AiSettingsEditor setNotice={setNotice} />
        )}
        {section === "messages" && (
          <Messages
            messages={messages}
            reload={() => void request("/admin/messages").then(setMessages)}
            setNotice={setNotice}
          />
        )}
      </div>
    </div>
  );
}


function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  const maxValue = Math.max(
    1,
    ...data.map((point) => Math.max(point.contents, point.messages)),
  );
  const pointString = (key: "contents" | "messages") =>
    data
      .map(
        (point, index) =>
          `${(index / Math.max(data.length - 1, 1)) * 100},${94 - (point[key] / maxValue) * 72}`,
      )
      .join(" ");
  const pointDots = (key: "contents" | "messages") =>
    data.map((point, index) => ({
      x: (index / Math.max(data.length - 1, 1)) * 100,
      y: 94 - (point[key] / maxValue) * 72,
      date: point.date,
    }));
  const areaString = (key: "contents" | "messages") => {
    if (data.length === 0) return "";
    const points = pointDots(key);
    const first = points[0];
    const last = points[points.length - 1];
    return `M ${first.x},94 ${points.map((point) => `L ${point.x},${point.y}`).join(" ")} L ${last.x},94 Z`;
  };
  return (
    <svg
      className="evolution-svg"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Évolution des contenus et des messages"
    >
      <defs>
        <linearGradient id="contentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(25,125,136,0.28)" />
          <stop offset="100%" stopColor="rgba(25,125,136,0.02)" />
        </linearGradient>
        <linearGradient id="messageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(200,239,91,0.22)" />
          <stop offset="100%" stopColor="rgba(200,239,91,0.02)" />
        </linearGradient>
      </defs>
      <g className="evolution-grid">
        <line x1="0" y1="22" x2="100" y2="22" />
        <line x1="0" y1="58" x2="100" y2="58" />
        <line x1="0" y1="94" x2="100" y2="94" />
      </g>
      <path
        className="evolution-area evolution-area-content"
        d={areaString("contents")}
      />
      <path
        className="evolution-area evolution-area-messages"
        d={areaString("messages")}
      />
      <polyline
        className="evolution-line evolution-line-content"
        points={pointString("contents")}
      />
      <polyline
        className="evolution-line evolution-line-messages"
        points={pointString("messages")}
      />
      {pointDots("contents").map((point, index) => (
        <circle
          className="evolution-point evolution-point-content"
          key={`${point.date}-content`}
          cx={point.x}
          cy={point.y}
          r="1.6"
        />
      ))}
      {pointDots("messages").map((point, index) => (
        <circle
          className="evolution-point evolution-point-messages"
          key={`${point.date}-messages`}
          cx={point.x}
          cy={point.y}
          r="1.3"
        />
      ))}
      {data.map((point, index) => (
        <text
          className="evolution-label"
          key={point.date}
          x={`${(index / Math.max(data.length - 1, 1)) * 100}%`}
          y="100%"
          textAnchor={
            index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"
          }
        >
          {point.label}
        </text>
      ))}
    </svg>
  );
}

// Mini donut chart SVG
function DonutChart({ value, max, color }: { value: number; max: number; color: string }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const ratio = max > 0 ? value / max : 0;
  const dash = ratio * circumference;
  return (
    <svg viewBox="0 0 70 70" className="donut-svg">
      <circle cx="35" cy="35" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx="35" cy="35" r={r} fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 35 35)"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="35" y="39" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="Syne, sans-serif">{value}</text>
    </svg>
  );
}

function Dashboard({
  counts,
  onMessages,
}: {
  counts: Counts | null;
  onMessages: () => void;
}) {
  const total = (counts?.projects ?? 0) + (counts?.skills ?? 0) + (counts?.technologies ?? 0) + (counts?.timeline ?? 0) + (counts?.socials ?? 0) + (counts?.services ?? 0);
  const donutData = [
    { label: "Projets",   value: counts?.projects ?? 0,     color: "#818cf8" },
    { label: "Comp.",     value: counts?.skills ?? 0,       color: "#38bdf8" },
    { label: "Technos",   value: counts?.technologies ?? 0, color: "#a78bfa" },
    { label: "Parcours",  value: counts?.timeline ?? 0,     color: "#34d399" },
    { label: "Réseaux",   value: counts?.socials ?? 0,      color: "#f472b6" },
    { label: "Services",  value: counts?.services ?? 0,     color: "#fb923c" },
  ];
  const cards = [
    ["Projets",      counts?.projects ?? 0,      FolderKanban, "#818cf8"],
    ["Compétences",  counts?.skills ?? 0,        BarChart3,    "#38bdf8"],
    ["Technologies", counts?.technologies ?? 0,  FileText,     "#a78bfa"],
    ["Parcours",     counts?.timeline ?? 0,      UserRound,    "#34d399"],
    ["Réseaux",      counts?.socials ?? 0,       Share2,       "#f472b6"],
    ["Services",     counts?.services ?? 0,      Briefcase,    "#fb923c"],
    ["Messages",     counts?.messages ?? 0,      Mail,         "#f59e0b"],
    ["Non lus",      counts?.unreadMessages ?? 0, Mail,        "#f87171"],
  ] as const;
  return (
    <section className="admin-content">
      <div className="dashboard-intro">
        <div>
          <span className="admin-eyebrow">État du contenu</span>
          <h3>Votre infrastructure éditoriale, au même endroit.</h3>
        </div>
        <div className="dashboard-actions">
          <a className="admin-button admin-button-light" href="/" target="_blank" rel="noreferrer">
            Voir le site public ↗
          </a>
          <button className="admin-button" onClick={onMessages}>
            Voir les messages <Mail size={15} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {cards.map(([label, value, Icon, color]) => (
          <div className="stat-card" key={label} style={{ borderTop: `3px solid ${color}` }}>
            <Icon size={18} style={{ color }} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {/* Row: donut charts + evolution */}
      <div className="dashboard-charts-row">
        {/* Donut breakdown */}
        <div className="donut-panel">
          <div className="panel-heading">
            <span className="admin-eyebrow">Répartition</span>
            <h3>Contenus par catégorie</h3>
          </div>
          <div className="donut-grid">
            {donutData.map((d) => (
              <div className="donut-item" key={d.label}>
                <DonutChart value={d.value} max={Math.max(total, 1)} color={d.color} />
                <span style={{ color: d.color }}>{d.label}</span>
              </div>
            ))}
          </div>
          <div className="donut-total">
            <span className="admin-eyebrow">Total</span>
            <strong>{total} contenus</strong>
          </div>
        </div>

        {/* Evolution line chart */}
        <div className="evolution-panel" style={{ flex: 1 }}>
          <div className="evolution-heading">
            <div>
              <span className="admin-eyebrow">Évolution</span>
              <h3>Le contenu prend forme.</h3>
            </div>
            <div className="evolution-legend">
              <span><i className="legend-dot legend-dot-content" /> Contenus</span>
              <span><i className="legend-dot legend-dot-messages" /> Messages</span>
            </div>
          </div>
          <div className="evolution-chart">
            <EvolutionChart data={counts?.evolution ?? []} />
          </div>
        </div>
      </div>

      {/* Messages non lus rapide */}
      {(counts?.unreadMessages ?? 0) > 0 && (
        <div className="unread-banner" onClick={onMessages}>
          <Mail size={16} />
          <span>Vous avez <strong>{counts?.unreadMessages}</strong> message{(counts?.unreadMessages ?? 0) > 1 ? 's' : ''} non lu{(counts?.unreadMessages ?? 0) > 1 ? 's' : ''} — cliquez pour les consulter</span>
          <span className="unread-arrow">→</span>
        </div>
      )}
    </section>
  );
}


function CategoryCombobox({
  value,
  onChange,
  suggestions,
}: {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = React.useRef<HTMLDivElement>(null);

  // Sync external value to query when value changes (e.g. editing a different item)
  React.useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  const select = (cat: string) => {
    setQuery(cat);
    onChange(cat);
    setOpen(false);
  };

  return (
    <div ref={ref} className="combobox-wrap">
      <input
        className="combobox-input"
        value={query}
        placeholder="Choisir ou créer..."
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (filtered.length > 0 || (query && !suggestions.includes(query))) && (
        <ul className="combobox-list">
          {filtered.map((cat) => (
            <li
              key={cat}
              className={`combobox-option${cat === value ? " is-selected" : ""}`}
              onMouseDown={() => select(cat)}
            >
              {cat}
            </li>
          ))}
          {query && !filtered.includes(query) && (
            <li className="combobox-option combobox-create" onMouseDown={() => select(query)}>
              <Plus size={13} /> Créer «&nbsp;{query}&nbsp;»
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function MultiCombobox({
  values,
  onChange,
  suggestions,
  onCreateNew,
}: {
  values: string[];
  onChange: (val: string[]) => void;
  suggestions: string[];
  onCreateNew: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unselected = suggestions.filter((s) => !values.includes(s));
  const filtered = query
    ? unselected.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : unselected;

  const select = (item: string) => {
    onChange([...values, item]);
    setQuery("");
    setOpen(false);
  };
  const create = (item: string) => {
    onCreateNew(item);
    setQuery("");
    setOpen(false);
  };
  const remove = (item: string) => {
    onChange(values.filter((v) => v !== item));
  };

  return (
    <div ref={ref} className="combobox-wrap multi-combobox">
      <div className="multi-values">
        {values.map((v) => (
          <span key={v} className="multi-chip">
            {v}
            <button type="button" onClick={() => remove(v)}><X size={12} /></button>
          </span>
        ))}
        <input
          className="combobox-input"
          value={query}
          placeholder="Ajouter une technologie..."
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query) {
              e.preventDefault();
              if (filtered.includes(query)) select(query);
              else create(query);
            }
          }}
        />
      </div>
      {open && (filtered.length > 0 || (query && !unselected.includes(query))) && (
        <ul className="combobox-list">
          {filtered.map((item) => (
            <li
              key={item}
              className="combobox-option"
              onMouseDown={() => select(item)}
            >
              {item}
            </li>
          ))}
          {query && !filtered.includes(query) && (
            <li className="combobox-option combobox-create" onMouseDown={() => create(query)}>
              <Plus size={13} /> Ajouter la techno «&nbsp;{query}&nbsp;»
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function ContentManager({
  type,
  setType,
  items,
  allTechnologies,
  loading,
  editing,
  setEditing,
  setNotice,
  reload,
}: {
  type: ContentType;
  setType: (type: ContentType) => void;
  items: Item[];
  allTechnologies?: Item[];
  loading?: boolean;
  editing: Item | null;
  setEditing: (item: Item | null) => void;
  setNotice: (notice: string) => void;
  reload: () => void;
}) {
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    try {
      const payload = {
        ...editing,
        type,
        data: editing.data,
        sortOrder: editing.sortOrder,
        published: editing.published,
        visible: editing.visible,
      };
      await request(
        editing.id ? `/admin/items/${editing.id}` : "/admin/items",
        {
          method: editing.id ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setEditing(null);
      setNotice("Contenu enregistré.");
      reload();
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "Enregistrement impossible.",
      );
    }
  };
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const remove = async (id: number) => {
    setConfirmId(id);
  };
  const confirmRemove = async () => {
    if (confirmId === null) return;
    try {
      await request(`/admin/items/${confirmId}`, { method: "DELETE" });
      setConfirmId(null);
      setNotice("Contenu supprimé.");
      reload();
    } catch (err: any) {
      setNotice(err.message || "Erreur lors de la suppression.");
      setConfirmId(null);
    }
  };
  const [nestedEditing, setNestedEditing] = useState<Item | null>(null);
  const saveNested = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nestedEditing) return;
    try {
      const payload = {
        ...nestedEditing,
        data: nestedEditing.data,
      };
      await request("/admin/items", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const newTechs = [
        ...(Array.isArray(editing?.data.technologies)
          ? editing.data.technologies
          : []),
        nestedEditing.title,
      ];
      updateData({ technologies: newTechs });
      setNestedEditing(null);
      setNotice(`Technologie ${nestedEditing.title} ajoutée.`);
      reload();
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "Enregistrement impossible.",
      );
    }
  };
  const uploadCover = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API}/admin/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const result = (await response.json().catch(() => null)) as {
      url?: string;
      error?: string;
    } | null;
    if (!response.ok || !result?.url)
      throw new Error(result?.error ?? "Upload impossible.");
    if (!editing) return;
    setEditing({
      ...editing,
      data: { ...editing.data, coverImage: result.url },
    });
    setNotice("Image de couverture chargée.");
  };
  const updateData = (patch: Record<string, unknown>) => {
    if (!editing) return;
    setEditing({ ...editing, data: { ...editing.data, ...patch } });
  };
  const coverImage =
    type === "project" ? String(editing?.data.coverImage ?? "") : "";
  const technologiesValue = Array.isArray(editing?.data.technologies)
    ? editing.data.technologies.map(String)
    : [];
  return (
    <section className="admin-content">
      <div className="content-toolbar">
        <div className="type-tabs">
          {(Object.keys(labels) as ContentType[]).map((key) => (
            <button
              className={type === key ? "is-active" : ""}
              onClick={() => {
                setType(key);
                setEditing(null);
              }}
              key={key}
            >
              {labels[key]}
            </button>
          ))}
        </div>
        <button
          className="admin-button"
          onClick={() =>
            setEditing({
              id: 0,
              type,
              title: "",
              data: {},
              published: true,
              visible: true,
              sortOrder: items.length,
            })
          }
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>
      {editing && (
        <form className="editor-panel" onSubmit={save}>
          <div className="editor-heading">
            <div>
              <span className="admin-eyebrow">Édition</span>
              <h3>{editing.id ? "Modifier" : "Nouveau contenu"}</h3>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setEditing(null)}
            >
              <X size={17} />
            </button>
          </div>
          <label>
            Titre
            <input
              value={editing.title}
              onChange={(event) =>
                setEditing({ ...editing, title: event.target.value })
              }
              required
            />
          </label>
          <div className="two-fields">
            <label>
              Ordre
              <input
                type="number"
                value={editing.sortOrder}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    sortOrder: Number(event.target.value),
                  })
                }
              />
            </label>
            {type !== "project" && type !== "social" && (
              <label>
                Catégorie / niveau
                <CategoryCombobox
                  value={String(editing.data.category ?? "")}
                  onChange={(val) => updateData({ category: val })}
                  suggestions={[
                    ...new Set(
                      items
                        .filter(i => i.type === type)
                        .map((item) => String(item.data.category ?? ""))
                        .filter(Boolean)
                    ),
                  ]}
                />
              </label>
            )}
          </div>
          {type === "project" && (
            <div className="cover-field">
              <label>
                Image de couverture (URL)
                <input
                  type="url"
                  value={coverImage}
                  placeholder="https://.../image.jpg"
                  onChange={(event) =>
                    updateData({ coverImage: event.target.value })
                  }
                />
              </label>
              <label className="upload-field">
                Importer une image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file)
                      void uploadCover(file).catch((cause) =>
                        setNotice(
                          cause instanceof Error
                            ? cause.message
                            : "Upload impossible.",
                        ),
                      );
                  }}
                />
              </label>
              {coverImage && (
                <img
                  className="cover-preview"
                  src={coverImage}
                  alt="Aperçu de la couverture"
                />
              )}
            </div>
          )}
          {type !== "social" && (
            <label>
              Résumé
              <textarea
                value={String(editing.data.description ?? "")}
                onChange={(event) =>
                  updateData({ description: event.target.value })
                }
                rows={4}
              />
            </label>
          )}
          {type !== "social" && (
            <label>
              Contexte / détails
              <textarea
                value={String(editing.data.context ?? "")}
                onChange={(event) => updateData({ context: event.target.value })}
                rows={4}
              />
            </label>
          )}
          {type === "social" && (
            <>
              <label>
                Lien URL
                <input
                  type="url"
                  value={String(editing.data.url ?? "")}
                  onChange={(event) => updateData({ url: event.target.value })}
                  placeholder="https://..."
                  required
                />
              </label>
              <label>
                Icône (Optionnel)
                <input
                  type="text"
                  value={String(editing.data.icon ?? "")}
                  onChange={(event) => updateData({ icon: event.target.value })}
                  placeholder="github, linkedin, twitter, instagram..."
                />
              </label>
            </>
          )}
          {type === "project" && (
            <label>
              Technologies
              <MultiCombobox
                values={technologiesValue}
                onChange={(val) => updateData({ technologies: val })}
                suggestions={[
                  ...new Set(
                    (allTechnologies ?? items.filter(i => i.type === "technology")).map(i => i.title)
                  )
                ]}
                onCreateNew={(name) => {
                  setNestedEditing({
                    id: 0,
                    type: "technology",
                    title: name,
                    data: {},
                    published: true,
                    visible: true,
                    sortOrder: (allTechnologies ?? items.filter(i => i.type === "technology")).length,
                  });
                }}
              />
            </label>
          )}
          <div className="check-row">
            <label>
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(event) =>
                  setEditing({ ...editing, published: event.target.checked })
                }
              />{" "}
              Publié
            </label>
            <label>
              <input
                type="checkbox"
                checked={editing.visible}
                onChange={(event) =>
                  setEditing({ ...editing, visible: event.target.checked })
                }
              />{" "}
              Visible
            </label>
          </div>
          <button className="admin-button" type="submit">
            <Save size={16} /> Enregistrer
          </button>
        </form>
      )}
      <div className="content-table">
        {items.map((item) => (
          <div className="content-row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>
                {String(
                  item.data.category ??
                    item.data.description ??
                    "Aucune description",
                )}
              </span>
            </div>
            <span
              className={
                item.visible && item.published ? "status status-live" : "status"
              }
            >
              {item.visible && item.published ? "Publié" : "Masqué"}
            </span>
            <div className="row-actions">
              <button
                className="icon-button"
                onClick={() => setEditing(item)}
                aria-label="Modifier"
              >
                <FileText size={16} />
              </button>
              <button
                className="icon-button danger"
                onClick={() => void remove(item.id)}
                aria-label="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {loading ? (
          <div className="empty-table">
            <span className="login-status-dot" style={{ display: 'inline-block', marginRight: 8, width: 10, height: 10 }} />
            Chargement...
          </div>
        ) : items.length === 0 ? (
          <div className="empty-table">
            Aucun contenu pour l’instant. Ajoutez uniquement des informations
            vérifiées.
          </div>
        ) : null}
      </div>

      {confirmId !== null && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="editor-panel" style={{ width: 400, maxWidth: '90%', margin: 0, position: 'relative', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 12px' }}>Supprimer le contenu ?</h3>
            <p style={{ margin: '0 0 24px', color: 'var(--admin-muted)' }}>Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="admin-button admin-button-light" onClick={() => setConfirmId(null)}>Annuler</button>
              <button className="admin-button" onClick={() => void confirmRemove()} style={{ background: 'rgba(248, 113, 113, 0.1)', color: 'var(--admin-danger)' }}>
                <Trash2 size={16} /> Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {nestedEditing !== null && (
        <div className="sidebar-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <form className="editor-panel" style={{ width: 600, maxWidth: '90%', margin: 0, position: 'relative', animation: 'fadeIn 0.2s ease-out' }} onSubmit={saveNested}>
            <div className="editor-heading">
              <div>
                <span className="admin-eyebrow">Nouvelle technologie</span>
                <h3>Ajouter {nestedEditing.title}</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setNestedEditing(null)}><X size={17} /></button>
            </div>
            <label>
              Titre
              <input
                value={nestedEditing.title}
                onChange={(e) => setNestedEditing({ ...nestedEditing, title: e.target.value })}
                required
              />
            </label>
            <div className="two-fields">
              <label>
                Ordre
                <input
                  type="number"
                  value={nestedEditing.sortOrder}
                  onChange={(e) => setNestedEditing({ ...nestedEditing, sortOrder: Number(e.target.value) })}
                />
              </label>
              <label>
                Catégorie / niveau
                <CategoryCombobox
                  value={String(nestedEditing.data.category ?? "")}
                  onChange={(val) => setNestedEditing({ ...nestedEditing, data: { ...nestedEditing.data, category: val } })}
                  suggestions={[...new Set((allTechnologies ?? items.filter(i => i.type === "technology")).map((item) => String(item.data.category ?? "")).filter(Boolean))]}
                />
              </label>
            </div>
            <label>
              Résumé
              <textarea
                value={String(nestedEditing.data.description ?? "")}
                onChange={(e) => setNestedEditing({ ...nestedEditing, data: { ...nestedEditing.data, description: e.target.value } })}
                rows={3}
              />
            </label>
            <button className="admin-button" type="submit">
              <Save size={16} /> Créer et ajouter
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function AiSettingsEditor({ setNotice }: { setNotice: (msg: string) => void }) {
  const [data, setData] = useState<Record<string, any>>({
    active_model: "gemini-2.0-flash",
    api_key_gemini: "",
    api_key_deepseek: "",
    api_key_openai: "",
    system_prompt: "Tu es l'assistant IA de Landry. Règle d'or: Sois naturel, direct et très concis. N'utilise AUCUN markdown (pas de **). Ne pose pas de questions inutiles. Exécute simplement la tâche demandée avec les outils.",
    seo_rules: "Chaque description doit faire 120-160 caractères. Utilise des mots clés tech."
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    request("/admin/ai-settings")
      .then((res) => {
        if (res && Object.keys(res).length > 0) setData(prev => ({ ...prev, ...res }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request("/admin/ai-settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setNotice("Configuration IA enregistrée avec succès !");
    } catch {
      setNotice("Erreur lors de l'enregistrement de l'IA.");
    }
  };

  if (loading) {
    return (
      <section className="admin-content">
        <div className="editor-panel singleton" style={{ opacity: 0.7 }}>
          <span className="login-status-dot" style={{ display: 'inline-block', marginRight: 8, width: 10, height: 10 }} />
          Chargement de la configuration...
        </div>
      </section>
    );
  }

  const activeModelStr = String(data.active_model || "");

  return (
    <section className="admin-content">
      <form className="editor-panel singleton" onSubmit={save}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="admin-eyebrow" style={{ color: "var(--admin-blue)" }}>Système Privé</span>
            <h3>Configuration de l'Assistant IA</h3>
          </div>
          <Sparkles size={24} style={{ color: "var(--admin-blue)", opacity: 0.5 }} />
        </div>
        <p style={{ color: "var(--admin-muted)" }}>
          Ces clés et instructions restent strictement confidentielles sur le serveur (Table admin_settings). 
          Personne ne peut y accéder publiquement.
        </p>
        
        <div style={{ display: "grid", gap: "20px", marginTop: "24px" }}>
          <label>
            Modèle IA actif
            <select
              value={activeModelStr}
              onChange={e => setData({ ...data, active_model: e.target.value })}
              style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px", fontFamily: "inherit" }}
            >
              <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Gratuit / Rapide)</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Puissant)</option>
              <option value="deepseek-chat">DeepSeek Chat (Alternative ChatGPT)</option>
              <option value="deepseek-reasoner">DeepSeek Reasoner (Complexe)</option>
              <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
              <option value="gpt-4o">OpenAI GPT-4o</option>
            </select>
          </label>

          {activeModelStr.includes("gemini") && (
            <label>
              Clé API Google Gemini 
              {data.api_key_gemini && data.api_key_gemini.length > 5 ? <span style={{ color: 'var(--admin-lime)', marginLeft: 8, fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Configurrée</span> : <span style={{ color: 'var(--admin-danger)', marginLeft: 8, fontSize: '0.8rem', fontWeight: 'bold' }}>⚠️ Non configurée</span>}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--admin-blue)', marginLeft: 8 }}>Obtenir une clé ↗</a>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={String(data.api_key_gemini || "")}
                onChange={e => setData({ ...data, api_key_gemini: e.target.value })}
                style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px" }}
              />
            </label>
          )}

          {activeModelStr.includes("deepseek") && (
            <label>
              Clé API DeepSeek 
              {data.api_key_deepseek && data.api_key_deepseek.length > 5 ? <span style={{ color: 'var(--admin-lime)', marginLeft: 8, fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Configurrée</span> : <span style={{ color: 'var(--admin-danger)', marginLeft: 8, fontSize: '0.8rem', fontWeight: 'bold' }}>⚠️ Non configurée</span>}
              <a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--admin-blue)', marginLeft: 8 }}>Plateforme ↗</a>
              <input
                type="password"
                placeholder="sk-..."
                value={String(data.api_key_deepseek || "")}
                onChange={e => setData({ ...data, api_key_deepseek: e.target.value })}
                style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px" }}
              />
            </label>
          )}

          {activeModelStr.includes("gpt") && (
            <label>
              Clé API OpenAI 
              {data.api_key_openai && data.api_key_openai.length > 5 ? <span style={{ color: 'var(--admin-lime)', marginLeft: 8, fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Configurrée</span> : <span style={{ color: 'var(--admin-danger)', marginLeft: 8, fontSize: '0.8rem', fontWeight: 'bold' }}>⚠️ Non configurée</span>}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--admin-blue)', marginLeft: 8 }}>Plateforme ↗</a>
              <input
                type="password"
                placeholder="sk-..."
                value={String(data.api_key_openai || "")}
                onChange={e => setData({ ...data, api_key_openai: e.target.value })}
                style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px" }}
              />
            </label>
          )}

          <hr style={{ border: 0, borderTop: "1px solid var(--admin-line)", margin: "10px 0" }} />

          <label>
            System Prompt (Personnalité & Objectifs de l'IA)
            <textarea
              value={String(data.system_prompt || "")}
              onChange={e => setData({ ...data, system_prompt: e.target.value })}
              rows={6}
              placeholder="Ex: Tu es l'assistant de Landry..."
              style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px", resize: "vertical", fontFamily: "inherit" }}
            />
          </label>

          <label>
            Règles de style et SEO
            <textarea
              value={String(data.seo_rules || "")}
              onChange={e => setData({ ...data, seo_rules: e.target.value })}
              rows={4}
              placeholder="Ex: 1. Les titres doivent faire moins de 60 caractères..."
              style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px", resize: "vertical", fontFamily: "inherit" }}
            />
          </label>
        </div>
        
        <button className="admin-button" type="submit" style={{ marginTop: "24px", alignSelf: "flex-start", background: "var(--admin-blue)" }}>
          <Save size={16} /> Enregistrer la configuration
        </button>
      </form>
    </section>
  );
}

function SingletonEditor({
  endpoint,
  title,
  setNotice,
}: {
  endpoint: "profile" | "settings" | "ai-settings";
  title: string;
  setNotice: (notice: string) => void;
}) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    setLoading(true);
    request(`/admin/${endpoint}`)
      .then((res) => setData(res || {}))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, [endpoint]);

  const save = async () => {
    try {
      await request(`/admin/${endpoint}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setNotice("Paramètres enregistrés avec succès.");
    } catch {
      setNotice("Erreur lors de l'enregistrement.");
    }
  };

  const updateField = (key: string, value: string | boolean | number) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const deleteField = (key: string) => {
    setData((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addField = () => {
    const key = newKey.trim();
    if (key && data[key] === undefined) {
      setData((prev) => ({ ...prev, [key]: "" }));
      setNewKey("");
    }
  };

  if (loading) {
    return (
      <section className="admin-content">
        <div className="editor-panel singleton" style={{ opacity: 0.7 }}>
          Chargement des données...
        </div>
      </section>
    );
  }

  return (
    <section className="admin-content">
      <div className="editor-panel singleton">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="admin-eyebrow">Source publique</span>
            <h3>{title}</h3>
          </div>
        </div>
        <p>Ces données seront disponibles pour le portfolio public.</p>
        
        <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
          {Object.entries(data).map(([key, val]) => (
            <div key={key} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <label style={{ flex: 1 }}>
                <span style={{ color: "var(--admin-lime)", fontFamily: "Space Mono", fontSize: ".7rem", textTransform: "uppercase" }}>{key}</span>
                {typeof val === "boolean" ? (
                  <select
                    value={val ? "true" : "false"}
                    onChange={(e) => updateField(key, e.target.value === "true")}
                    style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px" }}
                  >
                    <option value="true">Vrai (Oui)</option>
                    <option value="false">Faux (Non)</option>
                  </select>
                ) : (
                  <textarea
                    value={String(val)}
                    onChange={(e) => updateField(key, e.target.value)}
                    rows={String(val).length > 60 ? 3 : 1}
                    style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px", resize: "vertical", fontFamily: "inherit" }}
                  />
                )}
              </label>
              <button
                className="icon-button danger"
                style={{ marginTop: "24px" }}
                onClick={() => deleteField(key)}
                title="Supprimer ce champ"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {Object.keys(data).length === 0 && (
            <div style={{ color: "var(--admin-muted)", fontSize: ".85rem", padding: "20px 0" }}>
              Aucun champ défini. Ajoutez-en un pour commencer.
            </div>
          )}
        </div>
        
        {/* Ajout d'un nouveau champ */}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <input
            type="text"
            placeholder="Nouveau champ (ex: bio)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addField()}
            style={{ flex: 1, padding: "8px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px" }}
          />
          <button className="admin-button admin-button-light" onClick={addField} style={{ padding: "8px 16px" }}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
        
        <button className="admin-button" onClick={() => void save()} style={{ marginTop: "20px", alignSelf: "flex-start" }}>
          <Save size={16} /> Enregistrer
        </button>
      </div>
    </section>
  );
}

function Messages({
  messages,
  reload,
  setNotice,
}: {
  messages: Record<string, unknown>[];
  reload: () => void;
  setNotice: (notice: string) => void;
}) {
  const toggle = async (id: number, isRead: boolean) => {
    await request(`/admin/messages/${id}/read`, {
      method: "PATCH",
      body: JSON.stringify({ isRead: !isRead }),
    });
    setNotice("Statut du message mis à jour.");
    reload();
  };
  const remove = async (id: number) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    await request(`/admin/messages/${id}`, { method: "DELETE" });
    reload();
  };
  return (
    <section className="admin-content">
      <div className="messages-list">
        {messages.map((message) => (
          <article
            className={
              !message.is_read ? "message-card is-unread" : "message-card"
            }
            key={String(message.id)}
          >
            <div className="message-meta">
              <span>
                {String(message.name)} · {String(message.email)}
              </span>
              <small>
                {new Date(String(message.created_at)).toLocaleString("fr-FR")}
              </small>
            </div>
            <h3>{String(message.subject)}</h3>
            <p>{String(message.message)}</p>
            <div className="row-actions">
              <button
                className="text-button"
                onClick={() =>
                  void toggle(Number(message.id), Boolean(message.is_read))
                }
              >
                {message.is_read ? "Marquer non lu" : "Marquer lu"}
              </button>
              <button
                className="icon-button danger"
                onClick={() => void remove(Number(message.id))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        {messages.length === 0 && (
          <div className="empty-table">Aucun message reçu.</div>
        )}
      </div>
    </section>
  );
}

export default AdminApp;
