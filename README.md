# MCP TypeScript Analyzer

A powerful Model Context Protocol (MCP) server for comprehensive TypeScript code analysis using ts-morph. This tool provides deep static analysis capabilities for TypeScript codebases with intelligent caching and performance optimizations.

## Features

### Core Analysis Capabilities
- **File Analysis**: Deep inspection of TypeScript files with symbol extraction, complexity metrics, and type information
- **Symbol Search**: Advanced search across codebases with fuzzy matching and filtering
- **Reference Finding**: Locate all references to symbols with precise location tracking
- **Dependency Analysis**: Map import/export relationships and dependency graphs
- **Pattern Matching**: AST-based code pattern detection and matching
- **Code Smell Detection**: Identify common code quality issues and anti-patterns
- **Context Extraction**: Extract relevant code context for AI understanding
- **Codebase Summarization**: Generate high-level summaries of entire codebases

### Performance & Caching
- **Multi-layer Caching**: LRU memory cache + persistent disk cache
- **Intelligent Cache Invalidation**: Content-hash, timestamp, or manual strategies
- **Project-aware Configuration**: Automatically detects and uses target project's `tsconfig.json`
- **Memory Management**: Configurable limits and automatic garbage collection
- **Batch Processing**: Concurrent analysis with configurable limits

### MCP Integration
- **Standard MCP Protocol**: Full compatibility with MCP-enabled clients
- **Tool-based Interface**: Each analysis function exposed as an MCP tool
- **Error Handling**: Comprehensive error reporting with detailed diagnostics
- **Type Safety**: Full TypeScript support with Zod schema validation

## Installation

### Prerequisites
- Node.js 18+ 
- TypeScript 5.3+
- An MCP-compatible client (Claude Desktop, Cursor, VS Code, etc.)

### Install from npm (Coming Soon)
```bash
npm install -g mcp-typescript-analyzer
```

### Install from Source
```bash
git clone https://github.com/your-org/mcp-typescript-analyzer.git
cd mcp-typescript-analyzer
npm install
npm run build
```

### Install for MCP Clients
```bash
# For Claude Desktop
npm run install-desktop

# For Cursor
npm run install-cursor

# For VS Code
npm run install-code

# Generic MCP server
npm run install-server
```

## Configuration

### MCP Client Configuration

Add this to your MCP client configuration:

**Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "typescript-analyzer": {
      "command": "/path/to/mcp-typescript-analyzer/dist/index.js",
      "args": []
    }
  }
}
```

**Cursor (`~/.cursor/mcp_config.json`):**
```json
{
  "typescript-analyzer": {
    "command": "/path/to/mcp-typescript-analyzer/dist/index.js"
  }
}
```

### Cache Configuration

The analyzer automatically creates a `.mcp-cache` directory in your project root. You can customize caching behavior:

```typescript
// Cache strategies based on project size
// Small projects (< 100 files): memory-only
// Medium projects (< 1000 files): memory-only  
// Large projects (< 5000 files): hybrid (memory + disk)
// Huge projects (5000+ files): disk-based
```

Add `.mcp-cache/` to your `.gitignore` file.

## Available Tools

### 1. `analyze_file`
Comprehensive analysis of a single TypeScript file.

```json
{
  "name": "analyze_file",
  "arguments": {
    "filePath": "./src/components/Button.tsx",
    "includeSymbols": true,
    "includeReferences": true,
    "includeTypes": true,
    "depth": "medium"
  }
}
```

**Parameters:**
- `filePath` (string): Path to the TypeScript file
- `includeSymbols` (boolean): Extract symbol information
- `includeReferences` (boolean): Include reference locations
- `includeTypes` (boolean): Include type information
- `depth` ("shallow" | "medium" | "deep"): Analysis depth

### 2. `search_symbols`
Search for symbols across the codebase.

```json
{
  "name": "search_symbols",
  "arguments": {
    "query": "UserComponent",
    "searchStrategy": "fuzzy",
    "symbolTypes": ["class", "function", "interface"],
    "maxResults": 50
  }
}
```

### 3. `get_symbol_info`
Get detailed information about a specific symbol.

```json
{
  "name": "get_symbol_info",
  "arguments": {
    "symbolName": "UserService",
    "filePath": "./src/services/UserService.ts"
  }
}
```

### 4. `find_references`
Find all references to a symbol.

```json
{
  "name": "find_references",
  "arguments": {
    "symbolName": "calculateTotal",
    "filePath": "./src/utils/math.ts",
    "includeDeclaration": true
  }
}
```

### 5. `analyze_dependencies`
Analyze import/export relationships.

```json
{
  "name": "analyze_dependencies",
  "arguments": {
    "filePath": "./src/index.ts",
    "direction": "both",
    "includeExternal": false,
    "maxDepth": 3
  }
}
```

### 6. `find_patterns`
Search for code patterns using AST matching.

```json
{
  "name": "find_patterns",
  "arguments": {
    "pattern": "async function.*await.*fetch",
    "includeTests": false,
    "contextLines": 3
  }
}
```

### 7. `detect_code_smells`
Identify code quality issues.

```json
{
  "name": "detect_code_smells",
  "arguments": {
    "filePath": "./src/legacy/old-component.ts",
    "categories": ["complexity", "naming", "structure"],
    "severity": "medium"
  }
}
```

### 8. `extract_context`
Extract relevant context for AI understanding.

```json
{
  "name": "extract_context",
  "arguments": {
    "filePath": "./src/hooks/useAuth.ts",
    "contextType": "implementation",
    "includeUsages": true
  }
}
```

### 9. `summarize_codebase`
Generate high-level codebase summary.

```json
{
  "name": "summarize_codebase",
  "arguments": {
    "rootPath": "./src",
    "includeMetrics": true,
    "groupBy": "feature"
  }
}
```

## Use Cases

### Code Review & Quality Assurance
```typescript
// Find all TODO comments
find_patterns({ pattern: "//\\s*TODO.*", includeTests: false })

// Detect complex functions
detect_code_smells({ categories: ["complexity"], severity: "high" })

// Analyze component dependencies
analyze_dependencies({ filePath: "./src/components/App.tsx", direction: "both" })
```

### Refactoring Support
```typescript
// Find all usages before renaming
find_references({ symbolName: "oldFunctionName", includeDeclaration: true })

// Understand component structure
analyze_file({ filePath: "./src/components/Form.tsx", depth: "deep" })

// Check impact of changes
analyze_dependencies({ filePath: "./src/utils/api.ts", direction: "incoming" })
```

### Documentation & Understanding
```typescript
// Generate component documentation
extract_context({ filePath: "./src/components/Modal.tsx", contextType: "documentation" })

// Understand codebase structure
summarize_codebase({ rootPath: "./src", groupBy: "feature" })

// Find implementation patterns
find_patterns({ pattern: "useEffect.*\\[\\]", contextLines: 5 })
```

### AI-Assisted Development
```typescript
// Extract context for AI code generation
extract_context({ 
  filePath: "./src/hooks/useLocalStorage.ts", 
  contextType: "implementation",
  includeUsages: true 
})

// Understand component relationships
analyze_dependencies({ 
  filePath: "./src/components/Dashboard.tsx", 
  direction: "both",
  maxDepth: 2 
})
```

## Example Output

### File Analysis Result
```json
{
  "summary": {
    "totalSymbols": 15,
    "complexity": 23,
    "dependencies": ["react", "@/hooks/useAuth", "./types"]
  },
  "symbols": [
    {
      "name": "UserProfile",
      "kind": "function",
      "type": "React.FC<UserProfileProps>",
      "location": {
        "file": "/src/components/UserProfile.tsx",
        "position": { "line": 12, "character": 0 },
        "endPosition": { "line": 45, "character": 1 }
      },
      "modifiers": ["export", "default"],
      "complexity": 8
    }
  ],
  "diagnostics": [],
  "metadata": {
    "fileSize": 2048,
    "lastModified": "2024-01-15T10:30:00Z",
    "analysisTimeMs": 156
  }
}
```

### Symbol Search Result
```json
{
  "symbols": [
    {
      "name": "useAuth",
      "kind": "function",
      "location": {
        "file": "/src/hooks/useAuth.ts",
        "position": { "line": 8, "character": 0 }
      },
      "relevanceScore": 0.95
    }
  ],
  "totalFound": 12,
  "searchTimeMs": 45
}
```

## Performance

### Benchmarks
- **Small Projects** (< 100 files): ~50ms per file analysis
- **Medium Projects** (< 1000 files): ~100ms per file analysis  
- **Large Projects** (< 5000 files): ~200ms per file analysis
- **Cache Hit Rate**: 85-95% for repeated analyses
- **Memory Usage**: ~50KB per cached file

### Optimization Features
- **Incremental Analysis**: Only re-analyze changed files
- **Smart Caching**: Content-hash based invalidation
- **Memory Management**: Automatic cleanup of unused references
- **Concurrent Processing**: Parallel analysis with configurable limits
- **Project-aware**: Respects `tsconfig.json` for accurate type resolution

## Architecture

### Core Components
```
src/
├── index.ts           # MCP server entry point
├── tools.ts           # Tool implementations
├── analyzer.ts        # Core analysis engine
├── cache.ts           # Multi-layer caching system
├── utils.ts           # Utilities and helpers
└── types.ts           # Type definitions
```

### Key Technologies
- **ts-morph**: TypeScript compiler API wrapper
- **LRU Cache**: Memory-efficient caching
- **node-persist**: Disk-based cache persistence
- **Zod**: Runtime type validation
- **p-limit**: Concurrency control

## Development

### Setup
```bash
git clone https://github.com/your-org/mcp-typescript-analyzer.git
cd mcp-typescript-analyzer
npm install
```

### Build
```bash
npm run build          # Compile TypeScript
npm run build:watch    # Watch mode for development
```

### Testing
```bash
npm test              # Run test suite
npm run test:cache    # Test caching functionality
npm run test:perf     # Performance benchmarks
```

### Development Workflow
```bash
# Start in development mode
npm run dev

# Test with a real project
node dist/index.js

# Install in MCP client for testing
npm run install-cursor
```

## Cache Management

### Cache Structure
```
.mcp-cache/
├── analysis/         # Persistent analysis results
├── files/           # Parsed file cache (memory)
└── symbols/         # Symbol information cache (memory)
```

### Cache Commands
```bash
# Clear all caches
node -e "import('./dist/cache.js').then(({cacheManager}) => cacheManager.clearAll())"

# Check cache stats
node -e "import('./dist/cache.js').then(({cacheManager}) => console.log(cacheManager.getStats()))"
```

### Cache Strategies
- **Content-hash**: Invalidate when file content changes (default)
- **Timestamp**: Invalidate when file modification time changes
- **Manual**: Never invalidate automatically

## Troubleshooting

### Common Issues

**1. "Cannot find module" errors**
- Ensure the target project has a valid `tsconfig.json`
- Check that path aliases are properly configured
- Verify that all dependencies are installed

**2. Memory issues with large codebases**
- Adjust cache limits in the configuration
- Use disk-based caching for large projects
- Enable memory monitoring

**3. Slow analysis performance**
- Enable caching (default)
- Reduce analysis depth for large files
- Use incremental analysis mode

**4. MCP connection issues**
- Check that the server path is correct in MCP config
- Ensure the executable has proper permissions
- Verify Node.js version compatibility

### Debug Mode
```bash
# Enable verbose logging
DEBUG=mcp-typescript-analyzer node dist/index.js

# Test server directly
echo '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}' | node dist/index.js
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [ts-morph](https://github.com/dsherret/ts-morph) - TypeScript compiler API wrapper
- [Model Context Protocol](https://github.com/anthropics/mcp) - Protocol specification
- [TypeScript](https://www.typescriptlang.org/) - The TypeScript language

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/mcp-typescript-analyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mcp-typescript-analyzer/discussions)
- **Documentation**: [Wiki](https://github.com/your-org/mcp-typescript-analyzer/wiki)

---

**Made with care for the TypeScript community**