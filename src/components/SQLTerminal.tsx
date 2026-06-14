import React, { useState } from "react";
import { Play, RotateCcw, Copy, Check, Terminal, FileCode2, HelpCircle } from "lucide-react";

interface SQLTerminalProps {
  sqlText: string;
  setSqlText: (val: string) => void;
  onExecute: (sql: string) => void;
  consoleHistory: string[];
  clearConsole: () => void;
  loadOriginalScript: () => void;
}

export default function SQLTerminal({
  sqlText,
  setSqlText,
  onExecute,
  consoleHistory,
  clearConsole,
  loadOriginalScript,
}: SQLTerminalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickCommands = [
    {
      label: "Consultar Alunos",
      sql: "SELECT * FROM ALUNO;",
      desc: "Busca todos os registros salvos",
    },
    {
      label: "Inserir Novo Aluno",
      sql: "INSERT INTO ALUNO (nome, `e-mail`, endereco)\nVALUES ('Sofia Santos', 'sofia@escola.com', 'Rua das Flores, 123');",
      desc: "Adiciona uma linha na tabela ALUNO",
    },
    {
      label: "Atualizar Endereço",
      sql: "UPDATE ALUNO SET endereco = 'Av. Paulista, 1500' WHERE ID = 1;",
      desc: "Altera o endereço do aluno com ID = 1",
    },
    {
      label: "Descartar Banco",
      sql: "DROP DATABASE ESCOLA;",
      desc: "Deleta o banco e reinicia o estado",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl" id="sql-terminal-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="text-emerald-400 w-5 h-5 animate-pulse" />
          <span className="font-mono text-sm font-semibold text-slate-200">Terminal SQL Interativo</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOriginalScript}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded-md border border-emerald-800/45 transition-colors"
            title="Carregar script SQL original do exercício"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Ver Script Escola</span>
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition-colors"
            title="Copiar código SQL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={clearConsole}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-250 rounded-md transition-colors"
            title="Limpar console"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor & Templates Panel */}
      <div className="flex flex-col md:grid md:grid-cols-4 flex-1 overflow-hidden min-h-[420px]">
        {/* Editor Area */}
        <div className="md:col-span-3 flex flex-col border-r border-slate-800 relative h-full">
          <textarea
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            className="flex-1 w-full p-4 bg-slate-950 font-mono text-slate-100 text-sm focus:outline-none resize-none placeholder-slate-600 focus:ring-1 focus:ring-emerald-500/30"
            placeholder="-- Digite os comandos SQL aqui...&#13;-- Exemplo:&#13;CREATE DATABASE ESCOLA;&#13;USE ESCOLA;"
            spellCheck="false"
            id="sql-code-editor"
          />
          <div className="absolute right-4 bottom-4">
            <button
              onClick={() => onExecute(sqlText)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm rounded-lg shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all"
              id="execute-query-btn"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Executar SQL</span>
            </button>
          </div>
        </div>

        {/* Quick Snippets Side Rail */}
        <div className="p-4 bg-slate-900/60 overflow-y-auto space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <FileCode2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Atalhos rápidos</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Clique nos comandos para carregá-los rapidamente no editor de código:
            </p>
            <div className="space-y-2">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => setSqlText(cmd.sql)}
                  className="w-full text-left p-2.5 bg-slate-950/80 hover:bg-slate-950 hover:border-emerald-500/40 border border-slate-800 rounded-lg group transition-all"
                >
                  <p className="font-medium text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                    {cmd.label}
                  </p>
                  <code className="block mt-1 font-mono text-[10px] text-slate-500 truncate">
                    {cmd.sql.replace(/\n/g, " ")}
                  </code>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" /> Dica de Sintaxe:
            </span>
            As aspas craseadas (<code className="font-mono text-emerald-400 bg-slate-950 px-1 rounded">`e-mail`</code>) protegem o hífen no nome do atributo.
          </div>
        </div>
      </div>

      {/* Terminal Visual Log Box */}
      <div className="h-44 bg-black border-t border-slate-800 font-mono text-xs text-slate-300 p-4 overflow-y-auto" id="sql-terminal-logger">
        <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mb-2 border-b border-slate-900 pb-1.5 flex justify-between items-center">
          <span>Histórico de Saída (Console)</span>
          <span className="text-emerald-500 text-[9px] lowercase bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900">online</span>
        </div>
        {consoleHistory.length === 0 ? (
          <div className="text-slate-600 italic">Console do Banco vazio. Escreva sua instrução SQL acima e aperte "Executar SQL"!</div>
        ) : (
          consoleHistory.map((log, index) => (
            <div
              key={index}
              className={`whitespace-pre-wrap leading-relaxed py-0.5 ${
                log.startsWith("mysql>")
                  ? "text-slate-400 font-semibold"
                  : log.startsWith("Erro")
                  ? "text-rose-400 font-medium"
                  : log.includes("Query OK") || log.includes("sucesso")
                  ? "text-emerald-400 font-medium"
                  : "text-slate-300"
              }`}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
