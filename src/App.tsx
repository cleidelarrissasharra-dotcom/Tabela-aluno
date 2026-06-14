import React, { useState } from "react";
import { getInitialState, executeSQLScript } from "./utils/sqlEngine";
import SQLTerminal from "./components/SQLTerminal";
import DatabaseVisualizer from "./components/DatabaseVisualizer";
import GuidedTutorial from "./components/GuidedTutorial";
import ERDiagram from "./components/ERDiagram";
import AIChatTutor from "./components/AIChatTutor";
import { SQLState } from "./types";
import { Sparkles, BookOpen, Layers, Terminal as TerminalIcon, Database, CheckSquare, Trash2 } from "lucide-react";

const ORIGINAL_SCRIPT = `-- 1. Criar o banco de dados chamado ESCOLA
CREATE DATABASE ESCOLA;

-- Deixar o banco de dados pronto para o uso
USE ESCOLA;

-- 2. Criar a tabela chamada ALUNO com seus respectivos atributos
CREATE TABLE ALUNO (
    -- 3. Adicionar a chave primária de nome ID (identificador)
    ID INT AUTO_INCREMENT,
    
    -- 4. Adicionar um atributo nome do tipo varchar
    nome VARCHAR(255) NOT NULL,
    
    -- 5. Adicionar um atributo e-mail do tipo varchar
    \`e-mail\` VARCHAR(255) NOT NULL,
    
    -- 6. Adicionar um atributo endereço do tipo varchar
    endereco VARCHAR(255),
    
    -- Definindo explicitamente a chave primária
    PRIMARY KEY (ID)
);`;

export default function App() {
  const [dbState, setDbState] = useState<SQLState>(getInitialState());
  const [sqlText, setSqlText] = useState<string>(ORIGINAL_SCRIPT);
  const [consoleHistory, setConsoleHistory] = useState<string[]>([
    "=== SIMULADOR DE BANCO DE DADOS SGBD ESCOLA ===\nPronto para executar comandos SQL padrão.\nCarregue o exercício Escola ou crie do zero.\n================================================"
  ]);
  const [activeTab, setActiveTab] = useState<"tutorial" | "visualizer" | "diagram">("visualizer");

  /**
   * Run custom SQL commands and append results to console logs
   */
  const handleExecuteSQL = (query: string) => {
    if (!query.trim()) {
      setConsoleHistory((prev) => [...prev, "Erro: Editor vazio. Digite um comando SQL válido."]);
      return;
    }

    const result = executeSQLScript(query, dbState);
    setDbState(result.newState);
    setConsoleHistory((prev) => [...prev, ...result.consoleOutputs]);
  };

  /**
   * Reset database back to empty state
   */
  const handleResetDatabase = () => {
    setDbState(getInitialState());
    setConsoleHistory([
      "=== SIMULADOR REINICIADO ===\nTudo pronto. Escreva novos comandos SQL para começar de novo."
    ]);
  };

  /**
   * Loads the school homework script block and focuses visual tabs
   */
  const handleLoadHomeworkScript = () => {
    setSqlText(ORIGINAL_SCRIPT);
    setConsoleHistory((prev) => [
      ...prev,
      "mysql> -- O script SQL original do exercício ESCOLA foi carregado no editor! Clique em 'Executar SQL' para testar."
    ]);
  };

  const handleQuickLoadAndRun = (sql: string) => {
    setSqlText(sql);
    handleExecuteSQL(sql);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Professional Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black tracking-tighter shadow-md shadow-emerald-500/20">
            <span className="font-display text-lg">S</span>
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-tight text-white flex items-center gap-2">
              Simulador SQL Escola
              <span className="text-[10px] bg-emerald-500/25 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                SGBD Virtual v1.2
              </span>
            </h1>
            <p className="text-xs text-slate-400">Plataforma Interativa para Modelagem Relacional e Criação de Tabelas</p>
          </div>
        </div>

        {/* Database Quick Health Badges / Reset Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExecuteSQL(ORIGINAL_SCRIPT)}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Adiciona as tabelas e bancos originais de uma vez clicando aqui!"
          >
            Auto-Executar Script
          </button>
          <button
            onClick={handleResetDatabase}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-300 font-medium text-xs rounded-lg border border-slate-700/60 transition-all flex items-center gap-1 cursor-pointer"
            title="Limpar todos os bancos criados e recomeçar"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Resetar Banco</span>
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Interactive SQL Playground Area (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6 h-full">
          <SQLTerminal
            sqlText={sqlText}
            setSqlText={setSqlText}
            onExecute={handleExecuteSQL}
            consoleHistory={consoleHistory}
            clearConsole={() => setConsoleHistory([])}
            loadOriginalScript={handleLoadHomeworkScript}
          />
        </div>

        {/* Right Active DB Visualization Panel + Lessons (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6 h-full overflow-hidden">
          {/* Navigation Tab bar */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
            <button
              onClick={() => setActiveTab("visualizer")}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "visualizer"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Dados & Tabelas</span>
            </button>
            <button
              onClick={() => setActiveTab("tutorial")}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "tutorial"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Desafios</span>
            </button>
            <button
              onClick={() => setActiveTab("diagram")}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "diagram"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Diagrama ER</span>
            </button>
          </div>

          {/* Active Tab View Component */}
          <div className="flex-1 min-h-[460px] relative">
            <div className={`absolute inset-0 transition-all duration-250 ${activeTab === "visualizer" ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"}`}>
              <DatabaseVisualizer state={dbState} onRunTemplate={handleQuickLoadAndRun} />
            </div>
            <div className={`absolute inset-0 transition-all duration-250 ${activeTab === "tutorial" ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"}`}>
              <GuidedTutorial state={dbState} onLoadSQL={setSqlText} />
            </div>
            <div className={`absolute inset-0 transition-all duration-250 ${activeTab === "diagram" ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"}`}>
              <ERDiagram state={dbState} />
            </div>
          </div>
        </div>

        {/* Floating Chat/Tutor Panel below columns (spanning 12 cols for readability or side column depending on size) */}
        <div className="lg:col-span-12 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <AIChatTutor state={dbState} />
          </div>
        </div>
      </main>

      {/* Styled minimalistic footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        Desenvolvido para fins pedagógicos de banco de dados • Atividade Resolvida: <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono font-bold">ALUNO (ID, nome, e-mail, endereco)</code>
      </footer>
    </div>
  );
}
