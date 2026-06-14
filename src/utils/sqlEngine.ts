import { SQLState, SQLDatabase, SQLTable, SQLColumn } from "../types";

/**
 * Removes SQL comments (-- comment) and splits statements by semicolon.
 */
export function preprocessSQL(sqlText: string): string[] {
  // Remove block comments /* */
  let cleaned = sqlText.replace(/\/\*[\s\S]*?\*\//g, "");
  
  // Split into lines, filter/remove single line comments
  const lines = cleaned.split("\n").map(line => {
    const commentIndex = line.indexOf("--");
    if (commentIndex !== -1) {
      return line.substring(0, commentIndex);
    }
    return line;
  });

  // Rejoin and split by semicolon (guarded against semicolons in quotes if possible, or simple split)
  cleaned = lines.join(" ");

  // Simple split by ; but ignoring inside matches is complex,
  // we do a standard split and clean empty items.
  const statements = cleaned
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return statements;
}

/**
 * Clears quotes/backticks from identifier names (e.g. `e-mail` -> e-mail)
 */
function cleanIdentifier(id: string): string {
  return id.replace(/[`"']/g, "").trim();
}

/**
 * Parses parameters inside rows/values: "('Sofia', 'sofia@escola.com', 'Rua 1')"
 */
function parseValuesString(valuesStr: string): any[] {
  const result: any[] = [];
  let currentVal = "";
  let insideQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    if ((char === "'" || char === '"') && (i === 0 || valuesStr[i - 1] !== "\\")) {
      if (insideQuotes && char === quoteChar) {
        insideQuotes = false;
      } else if (!insideQuotes) {
        insideQuotes = true;
        quoteChar = char;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(currentVal.trim().replace(/^['"]|['"]$/g, ""));
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal.trim().replace(/^['"]|['"]$/g, ""));
  
  // Cast numeric values
  return result.map(v => {
    const cleaned = v.trim();
    if (!isNaN(Number(cleaned)) && cleaned !== "" && !cleaned.startsWith("0")) {
      return Number(cleaned);
    }
    return cleaned;
  });
}

/**
 * Executes a single SQL statement on the simulated state.
 */
export function executeSingleStatement(
  statement: string,
  state: SQLState
): { newState: SQLState; error?: string; message: string; payload?: any } {
  const startTime = performance.now();
  const newState = JSON.parse(JSON.stringify(state)) as SQLState;
  
  const createDbRegex = /^CREATE\s+DATABASE\s+(\w+)/i;
  const useDbRegex = /^USE\s+(\w+)/i;
  const showDbsRegex = /^SHOW\s+DATABASES/i;
  const showTablesRegex = /^SHOW\s+TABLES/i;
  const descTableRegex = /^DESC(?:RIBE)?\s+(\w+)/i;
  const dropDbRegex = /^DROP\s+DATABASE\s+(\w+)/i;
  
  // 1. CREATE DATABASE
  if (createDbRegex.test(statement)) {
    const match = statement.match(createDbRegex);
    if (match) {
      const dbName = match[1].toUpperCase();
      if (newState.databases[dbName]) {
        return {
          newState,
          error: `O banco de dados '${dbName}' já existe.`,
          message: `Erro: O banco de dados '${dbName}' já existe.`
        };
      }
      newState.databases[dbName] = { name: dbName, tables: {} };
      const elapsed = (performance.now() - startTime).toFixed(1);
      return {
        newState,
        message: `Query OK, 1 linha afetada (${elapsed}ms). Banco de dados '${dbName}' criado com sucesso!`
      };
    }
  }

  // 1b. DROP DATABASE
  if (dropDbRegex.test(statement)) {
    const match = statement.match(dropDbRegex);
    if (match) {
      const dbName = match[1].toUpperCase();
      if (!newState.databases[dbName]) {
        return {
          newState,
          error: `O banco de dados '${dbName}' não existe.`,
          message: `Erro: O banco de dados '${dbName}' não existe.`
        };
      }
      delete newState.databases[dbName];
      if (newState.currentDb === dbName) {
        newState.currentDb = null;
      }
      return {
        newState,
        message: `Query OK, banco de dados '${dbName}' excluído.`
      };
    }
  }

  // 2. SHOW DATABASES
  if (showDbsRegex.test(statement)) {
    const dbs = Object.keys(newState.databases);
    const rows = dbs.map(db => ({ "Database": db }));
    const elapsed = (performance.now() - startTime).toFixed(1);
    newState.lastQueryResult = {
      columns: ["Database"],
      rows,
      message: `${dbs.length} banco(s) de dados encontrado(s).`,
      isSelect: true,
      executionTimeMs: Number(elapsed)
    };
    return {
      newState,
      message: `SHOW DATABASES executado com sucesso (${elapsed}ms).`,
      payload: rows
    };
  }

  // 3. USE DATABASE
  if (useDbRegex.test(statement)) {
    const match = statement.match(useDbRegex);
    if (match) {
      const dbName = match[1].toUpperCase();
      if (!newState.databases[dbName]) {
        return {
          newState,
          error: `O banco de dados '${dbName}' não existe. Crie-o primeiro usando 'CREATE DATABASE ${dbName};'`,
          message: `Erro: Banco de dados '${dbName}' desconhecido.`
        };
      }
      newState.currentDb = dbName;
      const elapsed = (performance.now() - startTime).toFixed(1);
      return {
        newState,
        message: `Sucesso (${elapsed}ms). Banco de dados alterado para: '${dbName}'`
      };
    }
  }

  // Check if a database is currently selected for the following table/row commands
  if (!newState.currentDb) {
    return {
      newState,
      error: "Nenhum banco de dados selecionado. Por favor, execute 'USE ESCOLA;' ou crie e selecione um banco primeiro.",
      message: "Erro: Nenhum banco de dados ativo selecionado."
    };
  }

  const activeDb = newState.databases[newState.currentDb];

  // 4. SHOW TABLES
  if (showTablesRegex.test(statement)) {
    const tables = Object.keys(activeDb.tables);
    const colName = `Tables_in_${activeDb.name.toLowerCase()}`;
    const rows = tables.map(t => ({ [colName]: t }));
    const elapsed = (performance.now() - startTime).toFixed(1);
    newState.lastQueryResult = {
      columns: [colName],
      rows,
      message: `${tables.length} tabela(s) no banco de dados.`,
      isSelect: true,
      executionTimeMs: Number(elapsed)
    };
    return {
      newState,
      message: `SHOW TABLES executado com sucesso (${elapsed}ms).`,
      payload: rows
    };
  }

  // 5. DESCRIBE <tabela>
  if (descTableRegex.test(statement)) {
    const match = statement.match(descTableRegex);
    if (match) {
      const tableName = match[1].toUpperCase();
      const table = activeDb.tables[tableName];
      if (!table) {
        return {
          newState,
          error: `Tabela '${tableName}' não existe no banco de dados '${activeDb.name}'.`,
          message: `Erro: Tabela desconhecida.`
        };
      }
      
      const columns = ["Field", "Type", "Null", "Key", "Extra"];
      const rows = table.columns.map(col => ({
        Field: col.name,
        Type: col.type,
        Null: col.nullable ? "YES" : "NO",
        Key: col.primaryKey ? "PRI" : "",
        Extra: col.autoIncrement ? "auto_increment" : ""
      }));

      const elapsed = (performance.now() - startTime).toFixed(1);
      newState.lastQueryResult = {
        columns,
        rows,
        message: `Estrutura da tabela '${tableName}'.`,
        isSelect: true,
        executionTimeMs: Number(elapsed)
      };
      return {
        newState,
        message: `DESCRIBE ${tableName} executado com sucesso (${elapsed}ms).`
      };
    }
  }

  // 6. CREATE TABLE
  // Match standard query: CREATE TABLE ALUNO ( ... );
  const createTableMatch = statement.match(/^CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]+)\)/i);
  if (createTableMatch) {
    const tableName = createTableMatch[1].toUpperCase();
    const columnsDefinitionStr = createTableMatch[2];

    const parsedColumns: SQLColumn[] = [];
    let primaryKeyColumn: string | null = null;

    // Split column definitions by comma but ignore commas inside VARCHAR specs e.g. VARCHAR(255)
    // To handle this simply, split by comma when not inside parentheses
    const rawColLines: string[] = [];
    let currentPart = "";
    let parenLevel = 0;

    for (let i = 0; i < columnsDefinitionStr.length; i++) {
      const char = columnsDefinitionStr[i];
      if (char === "(") parenLevel++;
      if (char === ")") parenLevel--;
      if (char === "," && parenLevel === 0) {
        rawColLines.push(currentPart.trim());
        currentPart = "";
      } else {
        currentPart += char;
      }
    }
    if (currentPart.trim()) {
      rawColLines.push(currentPart.trim());
    }

    for (const rawLine of rawColLines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Handle PRIMARY KEY(ID) separate constraint inside columns list
      const pkMatch = line.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        primaryKeyColumn = cleanIdentifier(pkMatch[1]);
        continue;
      }

      // Standard column parsing: "ID INT AUTO_INCREMENT" or "nome VARCHAR(255) NOT NULL"
      // Split on first whitespace to obtain column name, remainder as type constraints
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;

      const rawColName = parts[0];
      const colName = cleanIdentifier(rawColName);

      // Collect rest as constraints
      const rest = parts.slice(1).join(" ");
      const isAutoIncrement = /AUTO_INCREMENT/i.test(rest);
      const isNotNull = /NOT\s+NULL/i.test(rest);
      const isPrimaryKeyInline = /PRIMARY\s+KEY/i.test(rest);

      // Extract SQL type like "INT" or "VARCHAR(255)"
      // Matches word possibly followed by (Number)
      const typeMatch = rest.match(/^([\w]+(?:\(\d+\))?)/i);
      const colType = typeMatch ? typeMatch[1].toUpperCase() : "VARCHAR(255)";

      parsedColumns.push({
        name: colName,
        type: colType,
        primaryKey: isPrimaryKeyInline,
        nullable: !isNotNull && !isPrimaryKeyInline,
        autoIncrement: isAutoIncrement
      });

      if (isPrimaryKeyInline) {
        primaryKeyColumn = colName;
      }
    }

    // Apply primary key if explicitly defined at the end
    if (primaryKeyColumn) {
      const pkName = primaryKeyColumn.toUpperCase();
      parsedColumns.forEach(c => {
        if (c.name.toUpperCase() === pkName) {
          c.primaryKey = true;
          c.nullable = false;
        }
      });
    }

    if (parsedColumns.length === 0) {
      return {
        newState,
        error: "Definição de colunas inválida para CREATE TABLE.",
        message: "Erro: Nenhuma coluna válida encontrada."
      };
    }

    activeDb.tables[tableName] = {
      name: tableName,
      columns: parsedColumns,
      rows: [],
      nextAutoId: 1
    };

    const elapsed = (performance.now() - startTime).toFixed(1);
    return {
      newState,
      message: `Query OK, 0 linhas afetadas (${elapsed}ms). Tabela '${tableName}' criada com sucesso!`
    };
  }

  // 7. INSERT INTO
  // Match: INSERT INTO ALUNO (nome, `e-mail`, endereco) VALUES ('Sofia Santos', 'sofia@escola.com', 'Rua A');
  // Or match without explicit column list: INSERT INTO ALUNO VALUES (1, 'Sofia Santos', 'sofia@escola.com', 'Rua A');
  const insertMatch = statement.match(/INSERT\s+INTO\s+(\w+)\s*(?:\(([^)]+)\))?\s*VALUES\s*\((.+)\)/i);
  if (insertMatch) {
    const tableName = insertMatch[1].toUpperCase();
    const columnsStr = insertMatch[2];
    const valuesStr = insertMatch[3];

    const table = activeDb.tables[tableName];
    if (!table) {
      return {
        newState,
        error: `Tabela '${tableName}' não encontrada no banco '${activeDb.name}'.`,
        message: "Erro: Tabela desconhecida."
      };
    }

    // Parse values list
    const parsedValues = parseValuesString(valuesStr);
    let targetColumns: string[] = [];

    if (columnsStr) {
      targetColumns = columnsStr.split(",").map(c => cleanIdentifier(c));
    } else {
      // If columns list omitted, map 1-to-1 to defined table columns
      targetColumns = table.columns.map(c => c.name);
    }

    // Validate size
    if (parsedValues.length !== targetColumns.length) {
      return {
        newState,
        error: `Inconsistência de colunas: Forneceu ${parsedValues.length} valores para ${targetColumns.length} colunas (${targetColumns.join(", ")}).`,
        message: "Erro: Contagem de colunas/valores não coincide."
      };
    }

    // Build row record
    const newRowRecord: Record<string, any> = {};
    
    // Initialize defaults or nulls for columns
    table.columns.forEach(col => {
      newRowRecord[col.name] = null;
    });

    // Populate provided values
    targetColumns.forEach((colName, index) => {
      const matchCol = table.columns.find(c => c.name.toLowerCase() === colName.toLowerCase());
      if (matchCol) {
        newRowRecord[matchCol.name] = parsedValues[index];
      }
    });

    // Handle AUTO_INCREMENT and NOT NULL validations
    let generatedId: number | null = null;
    for (const col of table.columns) {
      const val = newRowRecord[col.name];
      
      if (col.autoIncrement && (val === null || val === undefined || val === 0 || val === "")) {
        newRowRecord[col.name] = table.nextAutoId;
        generatedId = table.nextAutoId;
      }
      
      if (!col.nullable && (newRowRecord[col.name] === null || newRowRecord[col.name] === undefined)) {
        if (col.autoIncrement) continue; // Will be auto filled
        return {
          newState,
          error: `Campo '${col.name}' não pode ser nulo (NOT NULL).`,
          message: "Erro: Restrição NOT NULL violada."
        };
      }
    }

    // Advance nextAutoId if spent
    if (generatedId !== null) {
      table.nextAutoId = Math.max(table.nextAutoId + 1, (Number(newRowRecord[table.columns.find(c => c.autoIncrement)?.name || ""]) || 0) + 1);
    }

    table.rows.push(newRowRecord);

    const elapsed = (performance.now() - startTime).toFixed(1);
    return {
      newState,
      message: `Query OK, 1 linha afetada (${elapsed}ms). Registro inserido com sucesso!`
    };
  }

  // 8. SELECT
  // Matches "SELECT * FROM ALUNO" or "SELECT nome, `e-mail` FROM ALUNO WHERE ID = 1"
  const selectMatch = statement.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+([\s\S]+))?/i);
  if (selectMatch) {
    const rawSelectedFields = selectMatch[1].trim();
    const tableName = selectMatch[2].toUpperCase();
    const whereClauseStr = selectMatch[3] ? selectMatch[3].trim() : null;

    const table = activeDb.tables[tableName];
    if (!table) {
      return {
        newState,
        error: `Tabela '${tableName}' não foi encontrada no banco '${activeDb.name}'.`,
        message: "Erro: Tabela desconhecida."
      };
    }

    // Parse columns to retrieve
    let chosenColumns: string[] = [];
    if (rawSelectedFields === "*") {
      chosenColumns = table.columns.map(c => c.name);
    } else {
      chosenColumns = rawSelectedFields.split(",").map(c => cleanIdentifier(c));
      
      // Verify chosen exists
      for (const col of chosenColumns) {
        if (!table.columns.some(c => c.name.toLowerCase() === col.toLowerCase())) {
          return {
            newState,
            error: `Coluna '${col}' não existe na tabela '${tableName}'.`,
            message: "Erro: Coluna inválida."
          };
        }
      }
    }

    // Filter rows based on WHERE clause if any
    let matchedRows = [...table.rows];
    
    if (whereClauseStr) {
      // Evaluate basic WHERE expressions like:
      // ID = 1
      // name = 'Sofia Santos'
      // endereco LIKE '%Flores%'
      // We'll write dynamic in-memory parsers for these common SQL instructions
      const equalMatch = whereClauseStr.match(/^(\w+)\s*=\s*(.+)/i);
      const likeMatch = whereClauseStr.match(/^(\w+)\s+LIKE\s+['"]%?([^%'"\s]+)%?['"]/i);

      if (equalMatch) {
        const colName = cleanIdentifier(equalMatch[1]);
        const origVal = equalMatch[2].trim().replace(/^['"]|['"]$/g, "");
        const valToCompare = isNaN(Number(origVal)) ? origVal : Number(origVal);

        matchedRows = matchedRows.filter(r => {
          const colInRow = Object.keys(r).find(k => k.toLowerCase() === colName.toLowerCase());
          if (!colInRow) return false;
          return String(r[colInRow]).toLowerCase() === String(valToCompare).toLowerCase();
        });
      } else if (likeMatch) {
        const colName = cleanIdentifier(likeMatch[1]);
        const term = likeMatch[2].toLowerCase();

        matchedRows = matchedRows.filter(r => {
          const colInRow = Object.keys(r).find(k => k.toLowerCase() === colName.toLowerCase());
          if (!colInRow || !r[colInRow]) return false;
          return String(r[colInRow]).toLowerCase().includes(term);
        });
      }
    }

    // Select only requested columns
    const selectedRows = matchedRows.map(fullRow => {
      const projectedRow: Record<string, any> = {};
      chosenColumns.forEach(col => {
        const key = Object.keys(fullRow).find(k => k.toLowerCase() === col.toLowerCase()) || col;
        projectedRow[key] = fullRow[key];
      });
      return projectedRow;
    });

    const elapsed = (performance.now() - startTime).toFixed(1);
    newState.lastQueryResult = {
      columns: chosenColumns,
      rows: selectedRows,
      message: `${selectedRows.length} linha(s) em conjunto (${elapsed}ms).`,
      isSelect: true,
      executionTimeMs: Number(elapsed)
    };

    return {
      newState,
      message: `${selectedRows.length} linha(s) selecionada(s) (${elapsed}ms).`
    };
  }

  // 9. UPDATE
  // UPDATE ALUNO SET endereco = 'Rua B', nome = 'Ana' WHERE ID = 1;
  const updateMatch = statement.match(/^UPDATE\s+(\w+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+(.+))?$/i);
  if (updateMatch) {
    const tableName = updateMatch[1].toUpperCase();
    const setClause = updateMatch[2].trim();
    const whereClauseStr = updateMatch[3] ? updateMatch[3].trim() : null;

    const table = activeDb.tables[tableName];
    if (!table) {
      return {
        newState,
        error: `Tabela '${tableName}' não existe.`,
        message: "Erro: Tabela desconhecida."
      };
    }

    // Parse set values like "endereco = 'Rua B', nome = 'Sofia'"
    const assignments: Record<string, any> = {};
    const singleSets = setClause.split(",");
    for (const single of singleSets) {
      const matchSetObj = single.match(/^([\w`"'-]+)\s*=\s*(.+)$/);
      if (matchSetObj) {
        const colName = cleanIdentifier(matchSetObj[1]);
        const rawVal = matchSetObj[2].trim().replace(/^['"]|['"]$/g, "");
        assignments[colName] = isNaN(Number(rawVal)) ? rawVal : Number(rawVal);
      }
    }

    // Walk through and apply updates to matched rows
    let rowsAffected = 0;
    table.rows = table.rows.map(row => {
      let isMatch = !whereClauseStr; // Match all if missing WHERE
      
      if (whereClauseStr) {
        const equalMatch = whereClauseStr.match(/^(\w+)\s*=\s*(.+)/i);
        if (equalMatch) {
          const colName = cleanIdentifier(equalMatch[1]);
          const origVal = equalMatch[2].trim().replace(/^['"]|['"]$/g, "");
          const valToCompare = isNaN(Number(origVal)) ? origVal : Number(origVal);
          
          const colInRow = Object.keys(row).find(k => k.toLowerCase() === colName.toLowerCase());
          if (colInRow && String(row[colInRow]).toLowerCase() === String(valToCompare).toLowerCase()) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        rowsAffected++;
        const updatedRow = { ...row };
        Object.entries(assignments).forEach(([targetCol, newVal]) => {
          const key = Object.keys(updatedRow).find(k => k.toLowerCase() === targetCol.toLowerCase()) || targetCol;
          updatedRow[key] = newVal;
        });
        return updatedRow;
      }
      return row;
    });

    const elapsed = (performance.now() - startTime).toFixed(1);
    return {
      newState,
      message: `Query OK, ${rowsAffected} linha(s) afetada(s) (${elapsed}ms). Registros atualizados com sucesso!`
    };
  }

  // 10. DELETE FROM
  // DELETE FROM ALUNO WHERE ID = 2;
  const deleteMatch = statement.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
  if (deleteMatch) {
    const tableName = deleteMatch[1].toUpperCase();
    const whereClauseStr = deleteMatch[2] ? deleteMatch[2].trim() : null;

    const table = activeDb.tables[tableName];
    if (!table) {
      return {
        newState,
        error: `Tabela '${tableName}' não existe.`,
        message: "Erro: Tabela desconhecida."
      };
    }

    let initialCount = table.rows.length;
    
    if (!whereClauseStr) {
      table.rows = [];
    } else {
      const equalMatch = whereClauseStr.match(/^(\w+)\s*=\s*(.+)/i);
      if (equalMatch) {
        const colName = cleanIdentifier(equalMatch[1]);
        const origVal = equalMatch[2].trim().replace(/^['"]|['"]$/g, "");
        const valToCompare = isNaN(Number(origVal)) ? origVal : Number(origVal);

        table.rows = table.rows.filter(row => {
          const colInRow = Object.keys(row).find(k => k.toLowerCase() === colName.toLowerCase());
          if (!colInRow) return true; // keep if column isn't matches, standard SQL is different but we're simple
          return String(row[colInRow]).toLowerCase() !== String(valToCompare).toLowerCase();
        });
      }
    }

    const rowsDeleted = initialCount - table.rows.length;
    const elapsed = (performance.now() - startTime).toFixed(1);

    return {
      newState,
      message: `Query OK, ${rowsDeleted} linha(s) excluída(s) (${elapsed}ms).`
    };
  }

  // Fallback / Unknown command
  return {
    newState,
    error: `Sintaxe SQL não suportada pelo simulador para este comando: "${statement.trim()}". O simulador suporta comandos como CREATE DATABASE, USE, CREATE TABLE, DESCRIBE, SELECT, INSERT, UPDATE e DELETE.`,
    message: "Erro de sintaxe SQL ou comando desconhecido."
  };
}

/**
 * Executes a sequence of SQL statements, maintaining intermediate states.
 */
export function executeSQLScript(
  sqlText: string,
  state: SQLState
): { newState: SQLState; consoleOutputs: string[] } {
  const statements = preprocessSQL(sqlText);
  let currentState = JSON.parse(JSON.stringify(state)) as SQLState;
  const consoleOutputs: string[] = [];

  if (statements.length === 0) {
    return { newState: currentState, consoleOutputs: ["Sem comandos válidos para executar."] };
  }

  for (const st of statements) {
    consoleOutputs.push(`mysql> ${st};`);
    const result = executeSingleStatement(st, currentState);
    currentState = result.newState;
    
    if (result.error) {
      consoleOutputs.push(result.error);
      // Stop execution on first error to mimic standard CLI script running
      consoleOutputs.push("Execução interrompida devido a erro.");
      break;
    } else {
      consoleOutputs.push(result.message);
      // If it returned select results, print formatted terminal table representation
      if (currentState.lastQueryResult && result.message.includes("selecionada") || result.message.includes("encontrado")) {
        const queryRes = currentState.lastQueryResult;
        if (queryRes && queryRes.rows && queryRes.rows.length > 0) {
          // simple terminal visual rendering
          const headers = queryRes.columns;
          consoleOutputs.push(`+` + headers.map(h => "-".repeat(Math.max(h.length, 12))).join("+") + `+`);
          consoleOutputs.push(`|` + headers.map(h => h.padEnd(Math.max(h.length, 12))).join("|") + `|`);
          consoleOutputs.push(`+` + headers.map(h => "-".repeat(Math.max(h.length, 12))).join("+") + `+`);
          queryRes.rows.forEach(r => {
            consoleOutputs.push(`|` + headers.map(h => String(r[h] ?? "NULL").padEnd(Math.max(h.length, 12))).join("|") + `|`);
          });
          consoleOutputs.push(`+` + headers.map(h => "-".repeat(Math.max(h.length, 12))).join("+") + `+`);
        } else {
          consoleOutputs.push("Conjunto de resultados vazio (Empty set).");
        }
      }
    }
    consoleOutputs.push(""); // empty line spacer
  }

  return {
    newState: currentState,
    consoleOutputs
  };
}

/**
 * Creates initial pristine database state
 */
export function getInitialState(): SQLState {
  return {
    databases: {},
    currentDb: null,
    lastQueryResult: null,
    commandHistory: []
  };
}
