const llmService = require('./LLMService');
const logger = require('../../utils/logger');

class AuditorService {
    constructor() {
        this.systemMessage = 'You are a senior smart contract security auditor with expertise in Solidity, common vulnerabilities, and best practices. Provide detailed, actionable security analysis.';
    }

    /**
     * Perform full contract audit
     * @param {string} contractCode - Solidity contract code
     * @returns {Promise<Object>} Comprehensive audit report
     */
    async auditContract(contractCode) {
        try {
            const prompt = `Perform a comprehensive security audit of this smart contract:

${contractCode}

Provide a detailed audit covering:
1. **Vulnerabilities**: List all security vulnerabilities found (reentrancy, overflow, access control, etc.)
2. **Risk Level**: Overall risk assessment (LOW, MEDIUM, HIGH, CRITICAL)
3. **Gas Optimization**: Opportunities to reduce gas costs
4. **Best Practices**: Violations of Solidity best practices
5. **Recommendations**: Specific fixes for each issue
6. **Code Quality**: Assessment of code structure and readability

Format your response as:
VULNERABILITIES:
- [Issue]: [Description] [Severity: LOW/MEDIUM/HIGH/CRITICAL]

RISK LEVEL: [Overall risk]

GAS OPTIMIZATION:
- [Suggestion]

BEST PRACTICES:
- [Issue]

RECOMMENDATIONS:
- [Fix]

CODE QUALITY: [Assessment]`;

            const response = await llmService.chat(prompt, 'gpt-4', this.systemMessage);

            const parsed = this.parseAuditResponse(response.response);

            return {
                vulnerabilities: parsed.vulnerabilities,
                risk_level: parsed.risk_level,
                gas_optimization: parsed.gas_optimization,
                best_practices: parsed.best_practices,
                recommendations: parsed.recommendations,
                code_quality: parsed.code_quality,
                raw_report: response.response,
                tokens_used: response.tokens_used,
                model_used: response.model_used,
                audit_timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Contract audit error:', error.message);
            throw new Error(`Failed to audit contract: ${error.message}`);
        }
    }

    /**
     * Perform security-focused scan
     * @param {string} contractCode - Solidity contract code
     * @returns {Promise<Object>} Security scan results
     */
    async checkSecurity(contractCode) {
        try {
            const prompt = `Perform a focused security scan on this smart contract, checking for common vulnerabilities:

${contractCode}

Check for these specific vulnerabilities:
1. Reentrancy attacks
2. Integer overflow/underflow
3. Access control issues
4. Unchecked external calls
5. Denial of Service vulnerabilities
6. Front-running vulnerabilities
7. Timestamp dependence
8. Delegatecall to untrusted contracts
9. Unprotected self-destruct
10. Signature replay attacks

For each vulnerability found, provide:
- Vulnerability name
- Severity (LOW/MEDIUM/HIGH/CRITICAL)
- Location in code (function/line if possible)
- Explanation
- Fix recommendation

If no vulnerabilities found, state "No critical vulnerabilities detected."`;

            const response = await llmService.chat(prompt, 'gpt-4', this.systemMessage);

            const vulnerabilities = this.extractVulnerabilities(response.response);
            const riskLevel = this.calculateRiskLevel(vulnerabilities);

            return {
                vulnerabilities,
                risk_level: riskLevel,
                scan_type: 'security_focused',
                vulnerabilities_found: vulnerabilities.length,
                raw_report: response.response,
                tokens_used: response.tokens_used,
                model_used: response.model_used,
                scan_timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Security check error:', error.message);
            throw new Error(`Failed to check security: ${error.message}`);
        }
    }

    /**
     * Find specific vulnerabilities
     * @param {string} contractCode - Solidity contract code
     * @returns {Promise<Object>} Vulnerability detection results
     */
    async findVulnerabilities(contractCode) {
        try {
            const prompt = `Analyze this smart contract and identify ALL vulnerabilities:

${contractCode}

For each vulnerability, provide:
{
  "name": "Vulnerability name",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "location": "Function or line reference",
  "description": "What the vulnerability is",
  "impact": "Potential consequences",
  "fix": "How to fix it"
}

List all vulnerabilities found. If none, return empty array.`;

            const response = await llmService.chat(prompt, 'gpt-4', this.systemMessage);

            const vulnerabilities = this.extractStructuredVulnerabilities(response.response);

            return {
                vulnerabilities,
                total_found: vulnerabilities.length,
                critical_count: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
                high_count: vulnerabilities.filter(v => v.severity === 'HIGH').length,
                medium_count: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
                low_count: vulnerabilities.filter(v => v.severity === 'LOW').length,
                risk_level: this.calculateRiskLevel(vulnerabilities),
                tokens_used: response.tokens_used,
                model_used: response.model_used
            };
        } catch (error) {
            logger.error('Vulnerability detection error:', error.message);
            throw new Error(`Failed to find vulnerabilities: ${error.message}`);
        }
    }

    /**
     * Generate formatted audit report
     * @param {string} contractCode - Solidity contract code
     * @returns {Promise<Object>} Formatted audit report
     */
    async getAuditReport(contractCode) {
        try {
            const auditResults = await this.auditContract(contractCode);

            const report = {
                title: 'Smart Contract Security Audit Report',
                timestamp: new Date().toISOString(),
                executive_summary: {
                    risk_level: auditResults.risk_level,
                    vulnerabilities_found: auditResults.vulnerabilities.length,
                    critical_issues: auditResults.vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
                    recommendations_count: auditResults.recommendations.length
                },
                detailed_findings: {
                    vulnerabilities: auditResults.vulnerabilities,
                    gas_optimization: auditResults.gas_optimization,
                    best_practices: auditResults.best_practices
                },
                recommendations: auditResults.recommendations,
                code_quality_assessment: auditResults.code_quality,
                conclusion: this.generateConclusion(auditResults),
                metadata: {
                    tokens_used: auditResults.tokens_used,
                    model_used: auditResults.model_used,
                    contract_size: contractCode.length
                }
            };

            return report;
        } catch (error) {
            logger.error('Audit report generation error:', error.message);
            throw new Error(`Failed to generate audit report: ${error.message}`);
        }
    }

    /**
     * Parse audit response into structured data
     * @param {string} response - LLM response
     * @returns {Object} Parsed audit data
     */
    parseAuditResponse(response) {
        const sections = {
            vulnerabilities: [],
            risk_level: 'UNKNOWN',
            gas_optimization: [],
            best_practices: [],
            recommendations: [],
            code_quality: ''
        };

        // Extract vulnerabilities
        const vulnMatch = response.match(/VULNERABILITIES:([\s\S]*?)(?=RISK LEVEL:|GAS OPTIMIZATION:|$)/i);
        if (vulnMatch) {
            const vulnLines = vulnMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
            sections.vulnerabilities = vulnLines.map(line => {
                const severityMatch = line.match(/\[Severity:\s*(LOW|MEDIUM|HIGH|CRITICAL)\]/i);
                return {
                    description: line.replace(/\[Severity:.*?\]/i, '').trim().replace(/^-\s*/, ''),
                    severity: severityMatch ? severityMatch[1].toUpperCase() : 'MEDIUM'
                };
            });
        }

        // Extract risk level
        const riskMatch = response.match(/RISK LEVEL:\s*(LOW|MEDIUM|HIGH|CRITICAL)/i);
        if (riskMatch) {
            sections.risk_level = riskMatch[1].toUpperCase();
        }

        // Extract gas optimization
        const gasMatch = response.match(/GAS OPTIMIZATION:([\s\S]*?)(?=BEST PRACTICES:|RECOMMENDATIONS:|$)/i);
        if (gasMatch) {
            sections.gas_optimization = gasMatch[1].split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace(/^-\s*/, ''));
        }

        // Extract best practices
        const practicesMatch = response.match(/BEST PRACTICES:([\s\S]*?)(?=RECOMMENDATIONS:|CODE QUALITY:|$)/i);
        if (practicesMatch) {
            sections.best_practices = practicesMatch[1].split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace(/^-\s*/, ''));
        }

        // Extract recommendations
        const recsMatch = response.match(/RECOMMENDATIONS:([\s\S]*?)(?=CODE QUALITY:|$)/i);
        if (recsMatch) {
            sections.recommendations = recsMatch[1].split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace(/^-\s*/, ''));
        }

        // Extract code quality
        const qualityMatch = response.match(/CODE QUALITY:\s*(.+)/i);
        if (qualityMatch) {
            sections.code_quality = qualityMatch[1].trim();
        }

        return sections;
    }

    /**
     * Extract vulnerabilities from response
     * @param {string} response - LLM response
     * @returns {Array} Vulnerabilities array
     */
    extractVulnerabilities(response) {
        const vulnerabilities = [];
        const lines = response.split('\n');

        for (const line of lines) {
            const severityMatch = line.match(/(LOW|MEDIUM|HIGH|CRITICAL)/i);
            if (severityMatch && line.includes('-')) {
                vulnerabilities.push({
                    description: line.replace(/\(.*?\)/g, '').trim().replace(/^-\s*/, ''),
                    severity: severityMatch[1].toUpperCase()
                });
            }
        }

        return vulnerabilities;
    }

    /**
     * Extract structured vulnerabilities
     * @param {string} response - LLM response
     * @returns {Array} Structured vulnerabilities
     */
    extractStructuredVulnerabilities(response) {
        const vulnerabilities = [];

        // Try to parse JSON-like structures
        const jsonMatches = response.match(/\{[^}]+\}/g);
        if (jsonMatches) {
            for (const match of jsonMatches) {
                try {
                    const parsed = JSON.parse(match);
                    if (parsed.name && parsed.severity) {
                        vulnerabilities.push(parsed);
                    }
                } catch (e) {
                    // Not valid JSON, skip
                }
            }
        }

        // Fallback to simple extraction
        if (vulnerabilities.length === 0) {
            return this.extractVulnerabilities(response);
        }

        return vulnerabilities;
    }

    /**
     * Calculate overall risk level
     * @param {Array} vulnerabilities - Vulnerabilities array
     * @returns {string} Risk level
     */
    calculateRiskLevel(vulnerabilities) {
        if (vulnerabilities.some(v => v.severity === 'CRITICAL')) {
            return 'CRITICAL';
        }
        if (vulnerabilities.filter(v => v.severity === 'HIGH').length >= 2) {
            return 'HIGH';
        }
        if (vulnerabilities.some(v => v.severity === 'HIGH')) {
            return 'HIGH';
        }
        if (vulnerabilities.filter(v => v.severity === 'MEDIUM').length >= 3) {
            return 'MEDIUM';
        }
        if (vulnerabilities.some(v => v.severity === 'MEDIUM')) {
            return 'MEDIUM';
        }
        if (vulnerabilities.length > 0) {
            return 'LOW';
        }
        return 'LOW';
    }

    /**
     * Generate audit conclusion
     * @param {Object} auditResults - Audit results
     * @returns {string} Conclusion text
     */
    generateConclusion(auditResults) {
        const riskLevel = auditResults.risk_level;
        const vulnCount = auditResults.vulnerabilities.length;

        if (riskLevel === 'CRITICAL') {
            return `This contract has CRITICAL security issues that must be addressed before deployment. ${vulnCount} vulnerabilities were found that could lead to loss of funds or contract compromise.`;
        } else if (riskLevel === 'HIGH') {
            return `This contract has HIGH risk vulnerabilities that should be fixed before deployment. ${vulnCount} issues were identified that could impact security or functionality.`;
        } else if (riskLevel === 'MEDIUM') {
            return `This contract has MEDIUM risk issues that should be reviewed. ${vulnCount} potential problems were found that could be improved for better security and efficiency.`;
        } else {
            return `This contract appears to have LOW risk with ${vulnCount} minor issues identified. Review the recommendations for potential improvements.`;
        }
    }
}

module.exports = new AuditorService();
