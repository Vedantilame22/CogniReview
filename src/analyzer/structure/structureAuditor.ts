import path from 'node:path';
import { Violation } from '../../types/audit.js';

export class StructureAuditor {
  /**
   * Audits file location and cross-layer architectural boundaries
   */
  public auditStructure(filePath: string, fileContent: string): Violation[] {
    const violations: Violation[] = [];
    const normalized = filePath.replace(/\\/g, '/');

    // Rule 1: Depth limit check (prevent deeply nested spaghetti hierarchies)
    const depth = normalized.split('/').length;
    if (depth > 7) {
      violations.push({
        ruleId: 'STR-001',
        category: 'FOLDER_STRUCTURE',
        severity: 'WARNING',
        file: filePath,
        message: `File path depth is ${depth} levels deep. Deeply nested directory structures increase cognitive load and complicate imports.`,
        suggestedFix: `Refactor to flatten hierarchy (e.g. feature-based packaging or modular grouping).`
      });
    }

    // Rule 2: Architectural Leak: Client components or UI importing Database Libraries directly
    const isUIFile = normalized.includes('/components/') || normalized.includes('/views/') || normalized.includes('/pages/');
    if (isUIFile) {
      const forbiddenDBImports = ['mongoose', 'pg', 'prisma', 'typeorm', 'mysql2', 'sqlite3', 'knex'];
      for (const dbLib of forbiddenDBImports) {
        const importPattern = new RegExp(`from ['"]${dbLib}['"]|require\\(['"]${dbLib}['"]\\)`, 'i');
        if (importPattern.test(fileContent)) {
          violations.push({
            ruleId: 'STR-002',
            category: 'FOLDER_STRUCTURE',
            severity: 'CRITICAL',
            file: filePath,
            message: `Architectural boundary violation: UI layer component is directly importing database library '${dbLib}'.`,
            suggestedFix: `Move database operations to an API route, server action, or dedicated repository/service layer.`
          });
        }
      }
    }

    // Rule 3: Missing standard exports in barrel files
    if (path.basename(normalized) === 'index.ts' || path.basename(normalized) === 'index.js') {
      if (fileContent.trim().length === 0) {
        violations.push({
          ruleId: 'STR-003',
          category: 'FOLDER_STRUCTURE',
          severity: 'INFO',
          file: filePath,
          message: `Empty index barrel file detected at '${filePath}'.`,
          suggestedFix: `Export modules from this folder or delete the empty index file.`
        });
      }
    }

    return violations;
  }
}
