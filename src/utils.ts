import { Project, SourceFile, Node, SyntaxKind, Symbol, Type } from "ts-morph";
import { glob } from "glob";
import { minimatch } from "minimatch";
import path from "path";
import { LRUCache } from "lru-cache";
import { 
  Position, 
  Location, 
  SymbolKind, 
  PerformanceConfig,
  ErrorCode,
  AnalysisError
} from "./types.js";

export const fileCache = new LRUCache<string, SourceFile>({ max: 1000 });
export const symbolCache = new LRUCache<string, Symbol>({ max: 10000 });

export const performanceConfig: PerformanceConfig = {
  maxMemoryMB: 2048,
  batchSize: 50,
  cacheStrategy: "memory",
  gcInterval: 100
};

export const timeoutLimits = {
  singleFile: 5000,
  symbolSearch: 10000,
  projectAnalysis: 60000,
  impactAnalysis: 30000,
};

export const securityConfig = {
  allowedPaths: ["./src", "./tests", "./lib"],
  excludePatterns: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"],
  maxFileSize: 5 * 1024 * 1024,
  maxPathDepth: 10,
};

export function createProject(rootPath?: string): Project {
  const project = new Project({
    tsConfigFilePath: rootPath ? path.join(rootPath, "tsconfig.json") : undefined,
    skipAddingFilesFromTsConfig: true,
  });
  
  return project;
}

export function nodeToLocation(node: Node): Location {
  const sourceFile = node.getSourceFile();
  const start = sourceFile.getLineAndColumnAtPos(node.getStart());
  const end = sourceFile.getLineAndColumnAtPos(node.getEnd());
  
  return {
    file: sourceFile.getFilePath(),
    position: {
      line: start.line - 1,
      character: start.column - 1
    },
    endPosition: {
      line: end.line - 1,
      character: end.column - 1
    }
  };
}

export function positionToOffset(sourceFile: SourceFile, position: Position): number {
  const pos = sourceFile.compilerNode.getPositionOfLineAndCharacter(position.line, position.character);
  return pos;
}

export function getSymbolKind(node: Node): SymbolKind {
  const kind = node.getKind();
  
  switch (kind) {
    case SyntaxKind.ClassDeclaration:
      return "class";
    case SyntaxKind.InterfaceDeclaration:
      return "interface";
    case SyntaxKind.EnumDeclaration:
      return "enum";
    case SyntaxKind.FunctionDeclaration:
    case SyntaxKind.FunctionExpression:
    case SyntaxKind.ArrowFunction:
      return "function";
    case SyntaxKind.MethodDeclaration:
    case SyntaxKind.MethodSignature:
      return "method";
    case SyntaxKind.PropertyDeclaration:
    case SyntaxKind.PropertySignature:
      return "property";
    case SyntaxKind.VariableDeclaration:
      return "variable";
    case SyntaxKind.Parameter:
      return "parameter";
    case SyntaxKind.TypeAliasDeclaration:
      return "type";
    case SyntaxKind.ModuleDeclaration:
      return "module";
    case SyntaxKind.NamespaceKeyword:
      return "namespace";
    default:
      return "variable";
  }
}

export async function findFiles(
  pattern: string,
  basePath: string = process.cwd()
): Promise<string[]> {
  const files = await glob(pattern, {
    cwd: basePath,
    absolute: true,
    ignore: securityConfig.excludePatterns,
  });
  
  return files.filter(file => {
    const relativePath = path.relative(basePath, file);
    const depth = relativePath.split(path.sep).length;
    return depth <= securityConfig.maxPathDepth;
  });
}

export function matchesScope(filePath: string, scope?: {
  includeFiles?: string[];
  excludeFiles?: string[];
  fileTypes?: string[];
}): boolean {
  if (!scope) return true;
  
  if (scope.fileTypes) {
    const ext = path.extname(filePath);
    if (!scope.fileTypes.includes(ext)) return false;
  }
  
  if (scope.excludeFiles) {
    for (const pattern of scope.excludeFiles) {
      if (minimatch(filePath, pattern)) return false;
    }
  }
  
  if (scope.includeFiles) {
    for (const pattern of scope.includeFiles) {
      if (minimatch(filePath, pattern)) return true;
    }
    return false;
  }
  
  return true;
}

export function validatePath(filePath: string): void {
  const normalizedPath = path.normalize(filePath);
  const relativePath = path.relative(process.cwd(), normalizedPath);
  
  if (relativePath.startsWith('..')) {
    throw new AnalysisError({
      code: ErrorCode.SCOPE_ERROR,
      message: "Path is outside allowed scope",
      details: { file: filePath }
    });
  }
  
  for (const pattern of securityConfig.excludePatterns) {
    if (minimatch(normalizedPath, pattern)) {
      throw new AnalysisError({
        code: ErrorCode.SCOPE_ERROR,
        message: "Path matches excluded pattern",
        details: { file: filePath }
      });
    }
  }
}

export function getNodeComplexity(node: Node): number {
  let complexity = 1;
  
  node.forEachDescendant(child => {
    const kind = child.getKind();
    if (
      kind === SyntaxKind.IfStatement ||
      kind === SyntaxKind.ForStatement ||
      kind === SyntaxKind.ForInStatement ||
      kind === SyntaxKind.ForOfStatement ||
      kind === SyntaxKind.WhileStatement ||
      kind === SyntaxKind.DoStatement ||
      kind === SyntaxKind.ConditionalExpression ||
      kind === SyntaxKind.CatchClause ||
      kind === SyntaxKind.CaseClause ||
      kind === SyntaxKind.BinaryExpression
    ) {
      complexity++;
    }
  });
  
  return complexity;
}

export function getTypeString(type: Type): string {
  const typeText = type.getText();
  if (typeText.length > 100) {
    return typeText.substring(0, 97) + "...";
  }
  return typeText;
}

export function checkMemoryUsage(): void {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  
  if (heapUsedMB > performanceConfig.maxMemoryMB * 0.9) {
    if (global.gc) {
      global.gc();
    }
    fileCache.clear();
    symbolCache.clear();
  }
}

export class TimeoutError extends Error {
  constructor(operation: string, limit: number) {
    super(`Operation '${operation}' timed out after ${limit}ms`);
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  operation: string,
  limit: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new TimeoutError(operation, limit)), limit)
    )
  ]);
}