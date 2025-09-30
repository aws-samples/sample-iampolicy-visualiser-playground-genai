// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// services/bedrock.js
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";
import dotenv from 'dotenv';
import { TextDecoder } from 'util';
import stringify from 'json-stable-stringify';
dotenv.config();

const decoder = new TextDecoder('utf-8');

// Default model ID - will be overridden by MODEL_ID environment variable if set
const DEFAULT_MODEL_ID = "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function isResponseComplete(text) {
  if (!text || typeof text !== 'string') return false;
  const hasPolicy = text.includes('###POLICY_START###') && text.includes('###POLICY_END###');
  const hasExplanation = text.includes('###EXPLANATION_START###') && text.includes('###EXPLANATION_END###');
  const hasEnhancedPolicy = text.includes('###ENHANCED_POLICY_START###') && text.includes('###ENHANCED_POLICY_END###');
  const hasAbruptEnding = text.endsWith('...') || text.endsWith('…');
  
  const minimumLength = 100;
  
  return (hasPolicy && hasExplanation && hasEnhancedPolicy) && 
         !hasAbruptEnding && 
         text.length >= minimumLength;
}

export async function callBedrockWithKnowledgeBase(prompt, maxRetries = 3) {
  // Keep the logging as requested
  console.log("Environment variables loaded:");
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("MODEL_ID:", process.env.MODEL_ID || DEFAULT_MODEL_ID);
  
  const directClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    maxAttempts: 3
  });

  // Use environment variable MODEL_ID if provided, otherwise use default
  const modelId = process.env.MODEL_ID || DEFAULT_MODEL_ID;
  
  console.log("Configuration details:", stringify({
    region: process.env.AWS_REGION || "us-east-1",
    modelId: modelId
  }, { space: 2 }));

  let lastError;
  let lastResponse = "";
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try direct model invocation
      console.log(`Attempt ${attempt + 1}: Using direct model invocation`);
      
      const requestBody = stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      const command = new InvokeModelCommand({
        modelId: modelId,
        contentType: "application/json",
        accept: "application/json",
        body: requestBody
      });
      
      const response = await directClient.send(command);
      const responseBody = JSON.parse(decoder.decode(response.body));
      const responseText = responseBody.content[0].text;
      
      if (!responseText) {
        throw new Error("Response received but no output text found");
      }
      
      if (isResponseComplete(responseText)) {
        console.log(`Successfully generated complete response on attempt ${attempt + 1}`);
        return responseText;
      } else {
        lastResponse = responseText;
        throw new Error("Incomplete or partial response received");
      }
    } catch (error) {
      lastError = error;
      
      console.error("Attempt %d failed with error: %s - %s", attempt + 1, error.name, error.message);
      if (error.$metadata) {
        console.error("Error metadata:", stringify({
          httpStatusCode: error.$metadata.httpStatusCode,
          requestId: error.$metadata.requestId,
          attempts: error.$metadata.attempts
        }, { space: 2 }));
      }
      
      if (attempt === maxRetries - 1) {
        console.error(`Failed after ${maxRetries} attempts.`);
        if (lastResponse) {
          console.warn("Returning partial response as fallback");
          return lastResponse;
        }
        throw error;
      }

      const backoffTime = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
      console.log(`Retrying in ${Math.round(backoffTime)}ms...`);
      await sleep(backoffTime);
    }
  }

  if (lastResponse) {
    console.warn("Returning partial response after all retries exhausted");
    return lastResponse;
  }
  
  throw lastError;
}

export function extractPolicyFromResponse(responseText) {
  try {
    // Validate input
    if (!responseText || typeof responseText !== 'string') {
      throw new Error("Invalid response text provided");
    }
    
    // Extract standard policy
    const { policyJson, policyExtracted } = extractStandardPolicy(responseText);
    
    // Extract enhanced policy
    const { enhancedPolicyJSON, enhancedpolicyExtracted } = extractEnhancedPolicy(responseText);
    
    // Extract explanation and suggestions
    const explanation = extractExplanation(responseText);
    const suggestion = extractSuggestions(responseText);
    
    // Validate extraction results
    if (!policyExtracted) {
      throw new Error("Could not find a valid standard IAM policy in the response.");
    }
    
    if (!enhancedpolicyExtracted) {
      console.warn("Could not find a valid enhanced IAM policy, using standard policy instead.");
    }
    
    return {
      policy: policyJson,
      explanation,
      enhancedpolicy: enhancedPolicyJSON || policyJson, 
      suggestion
    };
  } catch (error) {
    console.error("Error extracting policy:", error);
    throw new Error(`Policy extraction failed: ${error.message}`);
  }
}


function extractStandardPolicy(responseText) {
  //console.log(responseText);
  let policyJson;
  let policyExtracted = false;
  let policyJsonString;
  
  // First attempt: Extract from delimited section
  const policyRegex = /###POLICY_START###([\s\S]*?)###POLICY_END###/;
  const policyMatch = responseText.match(policyRegex);
  
  if (policyMatch) {
    policyJsonString = policyMatch[1].trim();
    try {
      // Clean up potential invisible characters and formatting issues
      policyJsonString = policyJsonString.replace(/[\u200B-\u200D\uFEFF]/g, '');
      // Handle potential nested JSON escaping issues
      if (policyJsonString.includes('{{')) {
        policyJsonString = policyJsonString.replace(/{{/g, '{').replace(/}}/g, '}');
      }
      policyJson = JSON.parse(policyJsonString);
      policyExtracted = true;
    } catch (jsonError) {
      console.warn("Found delimited policy section but couldn't parse JSON:", jsonError.message);
      console.log("Problematic JSON string:", policyJsonString);
    }
  }
  
  // Second attempt: Extract from code block
  if (!policyExtracted) {
    const jsonCodeBlockRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
    const codeBlockMatch = responseText.match(jsonCodeBlockRegex);
    
    if (codeBlockMatch) {
      policyJsonString = codeBlockMatch[1].trim();
      try {
        // Clean up potential invisible characters and formatting issues
        policyJsonString = policyJsonString.replace(/[\u200B-\u200D\uFEFF]/g, '');
        // Handle potential nested JSON escaping issues
        if (policyJsonString.includes('{{')) {
          policyJsonString = policyJsonString.replace(/{{/g, '{').replace(/}}/g, '}');
        }
        policyJson = JSON.parse(policyJsonString);
        policyExtracted = true;
      } catch (jsonError) {
        console.warn("Found code block but couldn't parse JSON:", jsonError.message);
        console.log("Problematic JSON string:", policyJsonString);
      }
    }
  }
  
  // Third attempt: Extract from any JSON-like content
  if (!policyExtracted) {
    const jsonObjectRegex = /({[\s\S]*?"Version"\s*:\s*"2012-10-17"[\s\S]*?})/;
    const jsonMatch = responseText.match(jsonObjectRegex);
    
    if (jsonMatch) {
      policyJsonString = jsonMatch[1].trim();
      try {
        // Clean up potential invisible characters and formatting issues
        policyJsonString = policyJsonString.replace(/[\u200B-\u200D\uFEFF]/g, '');
        // Handle potential nested JSON escaping issues
        if (policyJsonString.includes('{{')) {
          policyJsonString = policyJsonString.replace(/{{/g, '{').replace(/}}/g, '}');
        }
        policyJson = JSON.parse(policyJsonString);
        policyExtracted = true;
      } catch (jsonError) {
        console.warn("Found JSON-like content but couldn't parse:", jsonError.message);
        console.log("Problematic JSON string:", policyJsonString);
      }
    }
  }
  
  return { policyJson, policyExtracted };
}


function extractEnhancedPolicy(responseText) {
  let enhancedPolicyJSON;
  let enhancedpolicyExtracted = false;
  let enhancedpolicyJsonString;
  
  // First attempt: Extract from delimited section
  const enhancedPolicyRegex = /###ENHANCED_POLICY_START###([\s\S]*?)###ENHANCED_POLICY_END###/;
  const enhancedPolicyMatch = responseText.match(enhancedPolicyRegex);
  
  if (enhancedPolicyMatch) {
    enhancedpolicyJsonString = enhancedPolicyMatch[1].trim();
    try {
      // Clean up potential invisible characters and formatting issues
      enhancedpolicyJsonString = enhancedpolicyJsonString.replace(/[\u200B-\u200D\uFEFF]/g, '');
      // Handle potential nested JSON escaping issues
      if (enhancedpolicyJsonString.includes('{{')) {
        enhancedpolicyJsonString = enhancedpolicyJsonString.replace(/{{/g, '{').replace(/}}/g, '}');
      }
      enhancedPolicyJSON = JSON.parse(enhancedpolicyJsonString);
      enhancedpolicyExtracted = true;
    } catch (jsonError) {
      console.warn("Found delimited enhanced policy section but couldn't parse JSON:", jsonError.message);
      console.log("Problematic JSON string:", enhancedpolicyJsonString);
    }
  }
  
  // Second attempt: Look for another JSON block after the standard policy
  if (!enhancedpolicyExtracted) {
    const { policyJson } = extractStandardPolicy(responseText);
    if (policyJson) {
      const policyString = stringify(policyJson);

      const remainingText = responseText.substring(responseText.indexOf(policyString) + policyString.length);
      
      const jsonCodeBlockRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/;
      const codeBlockMatch = remainingText.match(jsonCodeBlockRegex);
      
      if (codeBlockMatch) {
        enhancedpolicyJsonString = codeBlockMatch[1].trim();
        try {
          // Clean up potential invisible characters and formatting issues
          enhancedpolicyJsonString = enhancedpolicyJsonString.replace(/[\u200B-\u200D\uFEFF]/g, '');
          // Handle potential nested JSON escaping issues
          if (enhancedpolicyJsonString.includes('{{')) {
            enhancedpolicyJsonString = enhancedpolicyJsonString.replace(/{{/g, '{').replace(/}}/g, '}');
          }
          enhancedPolicyJSON = JSON.parse(enhancedpolicyJsonString);
          enhancedpolicyExtracted = true;
        } catch (jsonError) {
          console.warn("Found second code block but couldn't parse JSON:", jsonError.message);
          console.log("Problematic JSON string:", enhancedpolicyJsonString);
        }
      }
    }
  }
  
  return { enhancedPolicyJSON, enhancedpolicyExtracted };
}


function extractExplanation(responseText) {

  const explanationRegex = /###EXPLANATION_START###([\s\S]*?)###EXPLANATION_END###/;
  const explanationMatch = responseText.match(explanationRegex);
  
  if (explanationMatch) {
    return explanationMatch[1].trim();
  } 
  

  let cleanedText = responseText
    .replace(/```(?:json)?\s*{[\s\S]*?}\s*```/g, '')
    .replace(/{[\s\S]*?"Version"\s*:\s*"2012-10-17"[\s\S]*?}/g, '')
    .replace(/###POLICY_START###[\s\S]*?###POLICY_END###/g, '')
    .replace(/###ENHANCED_POLICY_START###[\s\S]*?###ENHANCED_POLICY_END###/g, '')
    .replace(/###SUGGESTIONS_START###[\s\S]*?###SUGGESTIONS_END###/g, '');
    

  return cleanedText.trim();
}


function extractSuggestions(responseText) {

  const suggestionsRegex = /###SUGGESTIONS_START###([\s\S]*?)###SUGGESTIONS_END###/;
  const suggestionsMatch = responseText.match(suggestionsRegex);
  
  if (suggestionsMatch) {
    return suggestionsMatch[1].trim();
  }
  

  const explanationRegex = /###EXPLANATION_START###([\s\S]*?)###EXPLANATION_END###/;
  const explanationMatch = responseText.match(explanationRegex);
  
  if (explanationMatch) {

    const afterExplanation = responseText.substring(
      responseText.indexOf(explanationMatch[0]) + explanationMatch[0].length
    );
    

    const cleanedText = afterExplanation
      .replace(/###ENHANCED_POLICY_START###[\s\S]*?###ENHANCED_POLICY_END###/g, '')
      .replace(/```(?:json)?\s*{[\s\S]*?}\s*```/g, '')
      .trim();
      
    return cleanedText;
  }
  
  return ""; 
}
