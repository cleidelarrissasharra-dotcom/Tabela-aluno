import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { ChatMessage, SQLState } from "../types";

interface AIChatTutorProps {
  state: SQLState;
}

export default function AIChatTutor({ state }: AIChatTutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Olá! Sou o seu **Tutor SQL Inteligente** 🎓\n\nEstou aqui para ajudar você a entender bancos de dados relacionais e os comandos SQL do seu exercício de criação do banco **ESCOLA** e tabela **ALUNO**.\n\nSinta-se à vontade para me perguntar qualquer dúvida! Por exemplo: *'Por que usamos aspas na coluna e-mail?'* ou *'Como inserir dados nessa tabela?'*.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch("/api/gemini/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          sqlContext: {
            currentDatabase: state.currentDb,
            databasesConfigured: Object.keys(state.databases).map((dbName) => {
              const db = state.databases[dbName];
              return {
                name: dbName,
                tables: Object.keys(db.tables).map((tName) => {
                  const table = db.tables[tName];
                  return {
                    name: tName,
                    columns: table.columns.map((c) => ({
                      name: c.name,
                      type: c.type,
                      primaryKey: c.primaryKey,
                      nullable: c.nullable,
                      autoIncrement: c.autoIncrement,
                    })),
                    rowCount: table.rows.length,
                  };
                }),
              };
            }),
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Erro de rede ao consultar o Tutor de IA.");
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.text || "Desculpe, não consegui formular uma explicação.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Erro para conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage(inputText);
    }
  };

  const topicChips = [
    { label: "O que é AUTO_INCREMENT?", q: "Explique o que o INT AUTO_INCREMENT faz e por que usamos no atributo ID." },
    { label: "Por que aspas em e-mail?", q: "Por que delimitamos a coluna `e-mail` com aspas graves/crases?" },
    { label: "Como funciona PRIMARY KEY?", q: "Explique de forma didática o conceito de Chave Primária (PRIMARY KEY)." },
    { label: "Como fazer INSERT?", q: "Mostre um exemplo prático de comando INSERT de alunos para inserirmos no simulador." },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-md" id="ai-chat-tutor-container">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 bg-slate-900 border-b border-slate-800 text-white justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/35 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white">Tutor SQL Inteligente</h3>
            <span className="text-[10px] text-emerald-400 font-medium">Resposta instantânea via Gemini</span>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[460px] min-h-[300px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar block */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                msg.sender === "user" ? "bg-slate-800 text-white" : "bg-emerald-600 text-slate-100"
              }`}
            >
              {msg.sender === "user" ? "U" : "T"}
            </div>

            {/* Bubble */}
            <div
              className={`p-3 rounded-2xl flex flex-col space-y-1 shadow-sm text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-slate-800 text-white rounded-tr-none"
                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-wrap markdown-body"
              }`}
            >
              <div>{msg.text}</div>
              <span className={`text-[9px] self-end pt-0.5 ${msg.sender === "user" ? "text-slate-400" : "text-slate-400"}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 mr-auto bg-slate-100/60 p-3 rounded-2xl border border-slate-200 shadow-sm max-w-[70%] animate-pulse">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
            <span className="text-slate-500 text-xs font-medium italic">Formatando explicação didática...</span>
          </div>
        )}

        {errorStatus && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 max-w-[90%]">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Não foi possível consultar a IA</p>
              <p className="mt-0.5 leading-relaxed text-[11px]">{errorStatus}</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested chips list */}
      <div className="px-4 pb-2 pt-1 border-t border-slate-150 bg-slate-100/50">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5 pt-1">
          <HelpCircle className="w-3 h-3 text-slate-400" /> Dúvidas frequentes:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {topicChips.map((chip, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => sendMessage(chip.q)}
              className="text-[10px] bg-white group hover:bg-slate-900 border border-slate-200 hover:border-slate-800 hover:text-white px-2.5 py-1 rounded-full text-slate-600 transition-all font-medium disabled:opacity-50 text-left shrink-0 cursor-pointer"
            >
              <span className="group-hover:text-emerald-400 font-semibold mr-0.5">#</span>
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input row */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-1.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
          placeholder="Pergunte ao tutor SQL (ex. o que é VARCHAR?)..."
          className="flex-1 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 rounded-xl text-xs text-slate-800 focus:outline-none transition-colors"
          id="chat-input"
        />
        <button
          onClick={() => sendMessage(inputText)}
          disabled={!inputText.trim() || loading}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md disabled:bg-slate-100 disabled:text-slate-450 transition-all"
          id="chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
