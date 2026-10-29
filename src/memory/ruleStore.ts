import { LearnedRule } from '../types/rules.js';
import { Violation } from '../types/audit.js';

export class RuleStore {
  private rules: Map<string, LearnedRule[]> = new Map();

  constructor() {
    // Seed with a sample learned rule so the engine can demonstrate learning out-of-the-box
    this.addLearnedRule({
      id: 'LRN-001',
      repository: 'default',
      category: 'LEARNED_RULE_VIOLATION',
      patternDescription: 'Team prefers native Array.flat() and Array.flatMap() over external Lodash utility imports.',
      severity: 'WARNING',
      triggerComment: 'We deprecated lodash in PR #42; please use native ES2022 array methods.',
      confidenceScore: 0.95,
      timesEnforced: 14,
      timesOverridden: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Adds or updates a learned rule derived from developer PR feedback
   */
  public addLearnedRule(rule: LearnedRule): void {
    const repoRules = this.rules.get(rule.repository) || [];
    const existingIndex = repoRules.findIndex(r => r.id === rule.id);

    if (existingIndex >= 0) {
      repoRules[existingIndex] = rule;
    } else {
      repoRules.push(rule);
    }

    this.rules.set(rule.repository, repoRules);
  }

  /**
   * Retrieves all active learned rules for a given repository
   */
  public getRulesForRepo(repoName: string): LearnedRule[] {
    const specific = this.rules.get(repoName) || [];
    const defaults = this.rules.get('default') || [];
    return [...defaults, ...specific];
  }

  /**
   * Checks code against learned rules for the repository
   */
  public auditAgainstLearnedRules(repoName: string, filePath: string, code: string): Violation[] {
    const violations: Violation[] = [];
    const rules = this.getRulesForRepo(repoName);

    for (const rule of rules) {
      // Example rule: No lodash import
      if (rule.patternDescription.includes('Lodash') || rule.patternDescription.includes('lodash')) {
        if (/from ['"]lodash['"]|require\(['"]lodash['"]\)/.test(code)) {
          violations.push({
            ruleId: rule.id,
            category: 'LEARNED_RULE_VIOLATION',
            severity: rule.severity,
            file: filePath,
            message: `Learned Team Rule (${Math.round(rule.confidenceScore * 100)}% confidence): ${rule.patternDescription}`,
            suggestedFix: `Refactor to adhere to the team convention established in PR #${rule.originatingPR || 'past reviews'}.`,
            isLearnedRule: true
          });
        }
      }
    }

    return violations;
  }

  /**
   * Adjusts rule confidence based on developer feedback
   */
  public recordFeedback(ruleId: string, repoName: string, action: 'ACCEPTED' | 'OVERRIDDEN'): void {
    const rules = this.getRulesForRepo(repoName);
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    if (action === 'ACCEPTED') {
      rule.timesEnforced += 1;
      rule.confidenceScore = Math.min(1.0, rule.confidenceScore + 0.05);
    } else {
      rule.timesOverridden += 1;
      rule.confidenceScore = Math.max(0.1, rule.confidenceScore - 0.15);
    }
    rule.updatedAt = new Date().toISOString();
  }
}
