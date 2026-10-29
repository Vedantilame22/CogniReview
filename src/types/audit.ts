export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

export type Category = 
  | 'FILE_NAMING'
  | 'CASING_CONVENTION'
  | 'FOLDER_STRUCTURE'
  | 'COGNITIVE_COMPLEXITY'
  | 'SECURITY_RISK'
  | 'CODE_SMELL'
  | 'LEARNED_RULE_VIOLATION';

export interface Violation {
  ruleId: string;
  category: Category;
  severity: Severity;
  message: string;
  file: string;
  line?: number;
  column?: number;
  suggestedFix?: string;
  contextSnippet?: string;
  isLearnedRule?: boolean;
}

export interface FileAuditReport {
  file: string;
  violations: Violation[];
  metrics: {
    linesOfCode: number;
    cognitiveComplexityScore: number;
    functionsCount: number;
  };
  passed: boolean;
}

export interface CodebaseAuditResult {
  summary: {
    totalFiles: number;
    totalViolations: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    overallHealthScore: number; // 0 - 100
  };
  reports: FileAuditReport[];
  timestamp: string;
}
