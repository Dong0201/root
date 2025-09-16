document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const chatForm = document.getElementById('chat-form');
    const modelSelect = document.getElementById('model-select');
    const streamToggle = document.getElementById('stream-toggle');
    const temperatureSlider = document.getElementById('temperature-slider');
    const temperatureValue = document.getElementById('temperature-value');
    const topPSlider = document.getElementById('top-p-slider');
    const topPValue = document.getElementById('top-p-value');
    const maxTokensInput = document.getElementById('max-tokens-input');
    const thinkingIndicator = document.getElementById('thinking-indicator');

    const API_URL = 'https://api.pearktrue.cn/api/aichat/';

    let conversationHistory = [
        // Keep track of messages for the API
        // { role: 'assistant', content: '你好呀！我是DongChat，可以回答你的问题' } // Initial message doesn't need to be sent back
    ];

    // --- Fetch Models ---
    async function fetchModels() {
        try {
            const response = await fetch(API_URL, { method: 'GET' });
             if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
             }
             // **IMPORTANT**: Adjust parsing based on ACTUAL API response format for GET /models
             // Assuming it returns an object like { code: 200, models: ["model1", "model2"] }
             // Or maybe just an array ["model1", "model2"]
             // Or { code: 200, data: { models: [...] } }
             // You MUST inspect the actual response in your browser's developer tools (Network tab)
            const data = await response.json();

            // --- Adjust this based on the actual API response structure ---
            let models = [];
            if (data && Array.isArray(data)) { // Simple array
                models = data;
            } else if (data && Array.isArray(data.models)) { // { models: [...] }
                models = data.models;
            } else if (data && data.data && Array.isArray(data.data.models)) { // { data: { models: [...] } }
                 models = data.data.models;
            } else {
                console.warn("Could not parse model list from API response:", data);
                 models = ["qwq-32b", "default"]; // Fallback models
            }
            // --- End Adjustment ---

            modelSelect.innerHTML = ''; // Clear loading/existing options
            models.forEach(modelName => {
                const option = document.createElement('option');
                option.value = modelName;
                option.textContent = modelName;
                modelSelect.appendChild(option);
            });

            // Select a default model if available
            const defaultModel = ""; // Your specified default
            if (models.includes(defaultModel)) {
                modelSelect.value = defaultModel;
            } else if (models.length > 0) {
                modelSelect.value = models[0]; // Select the first available if default isn't found
            }

        } catch (error) {
            console.error('Error fetching models:', error);
            modelSelect.innerHTML = '<option value="">无法加载模型</option>';
        }
    }

    // --- Update Slider Values ---
    temperatureSlider.addEventListener('input', (e) => {
        temperatureValue.textContent = e.target.value;
    });
    topPSlider.addEventListener('input', (e) => {
        topPValue.textContent = e.target.value;
    });

    // --- Add Message to UI ---
    function addMessageToUI(role, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role);

        const roleElement = document.createElement('span');
        roleElement.classList.add('role');
        roleElement.textContent = role === 'user' ? '你' : 'Dong'; // Cute names

        const contentElement = document.createElement('p');
        // Basic security: Use textContent to prevent HTML injection from response
        // If you TRUST the API and need HTML rendering (like markdown),
        // you'll need a Markdown library (e.g., Marked.js) and sanitize the output.
        contentElement.textContent = content;

        messageElement.appendChild(roleElement);
        messageElement.appendChild(contentElement);
        chatBox.appendChild(messageElement);

        // Scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement; // Return the element for potential stream updates
    }

     // --- Handle Thinking Indicator ---
    function showThinking(show = true) {
        thinkingIndicator.style.display = show ? 'block' : 'none';
        if (show) {
             chatBox.scrollTop = chatBox.scrollHeight; // Scroll down to show indicator
        }
    }

    // --- Handle Form Submission ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = messageInput.value.trim();

        if (!userMessage) return;

        // Add user message to UI and history
        addMessageToUI('user', userMessage);
        conversationHistory.push({ role: 'user', content: userMessage });
        messageInput.value = '';
        showThinking(true); // Show thinking indicator

        // Prepare API request data
        const requestData = {
            model: modelSelect.value || "https://api.jkyai.top/API/doubao.php?question=", // Fallback model
            messages: conversationHistory,
            stream: streamToggle.checked,
            temperature: parseFloat(temperatureSlider.value),
            top_p: parseFloat(topPSlider.value),
            max_tokens: parseInt(maxTokensInput.value) || 4096 // Ensure it's an int
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': requestData.stream ? 'text/event-stream' : 'application/json'
                },
                body: JSON.stringify(requestData)
            });

             showThinking(false); // Hide thinking indicator once response starts

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }

            if (requestData.stream && response.headers.get('Content-Type')?.includes('text/event-stream')) {
                // Handle Streaming Response (Server-Sent Events)
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let fullResponse = '';
                let reasoningContent = null; // Store reasoning if found

                 // Add placeholder message element for the AI response
                const aiMessageElement = addMessageToUI('assistant', '...'); // Start with placeholder
                const aiContentElement = aiMessageElement.querySelector('p');
                aiContentElement.textContent = ''; // Clear placeholder dots

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep the last partial line

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataJson = line.substring(6).trim();
                             if (dataJson === '[DONE]') { // Check for OpenAI-like DONE signal if applicable
                                 console.log("Stream finished signal received.");
                                 continue;
                             }
                            try {
                                const chunk = JSON.parse(dataJson);
                                // **IMPORTANT**: Adapt based on the ACTUAL stream format.
                                // Common formats:
                                // 1. { content: "...", ... } -> Just append chunk.content
                                // 2. OpenAI format: { choices: [{ delta: { content: "..." } }], ... }
                                let contentChunk = '';
                                if (chunk.content) {
                                     contentChunk = chunk.content;
                                } else if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
                                     contentChunk = chunk.choices[0].delta.content;
                                } else {
                                    console.warn("Unrecognized stream chunk format:", chunk);
                                }

                                if (contentChunk) {
                                    fullResponse += contentChunk;
                                    aiContentElement.textContent = fullResponse; // Update UI incrementally
                                    chatBox.scrollTop = chatBox.scrollHeight; // Keep scrolling down
                                }
                                // Check for reasoning content (adjust field name if needed)
                                if(chunk.reasoning_content && !reasoningContent) {
                                    reasoningContent = chunk.reasoning_content;
                                    console.log("Reasoning content received:", reasoningContent);
                                     // Optionally display reasoning content somewhere else
                                }

                            } catch (parseError) {
                                console.warn('Failed to parse stream chunk:', dataJson, parseError);
                                // Append raw line if parsing fails, might indicate non-JSON data or error
                                // aiContentElement.textContent += line + '\n';
                            }
                        }
                    }
                }
                 // Final buffer processing (if any) - Simplified for this example
                 if (buffer.startsWith('data: ')) {
                     // Try parsing the last bit
                     try {
                         const chunk = JSON.parse(buffer.substring(6).trim());
                          let contentChunk = '';
                          if (chunk.content) contentChunk = chunk.content;
                           else if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) contentChunk = chunk.choices[0].delta.content;

                         if (contentChunk) {
                             fullResponse += contentChunk;
                              aiContentElement.textContent = fullResponse;
                              chatBox.scrollTop = chatBox.scrollHeight;
                         }
                          if(chunk.reasoning_content && !reasoningContent) reasoningContent = chunk.reasoning_content;
                     } catch(e) { console.warn("Failed to parse final buffer chunk", buffer, e);}
                 }


                // Add the completed message to history AFTER the stream finishes
                if (fullResponse) {
                    conversationHistory.push({ role: 'assistant', content: fullResponse });
                } else {
                     aiContentElement.textContent = "[空响应或解析错误]";
                     console.error("Stream ended but no valid content was assembled.");
                }
                 // Handle final reasoning content display if needed

            } else {
                // Handle Non-Streaming JSON Response
                const data = await response.json();
                if (data.code === 200 && data.content) {
                    addMessageToUI('assistant', data.content);
                    conversationHistory.push({ role: 'assistant', content: data.content });
                     if (data.reasoning_content) {
                        console.log("Reasoning content:", data.reasoning_content);
                        // Optionally display it, e.g., in console or a dedicated area
                        // addMessageToUI('system', `(思考: ${data.reasoning_content})`); // Example
                    }
                } else {
                    throw new Error(`API Error (Code ${data.code}): ${data.msg || 'Unknown error'}`);
                }
            }

        } catch (error) {
            console.error('Chat error:', error);
             showThinking(false); // Ensure indicator is hidden on error
            addMessageToUI('assistant', `糟糕！出错了： ${error.message} QAQ`);
        }
    });

    // --- Initial Load ---
    fetchModels(); // Load models when the page loads
});
