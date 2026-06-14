import React from "react";
import { CheckCircle2, Circle, ArrowRight, HelpCircle, Code, Lightbulb } from "lucide-react";
import { SQLState } from "../types";

interface GuidedTutorialProps {
  state: SQLState;
  onLoadSQL: (sql: string) => void;
}

export default function GuidedTutorial({ state, onLoadSQL }: GuidedTutorialProps) {
  // Compute progress on each step reactively
  const hasEscolaDB = !!state.databases["ESCOLA"];
  const isUsingEscola = state.currentDb === "ESCOLA";
  const hasAlunoTable = !!(state.databases["ESCOLA"]?.tables["ALUNO"]);
  
  const hasSampleData = !!(
    state.databases["ESCOLA"]?.tables["ALUNO"] &&
    state.databases["ESCOLA"]?.tables["ALUNO"]?.rows.length > 0
  );

  const steps = [
    {
      id: "create_db",
      title: "1. Criar o Banco de Dados ESCOLA",
      description: "Crie o espaço reservado para guardar as tabelas.",
      sql: "CREATE DATABASE ESCOLA;",
      isCompleted: hasEscolaDB,
      hint: "O comando CREATE DATABASE serve para criar um novo banco de dados vazio.",
      explanation: "No SQL, instruímos o SGBD para reservar um espaço de armazenamento nomeado. O ';' ao final indica o fechamento da instrução."
    },
    {
      id: "use_db",
      title: "2. Selecionar o Banco para Uso",
      description: "Instrua o simulador a entrar no banco de dados recém-criado.",
      sql: "USE ESCOLA;",
      isCompleted: isUsingEscola,
      hint: "O comando USE define qual banco de dados receberá as criações de tabelas seguintes.",
      explanation: "Sem carregar o USE, o servidor não saberá em qual gaveta (banco) gravar os novos dados e emitirá um erro de referência."
    },
    {
      id: "create_table",
      title: "3. Criar a Tabela ALUNO",
      description: "Escreva o comando DDl de criação com chaves e atributos.",
      sql: `CREATE TABLE ALUNO (
    ID INT AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    \`e-mail\` VARCHAR(255) NOT NULL,
    endereco VARCHAR(255),
    PRIMARY KEY (ID)
);`,
      isCompleted: hasAlunoTable,
      hint: "Utilize AUTO_INCREMENT para o ID e envolva a coluna e-mail com aspas graves.",
      explanation: "Note o uso da crase (`e-mail`). Ela é mandatória porque o hífen (-) é um caractere especial de subtração em SQL. O ID é definido como PRIMARY KEY para garantir unicidade e integridade."
    },
    {
      id: "insert_rows",
      title: "4. Desafio: Inserir Alunos Exemplo",
      description: "Insira os primeiros registros para testar os incrementos.",
      sql: `INSERT INTO ALUNO (nome, \`e-mail\`, endereco)
VALUES ('Ana Souza', 'ana@escola.com', 'Rua das Flores, 123');`,
      isCompleted: hasSampleData,
      hint: "Use o INSERT INTO ALUNO especificando os nomes dos campos entre parênteses.",
      explanation: "Como definimos o ID como AUTO_INCREMENT, não precisamos passá-lo no VALUES do INSERT. Ele será recalculado automaticamente para 1, depois 2, e assim por diante."
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200 shadow-md" id="tutorial-panel">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 bg-slate-50 border-b border-slate-200">
        <Lightbulb className="text-amber-500 w-5 h-5" />
        <span className="font-semibold text-slate-800 text-sm">Missões Práticas SQL</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Siga o roteiro passo a passo do seu trabalho abaixo. Clique em cada missão para carregar o SQL correto no editor e executá-lo:
        </p>

        <div className="space-y-3.5">
          {steps.map((step, idx) => {
            const isCompleted = step.isCompleted;
            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? "bg-emerald-50/40 border-emerald-200"
                    : "bg-slate-50/55 border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-355" />
                      )}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{step.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-normal">{step.description}</p>
                    </div>
                  </div>
                  {!isCompleted && (
                    <button
                      onClick={() => onLoadSQL(step.sql)}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold hover:bg-slate-800 flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Copiar para o Editor"
                    >
                      <span>Resolver</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Technical Snippet Explanations for the student */}
                <div className="mt-3 bg-white p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium font-mono text-[10px] select-all">
                    <Code className="w-3 h-3 text-emerald-600" /> {step.sql.split("\n")[0]}...
                  </div>
                  <div className="text-slate-600 leading-relaxed">
                    <strong>Explicando: </strong>
                    {step.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative helper box */}
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Por que aspas graves em `e-mail`?
          </div>
          <p>
            Em bancos de dados relacionais, caracteres como hífens, espaços ou palavras reservadas podem causar conflito sintático. A crase (ou backticks no MySQL) informa ao compilador SQL que `e-mail` é exatamente o nome literal do atributo, impedindo que o SGBD divida a coluna ou acabe assumindo o caractere de subtração "-".
          </p>
        </div>
      </div>
    </div>
  );
}
