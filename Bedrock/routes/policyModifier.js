// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { callBedrockWithKnowledgeBase, extractPolicyFromResponse } from "../services/bedrock.js";
import { simulateCustomPolicy } from "../services/PolicyValidator.js";

export async function modifyExistingPolicy(existingPolicy) {
  
  const systemPrompt = `
You are an expert AWS IAM policy assistant. You will receive an existing IAM policy in valid JSON and must:

1. Revise it so that:
   - It uses the "2012-10-17" version if missing.
   - It follows the principle of least privilege, avoiding wildcards where possible.
   - It maintains correct JSON structure (using "Effect", "Action", "Resource", etc.).
   - If details are missing (e.g., ARNs), use placeholders like "arn:aws:REGION:ACCOUNT_ID:resource/RESOURCE_NAME" instead of disclaiming.

2. Provide no disclaimers, references to external tools (console, CLI), or refusal statements.

3. Return exactly two sections, delimited by:
   ###POLICY_START###
   { ... revised IAM JSON policy ... }
   ###POLICY_END###
   ###EXPLANATION_START###
   Explanation of changes and why they align with best practices.
   ###EXPLANATION_END###

Produce nothing else. The policy must be valid JSON, and the explanation must be plain text.
`;


  const finalPrompt = `${systemPrompt}\n\nExisting Policy:\n${existingPolicy}`;


  const rawText = await callBedrockWithKnowledgeBase(finalPrompt);


  const { policy, explanation } = extractPolicyFromResponse(rawText);
  

  const simulationResults = await simulateCustomPolicy(policy);
  

  return { policy, explanation, simulationResults };
}
