# Comprehensive MCP Server Specification for TypeScript Code Analysis

## Executive Summary

This specification defines a Model Context Protocol (MCP) server that leverages ts-morph to provide advanced TypeScript code analysis capabilities for AI editors. The design emphasizes composability, progressive disclosure, and performance optimization while addressing the unique needs of AI-powered development tools.

## Tool Inventory

### 1. Core File Operations

#### `analyze_file`

**Purpose**: Analyze a single TypeScript file with configurable depth and detail

```typescript
interface AnalyzeFileParams {
  filePath: string;
  analysisType: "symbols" | "dependencies" | "complexity" | "all";
  depth: number; // 1-3, default: 2
  includePrivate?: boolean; // default: false
  includeNodeModules?: boolean; // default: false
  outputFormat?: "summary" | "detailed" | "full"; // default: 'summary'
}

interface AnalyzeFileResult {
  summary: {
    totalSymbols: number;
    complexity: number;
    dependencies: string[];
  };
  symbols?: SymbolInfo[];
  diagnostics?: Diagnostic[];
  metadata: {
    fileSize: number;
    lastModified: string;
    analysisTimeMs: number;
  };
}
```

#### `search_symbols`

**Purpose**: Search for symbols across the codebase using various strategies

```typescript
interface SearchSymbolsParams {
  query: string;
  searchType: "text" | "semantic" | "ast-pattern";
  scope?: {
    includeFiles?: string[]; // glob patterns
    excludeFiles?: string[]; // glob patterns
    fileTypes?: string[]; // ['.ts', '.tsx']
  };
  symbolTypes?: SymbolKind[]; // ['class', 'function', 'interface']
  maxResults?: number; // default: 50
  includeReferences?: boolean; // default: false
}

interface SearchSymbolsResult {
  matches: Array<{
    symbol: SymbolInfo;
    score: number; // relevance score 0-1
    context: string; // surrounding code snippet
    references?: Location[];
  }>;
  totalMatches: number;
  searchTimeMs: number;
}
```

### 2. Symbol Analysis Tools

#### `get_symbol_info`

**Purpose**: Get detailed information about a specific symbol

```typescript
interface GetSymbolInfoParams {
  filePath: string;
  position: { line: number; character: number };
  includeRelationships?: boolean; // default: true
  includeUsages?: boolean; // default: false
  depth?: number; // for type hierarchy, default: 2
}

interface SymbolInfo {
  name: string;
  kind: SymbolKind;
  type: string;
  documentation?: string;
  modifiers?: string[]; // ['public', 'static', 'async']
  location: Location;
  relationships?: {
    extends?: SymbolReference[];
    implements?: SymbolReference[];
    usedBy?: SymbolReference[];
    uses?: SymbolReference[];
  };
}
```

#### `find_references`

**Purpose**: Find all references to a symbol

```typescript
interface FindReferencesParams {
  filePath: string;
  position: { line: number; character: number };
  includeDeclaration?: boolean; // default: false
  scope?: "file" | "project"; // default: 'project'
  maxResults?: number; // default: 100
}

interface FindReferencesResult {
  references: Array<{
    location: Location;
    kind: "read" | "write" | "call" | "import";
    context: string;
  }>;
  symbol: SymbolInfo;
  totalReferences: number;
}
```

### 3. Relationship Mapping Tools

#### `analyze_dependencies`

**Purpose**: Analyze import/export dependencies

```typescript
interface AnalyzeDependenciesParams {
  filePath?: string; // optional, analyzes entire project if omitted
  direction: "imports" | "exports" | "both";
  depth?: number; // dependency tree depth, default: 2
  includeNodeModules?: boolean; // default: false
  groupBy?: "module" | "file" | "none"; // default: 'module'
}

interface DependencyGraph {
  nodes: Array<{
    id: string;
    type: "file" | "module" | "external";
    metrics: {
      imports: number;
      exports: number;
      complexity: number;
    };
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: "import" | "export" | "reexport";
    symbols?: string[];
  }>;
}
```

#### `get_call_graph`

**Purpose**: Generate function call relationships

```typescript
interface GetCallGraphParams {
  functionName?: string; // specific function or all
  filePath?: string; // scope to file
  direction: "callers" | "callees" | "both";
  maxDepth?: number; // default: 3
  includeAsync?: boolean; // track async boundaries
}

interface CallGraph {
  root: string;
  nodes: Array<{
    id: string;
    name: string;
    file: string;
    async: boolean;
    complexity: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    callCount: number;
    isAsync: boolean;
  }>;
}
```

#### `analyze_type_hierarchy`

**Purpose**: Analyze inheritance and implementation relationships

```typescript
interface AnalyzeTypeHierarchyParams {
  typeName: string;
  direction: "ancestors" | "descendants" | "both";
  includeInterfaces?: boolean; // default: true
  maxDepth?: number; // default: 5
  includeMembers?: boolean; // default: false
}

interface TypeHierarchy {
  root: TypeInfo;
  hierarchy: Array<{
    type: TypeInfo;
    relationship: "extends" | "implements";
    level: number;
    members?: MemberInfo[];
  }>;
  diagram?: string; // ASCII/mermaid diagram
}
```

### 4. Pattern Search Tools

#### `find_patterns`

**Purpose**: Search for code patterns using AST matching

```typescript
interface FindPatternsParams {
  pattern: string; // ts-morph pattern or custom DSL
  patternType: "ast" | "semantic" | "regex";
  scope?: ScopeOptions;
  maxResults?: number; // default: 100
  includeContext?: boolean; // default: true
}

interface PatternMatch {
  location: Location;
  matchedCode: string;
  captures?: Record<string, string>;
  severity?: "info" | "warning" | "error";
  suggestion?: string;
}
```

#### `detect_code_smells`

**Purpose**: Identify common code quality issues

```typescript
interface DetectCodeSmellsParams {
  filePath?: string; // optional for project-wide
  categories?: CodeSmellCategory[];
  threshold?: {
    complexity?: number; // default: 10
    fileSize?: number; // lines, default: 300
    functionSize?: number; // lines, default: 50
  };
}

type CodeSmellCategory =
  | "complexity"
  | "duplication"
  | "coupling"
  | "naming"
  | "unused-code"
  | "async-issues";

interface CodeSmell {
  type: string;
  severity: "low" | "medium" | "high";
  location: Location;
  message: string;
  metrics?: Record<string, number>;
  fix?: CodeAction;
}
```

### 5. Context Extraction Tools

#### `extract_context`

**Purpose**: Extract relevant context for AI understanding

```typescript
interface ExtractContextParams {
  filePath: string;
  position?: Position;
  contextType: "function" | "class" | "module" | "related";
  maxTokens?: number; // default: 2000
  includeImports?: boolean; // default: true
  includeTypes?: boolean; // default: true
  followReferences?: boolean; // default: false
}

interface ExtractedContext {
  primary: {
    code: string;
    symbols: SymbolInfo[];
    complexity: number;
  };
  related: Array<{
    file: string;
    code: string;
    relationship: string;
  }>;
  imports: ImportInfo[];
  types: TypeDefinition[];
  totalTokens: number;
}
```

#### `summarize_codebase`

**Purpose**: Generate high-level codebase summary

```typescript
interface SummarizeCodebaseParams {
  rootPath?: string;
  includeMetrics?: boolean; // default: true
  includeArchitecture?: boolean; // default: true
  maxDepth?: number; // directory depth
}

interface CodebaseSummary {
  structure: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
    mainModules: string[];
  };
  metrics: {
    avgComplexity: number;
    testCoverage?: number;
    duplicatePercentage: number;
  };
  architecture: {
    style: string; // 'monolithic' | 'modular' | 'microservices'
    layers: Layer[];
    dependencies: DependencyMatrix;
  };
  keyPatterns: string[];
}
```

### 6. Advanced Analysis Tools

#### `analyze_impact`

**Purpose**: Analyze the impact of potential changes

```typescript
interface AnalyzeImpactParams {
  filePath: string;
  changeType: "modify" | "delete" | "rename";
  symbolName?: string;
  maxDepth?: number; // default: 3
  includeTests?: boolean; // default: true
}

interface ImpactAnalysis {
  directImpact: Array<{
    file: string;
    symbols: string[];
    risk: "low" | "medium" | "high";
  }>;
  indirectImpact: Array<{
    file: string;
    path: string[]; // dependency path
    confidence: number;
  }>;
  testImpact: string[];
  suggestions: string[];
}
```

#### `suggest_refactoring`

**Purpose**: Suggest refactoring opportunities

```typescript
interface SuggestRefactoringParams {
  filePath?: string;
  refactoringTypes?: RefactoringType[];
  minConfidence?: number; // 0-1, default: 0.7
  maxSuggestions?: number; // default: 10
}

type RefactoringType =
  | "extract-function"
  | "extract-interface"
  | "consolidate-conditional"
  | "introduce-parameter-object"
  | "replace-magic-number";

interface RefactoringSuggestion {
  type: RefactoringType;
  location: Location;
  description: string;
  confidence: number;
  preview: {
    before: string;
    after: string;
  };
  impact: {
    linesChanged: number;
    complexity: number;
  };
}
```

#### `generate_documentation`

**Purpose**: Generate documentation from code analysis

```typescript
interface GenerateDocumentationParams {
  target: string; // file, class, or function
  format: "jsdoc" | "markdown" | "json";
  includeExamples?: boolean; // default: true
  includeTypes?: boolean; // default: true
  language?: string; // default: 'en'
}

interface GeneratedDocumentation {
  content: string;
  sections: Array<{
    type: "summary" | "parameters" | "returns" | "examples" | "see-also";
    content: string;
  }>;
  coverage: {
    documented: number;
    total: number;
    missing: string[];
  };
}
```

## Performance Guidelines

### Memory Management

```typescript
interface PerformanceConfig {
  maxMemoryMB: number; // default: 2048
  batchSize: number; // files per batch, default: 50
  cacheStrategy: "memory" | "disk" | "hybrid";
  gcInterval: number; // files processed, default: 100
}
```

### Recommended Limits by Project Size

| Project Size | Files  | LOC      | Max Memory | Batch Size | Cache Strategy |
| ------------ | ------ | -------- | ---------- | ---------- | -------------- |
| Small        | <100   | <10K     | 512MB      | 100        | memory         |
| Medium       | 100-1K | 10-100K  | 1GB        | 50         | memory         |
| Large        | 1-5K   | 100-500K | 2GB        | 25         | hybrid         |
| Enterprise   | >5K    | >500K    | 4GB        | 10         | disk           |

### Operation Timeouts

```typescript
const timeoutLimits = {
  singleFile: 5000, // 5s
  symbolSearch: 10000, // 10s
  projectAnalysis: 60000, // 60s
  impactAnalysis: 30000, // 30s
};
```

## Composability Examples

### Example 1: Understanding Function Usage

```typescript
// Step 1: Find the function
const symbolResult = await searchSymbols({
  query: "processUserData",
  searchType: "semantic",
  symbolTypes: ["function"],
});

// Step 2: Get detailed info
const info = await getSymbolInfo({
  filePath: symbolResult.matches[0].symbol.location.file,
  position: symbolResult.matches[0].symbol.location.position,
});

// Step 3: Find all references
const refs = await findReferences({
  filePath: info.location.file,
  position: info.location.position,
  scope: "project",
});

// Step 4: Extract context for each usage
const contexts = await Promise.all(
  refs.references.map((ref) =>
    extractContext({
      filePath: ref.location.file,
      position: ref.location.position,
      contextType: "function",
    })
  )
);
```

### Example 2: Safe Refactoring Analysis

```typescript
// Step 1: Analyze impact
const impact = await analyzeImpact({
  filePath: "src/services/UserService.ts",
  changeType: "modify",
  symbolName: "getUserById",
});

// Step 2: Get type hierarchy if it's a method
const hierarchy = await analyzeTypeHierarchy({
  typeName: "UserService",
  direction: "descendants",
  includeMembers: true,
});

// Step 3: Find patterns that might break
const patterns = await findPatterns({
  pattern: "getUserById(*)",
  patternType: "semantic",
  scope: { includeFiles: impact.directImpact.map((i) => i.file) },
});

// Step 4: Generate comprehensive report
const summary = {
  totalImpact: impact.directImpact.length + impact.indirectImpact.length,
  riskLevel: Math.max(...impact.directImpact.map((i) => i.risk)),
  affectedTests: impact.testImpact,
  breakingChanges: patterns.matches.filter((m) => m.severity === "error"),
};
```

### Example 3: Codebase Understanding

```typescript
// Step 1: Get overview
const summary = await summarizeCodebase({
  includeMetrics: true,
  includeArchitecture: true,
});

// Step 2: Analyze key modules
const modules = await Promise.all(
  summary.structure.mainModules.map((module) =>
    analyzeDependencies({
      filePath: module,
      direction: "both",
      depth: 2,
    })
  )
);

// Step 3: Detect architectural issues
const smells = await detectCodeSmells({
  categories: ["coupling", "complexity"],
  threshold: { complexity: 15 },
});

// Step 4: Generate insights
const insights = {
  architecture: summary.architecture.style,
  hotspots: smells.filter((s) => s.severity === "high"),
  dependencies: analyzeDependencyHealth(modules),
};
```

## Error Handling

### Error Types

```typescript
enum ErrorCode {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  PARSE_ERROR = "PARSE_ERROR",
  TIMEOUT = "TIMEOUT",
  MEMORY_LIMIT = "MEMORY_LIMIT",
  INVALID_PATTERN = "INVALID_PATTERN",
  SCOPE_ERROR = "SCOPE_ERROR",
}

interface AnalysisError {
  code: ErrorCode;
  message: string;
  details?: {
    file?: string;
    position?: Position;
    suggestion?: string;
  };
}
```

### Graceful Degradation

Tools should provide partial results when possible:

```typescript
interface PartialResult<T> {
  data: Partial<T>;
  errors: AnalysisError[];
  warnings: string[];
  completeness: number; // 0-1
}
```

## Security Considerations

### Path Validation

```typescript
const securityConfig = {
  allowedPaths: ["./src", "./tests"],
  excludePatterns: ["**/node_modules/**", "**/.git/**"],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxPathDepth: 10,
};
```

### Resource Limits

```typescript
const resourceLimits = {
  maxConcurrentAnalysis: 5,
  maxQueueSize: 100,
  maxExecutionTime: 300000, // 5 minutes
  maxMemoryPerOperation: 1024, // 1GB
};
```

## Implementation Notes

### 1. Progressive Enhancement

Start with basic tools and add advanced features incrementally:

- Phase 1: File analysis, symbol search, basic dependencies
- Phase 2: Pattern matching, call graphs, type hierarchies
- Phase 3: Impact analysis, refactoring suggestions
- Phase 4: AI-specific context extraction, documentation generation

### 2. Caching Strategy

```typescript
interface CacheStrategy {
  fileCache: LRUCache<string, ParsedFile>; // max 1000 entries
  symbolCache: LRUCache<string, SymbolInfo>; // max 10000 entries
  analysisCache: DiskCache<string, AnalysisResult>; // persistent
  invalidation: "timestamp" | "content-hash" | "manual";
}
```

### 3. Streaming Support

For large results, implement streaming:

```typescript
interface StreamableResult<T> {
  getStream(): AsyncIterator<T>;
  getPage(page: number, size: number): Promise<T[]>;
  getTotalCount(): Promise<number>;
}
```

## Conclusion

This MCP server specification provides a comprehensive toolkit for TypeScript code analysis optimized for AI editor consumption. The design emphasizes composability, performance, and progressive disclosure while maintaining the flexibility needed for various use cases. By following these guidelines and implementing the suggested optimizations, developers can create powerful code analysis capabilities that enhance AI-powered development workflows.
