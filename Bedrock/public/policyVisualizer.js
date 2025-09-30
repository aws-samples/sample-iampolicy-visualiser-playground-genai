// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
// Helper function for debouncing
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Import service icons and helper functions from the centralized configuration
import { serviceIcons, getServiceLogo, getResourceLogo, preloadIcons } from './assets/iconConfig.js';

// Preload icons for better performance
document.addEventListener('DOMContentLoaded', () => {
    preloadIcons();
});

let i = 0; // Counter for node IDs
let duration = 750; // Animation duration


function visualizePolicy(policy, containerId = 'visualization', options = {}) {
    // Find the container element
    const visualizationElement = document.getElementById(containerId);
    
    if (!visualizationElement) {
        console.error(`Visualization container with ID '${containerId}' not found`);
        return false;
    }
    
    // Handle empty policy
    if (!policy) {
        visualizationElement.innerHTML = '';
        return false;
    }

    try {
        // Parse policy if it's a string
        const policyObj = typeof policy === 'string' ? JSON.parse(policy) : policy;

        // Validate policy structure
        if (!policyObj || !policyObj.Statement || !Array.isArray(policyObj.Statement)) {
            throw new Error('Invalid IAM policy JSON');
        }

        // Create the root node
        const root = {
            name: "IAM Policy",
            children: []
        };

        // Process each statement
        policyObj.Statement.forEach((statement, index) => {
            // Use Sid if available, otherwise use "Statement X" naming pattern
            const statementName = statement.Sid ? statement.Sid : `Statement ${index + 1}`;
            
            const statementNode = {
                name: `${statementName}: ${statement.Effect}`,
                type: "statement",
                effect: statement.Effect,
                children: []
            };

            // Process actions
            if (statement.Action) {
                const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
                const actionsNode = {
                    name: "Actions",
                    children: actions.map(action => ({ 
                        name: action, 
                        type: "action", 
                        logo: getServiceLogo(action) 
                    }))
                };
                statementNode.children.push(actionsNode);
            }

            // Process resources
            if (statement.Resource) {
                const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
                const resourcesNode = {
                    name: "Resources",
                    children: resources.map(resource => ({ 
                        name: resource, 
                        type: "resource", 
                        logo: getResourceLogo(resource) 
                    }))
                };
                statementNode.children.push(resourcesNode);
            }

            // Process conditions
            if (statement.Condition) {
                const conditions = Object.entries(statement.Condition).map(([key, value]) => ({
                    name: `${key}: ${JSON.stringify(value)}`,
                    type: "condition"
                }));
                const conditionsNode = {
                    name: "Conditions",
                    children: conditions
                };
                statementNode.children.push(conditionsNode);
            }

            // Auto-collapse nodes for large policies
            const isLargePolicy = policyObj.Statement.length > 3 || 
                                 (statement.Action && Array.isArray(statement.Action) && statement.Action.length > 10) ||
                                 (statement.Resource && Array.isArray(statement.Resource) && statement.Resource.length > 10);
            
            // We're removing the auto-collapse feature to show everything expanded by default
            // if (isLargePolicy) {
            //     // Mark children for collapsing (will be handled in renderTree)
            //     statementNode._collapsed = true;
            // }

            root.children.push(statementNode);
        });

        // Render the tree
        renderTree(root, containerId, options);
        return true;
    } catch (error) {
        console.error('Visualization error:', error);
        visualizationElement.innerHTML = `<div class="error">Error visualizing policy: ${error.message}</div>`;
        return false;
    }
}

/**
 * Renders the policy tree using D3.js
 * @param {Object} root - The hierarchical data structure to render
 * @param {string} containerId - The ID of the container element
 * @param {Object} options - Optional configuration for the tree
 */
function renderTree(root, containerId, options = {}) {
    // Find container element
    const container = document.getElementById(containerId);
    
    // Determine dimensions
    const width = container.clientWidth;
    const height = container.clientHeight || 600; // Set minimum height if not specified
    
    // Clear previous content
    container.innerHTML = '';
    
    // Create zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.innerHTML = `
        <button class="zoom-in" title="Zoom In">+</button>
        <button class="zoom-out" title="Zoom Out">-</button>
        <button class="zoom-reset" title="Reset View">⟲</button>
    `;
    zoomControls.style.position = 'absolute';
    zoomControls.style.top = '10px';
    zoomControls.style.right = '10px';
    zoomControls.style.zIndex = '100';
    container.appendChild(zoomControls);
    
    // Create SVG with better zoom behavior
    const svg = d3.select("#" + containerId)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
    
    // Create a group for the entire visualization
    const g = svg.append("g");
    
    // Initial positioning - will be adjusted by the reset view function
    g.attr("transform", "translate(0,0)");
    
    // Remove the fit button since we now have a working reset button
    // Keep the code simple with just one way to reset the view
    
    // Create zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
    
    // Apply zoom behavior to SVG
    svg.call(zoom);
    
    // Function to reset view to show the entire tree
    function resetView() {
        console.log("Resetting view to fit entire tree");
        
        try {
            // Get the bounding box of the visualization
            const bounds = g.node().getBBox();
            console.log("Bounds:", bounds);
            
            // Check if bounds are valid
            if (!bounds || bounds.width === 0 || bounds.height === 0) {
                console.log("Invalid bounds, using fallback");
                svg.transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity.translate(width/4, height/4).scale(0.5));
                return;
            }
            
            // Add some padding
            const padding = 50;
            const fullWidth = bounds.width + padding * 2;
            const fullHeight = bounds.height + padding * 2;
            
            // Calculate scale to fit the entire tree
            const scaleX = width / fullWidth;
            const scaleY = height / fullHeight;
            const scale = Math.min(scaleX, scaleY, 0.9); // Limit scale to 0.9 for better visibility
            
            // Calculate position to center the tree
            const xOffset = (width - bounds.width * scale) / 2 - bounds.x * scale;
            const yOffset = (height - bounds.height * scale) / 2 - bounds.y * scale;
            
            console.log("Reset view calculations:", {
                bounds,
                containerSize: { width, height },
                scale,
                xOffset,
                yOffset
            });
            
            // Apply the transform with a smooth transition
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity.translate(xOffset, yOffset).scale(scale));
                
            return true;
        } catch (e) {
            console.error("Error resetting view:", e);
            // Fallback to a simple reset
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity.translate(width/4, height/4).scale(0.5));
            return false;
        }
    }
    
    // Connect zoom controls with explicit function references to avoid closure issues
    const zoomIn = () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.3);
    };
    
    const zoomOut = () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    };
    
    // Use direct function references
    d3.select(zoomControls.querySelector('.zoom-in')).on('click', zoomIn);
    d3.select(zoomControls.querySelector('.zoom-out')).on('click', zoomOut);
    d3.select(zoomControls.querySelector('.zoom-reset')).on('click', resetView);

    // Create a dynamic tree layout based on policy size
    const nodeCount = countNodes(root);
    console.log(`Policy has approximately ${nodeCount} nodes`);
    
    // Adjust layout based on policy size
    let nodeSize, separation;
    if (nodeCount > 50) {
        // For very large policies
        nodeSize = [50, 220];
        separation = (a, b) => (a.parent === b.parent ? 1.5 : 2);
    } else if (nodeCount > 20) {
        // For medium-sized policies
        nodeSize = [40, 200];
        separation = (a, b) => (a.parent === b.parent ? 1.3 : 1.8);
    } else {
        // For small policies
        nodeSize = [30, 180];
        separation = (a, b) => (a.parent === b.parent ? 1.2 : 1.5);
    }
    
    // Create tree layout with dynamic sizing
    const treeLayout = d3.tree()
        .nodeSize(nodeSize)
        .separation(separation);
        
    const rootD3 = d3.hierarchy(root, d => d.children);
    rootD3.x0 = height / 2;
    rootD3.y0 = 0;
    
    // Helper function to count nodes in the tree
    function countNodes(node) {
        if (!node) return 0;
        if (!node.children || node.children.length === 0) return 1;
        
        let count = 1; // Count this node
        for (const child of node.children) {
            count += countNodes(child);
        }
        return count;
    }
    
    // Process the initial state of the tree
    // Collapse nodes marked for collapsing
    processInitialState(rootD3);
    
    // Helper function to process initial collapsed state - now ensures everything is expanded
    function processInitialState(node) {
        if (!node) return;
        
        // Make sure all nodes are expanded by moving any _children to children
        if (node._children) {
            node.children = node._children;
            node._children = null;
        }
        
        // Process children recursively
        if (node.children) {
            node.children.forEach(processInitialState);
        }
    }

    // Initial rendering of the tree with a simple transform to ensure it's visible
    // This ensures we have something on screen immediately
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/4, height/4).scale(0.5));
    update(rootD3);
    
    // Global variable to track if reset has been done
    let initialResetDone = false;
    
    // Function to ensure the reset view is called only once
    function ensureResetView() {
        if (!initialResetDone) {
            console.log("Executing initial reset view");
            // Force a complete update before calculating bounds
            update(rootD3);
            
            // Wait for the update to complete
            setTimeout(() => {
                resetView();
                initialResetDone = true;
            }, 100);
        }
    }
    
    // Try multiple times to ensure the view is reset properly
    // This handles cases where the first attempt might fail due to timing issues
    setTimeout(ensureResetView, 300);
    setTimeout(ensureResetView, 800);
    setTimeout(ensureResetView, 1500);

    function update(source) {
        // Apply the tree layout to the hierarchy
        const treeData = treeLayout(rootD3);
        
        // Get all nodes and links
        const nodes = treeData.descendants();
        const links = treeData.descendants().slice(1);

        // Adjust node positions based on depth
        // For large policies, increase the horizontal spacing
        const depthSpacing = nodeCount > 30 ? 220 : 180;
        nodes.forEach(d => { d.y = d.depth * depthSpacing });
        
        // Select all existing nodes
        const node = g.selectAll('g.node')
            .data(nodes, d => d.id || (d.id = ++i));

        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", d => `translate(${source.y0},${source.x0})`);
            
        // Add separate event handlers for click, shift+click, ctrl+click and double-click
        nodeEnter.each(function(d) {
            const nodeGroup = d3.select(this);
            
            nodeGroup.on('click', function(event) {
                // Handle different click combinations
                if (event.shiftKey) {
                    // Shift+Click: Add child node
                    if(d.data.name === "Actions" || d.data.name === "Resources"){
                        event.stopPropagation();
                        handleShiftClick(d);
                    }
                } else if (event.ctrlKey || event.metaKey) {
                    // Ctrl+Click (or Cmd+Click on Mac): Delete node
                    event.stopPropagation();
                    handleDeleteNode(d);
                } else {
                    // Regular click: Toggle children (original behavior)
                    click(event, d);
                }
            });
            
            nodeGroup.on('dblclick', function(event) {
                // Handle double-click for editing
                event.stopPropagation();
                event.preventDefault();
                handleDoubleClick(this, d);
            });
        });

        // Apply drag behavior (unchanged)
        nodeEnter.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        // Add circles for nodes without icons
        nodeEnter.filter(d => !d.data.logo)
            .append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", d => {
                if (d.data.type === "statement") {
                    return d.data.effect === "Allow" ? "green" : (d.data.effect === "Deny" ? "red" : "#fff");
                } else {
                    return "#fff";
                }
            })
            .attr("stroke", d => d.data.effect === "Allow" ? "green" : (d.data.effect === "Deny" ? "red" : "steelblue"));

        // Add text for all nodes
        nodeEnter.append('text')
            .attr("class", "node-text")
            .attr("dy", ".35em")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => d.data.name);

        // Add images for nodes with logos
        nodeEnter.filter(d => d.data.logo)
            .append("image")
            .attr("xlink:href", d => d.data.logo)
            .attr("x", -12)
            .attr("y", -12)
            .attr("width", 24)
            .attr("height", 24)
            .on("error", function() {
                // Handle image loading error by removing the image
                const node = d3.select(this.parentNode);
                const d = node.datum();
                
                // Remove the image
                d3.select(this).remove();
                
                // Update the data to indicate no logo
                d.data.logo = null;
                
                // Add circle instead
                node.append('circle')
                    .attr('class', 'node')
                    .attr('r', 10)
                    .style("fill", "#fff")
                    .attr("stroke", "steelblue");
            });

        nodeEnter.append("title")
            .text(d => `${d.data.name}\nType: ${d.data.type}\nEffect: ${d.data.effect || "N/A"}\n${d.data.type === "condition" ? "Condition: " + d.data.name : ""}`);

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        // Update circles for nodes without icons
        nodeUpdate.filter(d => !d.data.logo)
            .select('circle.node')
            .attr('r', 10)
            .style("fill", d => {
                if (d.data.type === "statement") {
                    return d.data.effect === "Allow" ? "green" : (d.data.effect === "Deny" ? "red" : "#fff");
                } else {
                    return "#fff";
                }
            })
            .attr('cursor', 'pointer');

        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select('circle')
            .attr('r', 1e-6);

        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

        const link = g.selectAll('path.link')
            .data(links, d => d.id);

        const linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', d => {
                const o = { x: source.x0, y: source.y0 };
                return diagonal(o, o);
            });

        const linkUpdate = linkEnter.merge(link);

        linkUpdate.transition()
            .duration(duration)
            .attr('d', d => diagonal(d, d.parent));

        const linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', d => {
                const o = { x: source.x, y: source.y };
                return diagonal(o, o);
            })
            .remove();

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        function diagonal(s, d) {
            const path = `M ${s.y} ${s.x}
                          C ${(s.y + d.y) / 2} ${s.x},
                            ${(s.y + d.y) / 2} ${d.x},
                            ${d.y} ${d.x}`;
            return path;
        }

        //click function
        function click(event, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }
        
        // Function to handle shift+click for adding a child node
        function handleShiftClick(d) {
            console.log("Shift+click: adding new node to", d);
            
            let newNodeType = "custom";
            let newNodeName = "New Node";
            
            // If parent is "Actions", create an action type node
            if (d.data.name === "Actions") {
                newNodeType = "action";
                newNodeName = "service:action";
            }
            // If parent is "Resources", create a resource type node
            else if (d.data.name === "Resources") {
                newNodeType = "resource";
                newNodeName = "arn:aws:service::account:resource";
            }
            // If parent is "Conditions", create a condition type node
            else if (d.data.name === "Conditions") {
                newNodeType = "condition";
                newNodeName = "ConditionType: value";
            }
            
            // Create new node data with appropriate type
            const newNode = { 
                name: newNodeName, 
                type: newNodeType,
                logo: null // Initially set logo to null for all new nodes
            };
            
            // Only try to get logo after creation to avoid overlap issues
            if (newNodeType === "action") {
                const logo = getServiceLogo(newNodeName);
                if (logo) newNode.logo = logo;
            } else if (newNodeType === "resource") {
                const logo = getResourceLogo(newNodeName);
                if (logo) newNode.logo = logo;
            }
            
            // Initialize children array if needed
            if (!d.data.children) {
                d.data.children = [];
            }
            
            // Add the new node to parent's children
            d.data.children.push(newNode);
            
            // Make sure the node is expanded to show the new child
            if (d._children) {
                d.children = d._children;
                d._children = null;
            } else if (!d.children) {
                // Create d3 hierarchy for the new children
                const newHierarchy = d3.hierarchy(newNode);
                d.children = [newHierarchy];
                newHierarchy.depth = d.depth + 1;
                newHierarchy.parent = d;
                newHierarchy.id = ++i; // Assuming 'i' is your global counter
            } else {
                // Add the new node to the existing children array
                const newHierarchy = d3.hierarchy(newNode);
                newHierarchy.depth = d.depth + 1;
                newHierarchy.parent = d;
                newHierarchy.id = ++i; // Assuming 'i' is your global counter
                d.children.push(newHierarchy);
            }
            
            // Update the visualization with the current node as the source
            update(d);
        }
        
        // Function to handle ctrl+click for deleting a node
        function handleDeleteNode(d) {
            console.log("Ctrl+click: deleting node", d);
            
            // Don't allow deleting the root node or main category nodes
            if (!d.parent || d.data.name === "IAM Policy" || 
                d.data.name === "Actions" || d.data.name === "Resources" || 
                d.data.name === "Conditions") {
                console.log("Cannot delete root or main category nodes");
                return;
            }
            
            // Find the parent node
            const parent = d.parent;
            
            // Remove the node from parent's children array
            if (parent.children) {
                const index = parent.children.indexOf(d);
                if (index > -1) {
                    parent.children.splice(index, 1);
                }
                
                // If no more children, collapse the parent
                if (parent.children.length === 0) {
                    parent._children = parent.children;
                    parent.children = null;
                }
            }
            
            // Also update the underlying data structure
            if (parent.data.children) {
                const dataIndex = parent.data.children.findIndex(child => 
                    child.name === d.data.name && child.type === d.data.type);
                
                if (dataIndex > -1) {
                    parent.data.children.splice(dataIndex, 1);
                }
                
                // If no more children in data, clean up
                if (parent.data.children.length === 0) {
                    delete parent.data.children;
                }
            }
            
            // Update the visualization with the parent as the source
            update(parent);
        }
        
        // Function to handle double-click for editing node text
        function handleDoubleClick(nodeElement, d) {
            console.log("Double-click: editing node", d);
            
            // Remove any existing editing fields
            svg.selectAll(".temp-input").remove();
            
            // Get the node's text element
            const textElement = d3.select(nodeElement).select("text.node-text");
            const currentText = d.data.name;
            
            // Hide original text
            textElement.style("opacity", 0);
            
            // Get the position of the node in the transformed coordinate system
            const nodePos = d3.select(nodeElement).attr("transform");
            const match = nodePos.match(/translate\(([^,]+),([^)]+)\)/);
            if (!match) return;
            
            const nodeX = parseFloat(match[1]);
            const nodeY = parseFloat(match[2]);
            
            // Calculate position for the input field
            // Position depends on whether text is to the left or right of the node
            const isTextLeft = d.children || d._children;
            const inputX = isTextLeft ? nodeX - 120 : nodeX + 10;
            
            // Create an HTML input field
            const foreignObject = g.append("foreignObject")
                .attr("class", "temp-input")
                .attr("x", inputX)
                .attr("y", nodeY - 15)
                .attr("width", 200)
                .attr("height", 30);
                
            const input = foreignObject.append("xhtml:input")
                .attr("type", "text")
                .attr("value", currentText)
                .style("width", "100%")
                .style("height", "100%")
                .style("font-size", "12px")
                .style("border", "1px solid #999")
                .style("padding", "2px");
            
            // Auto-focus the input
            input.node().focus();
            
            // Flag to track if edit is being processed
            let isProcessingEdit = false;
            
            // Handle input events
            input.on("keydown", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    if (!isProcessingEdit) {
                        saveEdit();
                    }
                } else if (event.key === "Escape") {
                    event.preventDefault();
                    cancelEdit();
                }
            });
            
            // Handle blur events
            input.on("blur", function() {
                if (!isProcessingEdit) {
                    saveEdit();
                }
            });
            
            function saveEdit() {
                // Set flag to prevent duplicate processing
                isProcessingEdit = true;
                
                const newText = input.node().value.trim();
                if (newText !== "") {
                    // Update the data
                    d.data.name = newText;
                    
                    // Update the text
                    textElement.text(newText);
                    
                    // Check if this is an action node and update the logo if needed
                    if (d.data.type === "action") {
                        // Get the new logo based on the updated text
                        const newLogo = getServiceLogo(newText);
                        
                        // Remove existing image if there is one
                        d3.select(nodeElement).select("image").remove();
                        
                        // Remove existing circle if there is one
                        d3.select(nodeElement).select("circle").remove();
                        
                        // Add the new image if a logo is found
                        if (newLogo) {
                            d.data.logo = newLogo;
                            d3.select(nodeElement).append("image")
                                .attr("xlink:href", newLogo)
                                .attr("x", -12)
                                .attr("y", -12)
                                .attr("width", 24)
                                .attr("height", 24)
                                .on("error", function() {
                                    // Handle image loading error
                                    d3.select(this).remove();
                                    d.data.logo = null;
                                    
                                    // Add circle instead
                                    d3.select(nodeElement).append('circle')
                                        .attr('class', 'node')
                                        .attr('r', 10)
                                        .style("fill", "#fff")
                                        .attr("stroke", "steelblue");
                                });
                        } else {
                            // No logo found, add a circle
                            d.data.logo = null;
                            d3.select(nodeElement).append('circle')
                                .attr('class', 'node')
                                .attr('r', 10)
                                .style("fill", "#fff")
                                .attr("stroke", "steelblue");
                        }
                    }
                    // Similarly handle resource nodes
                    else if (d.data.type === "resource") {
                        // Get the new logo based on the updated text
                        const newLogo = getResourceLogo(newText);
                        
                        // Remove existing image if there is one
                        d3.select(nodeElement).select("image").remove();
                        
                        // Remove existing circle if there is one
                        d3.select(nodeElement).select("circle").remove();
                        
                        // Add the new image if a logo is found
                        if (newLogo) {
                            d.data.logo = newLogo;
                            d3.select(nodeElement).append("image")
                                .attr("xlink:href", newLogo)
                                .attr("x", -12)
                                .attr("y", -12)
                                .attr("width", 24)
                                .attr("height", 24)
                                .on("error", function() {
                                    // Handle image loading error
                                    d3.select(this).remove();
                                    d.data.logo = null;
                                    
                                    // Add circle instead
                                    d3.select(nodeElement).append('circle')
                                        .attr('class', 'node')
                                        .attr('r', 10)
                                        .style("fill", "#fff")
                                        .attr("stroke", "steelblue");
                                });
                        } else {
                            // No logo found, add a circle
                            d.data.logo = null;
                            d3.select(nodeElement).append('circle')
                                .attr('class', 'node')
                                .attr('r', 10)
                                .style("fill", "#fff")
                                .attr("stroke", "steelblue");
                        }
                    }
                }
                
                // Restore visibility
                textElement.style("opacity", 1);
                
                // Remove the input more safely
                try {
                    const tempInputs = d3.selectAll(".temp-input");
                    if (!tempInputs.empty()) {
                        tempInputs.remove();
                    }
                } catch (e) {
                    console.warn("Error removing temp input:", e);
                }
                
                // Reset processing flag
                isProcessingEdit = false;
            }
            
            function cancelEdit() {
                textElement.style("opacity", 1);
                foreignObject.remove();
            }
        }
    }

    function dragstarted(event, d) {
        if (!event.active) {
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
    }

    function dragged(event, d) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
        update(event.subject);
    }

    function dragended(event, d) {
        if (!event.active) {
            event.subject.fx = null;
            event.subject.fy = null;
        }
    }

    update(rootD3);
    
    // Return a function to handle window resize events
    const resizeHandler = debounce(() => {
        // Re-render the tree when window is resized
        renderTree(root, containerId, options);
    }, 250);

    window.addEventListener('resize', resizeHandler);

    // Store the handler reference for cleanup
    container._resizeHandler = resizeHandler;

    // Return cleanup function
    return () => {
        window.removeEventListener('resize', container._resizeHandler);
    };
}


function extractPolicyFromVisualization(containerId = 'visualization') {
    // First, find the root node more reliably
    let rootNode;
    try {
        // Try first approach - get from any node's root reference
        rootNode = d3.select(`#${containerId} g.node`).datum();
        if (rootNode) {
            // Navigate to the actual root if this is a child node
            while (rootNode.parent) {
                rootNode = rootNode.parent;
            }
        } else {
            throw new Error("Could not find node data");
        }
    } catch (e) {
        // Alternative approach - get all nodes and find the one without a parent
        try {
            const allNodes = d3.selectAll(`#${containerId} g.node`).data();
            rootNode = allNodes.find(node => !node.parent) || allNodes[0];
            if (!rootNode) {
                throw new Error("Could not find root node");
            }
        } catch (e) {
            console.error("Failed to find visualization data:", e);
            return null;
        }
    }
    
    // Helper function to safely get children
    function getChildren(node) {
        if (!node) return [];
        return node.children || node._children || [];
    }
    
    // Create the policy structure
    const policy = {
        "Version": "2012-10-17",
        "Statement": []
    };
    
    // Find all statement nodes (direct children of root)
    const statementNodes = getChildren(rootNode).filter(node => 
        node && node.data && node.data.type === "statement");
    
    // Process each statement
    statementNodes.forEach((statementNode, index) => {
        if (!statementNode || !statementNode.data) return;
        
        // Extract Sid from statement name if it exists
        let sid = `Statement${index + 1}`;  // Default Sid
        
        if (statementNode.data.name) {
            // Check if the name contains a Sid already
            // Format is typically "Sid: Effect" or "Statement X: Effect"
            const nameParts = statementNode.data.name.split(':');
            if (nameParts.length > 1) {
                // Don't use "Statement X" pattern as Sid
                const possibleSid = nameParts[0].trim();
                if (!possibleSid.startsWith('Statement ')) {
                    sid = possibleSid;
                }
            }
        }
        
        const statement = {
            "Sid": sid,
            "Effect": statementNode.data.effect || "Allow"
        };
        
        // Find Actions, Resources, and Conditions nodes
        const children = getChildren(statementNode);
        
        children.forEach(categoryNode => {
            if (!categoryNode || !categoryNode.data || !categoryNode.data.name) return;
            
            if (categoryNode.data.name === "Actions") {
                // Process Actions
                const actionChildren = getChildren(categoryNode);
                if (actionChildren.length > 0) {
                    const actions = actionChildren
                        .filter(node => node && node.data)
                        .map(actionNode => actionNode.data.name);
                    
                    if (actions.length > 0) {
                        statement["Action"] = actions.length === 1 ? actions[0] : actions;
                    }
                }
            } else if (categoryNode.data.name === "Resources") {
                // Process Resources
                const resourceChildren = getChildren(categoryNode);
                if (resourceChildren.length > 0) {
                    const resources = resourceChildren
                        .filter(node => node && node.data)
                        .map(resourceNode => resourceNode.data.name);
                    
                    if (resources.length > 0) {
                        statement["Resource"] = resources.length === 1 ? resources[0] : resources;
                    }
                }
            } else if (categoryNode.data.name === "Conditions") {
                // Process Conditions
                const conditionChildren = getChildren(categoryNode);
                if (conditionChildren.length > 0) {
                    statement["Condition"] = {};
                    
                    conditionChildren.forEach(conditionNode => {
                        if (!conditionNode || !conditionNode.data) return;
                        
                        const conditionText = conditionNode.data.name;
                        if (!conditionText) return;
                        
                        // Try to parse condition text like "StringEquals: {"aws:username": "user"}"
                        try {
                            const colonIndex = conditionText.indexOf(':');
                            if (colonIndex > 0) {
                                const operator = conditionText.substring(0, colonIndex).trim();
                                let jsonStr = conditionText.substring(colonIndex + 1).trim();
                                
                                // Try to parse as JSON
                                try {
                                    const conditionValue = JSON.parse(jsonStr);
                                    statement["Condition"][operator] = conditionValue;
                                } catch (e) {
                                    // If not valid JSON, use simple key-value extraction
                                    const matches = jsonStr.match(/["']?([\w:*]+)["']?\s*[:=]\s*["']?([\w:*]+)["']?/);
                                    if (matches) {
                                        const key = matches[1];
                                        const value = matches[2];
                                        const conditionObj = {};
                                        conditionObj[key] = value;
                                        statement["Condition"][operator] = conditionObj;
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn("Could not parse condition:", conditionText);
                        }
                    });
                    
                    // Remove empty condition object
                    if (Object.keys(statement["Condition"]).length === 0) {
                        delete statement["Condition"];
                    }
                }
            }
        });
        
        policy.Statement.push(statement);
    });
    
    return policy;
}


export {visualizePolicy , extractPolicyFromVisualization} ; 
// Export the main function

