// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// routes/policyGenerator.js

import { callBedrockWithKnowledgeBase, extractPolicyFromResponse } from "../services/bedrock.js";
import { analyzeIAMPolicyByStatement } from "../services/PolicyValidator.js";
import { getPromptForPolicyType } from "../services/promptSelector.js";

/**
 * Generate a new IAM policy based on user requirements
 * @param {string} userRequirements - The user's policy requirements
 * @param {string} policyType - The type of policy to generate
 * @returns {Object} - Generated policy and related information
 */
export async function generateNewPolicy(userRequirements, policyType) {
  // Get the appropriate prompt based on policy type
  const systemPrompt = getPromptForPolicyType(policyType);

  let finalPrompt = `${systemPrompt}\n\nUser Requirements: ${userRequirements}`;
  
  // Function to create a prompt for policy correction based on validation results
  function createCorrectionPrompt(policy, validationResults, originalRequirements) {
    // Extract invalid actions from validation results
    const invalidActions = [];
    
    if (validationResults && validationResults.results) {
      validationResults.results.forEach(statementResult => {
        if (statementResult.result && statementResult.result.findings && statementResult.result.findings.errors) {
          statementResult.result.findings.errors.forEach(error => {
            if (error.issueCode === 'INVALID_ACTION') {
              invalidActions.push(error.message);
            }
          });
        }
      });
    }
    
    if (invalidActions.length === 0) {
      return null;
    }
    
    return `
You previously created an IAM policy based on these requirements: "${originalRequirements}"

However, the policy validation found the following issues with invalid actions:
${invalidActions.join('\n')}

Please correct the policy by:
1. Removing any invalid actions
2. Replacing them with valid AWS actions that fulfill the same requirements
3. Ensuring all actions are valid AWS IAM actions

Return the corrected policy with the same format as before:
###POLICY_START###
{
  ... valid JSON ...
}
###POLICY_END###
###EXPLANATION_START###
Explain the enhanced IAM policy.
###EXPLANATION_END###
###SUGGESTIONS_START###
 - List specific security improvements
 - Additional conditions to consider
 - Best practice recommendations
###SUGGESTIONS_END###
###ENHANCED_POLICY_START###
{
  ... improved policy JSON incorporating all security suggestions ...
}
###ENHANCED_POLICY_END###
`;
  }

  const MAX_ITERATIONS = 3;
  let currentIteration = 0;
  let currentPolicy = null;
  let currentExplanation = "";
  let currentSuggestion = "";
  let currentEnhancedPolicy = null;
  let simulationResults = null;
  let hasInvalidActions = true;
  
  while (hasInvalidActions && currentIteration < MAX_ITERATIONS) {
    currentIteration++;
    console.log(`Starting iteration ${currentIteration} of policy generation`);
    
    try {
      const rawText = await callBedrockWithKnowledgeBase(finalPrompt);
      console.log(`Iteration ${currentIteration} - Raw Text Length: ${rawText.length}`);
      
      const { policy, explanation, enhancedpolicy, suggestion } = extractPolicyFromResponse(rawText);
      
      currentPolicy = policy;
      currentExplanation = explanation;
      currentSuggestion = suggestion;
      currentEnhancedPolicy = enhancedpolicy || policy; 
      
      simulationResults = await analyzeIAMPolicyByStatement(currentEnhancedPolicy, policyType);
      
      hasInvalidActions = false;
      if (simulationResults && simulationResults.results) {
        simulationResults.results.forEach(statementResult => {
          if (statementResult.result && statementResult.result.findings && statementResult.result.findings.errors) {
            statementResult.result.findings.errors.forEach(error => {
              if (error.issueCode === 'INVALID_ACTION') {
                hasInvalidActions = true;
              }
            });
          }
        });
      }
      
      if (hasInvalidActions && currentIteration < MAX_ITERATIONS) {
        finalPrompt = createCorrectionPrompt(currentEnhancedPolicy, simulationResults, userRequirements);
        console.log(`Found invalid actions. Creating correction prompt for iteration ${currentIteration + 1}`);
      } else {
        break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in iteration %d: %s', currentIteration, errorMessage);
      break;
    }
  }
  
  console.log(`Policy generation completed after ${currentIteration} iteration(s)`);
  
  return { 
    policy: currentPolicy, 
    explanation: currentExplanation, 
    enhancedpolicy: currentEnhancedPolicy,
    suggestion: currentSuggestion,
    simulationResults,
    iterations: currentIteration
  };
}
