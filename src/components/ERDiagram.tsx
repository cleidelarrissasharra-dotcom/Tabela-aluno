import React from "react";
import { Key, Eye, HelpCircle, TableProperties, Network } from "lucide-react";
import { SQLState } from "../types";

interface ERDiagramProps {
  state: SQLState;
}

export default function ERDiagram({ state }: ERDiagramProps) {
  const activeDbName = state.currentDb || "Nenhum Banco Selecionado";
  const hasEscola = !!state.databases["ESCOLA"];
  const hasAluno = !!state.databases["ESCOLA"]?.tables["ALUNO"];
  const alunoTable = state.databases["ESCOLA"]?.tables["ALUNO"];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-md" id="er-diagram-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 bg-slate-50 border-b border-slate-200">
        <Network className="text-indigo-600 w-5 h-5" />
        <span className="font-semibold text-slate-800 text-sm">Diagrama Entidade-Relacionamento (ERD)</span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-normal">
            Visualize as conexões lógicas e as restrições físicas de integridade definidas pelo seu script SQL no banco ativo:
          </p>

          {/* Canvas Wrapper */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-900 relative shadow-inner min-h-[280px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

            {!hasEscola ? (
              <div className="text-center z-10 p-4">
                <p className="text-slate-400 font-medium text-xs">Aguardando a criação do banco de dados...</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-xs font-mono font-bold">CREATE DATABASE ESCOLA;</p>
              </div>
            ) : !hasAluno ? (
              <div className="text-center z-10 p-4 space-y-2">
                <div className="bg-emerald-950/40 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-900 text-[11px] font-semibold max-w-sm inline-block font-mono">
                  DATABASE ESCOLA: ATIVO
                </div>
                <p className="text-slate-400 text-xs">Crie a tabela ALUNO para renderizar a entidade no diagrama.</p>
                <p className="text-[10px] text-slate-600 font-mono">CREATE TABLE ALUNO ( ... );</p>
              </div>
            ) : (
              <div className="z-10 flex flex-col items-center space-y-6 w-full max-w-sm">
                {/* School Database Context Bubble */}
                <div className="bg-indigo-950/80 border border-indigo-700/60 rounded-full px-4 py-1 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  <span className="font-mono text-[10px] font-bold text-indigo-200 uppercase tracking-wider">BANCO DE DADOS: ESCOLA</span>
                </div>

                {/* Table Box (Visual Entity) */}
                <div className="w-full bg-slate-900/95 border-2 border-emerald-500/80 rounded-xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-200">
                  {/* Table title bar */}
                  <div className="bg-emerald-600 text-slate-950 px-3.5 py-2 font-mono text-xs font-black uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TableProperties className="w-4 h-4 text-slate-950" />
                      ALUNO
                    </span>
                    <span className="text-[9px] bg-slate-950 text-emerald-400 px-1.5 py-0.5 rounded font-bold">TABELA</span>
                  </div>

                  {/* Attributes lines */}
                  <div className="divide-y divide-slate-800 p-1 font-mono text-xs">
                    {alunoTable?.columns.map((c) => {
                      return (
                        <div key={c.name} className="flex items-center justify-between px-3 py-2 hover:bg-slate-800/40">
                          <div className="flex items-center gap-1.5">
                            {c.primaryKey ? (
                              <Key className="w-3.5 h-3.5 text-amber-400 fill-amber-400/10 shrink-0" title="Chave Primária" />
                            ) : (
                              <span className="w-3.5 h-3.5 shrink-0 block"></span>
                            )}
                            <span className={`text-[11px] ${c.primaryKey ? "text-amber-300 font-bold" : "text-slate-100"}`}>
                              {c.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">{c.type.toLowerCase()}</span>
                            {!c.nullable && (
                              <span className="text-[8px] bg-sky-950 text-indigo-300 px-1 py-0.2 rounded border border-indigo-900 font-sans" title="Não permite valores nulos">
                                NN
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated ER Relationship indicator */}
                <div className="flex justify-center text-center">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Chave Primária Ativa: <code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded">ID (Auto-Incremento)</code>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend Panel & DB concepts summary */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            Significados no Diagrama de Dados
          </h4>
          <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-600">
            <div className="flex items-start gap-2">
              <Key className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong>PK (Primary Key):</strong> Garante que cada Aluno tenha um identificador único, evitando nomes duplicados sem distinção oficial.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[9px] bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-bold shrink-0 mt-0.5">NN</span>
              <div>
                <strong>NN (Not Null):</strong> Campos que nunca podem ser dadas sem preencher (como Nome e E-mail), resguardando a completitude cadastral.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
