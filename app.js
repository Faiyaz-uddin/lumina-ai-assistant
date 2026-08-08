
const API_KEY = "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";
const API_URL = `https://openrouter.ai/api/v1/chat/completions`;

const App = {
    state: {
        mode: 'general', // 'general' or 'paper'
        paperDetails: null, // { title, area, abstract, goal, special }
        chatHistory: [], // Array of { role: 'user' | 'model', text: string }
        isGenerating: false
    },

    init: () => {
        // Any startup logic
        console.log("Lumina initialized");

        // Add click handler for floating back button (CSS ::before workaround)
        // Legacy click handler removed. Back button in HTML has onlick attribute.
    },

    // --- Navigation & View Switching ---

    switchView: (viewId) => {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.view').forEach(el => {
            el.classList.add('hidden'); // Ensure hidden is applied for display:none behavior if needed
            // But our CSS handles .view opacity. We need display:none to remove from flow?
            // CSS says: .view { position: absolute ... } so they overlap.
            // We'll toggle 'hidden' class for safety on pointer events/focus.
            setTimeout(() => {
                if (!el.classList.contains('active')) el.classList.add('hidden');
            }, 300); // Wait for fade out
        });

        const target = document.getElementById(viewId);
        target.classList.remove('hidden');
        // Small delay to allow display:block to apply before opacity transition
        setTimeout(() => target.classList.add('active'), 10);
    },

    startMode: (mode) => {
        App.state.mode = mode;
        App.state.chatHistory = [];
        App.clearChatUI();

        if (mode === 'general') {
            document.getElementById('chat-mode-indicator').innerText = 'Ask Anything';
            document.getElementById('info-toggle-btn').classList.add('hidden');
            document.getElementById('paper-info-panel').classList.add('hidden');
            App.switchView('view-chat');
            App.addMessage('system-welcome', "Hello! I am Lumina. How can I assist you today?");
        } else {
            // Paper mode handling is done via submitPaperForm
        }
    },

    openPaperForm: () => {
        const modal = document.getElementById('modal-paper-form');
        modal.classList.remove('hidden');
    },

    closePaperForm: () => {
        const modal = document.getElementById('modal-paper-form');
        modal.classList.add('hidden');
        // Reset form?
        document.getElementById('paper-form').reset();
    },

    submitPaperForm: (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const details = {
            title: formData.get('title'),
            area: formData.get('area'),
            abstract: formData.get('abstract'),
            goal: formData.get('goal'),
            special: formData.get('special')
        };

        App.state.paperDetails = details;
        App.state.mode = 'paper';
        App.state.chatHistory = []; // Reset chat for new context

        App.closePaperForm();
        App.preparePaperModeUI();
        App.switchView('view-chat');
    },

    preparePaperModeUI: () => {
        document.getElementById('chat-mode-indicator').innerText = 'Paper Assistant';
        document.getElementById('info-toggle-btn').classList.remove('hidden');

        // Populate Panel
        const panel = document.getElementById('paper-details-display');
        panel.innerHTML = `
            <div class="info-item">
                <div class="info-label">Title</div>
                <div class="info-value">${App.state.paperDetails.title}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Area</div>
                <div class="info-value">${App.state.paperDetails.area}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Goal</div>
                <div class="info-value">${App.state.paperDetails.goal}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Notes</div>
                <div class="info-value">${App.state.paperDetails.special || 'None'}</div>
            </div>
        `;

        // Show panel by default on desktop? Let's just keep it toggleable or show it initially.
        // Prompt says "panel (at the top or sidebar) showing the paper details".
        // Let's show it.
        const aside = document.getElementById('paper-info-panel');
        aside.classList.remove('hidden');

        App.clearChatUI();
        App.addMessage('system-welcome', `I am ready to help with your paper: "${App.state.paperDetails.title}". What would you like to do first?`);
    },

    togglePanelInfo: () => {
        const aside = document.getElementById('paper-info-panel');
        if (aside.classList.contains('hidden')) {
            aside.classList.remove('hidden');
            // Allow time for display:flex to apply
            setTimeout(() => aside.style.transform = 'translateX(0)', 10);
        } else {
            // aside.style.transform = 'translateX(-100%)';
            // setTimeout(() => aside.classList.add('hidden'), 300);
            // Simple toggle for now to avoid layout shift complexities in vanilla js without complex animations
            aside.classList.toggle('hidden');
        }
    },

    goBack: () => {
        // Confirm if chat history exists? Nah, just go back.
        App.switchView('view-landing');
    },

    // --- Chat Logic ---

    clearChatUI: () => {
        const container = document.getElementById('chat-container');
        container.innerHTML = '';
    },

    // Enhanced markdown parser
    parseMarkdown: (text) => {
        let html = text;

        // Code blocks (```code```) - must be first
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Tables - convert markdown tables to HTML
        html = html.replace(/\n(\|.+\|)\n(\|[\s:|-]+\|)\n((?:\|.+\|\n?)+)/g, (match, header, separator, rows) => {
            const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
            const rowsHtml = rows.trim().split('\n').map(row => {
                const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table class="md-table"><thead><tr>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
        });

        // Inline code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold (**text** or __text__)
        html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Italic (*text* or _text_) - be careful not to match already processed bold
        html = html.replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<em>$1</em>');
        html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

        // Headers (### Header)
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Unordered lists (- item or * item)
        html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Numbered lists (1. item)
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    },

    addMessage: (role, text) => { // role: 'user', 'assistant', 'system-welcome'
        const container = document.getElementById('chat-container');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;

        // Parse markdown for assistant messages
        const formattedText = (role === 'assistant') ? App.parseMarkdown(text) : text.replace(/\n/g, '<br>');

        // Add action buttons for assistant messages
        let actionButtons = '';
        if (role === 'assistant') {
            actionButtons = `
                <div class="message-actions">
                    <button class="action-btn" onclick="App.copyMessage(this)" title="Copy">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="action-btn" onclick="App.shareMessage(this)" title="Share">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                </div>
            `;
        }

        msgDiv.innerHTML = `
            <div class="bubble" data-text="${text.replace(/"/g, '&quot;')}">
                ${formattedText}
                ${actionButtons}
            </div>
        `;
        container.appendChild(msgDiv);


        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    handleInputKey: (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            App.sendMessage();
        }
    },

    sendMessage: async () => {
        if (App.state.isGenerating) return;

        const input = document.getElementById('user-input');
        const text = input.value.trim();
        if (!text) return;

        // UI
        input.value = '';
        App.addMessage('user', text);
        App.state.isGenerating = true;

        // Show loading state
        const loadingId = 'loading-' + Date.now();
        const container = document.getElementById('chat-container');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.id = loadingId;
        loadingDiv.innerHTML = `<div class="bubble">...</div>`;
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;

        try {
            const responseText = await App.callOpenAI(text);

            // Remove loading
            document.getElementById(loadingId).remove();

            // Add response
            App.addMessage('assistant', responseText);

            // Update history
            App.state.chatHistory.push({ role: 'user', parts: [{ text: text }] });
            App.state.chatHistory.push({ role: 'model', parts: [{ text: responseText }] });

            // Prune history if too long?
            // "Send the last 3–4 user + assistant messages"
            // We'll slice nicely in the preparePayload function, but keeping full local history is fine.

        } catch (err) {
            console.error("Gemini API Error:", err);
            document.getElementById(loadingId).remove();
            App.addMessage('assistant', `⚠️ Error: ${err.message || 'Unknown error occurred.'}`);
        } finally {
            App.state.isGenerating = false;
        }
    },

    // --- Backend Logic (Client simulation) ---

    callOpenAI: async (userQuery) => {
        // 1. Construct System Instruction
        let systemInstruction = "";

        if (App.state.mode === 'general') {
            systemInstruction = "You are Lumina, a generic but intelligent academic assistant. Answer questions clearly and concisely. Do NOT output your internal thinking process or <think> tags, provide ONLY the final response.";
        } else {
            const p = App.state.paperDetails;
            systemInstruction = `You are Lumina, a dedicated Research Assistant helping with a specific paper.
DETAILS:
Title: ${p.title}
Area: ${p.area}
Abstract: ${p.abstract}
Goal: ${p.goal}
Original Instructions: ${p.special || "None"}

Your answers must be tailored to this project. Be academic, precise, and helpful based on the context provided.
IMPORTANT: Do NOT output your internal thinking process or <think> tags. providing ONLY the final response.`;
        }

        // 2. Prepare History (Last 3-4 turns)
        // Chat history format in state: [{role, parts: [{text}]}]
        // We need to convert to OpenAI format: { role: 'user'|'assistant', content: string }

        const historyWindow = App.state.chatHistory.slice(-8).map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0].text
        }));

        // 3. Construct Payload
        const messages = [
            { role: "system", content: systemInstruction },
            ...historyWindow,
            { role: "user", content: userQuery }
        ];

        const payload = {
            // UPDATED: Using Llama 3.3 70B (Best balance of smarts & speed)
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: messages
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000', // To identify your app
                    'X-Title': 'Lumina'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle HTTP errors
                const errMsg = data.error?.message || `HTTP Error: ${res.status} ${res.statusText}`;
                throw new Error(errMsg);
            }

            if (data.error) {
                throw new Error(data.error.message);
            }

            if (!data.choices || data.choices.length === 0) {
                throw new Error("No response choices returned.");
            }

            // Extract text and remove <think> blocks if present
            let rawText = data.choices[0].message.content;

            console.log("[Lumina] Raw Response:", rawText); // Debugging

            // Remove <think>...</think> (including newlines)
            // Also attempt to remove partial matches or other common reasoning patterns if regex misses
            rawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '');
            rawText = rawText.replace(/<think>[\s\S]*/gi, ''); // Remove unclosed think tag at start if any? (Dangerous if answer follows)
            // Actually, some models might output "Thinking Process: ..."

            return rawText.trim();
        } catch (e) {
            console.error("API Error", e);
            throw e;
        }
    },

    // --- Message Actions ---

    copyMessage: (btn) => {
        const bubble = btn.closest('.bubble');
        const text = bubble.getAttribute('data-text');

        navigator.clipboard.writeText(text).then(() => {
            // Visual feedback
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`;
            btn.style.color = '#10b981';

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('Failed to copy text');
        });
    },

    shareMessage: async (btn) => {
        const bubble = btn.closest('.bubble');
        const text = bubble.getAttribute('data-text');

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Lumina Response',
                    text: text
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            // Fallback: copy to clipboard
            App.copyMessage(btn);
            alert('Link copied to clipboard! (Share API not supported)');
        }
    }
};

// Start
App.init();
