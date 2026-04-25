

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from "react";
import { useQueue }    from "../../context/QueueContext";
import { useAuth }     from "../../context/AuthContext";
import { useServices } from "../../hooks/useServices";

// ── Types ─────────────────────────────────────────────────────────────────────
type Message = {
  role:    "user" | "assistant";
  content: string;
};

type GeminiRole = "user" | "model";  // Gemini uses "model" not "assistant"

type SmartTip = {
  icon:   string;
  title:  string;
  body:   string;
  colour: string;
};

// ── API key (from Vite env) ────────────────────────────────────────────────────
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? "";
const GEMINI_MODEL   = "gemini-2.5-flash";
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Smart recommendations (rules-based — identical across all AI variants) ────
function buildSmartTips(
  queue:    ReturnType<typeof useQueue>["queue"],
  services: ReturnType<typeof useServices>["services"],
  userId:   string | undefined,
): SmartTip[] {
  const tips: SmartTip[] = [];
  if (services.length === 0) return tips;

  const depths = services.map(s => ({
    service: s,
    inQueue: queue.filter(
      q => q.serviceId === s.id && q.status !== "served" && q.status !== "cancelled"
    ).length,
    estWait: 0,
  }));
  depths.forEach(d => { d.estWait = d.inQueue * d.service.expectedDuration; });

  // 1. Shortest wait
  const shortest = [...depths].sort((a, b) => a.estWait - b.estWait)[0];
  if (shortest) {
    tips.push({
      icon:   "⚡",
      title:  "Shortest Wait Right Now",
      body:   `${shortest.service.name} has the shortest wait (≈${shortest.estWait} min with ${shortest.inQueue} in queue). Consider joining this service first.`,
      colour: "bg-blue-50 border-blue-200 text-blue-800",
    });
  }

  // 2. Best time to join
  const totalInQueue = depths.reduce((s, d) => s + d.inQueue, 0);
  if (totalInQueue > 10) {
    tips.push({
      icon:   "🕐",
      title:  "Busy Period Detected",
      body:   `There are currently ${totalInQueue} people across all queues. Returning in 30–45 min may reduce your wait significantly.`,
      colour: "bg-yellow-50 border-yellow-200 text-yellow-800",
    });
  } else if (totalInQueue === 0) {
    tips.push({
      icon:   "🎯",
      title:  "Best Time to Join",
      body:   "All queues are empty right now — perfect time to walk in with zero wait!",
      colour: "bg-indigo-50 border-indigo-200 text-indigo-800",
    });
  } else {
    tips.push({
      icon:   "✅",
      title:  "Good Time to Join",
      body:   `Queues are light (${totalInQueue} total). Expected waits are short — now is a great time to join.`,
      colour: "bg-indigo-50 border-indigo-200 text-indigo-800",
    });
  }

  // 3. Alternative service suggestion
  if (userId) {
    const userEntries = queue.filter(
      q => q.userId === userId && q.status !== "cancelled" && q.status !== "served"
    );
    userEntries.forEach(entry => {
      const myDepth = depths.find(d => d.service.id === entry.serviceId);
      if (!myDepth) return;
      const betterAlts = depths.filter(
        d => d.service.id !== entry.serviceId && d.estWait < myDepth.estWait - 10
      );
      if (betterAlts.length > 0) {
        const best = betterAlts[0];
        tips.push({
          icon:   "💡",
          title:  "Alternative Service Available",
          body:   `You're waiting ${myDepth.estWait} min for ${myDepth.service.name}. "${best.service.name}" has only ≈${best.estWait} min wait — saving you ${myDepth.estWait - best.estWait} min.`,
          colour: "bg-violet-50 border-violet-200 text-violet-800",
        });
      }
    });
  }

  return tips.slice(0, 3);
}

// ── System prompt text ────────────────────────────────────────────────────────
// Gemini does not have a dedicated system message field.
// We inject context as the first "user" turn, followed by a synthetic
// "model" acknowledgement ("Understood."), then the real conversation.
// This is the recommended pattern for Gemini context injection.
function buildContextText(
  queue:    ReturnType<typeof useQueue>["queue"],
  services: ReturnType<typeof useServices>["services"],
  userName: string,
  userRole: string,
  userId:   string,
): string {
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const servicesSummary = services.map(s => {
    const inQueue = queue.filter(
      q => q.serviceId === s.id && q.status !== "cancelled" && q.status !== "served"
    ).length;
    const estWait = inQueue * s.expectedDuration;
    return `- ${s.name}: ${inQueue} people waiting, est. wait ${estWait} min (${s.expectedDuration} min/person, priority: ${s.priorityLevel})`;
  }).join("\n");

  const userEntries = queue.filter(
    q => q.userId === userId && q.status !== "cancelled" && q.status !== "served"
  );
  const userStatus = userEntries.length > 0
    ? userEntries.map(e => `  • ${e.serviceName}: ticket #${e.ticketNumber}, status: ${e.status}`).join("\n")
    : "  Not currently in any queue.";

  return `[SYSTEM CONTEXT — DO NOT REPEAT THIS IN YOUR RESPONSE]
You are QueueSmart Assistant — a helpful, concise AI assistant in a barber shop queue management app.
Current time: ${now}
User: ${userName} (role: ${userRole})

LIVE QUEUE DATA:
${servicesSummary || "No services available."}

CURRENT USER'S QUEUE STATUS:
${userStatus}

INSTRUCTIONS:
- Answer questions about wait times, queue status, and service recommendations using the live data above.
- Suggest the best service based on wait times and needs.
- Help users decide when to come back if queues are long.
- Keep answers brief (2–4 sentences max) and friendly.
- If asked something unrelated to the queue/barbershop, politely redirect.
- Always reference specific numbers from the live data.`;
}

// ── Convert our Message[] to Gemini contents format ───────────────────────────
// Gemini roles: "user" and "model" (not "assistant")
// Context injection: prepend a user turn with system text + a model "Understood." turn
function toGeminiContents(
  messages: Message[],
  contextText: string,
): { role: GeminiRole; parts: { text: string }[] }[] {
  const contents: { role: GeminiRole; parts: { text: string }[] }[] = [];

  // 1. Context injection (first user turn)
  contents.push({ role: "user",  parts: [{ text: contextText }] });
  contents.push({ role: "model", parts: [{ text: "Understood. I have the live queue data and I'm ready to help." }] });

  // 2. Actual conversation history (skip the initial greeting which is our own)
  messages.forEach(m => {
    // Gemini does not allow consecutive same-role turns — skip assistant-only opener
    const geminiRole: GeminiRole = m.role === "user" ? "user" : "model";
    contents.push({ role: geminiRole, parts: [{ text: m.content }] });
  });

  return contents;
}

// ── Main component ────────────────────────────────────────────────────────────
const SmartAssistantGemini: React.FC = () => {
  const { queue }    = useQueue();
  const { user }     = useAuth();
  const { services } = useServices();

  const [isOpen,    setIsOpen]    = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "tips">("tips");
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  const tips = useMemo(
    () => buildSmartTips(queue, services, user?.id),
    [queue, services, user?.id]
  );

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = user
        ? `Hi ${user.name.split(" ")[0]}! 👋 I'm your QueueSmart assistant (powered by Gemini). I can see the live queue data. Try: "How long will I wait?" or "Which service is quietest?"`
        : "Hi! I'm QueueSmart Assistant (Gemini). Ask me anything about wait times or services.";
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [isOpen, user]);

  // ── Gemini API call ───────────────────────────────────────────────────────
  // Endpoint : POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=API_KEY
  // Request  : { contents: [{role: "user"|"model", parts: [{text}]}] }
  //            NO separate system field — context is a "user" turn at the start
  // Response : data.candidates[0].content.parts[0].text
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    if (!GEMINI_API_KEY) {
      setError("Gemini API key not set. Add VITE_GEMINI_API_KEY to your .env file.");
      return;
    }

    const userMsg: Message = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const contextText = buildContextText(
        queue, services,
        user?.name || "Guest",
        user?.role || "user",
        user?.id   || "",
      );

      // Build Gemini contents array:
      // [ context_user, context_model_ack, ...conversation_history, user_message ]
      // Note: the last message (user_message) is already in newHistory
      const geminiContents = toGeminiContents(newHistory, contextText);

      const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            maxOutputTokens: 500,
            temperature:     0.7,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.error?.message || `Gemini error ${response.status}`;
        throw new Error(errMsg);
      }

      // Gemini response structure:
      // data.candidates[0].content.parts[0].text
      const assistantText: string =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        "Sorry, I couldn't generate a response.";

      setMessages(prev => [...prev, { role: "assistant", content: assistantText }]);
    } catch (err: any) {
      setError(err.message || "Unable to reach Gemini. Please try again.");
      console.error("SmartAssistant-Gemini error:", err);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, queue, services, user]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => { setMessages([]); setError(""); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Action Button (indigo = Gemini brand) ─────────────────── */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open QueueSmart AI Assistant (Gemini)"
        title="AI Assistant · Gemini"
        className={`
          fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center
          rounded-full bg-indigo-600 text-white shadow-xl
          transition-all duration-200 hover:bg-indigo-700 hover:scale-110
          ${isOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"}
        `}
      >
        {/* Gemini star / sparkle icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        {tips.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {tips.length}
          </span>
        )}
      </button>

      {/* ── Backdrop ──────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-in panel ────────────────────────────────────────────────────── */}
      <div
        className={`
          fixed bottom-0 right-0 z-50 flex flex-col
          w-full max-w-md h-[90vh] max-h-[640px]
          bg-white shadow-2xl rounded-t-2xl sm:rounded-2xl sm:bottom-6 sm:right-6 sm:h-[620px]
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"}
        `}
      >
        {/* ── Header (indigo = Gemini brand) ───────────────────────────────────── */}
        <div className="flex flex-shrink-0 items-center justify-between rounded-t-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">QueueSmart Assistant</p>
              <p className="text-xs text-indigo-200">Powered by Gemini 1.5 Flash · Live queue data</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0 border-b border-gray-100">
          {(["tips", "chat"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab === "tips"
                ? `💡 Smart Tips${tips.length > 0 ? ` (${tips.length})` : ""}`
                : "💬 Ask Gemini"}
            </button>
          ))}
        </div>

        {/* ── Smart Tips tab ────────────────────────────────────────────────────── */}
        {activeTab === "tips" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <p className="text-xs text-gray-500 text-center">
              Real-time recommendations based on live queue data
            </p>

            {tips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-4xl mb-3">🔍</span>
                <p className="text-sm">No services to analyse yet.</p>
              </div>
            ) : (
              tips.map((tip, i) => (
                <div key={i} className={`rounded-xl border p-4 ${tip.colour}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{tip.icon}</span>
                    <div>
                      <p className="text-sm font-semibold mb-1">{tip.title}</p>
                      <p className="text-xs leading-relaxed">{tip.body}</p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Live snapshot */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">📊 Live Queue Snapshot</p>
              {services.length === 0 ? (
                <p className="text-xs text-gray-400">No services available.</p>
              ) : (
                services.map(s => {
                  const inQ  = queue.filter(q => q.serviceId === s.id && q.status !== "cancelled" && q.status !== "served").length;
                  const wait = inQ * s.expectedDuration;
                  return (
                    <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-200 last:border-0">
                      <span className="text-xs text-gray-700 truncate max-w-[140px]">{s.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">{inQ} waiting</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          wait === 0 ? "bg-green-100 text-green-700" :
                          wait <= 30 ? "bg-blue-100 text-blue-700" :
                          wait <= 60 ? "bg-yellow-100 text-yellow-700" :
                                       "bg-red-100 text-red-700"
                        }`}>
                          {wait === 0 ? "No wait" : `~${wait} min`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <p className="text-center">
              <button
                onClick={() => setActiveTab("chat")}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Ask Gemini for personalised advice →
              </button>
            </p>
          </div>
        )}

        {/* ── Chat tab ──────────────────────────────────────────────────────────── */}
        {activeTab === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="mr-2 flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mt-0.5">
                      G
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    G
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div className="flex-shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
                {[
                  "How long will I wait?",
                  "Which service is quietest?",
                  "Should I come back later?",
                  "What's the best service for a quick trim?",
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); setTimeout(sendMessage, 50); }}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.length > 1 && (
              <div className="flex-shrink-0 px-4 pb-1 text-right">
                <button onClick={clearChat} className="text-xs text-gray-400 hover:text-gray-600 transition">
                  Clear chat
                </button>
              </div>
            )}

            <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about wait times, services…"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="mt-1.5 text-center text-xs text-gray-400">
                Powered by Gemini 1.5 Flash · Uses live queue data
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SmartAssistantGemini;
