// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { IDENTITY_POLICY_PROMPT } from '../prompts/identity_policy_prompt.js';
import { RESOURCE_POLICY_PROMPT } from '../prompts/resource_policy_prompt.js';
import { SERVICE_CONTROL_POLICY_PROMPT } from '../prompts/service_control_policy_prompt.js';
import { RESOURCE_CONTROL_POLICY_PROMPT } from '../prompts/resource_control_policy_prompt.js';

/**
 * Returns the appropriate prompt template based on the policy type
 * @param {string} policyType - The type of policy (IDENTITY_POLICY, RESOURCE_POLICY, etc.)
 * @returns {string} - The prompt template for the specified policy type
 */
export function getPromptForPolicyType(policyType) {
  switch (policyType) {
    case 'IDENTITY_POLICY':
      return IDENTITY_POLICY_PROMPT;
    case 'RESOURCE_POLICY':
      return RESOURCE_POLICY_PROMPT;
    case 'SERVICE_CONTROL_POLICY':
      return SERVICE_CONTROL_POLICY_PROMPT;
    case 'RESOURCE_CONTROL_POLICY':
      return RESOURCE_CONTROL_POLICY_PROMPT;
    default:
      return IDENTITY_POLICY_PROMPT; // Default to identity policy
  }
}
