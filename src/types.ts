export interface SQLColumn {
  name: string;
  type: string;
  primaryKey: boolean;
  nullable: boolean;
  autoIncrement: boolean;
}

export interface SQLTable {
  name: string;
  columns: SQLColumn[];
  rows: Record<string, any>[];
  nextAutoId: number;
}

export interface SQLDatabase {
  name: string;
  tables: Record<string, SQLTable>;
}

export interface SQLState {
  databases: Record<string, SQLDatabase>;
  currentDb: string | null;
  lastQueryResult: {
    columns: string[];
    rows: any[];
    message: string;
    isSelect: boolean;
    executionTimeMs: number;
  } | null;
  commandHistory: string[];
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  expectedSqlPattern: RegExp;
  hint: string;
  codeToLoad: string;
  isCompleted: boolean;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
