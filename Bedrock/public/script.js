// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { visualizePolicy, extractPolicyFromVisualization } from "./policyVisualizer.js";

document.addEventListener('DOMContentLoaded', () => {
  // Generate Policy
  const generateForm = document.getElementById('generateForm');
  const generateExplanationDiv = document.getElementById("generateExplanation");
  const generatePolicyDiv = document.getElementById("generatePolicy");
  const generateEnhancedPolicyDiv = document.getElementById("generateEnhancedPolicy");
  const generateSuggestionDiv = document.getElementById("generateSuggestion");
  
  // Extract policy buttons and result divs
  const extractGeneratedBtn = document.getElementById('extractGeneratedPolicyBtn');
  const generateClipboardNotification = document.getElementById('generate-clipboard-notification');
  
  // Add analyze policy functionality
  const analyzeBtn = document.getElementById('analyzeGeneratedPolicyBtn');
  const analyzeResultsDiv = document.getElementById('analyzeResults');
  
  // Initially disable extract buttons until visualizations are created
  extractGeneratedBtn.disabled = true;
  
  // Initially disable analyze button until policy is generated
  analyzeBtn.disabled = true;
  
  analyzeBtn.addEventListener('click', async function() {
    // Get the current policy from the enhanced policy div (preferred) or regular policy div
    const enhancedPolicyElement = document.getElementById('generateEnhancedPolicy');
    const regularPolicyElement = document.getElementById('generatePolicy');
    const policyType = document.getElementById('policyType').value;
    
    // Use enhanced policy if available, otherwise use regular policy
    const policyElement = enhancedPolicyElement.querySelector('pre') ? 
                          enhancedPolicyElement : regularPolicyElement;
    
    // Check if there's a policy to analyze
    if (!policyElement || !policyElement.querySelector('pre')) {
      analyzeResultsDiv.innerHTML = '';
      const errorStrong = document.createElement('strong');
      errorStrong.textContent = 'Error: ';
      const errorText = document.createTextNode('No policy available to analyze.');
      analyzeResultsDiv.appendChild(errorStrong);
      analyzeResultsDiv.appendChild(errorText);
      analyzeResultsDiv.style.display = 'block';
      return;
    }
    
    try {
      // Extract the policy JSON string from the pre tag
      const policyText = policyElement.querySelector('pre').textContent;
      const policyToAnalyze = JSON.parse(policyText);
      
      // Show loading state
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'Analyzing...';
      analyzeResultsDiv.innerHTML = '';
      const analyzingStrong = document.createElement('strong');
      analyzingStrong.textContent = 'Analyzing policy...';
      analyzeResultsDiv.appendChild(analyzingStrong);
      analyzeResultsDiv.style.display = 'block';
      
      // Call the analyze API
      const response = await fetch('/api/analyzePolicy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy: policyToAnalyze, policyType: policyType })
      });
      
      const data = await response.json();
      
      if (data.success) {
        
        if (data.analysis && data.analysis.output) {
          // Use pre tag to preserve formatting of the output string
          analyzeResultsDiv.innerHTML = '';
          const preElement = document.createElement('pre');
          preElement.textContent = data.analysis.output;
          analyzeResultsDiv.appendChild(preElement);
        } else {
          // Fallback if output string isn't available
          analyzeResultsDiv.innerHTML = '';
          const preElement = document.createElement('pre');
          preElement.textContent = JSON.stringify(data.analysis, null, 2);
          analyzeResultsDiv.appendChild(preElement);
        }
      } else {
        analyzeResultsDiv.innerHTML = '';
        const errorStrong = document.createElement('strong');
        errorStrong.textContent = 'Analysis Error: ';
        const errorText = document.createTextNode(data.error || 'Unknown error occurred');
        analyzeResultsDiv.appendChild(errorStrong);
        analyzeResultsDiv.appendChild(errorText);
      }
    } catch (err) {
      console.error("Policy analysis failed:", err);
      analyzeResultsDiv.innerHTML = '';
      const errorStrong = document.createElement('strong');
      errorStrong.textContent = 'Error: ';
      const errorText = document.createTextNode(err.message || 'Failed to analyze policy');
      analyzeResultsDiv.appendChild(errorStrong);
      analyzeResultsDiv.appendChild(errorText);
    } finally {
      // Reset button state
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze Current Policy';
      analyzeResultsDiv.style.display = 'block';
    }
  });

  // Add event listeners for extraction buttons
  extractGeneratedBtn.addEventListener('click', function() {
    const extractedPolicy = extractPolicyFromVisualization('generateVisualization');
    handleExtractedPolicy(extractedPolicy, generateEnhancedPolicyDiv, generateClipboardNotification);
  });
  
  // Function to handle extracted policy display and clipboard
  function handleExtractedPolicy(policy, resultDiv, notificationElement) {
    if (policy) {
      const policyString = JSON.stringify(policy, null, 2);
      
      // Display the extracted policy
      resultDiv.innerHTML = '';
      const preElement = document.createElement('pre');
      preElement.textContent = policyString;
      resultDiv.appendChild(preElement);
      resultDiv.style.display = 'block';
      
      // Copy to clipboard
      navigator.clipboard.writeText(policyString)
        .then(() => {
          console.log("Policy copied to clipboard!");
          // Show success message
          notificationElement.style.display = 'inline';
          setTimeout(() => { notificationElement.style.display = 'none'; }, 3000);
        })
        .catch(err => console.error("Failed to copy: ", err));
    } else {
      console.error("Failed to extract policy from visualization");
      resultDiv.innerHTML = `<strong>Error:</strong> Failed to extract policy. Make sure a policy is visualized.`;
      resultDiv.style.display = 'block';
    }
  }

  generateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const requirements = document.getElementById('requirements').value;
    const policyType = document.getElementById('policyType').value;

    // Show loading state
    const submitButton = generateForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Generating...';

    try {
      const response = await fetch('/api/generatePolicy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements, policyType })
      });
      const data = await response.json();

      if (data.success) {
        // Make sure result blocks are visible
        generateExplanationDiv.style.display = 'block';
        generatePolicyDiv.style.display = 'block';
        generateEnhancedPolicyDiv.style.display = 'block';
      
        // Set explanation
        generateExplanationDiv.innerHTML = '';
        const explanationStrong = document.createElement('strong');
        explanationStrong.textContent = 'Explanation:';
        const lineBreak = document.createElement('br');
        const explanationText = document.createTextNode(data.output.explanation);
        generateExplanationDiv.appendChild(explanationStrong);
        generateExplanationDiv.appendChild(lineBreak);
        generateExplanationDiv.appendChild(explanationText);
      
        // Set original policy
        generatePolicyDiv.innerHTML = '';
        const preElement = document.createElement('pre');
        preElement.textContent = JSON.stringify(data.output.policy, null, 2);
        generatePolicyDiv.appendChild(preElement);
          
        // Set enhanced policy if available, otherwise use the regular policy
        if (data.output.enhancedpolicy) {
          generateEnhancedPolicyDiv.innerHTML = '';
          const preElement = document.createElement('pre');
          preElement.textContent = JSON.stringify(data.output.enhancedpolicy, null, 2);
          generateEnhancedPolicyDiv.appendChild(preElement);
        } else {
          generateEnhancedPolicyDiv.innerHTML = '';
          const preElement = document.createElement('pre');
          preElement.textContent = JSON.stringify(data.output.policy, null, 2);
          generateEnhancedPolicyDiv.appendChild(preElement);
        }
        
        // Only show suggestion if there is one
        if (data.output.suggestion) {
          generateSuggestionDiv.innerHTML = '';
          const suggestionStrong = document.createElement('strong');
          suggestionStrong.textContent = 'Suggestion:';
          const lineBreak = document.createElement('br');
          const suggestionText = document.createTextNode(data.output.suggestion);
          generateSuggestionDiv.appendChild(suggestionStrong);
          generateSuggestionDiv.appendChild(lineBreak);
          generateSuggestionDiv.appendChild(suggestionText);
          generateSuggestionDiv.style.display = 'block';
        } else {
          generateSuggestionDiv.style.display = 'none';
        }

        if (data.output.simulationResults && data.output.simulationResults.output) {
          analyzeResultsDiv.innerHTML = '';
          const preElement = document.createElement('pre');
          preElement.textContent = data.output.simulationResults.output;
          analyzeResultsDiv.appendChild(preElement);
          analyzeResultsDiv.style.display = 'block';
          // Still enable analyze button in case user wants to re-analyze later
          analyzeBtn.disabled = false;
        } else {
          // If no simulation data is available, hide the results div
          analyzeResultsDiv.style.display = 'none';
        }

        try {
          // Always visualize the enhanced policy if available
          const policyToVisualize = data.output.enhancedpolicy || data.output.policy;
          visualizePolicy(policyToVisualize, 'generateVisualization', {
              height: 500
          });
          // Enable the extract button after visualization is created
          extractGeneratedBtn.disabled = false;
          
          // Enable the analyze button when a policy is generated
          analyzeBtn.disabled = false;
          
          // Don't hide analysis results if they were just set
          if (!data.output.simulationResults || !data.output.simulationResults.output) {
            analyzeResultsDiv.style.display = 'none';
          }
        } catch (err) {
          console.error("Visualization failed:", err);
        }
      
      } else {
        generateExplanationDiv.textContent = "";
        generatePolicyDiv.innerHTML = '';
        const errorStrong = document.createElement('strong');
        errorStrong.textContent = 'Error: ';
        const errorText = document.createTextNode(data.error);
        generatePolicyDiv.appendChild(errorStrong);
        generatePolicyDiv.appendChild(errorText);
        generatePolicyDiv.style.display = 'block';
        generateEnhancedPolicyDiv.textContent = "";
        generateEnhancedPolicyDiv.style.display = 'none';
        generateSuggestionDiv.textContent = "";
        generateSuggestionDiv.style.display = 'none';
        
        // Disable analyze button on error
        analyzeBtn.disabled = true;
      }
    } catch (err) {
      generateExplanationDiv.textContent = "";
      generatePolicyDiv.innerHTML = '';
      const errorStrong = document.createElement('strong');
      errorStrong.textContent = 'Request failed: ';
      const errorText = document.createTextNode(err.message);
      generatePolicyDiv.appendChild(errorStrong);
      generatePolicyDiv.appendChild(errorText);
      generatePolicyDiv.style.display = 'block';
      generateEnhancedPolicyDiv.textContent = "";
      generateEnhancedPolicyDiv.style.display = 'none';
      generateSuggestionDiv.textContent = "";
      generateSuggestionDiv.style.display = 'none';
      
      // Disable analyze button on error
      analyzeBtn.disabled = true;
    } finally {
      // Reset button state
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
