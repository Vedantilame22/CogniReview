import { parse } from '@babel/parser';
import traversePkg from '@babel/traverse';
import { Violation } from '../../types/audit.js';

const traverse = (traversePkg as unknown as { default: typeof traversePkg }).default || traversePkg;

export class ComplexityAuditor {
  /**
   * Audits code for cognitive complexity, empty catch blocks, console leaks, and giant functions
   */
  public auditComplexity(filePath: string, code: string): { violations: Violation[]; complexityScore: number } {
    const violations: Violation[] = [];
    let complexityScore = 0;

    if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) {
      return { violations, complexityScore: 0 };
    }

    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'decorators-legacy'],
        errorRecovery: true
      });

      traverse(ast, {
        // 1. Calculate Cognitive Complexity increments
        IfStatement: () => { complexityScore += 1; },
        ForStatement: () => { complexityScore += 2; },
        ForInStatement: () => { complexityScore += 2; },
        ForOfStatement: () => { complexityScore += 2; },
        WhileStatement: () => { complexityScore += 2; },
        ConditionalExpression: () => { complexityScore += 1; }, // Ternary operator
        CatchClause: (nodePath: any) => {
          complexityScore += 1;
          // Rule: Empty catch block (Anti-pattern)
          const body = nodePath.node.body.body;
          if (body.length === 0) {
            violations.push({
              ruleId: 'SMR-001',
              category: 'CODE_SMELL',
              severity: 'WARNING',
              file: filePath,
              line: nodePath.node.loc?.start.line,
              message: `Empty catch block detected. Swallowing exceptions without logging or handling leads to silent production bugs.`,
              suggestedFix: `Log the caught error or re-throw a structured domain error.`
            });
          }
        },

        // 2. Giant functions check (> 80 lines)
        FunctionDeclaration: (nodePath: any) => {
          const loc = nodePath.node.loc;
          if (loc) {
            const lines = loc.end.line - loc.start.line;
            if (lines > 80) {
              const name = nodePath.node.id?.name || 'anonymous';
              violations.push({
                ruleId: 'SMR-002',
                category: 'COGNITIVE_COMPLEXITY',
                severity: 'WARNING',
                file: filePath,
                line: loc.start.line,
                message: `Function '${name}' spans ${lines} lines. Large functions violate the Single Responsibility Principle and increase regression risks.`,
                suggestedFix: `Decompose this function into smaller, single-purpose helper functions.`
              });
            }
          }
        },

        // 3. Debugging Artifacts: console.log left in code
        CallExpression: (nodePath: any) => {
          const callee = nodePath.node.callee;
          if (callee.type === 'MemberExpression') {
            if (callee.object.type === 'Identifier' && callee.object.name === 'console') {
              if (callee.property.type === 'Identifier' && callee.property.name === 'log') {
                violations.push({
                  ruleId: 'SMR-003',
                  category: 'CODE_SMELL',
                  severity: 'INFO',
                  file: filePath,
                  line: nodePath.node.loc?.start.line,
                  message: `Uncleaned 'console.log' call detected. Production code should use a configured logging framework or omit debug logs.`,
                  suggestedFix: `Remove console.log before merging to production.`
                });
              }
            }
          }
        }
      });
    } catch {
      // Ignore parse failure, handled by casing auditor
    }

    return { violations, complexityScore };
  }
}
