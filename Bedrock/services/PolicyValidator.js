// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { AccessAnalyzerClient, ValidatePolicyCommand } from "@aws-sdk/client-accessanalyzer";
import dotenv from 'dotenv';
dotenv.config();


export function validatePolicyStructure(policyJson) {

    if (!policyJson) {
        return {
            valid: false,
            errors: ["Policy document is null or undefined"]
        };
    }
    
    const errors = [];
    

    if (!policyJson.Version) {
        errors.push("Missing required 'Version' field");
    } else if (policyJson.Version !== "2012-10-17") {
        errors.push("Policy 'Version' should be '2012-10-17'");
    }
    

    if (!policyJson.Statement) {
        errors.push("Missing required 'Statement' field");
    } else {

        const statements = Array.isArray(policyJson.Statement) 
            ? policyJson.Statement 
            : [policyJson.Statement];
        

        statements.forEach((statement, index) => {

            if (!statement.Effect) {
                errors.push(`Statement ${index} missing required 'Effect' field`);
            } else if (!['Allow', 'Deny'].includes(statement.Effect)) {
                errors.push(`Statement ${index} has invalid 'Effect' value: ${statement.Effect}`);
            }
            

            if (!statement.Action && !statement.NotAction) {
                errors.push(`Statement ${index} missing required 'Action' or 'NotAction' field`);
            }
            

            if (!statement.Resource && !statement.NotResource) {
                errors.push(`Statement ${index} missing required 'Resource' or 'NotResource' field`);
            }
        });
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}


export async function simulateCustomPolicy(policyJson, policyType = "IDENTITY_POLICY", actionNames = [], context = {}) {
    try {
        // Validate the policy type
        const validPolicyTypes = ["IDENTITY_POLICY", "RESOURCE_POLICY", "SERVICE_CONTROL_POLICY", "RESOURCE_CONTROL_POLICY"];
        if (!validPolicyTypes.includes(policyType)) {
            return {
                success: false,
                error: "Invalid policy type",
                validationErrors: [`Policy type must be one of: ${validPolicyTypes.join(', ')}`]
            };
        }

        const validationResult = validatePolicyStructure(policyJson);
        if (!validationResult.valid) {
            return {
                success: false,
                error: "Invalid policy structure",
                validationErrors: validationResult.errors
            };
        }


        const client = new AccessAnalyzerClient({
            region: process.env.AWS_REGION || "us-east-1"
        });


        const policyDocument = JSON.stringify(policyJson);


        const params = {
            policyDocument: policyDocument,
            policyType: policyType, 
            locale: "EN"                   
        };


        const command = new ValidatePolicyCommand(params);
        const response = await client.send(command);


        const findingsMap = {
            security: [],
            errors: [],
            warnings: [],
            suggestions: []
        };

        if (response.findings) {
            response.findings.forEach(finding => {
                const formattedFinding = {
                    issueCode: finding.issueCode,
                    message: finding.findingDetails,
                    location: finding.locations?.[0]?.span?.start?.line || 'unknown'
                };
                
                switch(finding.findingType) {
                    case 'ERROR':
                        findingsMap.errors.push(formattedFinding);
                        break;
                    case 'SECURITY_WARNING':
                        findingsMap.security.push(formattedFinding);
                        break;
                    case 'WARNING':
                        findingsMap.warnings.push(formattedFinding);
                        break;
                    case 'SUGGESTION':
                        findingsMap.suggestions.push(formattedFinding);
                        break;
                }
            });
        }

        return {
            success: true,
            valid: (findingsMap.errors.length === 0),
            findings: findingsMap,
            summary: {
                security_issues: findingsMap.security.length,
                errors: findingsMap.errors.length,
                warnings: findingsMap.warnings.length,
                suggestions: findingsMap.suggestions.length,
                total_findings: response.findings?.length || 0
            },
            rawResponse: response
        };
    } catch (error) {
        console.error("Error validating policy:", error);
        return {
            success: false,
            error: error.message
        };
    }
}


export async function analyzeIAMPolicyByStatement(fullPolicy, policyType = "IDENTITY_POLICY") {
    let outputString = "=== Starting IAM Policy Analysis ===\n";
    outputString += `Analyzing policy with ${Array.isArray(fullPolicy.Statement) ? 
        fullPolicy.Statement.length : 1} statement(s)\n`;
    outputString += `Policy Type: ${policyType}\n`;


    if (!fullPolicy || !fullPolicy.Version || !fullPolicy.Statement) {
        const errorMsg = "ERROR: Invalid policy structure. Must have Version and Statement.";
        outputString += errorMsg + "\n";
        return {
            success: false,
            error: errorMsg,
            output: outputString
        };
    }

    const statements = Array.isArray(fullPolicy.Statement) 
        ? fullPolicy.Statement 
        : [fullPolicy.Statement];
    
    const results = [];
    

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const statementId = statement.Sid || `Statement ${i+1}`;
        
        outputString += `\n=== Analyzing Statement: ${statementId} ===\n`;
        

        const singleStatementPolicy = {
            Version: fullPolicy.Version,
            Statement: [statement]
        };

        try {

            const statementAnalysis = await simulateCustomPolicy(singleStatementPolicy, policyType);
            

            outputString += `\n→ Results for "${statementId}":\n`;
            
            if (statementAnalysis.success) {
                outputString += `  Valid: ${statementAnalysis.valid ? "✅ Yes" : "❌ No"}\n`;
                outputString += `  Summary: ${statementAnalysis.summary.total_findings} finding(s) ` +
                    `(${statementAnalysis.summary.security_issues} security issues, ` +
                    `${statementAnalysis.summary.errors} errors, ` +
                    `${statementAnalysis.summary.warnings} warnings, ` +
                    `${statementAnalysis.summary.suggestions} suggestions)\n`;
                

                if (statementAnalysis.summary.total_findings > 0) {
                    outputString += "\n  Detailed findings:\n";
                    
                    if (statementAnalysis.findings.security.length > 0) {
                        outputString += "\n  🛑 SECURITY ISSUES:\n";
                        statementAnalysis.findings.security.forEach(issue => {
                            outputString += `    - ${issue.message} (${issue.issueCode})\n`;
                        });
                    }
                    
                    if (statementAnalysis.findings.errors.length > 0) {
                        outputString += "\n  ❌ ERRORS:\n";
                        statementAnalysis.findings.errors.forEach(error => {
                            outputString += `    - ${error.message} (${error.issueCode})\n`;
                        });
                    }
                    
                    if (statementAnalysis.findings.warnings.length > 0) {
                        outputString += "\n  ⚠️ WARNINGS:\n";
                        statementAnalysis.findings.warnings.forEach(warning => {
                            outputString += `    - ${warning.message} (${warning.issueCode})\n`;
                        });
                    }
                    
                    if (statementAnalysis.findings.suggestions.length > 0) {
                        outputString += "\n  ℹ️ SUGGESTIONS:\n";
                        statementAnalysis.findings.suggestions.forEach(suggestion => {
                            outputString += `    - ${suggestion.message} (${suggestion.issueCode})\n`;
                        });
                    }
                } else {
                    outputString += "  No issues found for this statement\n";
                }
            } else {
                outputString += `  ❌ Analysis failed: ${statementAnalysis.error}\n`;
                if (statementAnalysis.validationErrors) {
                    statementAnalysis.validationErrors.forEach(error => {
                        outputString += `    - ${error}\n`;
                    });
                }
            }
            

            results.push({
                statementId,
                result: statementAnalysis
            });
            
        } catch (error) {
            outputString += `Error analyzing statement ${statementId}: ${error.message}\n`;
            results.push({
                statementId,
                result: {
                    success: false,
                    error: error.message
                }
            });
        }
    }
    
    outputString += "\n=== IAM Policy Analysis Complete ===\n";
    

    console.log(outputString);
    
    const summary = results.reduce((acc, item) => {
        if (item.result.success && item.result.summary) {
            acc.security_issues += item.result.summary.security_issues;
            acc.errors += item.result.summary.errors;
            acc.warnings += item.result.summary.warnings;
            acc.suggestions += item.result.summary.suggestions;
            acc.total_findings += item.result.summary.total_findings;
        }
        return acc;
    }, {
        security_issues: 0,
        errors: 0,
        warnings: 0,
        suggestions: 0,
        total_findings: 0
    });
    
    return {
        success: true,
        policyStatements: statements.length,
        results: results,
        summary: summary,
        output: outputString
    };
}