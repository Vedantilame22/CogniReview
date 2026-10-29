import { Severity, Category } from './audit.js';

export interface LearnedRule {
  id: string;
  repository: string;
  category: Category;
  patternDescription: string;
  severity: Severity;
  originatingPR?: number;
  triggerComment?: string; // What developer said when dismissing/correcting
  confidenceScore: number;  // 0.0 to 1.0 (increases as more PRs agree)
  timesEnforced: number;
  timesOverridden: number;
  createdAt: string;
  updatedAt: string;
}

export interface NamingConventionConfig {
  reactComponents: 'PascalCase';
  variables: 'camelCase';
  functions: 'camelCase';
  constants: 'UPPER_SNAKE_CASE';
  filenames: {
    components: 'PascalCase' | 'kebab-case';
    utilities: 'camelCase' | 'kebab-case';
    services: 'camelCase' | 'kebab-case';
  };
}

export interface StructureConventionConfig {
  allowedRootDirectories: string[];
  colocateTests: boolean;
  colocateStyles: boolean;
  forbiddenCrossImports: Array<{
    from: string;
    cannotImportFrom: string;
    reason: string;
  }>;
}
