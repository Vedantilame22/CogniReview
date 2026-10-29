import fs from 'node:fs';
import path from 'node:path';
import { FileNamingAuditor } from './naming/fileNamingAuditor.js';
import { StructureAuditor } from './structure/structureAuditor.js';
import { AstCasingAuditor } from './casing/astCasingAuditor.js';
import { ComplexityAuditor } from './complexity/complexityAuditor.js';
import { RuleStore } from '../memory/ruleStore.js';
import { FileAuditReport, CodebaseAuditResult, Violation } from '../types/audit.js';

export class CogniReviewAnalyzer {
  private namingAuditor = new FileNamingAuditor();
  private structureAuditor = new StructureAuditor();
  private casingAuditor = new AstCasingAuditor();
  private complexityAuditor = new ComplexityAuditor();
  public ruleStore = new RuleStore();

  /**
   * Audits a single file across all static, architectural, AST, and learned rules
   */
  public auditFile(filePath: string, fileContent: string, repoName: string = 'default'): FileAuditReport {
    const violations: Violation[] = [];

    // 1. Audit File Naming
    violations.push(...this.namingAuditor.auditFilePath(filePath));

    // 2. Audit Folder & Architecture Structure
    violations.push(...this.structureAuditor.auditStructure(filePath, fileContent));

    // 3. Audit AST Identifiers, Casing & Hardcoded Secrets
    violations.push(...this.casingAuditor.auditCode(filePath, fileContent));

    // 4. Audit Cognitive Complexity & Code Smells
    const complexityResult = this.complexityAuditor.auditComplexity(filePath, fileContent);
    violations.push(...complexityResult.violations);

    // 5. Audit Against Learned Repository Rules
    violations.push(...this.ruleStore.auditAgainstLearnedRules(repoName, filePath, fileContent));

    const linesOfCode = fileContent.split('\n').length;
    const functionsCount = (fileContent.match(/function\s+|const\s+\w+\s*=\s*(\(.*?\)|async\s*\(.*?\))\s*=>/g) || []).length;

    return {
      file: filePath,
      violations,
      metrics: {
        linesOfCode,
        cognitiveComplexityScore: complexityResult.complexityScore,
        functionsCount
      },
      passed: violations.filter(v => v.severity === 'CRITICAL').length === 0
    };
  }

  /**
   * Aggregates multiple file reports into a complete Codebase Audit Summary
   */
  public auditFiles(files: Array<{ path: string; content: string }>, repoName: string = 'default'): CodebaseAuditResult {
    const reports: FileAuditReport[] = [];
    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const f of files) {
      const report = this.auditFile(f.path, f.content, repoName);
      reports.push(report);

      for (const v of report.violations) {
        if (v.severity === 'CRITICAL') criticalCount++;
        else if (v.severity === 'WARNING') warningCount++;
        else infoCount++;
      }
    }

    const totalViolations = criticalCount + warningCount + infoCount;
    
    // Health Score calculation (100 is perfect, criticals penalize 15 pts, warnings 5 pts, info 1 pt)
    const penalty = (criticalCount * 15) + (warningCount * 5) + (infoCount * 1);
    const overallHealthScore = Math.max(0, Math.min(100, 100 - penalty));

    return {
      summary: {
        totalFiles: files.length,
        totalViolations,
        criticalCount,
        warningCount,
        infoCount,
        overallHealthScore
      },
      reports,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Scans and audits an entire local directory recursively (zero copy-paste required)
   */
  public auditDirectory(dirPath: string, repoName: string = 'default'): CodebaseAuditResult {
    const files: Array<{ path: string; content: string }> = [];
    
    const readDirRecursive = (currentPath: string) => {
      if (!fs.existsSync(currentPath)) return;
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache', '.turbo', '.system_generated']);
          if (!ignoredDirs.has(entry.name)) {
            readDirRecursive(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const allowedExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs', '.cjs']);
          if (allowedExts.has(ext)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              const relativePath = path.relative(dirPath, fullPath).replace(/\\/g, '/');
              files.push({ path: relativePath, content });
            } catch {
              // Ignore unreadable files
            }
          }
        }
      }
    };

    readDirRecursive(dirPath);
    return this.auditFiles(files, repoName);
  }
}
