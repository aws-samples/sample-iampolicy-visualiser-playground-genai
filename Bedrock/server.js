// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { generateNewPolicy } from './routes/policyGenerator.js';
import { modifyExistingPolicy } from './routes/policyModifier.js';
import { analyzeIAMPolicyByStatement } from './services/PolicyValidator.js';
import dotenv from 'dotenv';
dotenv.config();

// Log environment variables for debugging (redact sensitive values in production)
console.log("Environment variables loaded:");
console.log("AWS_REGION:", process.env.AWS_REGION || "Not set");
console.log("MODEL_ID:", process.env.MODEL_ID || "Not set");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Security middleware
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://d3js.org; style-src 'self' 'unsafe-inline';");
  next();
});

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Generate a brand-new IAM policy
app.post('/api/generatePolicy', async (req, res) => {
  try {
    const userRequirements = req.body.requirements;
    const policyType = req.body.policyType || "IDENTITY_POLICY";
    
    // Validate input
    if (!userRequirements || typeof userRequirements !== 'string' || userRequirements.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid or missing requirements" 
      });
    }

    let output;
    
    // Generate the policy using direct model invocation
    console.log('Generating policy...');
    output = await generateNewPolicy(userRequirements, policyType);
    console.log("Successfully generated policy");

    // Return the output
    res.json({ 
      success: true, 
      output
    });
  } catch (error) {
    console.error('Error generating policy:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Modify an existing IAM policy
app.post('/api/modifyPolicy', async (req, res) => {
  try {
    const existingPolicy = req.body.policy;
    
    // Validate input
    if (!existingPolicy || typeof existingPolicy !== 'string' || existingPolicy.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid or missing policy" 
      });
    }
    
    // Validate JSON format
    try {
      JSON.parse(existingPolicy);
    } catch (jsonError) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid JSON format in policy" 
      });
    }
    
    const output = await modifyExistingPolicy(existingPolicy);
    res.json({ success: true, output });
  } catch (error) {
    console.error('Error modifying policy:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

//Validate an existing IAM policy
app.post('/api/analyzePolicy', async (req, res) => {
  try {
    // Extract the policy from the request body
    const policyToAnalyze = req.body.policy;
    const policyType = req.body.policyType || "IDENTITY_POLICY";
    
    // Validate that policy exists in request
    if (!policyToAnalyze) {
      return res.status(400).json({ 
        success: false, 
        error: "No policy provided in request body" 
      });
    }
    
    // Call the analyzeIAMPolicyByStatement function
    const analysisResults = await analyzeIAMPolicyByStatement(policyToAnalyze, policyType);
    
    // Return the analysis results
    res.json({
      success: true,
      analysis: analysisResults
    });
    
  } catch (error) {
    console.error('Error analyzing policy:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`IAM Policy App running on http://localhost:${PORT}`);
});
