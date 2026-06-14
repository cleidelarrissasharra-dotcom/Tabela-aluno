import React, { useState, useEffect } from "react";
import { Database, Table, Key, Info, HelpCircle, Columns, Layers } from "lucide-react";
import { SQLState } from "../types";

interface DatabaseVisualizerProps {
  state: SQLState;
  onRunTemplate: (sql: string) => void;
}

export default function DatabaseVisualizer({ state, onRunTemplate }: DatabaseVisualizerProps) {
  const dbsList = Object.keys(state.databases);
  const activeDbName = state.currentDb;
  const activeDb = activeDbName ? state.databases[activeDbName] : null;
  const tablesList = activeDb ? Object.keys(activeDb.tables) : [];
  
  // Set selected table based on availability
  const [selectedTable, setSelectedTable] = useState<string>("");

  useEffect(() => {
    if (tablesList.length > 0) {
      if (!selectedTable || !tablesList.includes(selectedTable)) {
        setSelectedTable(tablesList[0]);
      }
    } else {
      setSelectedTable("");
    }
  }, [tablesList, selectedTable]);

  const activeTable = activeDb && selectedTable ? activeDb.tables[selectedTable] : null;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-md" id="db-visualizer-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Database className="text-emerald-600 w-5 h-5" />
          <span className="font-semibold text-slate-800 text-sm">Visualizador do SGDB</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium font-mono">
            DB Ativo: {activeDbName ? (
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{activeDbName}</span>
            ) : (
              <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded">NENHUM</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {/* Databases Listing Row */}
        <div>
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <Layers className="w-3.5 h-3.5" /> Bancos de Dados Existentes
          </span>
          {dbsList.length === 0 ? (
            <div className="p-3 bg-amber-50 rounded-lg text-amber-800 border border-amber-200 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                Nenhum banco de dados criado ainda. Use o comando <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">CREATE DATABASE ESCOLA;</code> no console ou clique no tutorial ao lado para iniciar!
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dbsList.map((db) => {
                const isActive = db === activeDbName;
                return (
                  <button
                    key={db}
                    onClick={() => {
                      onRunTemplate(`USE ${db};`);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border transition-all ${
                      isActive
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{db}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected DB Panel */}
        {activeDb ? (
          <div className="space-y-6">
            {/* Tables selector */}
            <div>
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                <Table className="w-3.5 h-3.5" /> Tabelas em {activeDbName}
              </span>
              {tablesList.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-sm text-slate-500 mb-2">Nenhuma tabela criada neste banco de dados.</p>
                  {activeDbName === "ESCOLA" && (
                    <button
                      onClick={() =>
                        onRunTemplate(`CREATE TABLE ALUNO (
  ID INT AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  \`e-mail\` VARCHAR(255) NOT NULL,
  endereco VARCHAR(255),
  PRIMARY KEY (ID)
);`)
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 rounded transition-colors"
                    >
                      <Table className="w-3.5 h-3.5" /> Criar tabela ALUNO padrão
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 border-b border-slate-100 pb-2">
                  {tablesList.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTable(t)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        selectedTable === t
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Table Details */}
            {activeTable && (
              <div className="space-y-5 animate-fadeIn">
                {/* Columns Definition List */}
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <Columns className="w-3.5 h-3.5" /> Estrutura da Tabela ({selectedTable})
                  </span>
                  <div className="overflow-x-auto border border-slate-200/60 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-100">
                          <th className="px-3 py-2">Coluna</th>
                          <th className="px-3 py-2">Tipo</th>
                          <th className="px-3 py-2 text-center">Chave</th>
                          <th className="px-3 py-2 text-center">Nulo</th>
                          <th className="px-3 py-2">Extra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-mono">
                        {activeTable.columns.map((c) => (
                          <tr key={c.name} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-medium text-slate-900">{c.name}</td>
                            <td className="px-3 py-2 text-indigo-600">{c.type}</td>
                            <td className="px-3 py-2 text-center">
                              {c.primaryKey && (
                                <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 text-[9px] font-semibold uppercase font-sans">
                                  <Key className="w-2.5 h-2.5 text-amber-600" /> PK
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center text-[10px]">
                              {c.nullable ? (
                                <span className="text-slate-400 font-sans">YES</span>
                              ) : (
                                <span className="text-rose-600 font-semibold font-sans text-[9px] bg-rose-50 border border-rose-100 px-1 py-0.5 rounded">NOT NULL</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-500 text-[10px]">
                              {c.autoIncrement ? "auto_increment" : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Data Grid Row */}
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <Table className="w-3.5 h-3.5" /> Visualização dos Dados (Contém {activeTable.rows.length} linha(s))
                  </span>
                  {activeTable.rows.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                      <p className="text-xs mb-3">Tabela vazia. Nenhuma linha inserida ainda.</p>
                      <button
                        onClick={() =>
                          onRunTemplate(
                            `INSERT INTO ALUNO (nome, \`e-mail\`, endereco) VALUES ('Ana Silva', 'ana@email.com', 'Rua São João, 45'), ('Carlos Souz', 'carlos@escola.com', 'Av Principal, 10');`
                          )
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold hover:border-slate-300 text-slate-700 rounded-lg hover:shadow-sm"
                      >
                        Popular Alunos Exemplo
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-semibold text-xs border-b border-slate-800">
                            {activeTable.columns.map((col) => (
                              <th key={col.name} className="px-3.5 py-2.5 font-mono">
                                {col.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {activeTable.rows.map((row, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              {activeTable.columns.map((col) => (
                                <td key={col.name} className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                                  {row[col.name] === null || row[col.name] === undefined ? (
                                    <span className="text-slate-300 italic font-mono">NULL</span>
                                  ) : (
                                    String(row[col.name])
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-3">
            <Database className="w-12 h-12 text-slate-300 stroke-[1.5]" />
            <div>
              <p className="font-semibold text-slate-700">Nenhum banco de dados em uso</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Execute <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">CREATE DATABASE ESCOLA;</code> e depois <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">USE ESCOLA;</code> no terminal para ativar o banco principal.
              </p>
            </div>
            <button
              onClick={() => onRunTemplate(`CREATE DATABASE ESCOLA;\nUSE ESCOLA;`)}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors pt-2 underline"
            >
              Criar e Ativar Escola Automaticamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
