type ChatMessage = { role: "user" | "assistant"; text: string; isError?: boolean; proposals?: any[] };

function inferProposalFromText(text: string) {
  const lower = text.toLowerCase();
  let type: ContentType | null = null;

  if (/(projet|project|réalisation|case study|portfolio)/.test(lower)) type = "project";
  else if (/(compétence|skill|expertise|formation|stack)/.test(lower)) type = "skill";
  else if (/(technolog|tech|framework|langage|stack|library)/.test(lower)) type = "technology";
  else if (/(service|prestation|offre|mission)/.test(lower)) type = "service";
  else if (/(timeline|parcours|expérience|cv|historique|experience)/.test(lower)) type = "timeline";
  else if (/(réseau|social|linkedin|instagram|github|twitter|x|network)/.test(lower)) type = "social";

  const firstLine = String(text).split(/\n/)[0].trim();
  const title =
    firstLine.length > 5 && firstLine.length < 120 ? firstLine : type ? `Nouvelle ${type}` : "Nouvelle proposition IA";

  return {
    type: type ?? "project",
    title,
    data: { description: text.slice(0, 200) },
  };
}

function AiChatBubble({ setNotice, onContentChanged }: { setNotice: (msg: string) => void; onContentChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishPayload, setPublishPayload] = useState<{ type?: ContentType; title: string; data: any } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("ai_chat_history");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ role: "assistant", text: "Bonjour ! Je suis ton assistant IA intégré. Je connais tout ton portfolio et je peux créer ou améliorer ton contenu. Que veux-tu faire ?" }];
  });

  React.useEffect(() => {
    localStorage.setItem("ai_chat_history", JSON.stringify(messages));
  }, [messages]);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const openPublishModalForMessage = (msgText: string) => {
    const inferred = inferProposalFromText(msgText);
    setPublishPayload({
      type: inferred.type,
      title: inferred.title,
      data: inferred.data,
    });
    setPublishModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!publishPayload) return;
    try {
      setThinking(true);
      await request("/admin/items", {
        method: "POST",
        body: JSON.stringify({
          type: publishPayload.type,
          title: publishPayload.title,
          data: publishPayload.data,
          published: true,
          visible: true,
        }),
      });
      setNotice(`Le contenu '${publishPayload.title}' a été publié.`);
      onContentChanged?.();
      setPublishModalOpen(false);
      setPublishPayload(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Erreur lors de la publication.");
    } finally {
      setThinking(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    const newMsg: ChatMessage = { role: "user", text };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setThinking(true);

    try {
      const allMsgs = [...messages, newMsg].filter((m) => !m.isError);
      const firstUserIdx = allMsgs.findIndex((m) => m.role === "user");
      const history = allMsgs
        .slice(firstUserIdx >= 0 ? firstUserIdx : 0)
        .map((m) => ({ role: m.role, content: m.text }));

      const response = await request("/admin/chat", {
        method: "POST",
        body: JSON.stringify({ messages: history }),
      });

      const responseText = response?.message?.text || "Traitement terminé.";
      const toolsExecuted: string[] = (response?.steps ?? []).flatMap(
        (step: any) => (step.toolCalls ?? []).map((tc: any) => tc.toolName as string),
      );
      const didCreateOrUpdate = toolsExecuted.some((t) => t === "updateContent");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: responseText,
        },
      ]);

      if (didCreateOrUpdate) {
        onContentChanged?.();
        setNotice("Contenu mis à jour par l'IA. La liste a été rechargée.");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erreur de connexion.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Erreur : ${errMsg}`,
          isError: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const clearChat = () => {
    const init = [{ role: "assistant", text: "Nouvelle conversation. Comment puis-je t'aider ?" }] as ChatMessage[];
    setMessages(init);
    localStorage.setItem("ai_chat_history", JSON.stringify(init));
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
                {msg.role === "assistant" && !msg.isError && (
                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={() => openPublishModalForMessage(msg.text)}
                      style={{ background: "var(--admin-lime)", color: "black", border: "none", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: "0.9em" }}
                    >
                      Valider et publier
                    </button>
                  </div>
                )}
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
          <form className="ai-chat-input-area" onSubmit={(e) => void sendMessage(e)}>
            <input
              type="text"
              placeholder="Ex: Crée un projet React avec description SEO..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={thinking}
            />
            <button type="submit" aria-label="Envoyer" disabled={thinking || !input.trim()}>
              <SendHorizontal size={18} />
            </button>
          </form>
        </div>
      )}

      {publishModalOpen && publishPayload && (
        <div className="sidebar-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="editor-panel" style={{ width: 520, maxWidth: "95%", margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Valider et publier</h3>
              <button
                className="icon-button"
                onClick={() => {
                  setPublishModalOpen(false);
                  setPublishPayload(null);
                }}
              >
                <X size={16} />
              </button>
            </div>

            <label>
              Type
              <select
                value={publishPayload.type}
                onChange={(e) => setPublishPayload({ ...publishPayload, type: e.target.value as ContentType })}
                style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px" }}
              >
                <option value="project">Projet</option>
                <option value="skill">Compétence</option>
                <option value="technology">Technologie</option>
                <option value="service">Service</option>
                <option value="timeline">Parcours</option>
                <option value="social">Réseau</option>
              </select>
            </label>

            <label style={{ marginTop: 12 }}>
              Titre
              <input
                value={publishPayload.title}
                onChange={(e) => setPublishPayload({ ...publishPayload, title: e.target.value })}
                style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px" }}
              />
            </label>

            <label style={{ marginTop: 12 }}>
              Description
              <textarea
                value={String(publishPayload.data?.description ?? "")}
                onChange={(e) =>
                  setPublishPayload({
                    ...publishPayload,
                    data: { ...publishPayload.data, description: e.target.value },
                  })
                }
                rows={4}
                style={{ width: "100%", padding: "10px", marginTop: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--admin-line)", color: "white", borderRadius: "8px", resize: "vertical" }}
              />
            </label>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                className="admin-button admin-button-light"
                onClick={() => {
                  setPublishModalOpen(false);
                  setPublishPayload(null);
                }}
              >
                Annuler
              </button>
              <button className="admin-button" onClick={() => void handleConfirmPublish()}>
                <Save size={14} /> Publier
              </button>
            </div>
          </div>
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

export default AdminApp;
