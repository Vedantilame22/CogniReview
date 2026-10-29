import { parse } from '@babel/parser';
import traversePkg from '@babel/traverse';
import { Violation } from '../../types/audit.js';

// Handle ESM default import interop for babel traverse
const traverse = (traversePkg as unknown as { default: typeof traversePkg }).default || traversePkg;

export class AstCasingAuditor {
  private isCamelCase(str: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(str);
  }

  private isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
  }

  private isUpperSnakeCase(str: string): boolean {
    return /^[A-Z0-9]+(_[A-Z0-9]+)*$/.test(str);
  }

  private isSnakeCase(str: string): boolean {
    return /^[a-z0-9]+(_[a-z0-9]+)+$/.test(str);
  }

  /**
   * Parses JavaScript / TypeScript source code to check identifier casings and code smells
   */
  public auditCode(filePath: string, code: string): Violation[] {
    const violations: Violation[] = [];

    // Skip non-code files
    if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) {
      return violations;
    }

    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'asyncGenerators'
        ],
        errorRecovery: true
      });

      // Traverse AST nodes
      traverse(ast, {
        // 1. Variable & Constant Declarations
        VariableDeclarator: (nodePath: any) => {
          const idNode = nodePath.node.id;
          if (idNode.type === 'Identifier') {
            const name: string = idNode.name;
            const line = idNode.loc?.start.line;
            const col = idNode.loc?.start.column;

            // Ignore system/standard variables and single-letter counters (i, j, _, etc.)
            if (name.length <= 2 || name.startsWith('_') || name.startsWith('$')) {
              return;
            }

            // Check if variable is declared with const at top-level scope
            const isConst = nodePath.parent.kind === 'const';
            const isTopLevel = nodePath.scope.depth <= 1;

            if (isConst && isTopLevel && !this.isUpperSnakeCase(name) && !this.isCamelCase(name) && !this.isPascalCase(name)) {
              if (this.isSnakeCase(name)) {
                violations.push({
                  ruleId: 'CASE-001',
                  category: 'CASING_CONVENTION',
                  severity: 'WARNING',
                  file: filePath,
                  line,
                  column: col,
                  message: `Variable '${name}' uses snake_case. TypeScript / JavaScript standards mandate camelCase or UPPER_SNAKE_CASE.`,
                  suggestedFix: `Rename '${name}' to '${this.toCamelCase(name)}'.`
                });
              }
            } else if (!isConst && this.isSnakeCase(name)) {
              violations.push({
                ruleId: 'CASE-002',
                category: 'CASING_CONVENTION',
                severity: 'WARNING',
                file: filePath,
                line,
                column: col,
                message: `Variable '${name}' uses snake_case. Standard JavaScript / TypeScript conventions require camelCase for mutable variables.`,
                suggestedFix: `Rename '${name}' to '${this.toCamelCase(name)}'.`
              });
            }
          }
        },

        // 2. Function Declarations
        FunctionDeclaration: (nodePath: any) => {
          if (nodePath.node.id && nodePath.node.id.type === 'Identifier') {
            const name: string = nodePath.node.id.name;
            const line = nodePath.node.loc?.start.line;
            const col = nodePath.node.loc?.start.column;

            // React components can be PascalCase (e.g., function Navbar() {})
            const isReactComponent = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
            if (isReactComponent && this.isPascalCase(name)) {
              return; // Valid component function
            }

            if (!this.isCamelCase(name) && !name.startsWith('_')) {
              violations.push({
                ruleId: 'CASE-003',
                category: 'CASING_CONVENTION',
                severity: 'WARNING',
                file: filePath,
                line,
                column: col,
                message: `Function '${name}' does not follow camelCase naming convention.`,
                suggestedFix: `Rename function to '${this.toCamelCase(name)}'.`
              });
            }
          }
        },

        // 3. Class Declarations
        ClassDeclaration: (nodePath: any) => {
          if (nodePath.node.id && nodePath.node.id.type === 'Identifier') {
            const name: string = nodePath.node.id.name;
            const line = nodePath.node.loc?.start.line;
            const col = nodePath.node.loc?.start.column;

            if (!this.isPascalCase(name)) {
              violations.push({
                ruleId: 'CASE-004',
                category: 'CASING_CONVENTION',
                severity: 'CRITICAL',
                file: filePath,
                line,
                column: col,
                message: `Class '${name}' must strictly follow PascalCase convention.`,
                suggestedFix: `Rename class to '${this.toPascalCase(name)}'.`
              });
            }
          }
        },

        // 4. Hardcoded Secret Detection (SonarQube Security Rule)
        StringLiteral: (nodePath: any) => {
          const val: string = nodePath.node.value;
          const line = nodePath.node.loc?.start.line;

          // Detect common API Key signatures
          const isSecret = 
            /(sk_live_[0-9a-zA-Z]{24})|(ghp_[0-9a-zA-Z]{36})|(AIzaSy[0-9a-zA-Z\\-_]{33})|(AKIA[0-9A-Z]{16})/.test(val) ||
            (val.length > 28 && /^[A-Za-z0-9+/=_-]+$/.test(val) && nodePath.parent.type === 'VariableDeclarator' && /key|secret|token|password/i.test(nodePath.parent.id?.name || ''));

          if (isSecret) {
            violations.push({
              ruleId: 'SEC-001',
              category: 'SECURITY_RISK',
              severity: 'CRITICAL',
              file: filePath,
              line,
              message: `High Severity: Potential hardcoded secret or API key detected in source code.`,
              suggestedFix: `Move secret to environment variables (.env) and access via process.env.`
            });
          }
        }
      });
    } catch {
      // If parsing fails (syntax error), report as an informative warning
      violations.push({
        ruleId: 'SYN-001',
        category: 'CODE_SMELL',
        severity: 'INFO',
        file: filePath,
        message: `Failed to parse file AST. File might contain unparsed dialect or syntax error.`
      });
    }

    return violations;
  }

  private toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/([-_][a-z0-9])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
  }

  private toPascalCase(str: string): string {
    const camel = this.toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }
}
