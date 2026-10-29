import path from 'node:path';
import { Violation } from '../../types/audit.js';

export class FileNamingAuditor {
  // Regex patterns for naming conventions
  private isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]+$/.test(str);
  }

  private isCamelCase(str: string): boolean {
    return /^[a-z][a-zA-Z0-9]+$/.test(str);
  }

  private isKebabCase(str: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
  }

  private isSnakeCase(str: string): boolean {
    return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(str);
  }

  /**
   * Audits a single file path for naming standard violations
   */
  public auditFilePath(filePath: string): Violation[] {
    const violations: Violation[] = [];
    const normalized = filePath.replace(/\\/g, '/');
    const baseName = path.basename(normalized);
    const parsed = path.parse(baseName);
    const fileNameWithoutExt = parsed.name;
    const ext = parsed.ext.toLowerCase();

    // Skip common root configs and special files
    const ignoredFiles = new Set([
      'package.json',
      'tsconfig.json',
      'readme.md',
      'license',
      'dockerfile',
      'vite.config.ts',
      'next.config.js',
      'next.config.mjs',
      'tailwind.config.js',
      'postcss.config.js'
    ]);

    if (ignoredFiles.has(baseName.toLowerCase()) || normalized.includes('node_modules')) {
      return violations;
    }

    // Rule 1: Flag snake_case in TS/JS files (Industry standard prefers PascalCase or kebab-case)
    if (this.isSnakeCase(fileNameWithoutExt) && (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx')) {
      // Allow index or special files
      if (!fileNameWithoutExt.startsWith('index') && !fileNameWithoutExt.startsWith('_')) {
        violations.push({
          ruleId: 'NAM-001',
          category: 'FILE_NAMING',
          severity: 'WARNING',
          file: filePath,
          message: `File name '${baseName}' uses snake_case ('_'). Standard TypeScript/React conventions prefer PascalCase or kebab-case.`,
          suggestedFix: `Rename '${baseName}' to '${this.toPascalCase(fileNameWithoutExt)}${ext}' or '${this.toKebabCase(fileNameWithoutExt)}${ext}'.`
        });
      }
    }

    // Rule 2: React Components (*.tsx or *.jsx) should typically be PascalCase
    if (ext === '.tsx' || ext === '.jsx') {
      const isHook = fileNameWithoutExt.startsWith('use') && this.isCamelCase(fileNameWithoutExt);
      const isNextAppSpecialFile = ['page', 'layout', 'loading', 'error', 'not-found', 'template', 'route'].includes(fileNameWithoutExt);

      if (!isHook && !isNextAppSpecialFile && !this.isPascalCase(fileNameWithoutExt)) {
        violations.push({
          ruleId: 'NAM-002',
          category: 'FILE_NAMING',
          severity: 'INFO',
          file: filePath,
          message: `React component file '${baseName}' should ideally follow PascalCase convention (e.g. 'UserProfile.tsx').`,
          suggestedFix: `Rename '${baseName}' to '${this.toPascalCase(fileNameWithoutExt)}${ext}'.`
        });
      }
    }

    // Rule 3: Custom React Hooks must start with 'use' and follow camelCase
    if (normalized.includes('/hooks/') && (ext === '.ts' || ext === '.tsx')) {
      if (!fileNameWithoutExt.startsWith('use') || !this.isCamelCase(fileNameWithoutExt)) {
        violations.push({
          ruleId: 'NAM-003',
          category: 'FILE_NAMING',
          severity: 'WARNING',
          file: filePath,
          message: `Hook file '${baseName}' inside hooks directory must start with 'use' and follow camelCase (e.g., 'useAuth.ts').`,
          suggestedFix: `Rename to 'use${this.toPascalCase(fileNameWithoutExt)}${ext}'.`
        });
      }
    }

    // Rule 4: Test files must follow standard suffix (*.test.ts, *.spec.ts)
    if (normalized.includes('__tests__') || normalized.includes('/tests/')) {
      const isTestSuffix = fileNameWithoutExt.endsWith('.test') || fileNameWithoutExt.endsWith('.spec');
      if (!isTestSuffix && (ext === '.ts' || ext === '.tsx' || ext === '.js')) {
        violations.push({
          ruleId: 'NAM-004',
          category: 'FILE_NAMING',
          severity: 'INFO',
          file: filePath,
          message: `Test file '${baseName}' should have a '.test${ext}' or '.spec${ext}' suffix for test runner auto-discovery.`,
          suggestedFix: `Rename to '${fileNameWithoutExt}.test${ext}'.`
        });
      }
    }

    return violations;
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^(\w)/, (_, c) => c.toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/^-/, '')
      .replace(/_/g, '-');
  }
}
