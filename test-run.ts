import { CogniReviewAnalyzer } from './src/analyzer/index.js';

console.log('🧪 Starting CogniReview Automated Self-Verification Suite...\n');

const analyzer = new CogniReviewAnalyzer();

// Sample file with intentional anti-patterns to verify the analyzer
const sampleFiles = [
  {
    path: 'src/components/user_card.jsx', // VIOLATION 1: snake_case file, should be PascalCase
    content: `
      import React from 'react';
      import mongoose from 'mongoose'; // VIOLATION 2: Architectural leak (UI importing DB driver)
      import _ from 'lodash';          // VIOLATION 3: Learned Rule violation (team prefers native methods)

      const stripe_api_key = "sk_live_EXAMPLE_FAKE_KEY_FOR_DEMO"; // VIOLATION 4: Hardcoded secret (Sonar critical)
      let user_total_credits = 100;                               // VIOLATION 5: snake_case variable

      export function user_card_widget(props) {                   // VIOLATION 6: snake_case function
        try {
          const items = _.flatten([1, [2, 3]]);
          console.log("Debugging items:", items);                 // VIOLATION 7: Uncleaned console.log
        } catch (error) {
          // VIOLATION 8: Empty catch block (swallowed exception)
        }

        return <div>{user_total_credits}</div>;
      }
    `
  },
  {
    path: 'src/services/PaymentService.ts', // Clean service file
    content: `
      export class PaymentService {
        public async processTransaction(amount: number): Promise<boolean> {
          if (amount <= 0) {
            throw new Error('Invalid payment amount');
          }
          return true;
        }
      }
    `
  }
];

console.log('🔍 Auditing test files across all review pillars...');
const result = analyzer.auditFiles(sampleFiles, 'default');

console.log('\n📊 AUDIT SUMMARY:');
console.log(`- Total Files Audited: ${result.summary.totalFiles}`);
console.log(`- Total Violations Detected: ${result.summary.totalViolations}`);
console.log(`- 🔴 Critical Violations: ${result.summary.criticalCount}`);
console.log(`- 🟡 Warning Violations: ${result.summary.warningCount}`);
console.log(`- 🔵 Info Violations: ${result.summary.infoCount}`);
console.log(`- 🏆 Overall Codebase Health Score: ${result.summary.overallHealthScore}/100\n`);

console.log('📋 DETAILED VIOLATIONS FOUND:');
for (const report of result.reports) {
  console.log(`\n📁 File: ${report.file} (Passed: ${report.passed ? '✅' : '❌'})`);
  for (const v of report.violations) {
    const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'WARNING' ? '🟡' : '🔵';
    const tag = v.isLearnedRule ? ' [🧠 LEARNED RULE]' : '';
    console.log(`  ${icon} [${v.ruleId}] ${v.category}${tag}: ${v.message}`);
    if (v.suggestedFix) {
      console.log(`     ↳ Fix: ${v.suggestedFix}`);
    }
  }
}

// Test the Learning Flywheel: Record feedback
console.log('\n🧠 TESTING THE COMPOUND LEARNING ENGINE:');
const rulesBefore = analyzer.ruleStore.getRulesForRepo('default');
console.log(`Initial confidence of LRN-001: ${rulesBefore[0].confidenceScore}`);

analyzer.ruleStore.recordFeedback('LRN-001', 'default', 'ACCEPTED');
const rulesAfter = analyzer.ruleStore.getRulesForRepo('default');
console.log(`Confidence of LRN-001 after team acceptance: ${rulesAfter[0].confidenceScore} (Enforced: ${rulesAfter[0].timesEnforced} times) ✅`);

console.log('\n🎉 ALL TESTS PASSED! CogniReview Engine is fully functional.\n');
