# MCP TypeScript Analyzer

A Model Context Protocol (MCP) server for comprehensive TypeScript code analysis using ts-morph. This server provides advanced static analysis capabilities for TypeScript codebases, including symbol extraction, dependency analysis, code quality detection, and pattern matching.

## Features

- **File Analysis**: Comprehensive analysis of TypeScript files with configurable depth and detail
- **Symbol Search**: Semantic symbol search across codebases with scoring and filtering
- **Pattern Matching**: AST-based, semantic, and regex pattern detection
- **Code Quality**: Automated detection of code smells and complexity issues
- **Reference Tracking**: Find all references to symbols with context
- **Dependency Analysis**: Import/export dependency graph generation
- **Context Extraction**: AI-friendly context extraction for code understanding
- **Codebase Summarization**: High-level architectural analysis and metrics

## Installation

### From Source

1. **Build the server**:

   ```bash
   pnpm install
   pnpm run build
   ```

2. **Install to MCP clients**:

   ```bash
   # Install to all supported clients
   pnpm run install-server

   # Install to specific clients
   pnpm run install-cursor    # Cursor IDE
   pnpm run install-desktop   # Claude Desktop
   pnpm run install-code      # Claude Code CLI
   ```

### From Release

Download the latest release from GitHub releases and extract to your desired location:

```bash
# Download and extract
curl -L https://github.com/tryterra/static-analysis/releases/latest/download/mcp-typescript-analyzer-vX.X.X.tar.gz | tar -xz

# Make executable
chmod +x dist/index.js
```

## Available Tools

### 1. `analyze_file`

Analyzes a single TypeScript file with configurable depth and detail.

**Parameters:**

- `filePath` (string): Path to the TypeScript file
- `analysisType` (enum): Type of analysis - "symbols", "dependencies", "complexity", "all"
- `depth` (number): Analysis depth (1-3, default: 2)
- `includePrivate` (boolean): Include private members (default: false)
- `outputFormat` (enum): Output format - "summary", "detailed", "full" (default: "summary")

### 2. `search_symbols`

Search for symbols across the codebase using various strategies.

**Parameters:**

- `query` (string): Search query
- `searchType` (enum): Search type - "text", "semantic", "ast-pattern"
- `symbolTypes` (array): Filter by symbol types (class, interface, function, etc.)
- `maxResults` (number): Maximum results to return (default: 50)
- `includeReferences` (boolean): Include reference information (default: false)

### 3. `get_symbol_info`

Get detailed information about a specific symbol at a given position.

**Parameters:**

- `filePath` (string): Path to the file
- `position` (object): Line and character position
- `includeRelationships` (boolean): Include type relationships (default: true)
- `includeUsages` (boolean): Include usage information (default: false)
- `depth` (number): Analysis depth (default: 2)

### 4. `find_references`

Find all references to a symbol across the project.

**Parameters:**

- `filePath` (string): Path to the file containing the symbol
- `position` (object): Position of the symbol
- `includeDeclaration` (boolean): Include the declaration (default: false)
- `scope` (enum): Search scope - "file" or "project" (default: "project")
- `maxResults` (number): Maximum results (default: 100)

### 5. `analyze_dependencies`

Analyze import/export dependencies and generate dependency graphs.

**Parameters:**

- `filePath` (string, optional): Specific file to analyze
- `direction` (enum): Analysis direction - "imports", "exports", "both"
- `depth` (number): Analysis depth (default: 2)
- `includeNodeModules` (boolean): Include node_modules (default: false)
- `groupBy` (enum): Grouping strategy - "module", "file", "none" (default: "module")

### 6. `find_patterns`

Search for code patterns using AST matching, semantic analysis, or regex.

**Parameters:**

- `pattern` (string): Pattern to search for
- `patternType` (enum): Pattern type - "ast", "semantic", "regex"
- `maxResults` (number): Maximum results (default: 100)
- `includeContext` (boolean): Include surrounding context (default: true)

### 7. `detect_code_smells`

Identify common code quality issues and anti-patterns.

**Parameters:**

- `filePath` (string, optional): Specific file to analyze
- `categories` (array): Categories to check - complexity, duplication, coupling, naming, unused-code, async-issues
- `threshold` (object): Configurable thresholds for various metrics

### 8. `extract_context`

Extract relevant context for AI understanding and code completion.

**Parameters:**

- `filePath` (string): Path to the file
- `position` (object, optional): Position to focus on
- `contextType` (enum): Context type - "function", "class", "module", "related"
- `maxTokens` (number): Maximum tokens to return (default: 2000)
- `includeImports` (boolean): Include import statements (default: true)
- `includeTypes` (boolean): Include type information (default: true)

### 9. `summarize_codebase`

Generate a high-level summary of the entire codebase.

**Parameters:**

- `rootPath` (string, optional): Root directory to analyze
- `includeMetrics` (boolean): Include complexity metrics (default: true)
- `includeArchitecture` (boolean): Include architectural analysis (default: true)
- `maxDepth` (number): Maximum directory depth (default: 5)

## Advanced Features

### Caching System

The server includes an intelligent caching system that:

- Caches parsed TypeScript files and analysis results
- Adapts caching strategy based on project size
- Provides significant performance improvements for repeated operations

### Performance Optimization

- Parallel processing for multi-file operations
- Configurable timeouts and memory monitoring
- Adaptive algorithms based on codebase size

### Error Handling

- Comprehensive error reporting with detailed context
- Graceful degradation for partially corrupt files
- Structured error codes for programmatic handling

## Configuration

### Environment Variables

Create a `.env.local` file to configure the server:

```env
# Optional: Set custom timeout values
ANALYSIS_TIMEOUT=30000
MEMORY_LIMIT=1000000000

# Optional: Configure caching
CACHE_SIZE=1000
CACHE_TTL=3600000
```

### TypeScript Configuration

The server automatically detects and uses your project's `tsconfig.json` file for accurate type analysis.

## Usage Examples

### Basic File Analysis

```json
{
  "tool": "analyze_file",
  "params": {
    "filePath": "./src/index.ts",
    "analysisType": "all",
    "outputFormat": "detailed"
  }
}
```

### Symbol Search

```json
{
  "tool": "search_symbols",
  "params": {
    "query": "UserService",
    "searchType": "semantic",
    "symbolTypes": ["class", "interface"]
  }
}
```

### Pattern Detection

```json
{
  "tool": "find_patterns",
  "params": {
    "pattern": "console.log",
    "patternType": "ast"
  }
}
```

### Code Quality Analysis

```json
{
  "tool": "detect_code_smells",
  "params": {
    "categories": ["complexity", "naming", "unused-code"],
    "threshold": {
      "complexity": 15,
      "functionSize": 100
    }
  }
}
```

## Architecture

The server is built with a modular architecture:

- **`src/index.ts`**: MCP server setup and tool registration
- **`src/tools.ts`**: Tool implementations and schemas
- **`src/analyzer.ts`**: Core TypeScript analysis engine
- **`src/utils.ts`**: Utility functions and project management
- **`src/cache.ts`**: Intelligent caching system
- **`src/types.ts`**: TypeScript type definitions

## Testing

See `TEST_RESULTS.md` for detailed test results and examples of all tool outputs.

## License

MIT License - see LICENSE file for details.

## CI/CD and Distribution

This project includes automated GitHub Actions workflows for:

- **Continuous Integration**: Builds and tests across multiple operating systems (Ubuntu, Windows, macOS) and Node.js versions (18, 20)
- **Automated Releases**: Creates distribution packages (tar.gz and zip) when version tags are pushed
- **Cross-platform Support**: Ensures compatibility across different environments

To create a new release:

```bash
# Tag a new version
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions will automatically build and create the release
```

## Requirements

- Node.js 18+
- TypeScript 5.0+
- A TypeScript project with valid `tsconfig.json`
