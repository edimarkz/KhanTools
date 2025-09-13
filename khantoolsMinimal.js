(function() {
    'use strict';
    
    if (window.KhanToolsLoaded) {
        alert('Khan Tools já está ativo!');
        return;
    }
    
    if (!window.location.hostname.includes('khanacademy.org')) {
        alert('Este Script Funciona Apenas no Khan Academy!');
        return;
    }
    
    window.KhanToolsLoaded = true;
    
    // ============= CONFIGURAÇÕES GLOBAIS =============
    window.features = {
        videoSpoof: true,
        questionSpoof: true,
        darkMode: false
    };
    
    window.featureConfigs = {};
    
    // ============= UTILITÁRIOS =============
    const logger = {
        log: (msg) => console.log(`[KhanTools] ${msg}`),
        error: (msg) => console.error(`[KhanTools] ${msg}`)
    };
    
    function showToast(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #3f505b;
            color: #faf9f5; padding: 12px 16px; border-radius: 8px; z-index: 10002;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; font-size: 13px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3); border: 1px solid #2a2f36;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
        logger.log(message);
    }
    
    const setFeatureByPath = (path, value) => {
        let obj = window;
        const parts = path.split('.');
        while (parts.length > 1) obj = obj[parts.shift()];
        obj[parts[0]] = value;
    };
    
    // ============= FETCH INTERCEPT (CORRIGIDO) =============
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init = {}) {
        // Extrai informações básicas sem consumir o body
        let url, method, headers, body = null;
        
        if (typeof input === 'string') {
            url = input;
            method = init.method || 'GET';
            headers = init.headers || {};
            body = init.body;
        } else if (input instanceof Request) {
            url = input.url;
            method = input.method;
            headers = input.headers;
            // NÃO consome o body aqui - isso é o que estava quebrando
        } else {
            url = input.url || input;
            method = init.method || 'GET';
            headers = init.headers || {};
            body = init.body;
        }
        
        // ===== VIDEO SPOOF =====
        if (window.features.videoSpoof && 
            method === 'POST' && 
            url.includes('/api/internal/graphql') &&
            body && 
            typeof body === 'string' &&
            body.includes('"operationName":"updateUserVideoProgress"')) {
            
            try {
                const bodyObj = JSON.parse(body);
                if (bodyObj.variables?.input?.durationSeconds) {
                    const duration = bodyObj.variables.input.durationSeconds;
                    bodyObj.variables.input.secondsWatched = duration;
                    bodyObj.variables.input.lastSecondWatched = duration;
                    
                    // Cria nova requisição com body modificado
                    const modifiedInit = {
                        ...init,
                        method: 'POST',
                        body: JSON.stringify(bodyObj),
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json'
                        }
                    };
                    
                    // Pausa o vídeo
                    const videoElem = document.querySelector('video');
                    if (videoElem) videoElem.pause();
                    
                    showToast("🎥 Vídeo completado automaticamente!", 1500);
                    
                    // Chama fetch original com dados modificados
                    return originalFetch.call(this, url, modifiedInit);
                }
            } catch (e) {
                logger.error(`Erro no VideoSpoof: ${e}`);
            }
        }
        
        // Para requisições normais, chama o original sem modificações
        const response = await originalFetch.call(this, input, init);
        
        // ===== QUESTION SPOOF =====
        if (window.features.questionSpoof && 
            response.ok && 
            method === 'POST' &&
            response.headers.get('content-type')?.includes('application/json') &&
            url.includes('/api/internal/graphql')) {
            
            try {
                const clonedResponse = response.clone();
                const responseText = await clonedResponse.text();
                
                // Verifica se contém dados de questão
                if (responseText.includes('"assessmentItem"') && 
                    responseText.includes('"itemData"')) {
                    
                    const responseObj = JSON.parse(responseText);
                    const assessmentItem = responseObj?.data?.assessmentItem?.item;
                    
                    if (assessmentItem?.itemData) {
                        const itemData = JSON.parse(assessmentItem.itemData);
                        
                        // Verifica se é uma questão válida
                        if (itemData.question?.content && 
                            Array.isArray(itemData.question.content) &&
                            itemData.question.content.length > 0 &&
                            typeof itemData.question.content[0] === 'string' &&
                            itemData.question.content[0].trim().length > 0) {
                            
                            // Substitui a questão por uma simples
                            itemData.answerArea = { 
                                "calculator": false, "chi2Table": false, 
                                "periodicTable": false, "tTable": false, "zTable": false 
                            };
                            
                            itemData.question.content = ["Qual é a resposta correta? [[☃ radio 1]]"];
                            itemData.question.widgets = { 
                                "radio 1": { 
                                    type: "radio", 
                                    options: { 
                                        choices: [ 
                                            { content: "Esta é a resposta correta ✓", correct: true }, 
                                            { content: "Opção incorreta A", correct: false },
                                            { content: "Opção incorreta B", correct: false }
                                        ] 
                                    } 
                                } 
                            };
                            
                            responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                            showToast("❓ Questão simplificada!", 1500);
                            
                            return new Response(JSON.stringify(responseObj), {
                                status: response.status,
                                statusText: response.statusText,
                                headers: response.headers
                            });
                        }
                    }
                }
            } catch (e) {
                // Silencioso para evitar spam - só loga erros importantes
                if (!e.message.includes('JSON') && !e.message.includes('parse')) {
                    logger.error(`Erro no QuestionSpoof: ${e}`);
                }
            }
        }
        
        return response;
    };
    
    // ============= DARK MODE =============
    function toggleDarkMode(enabled) {
        if (enabled) {
            if (!document.getElementById('khan-tools-dark-mode')) {
                const darkStyle = document.createElement('style');
                darkStyle.id = 'khan-tools-dark-mode';
                darkStyle.textContent = `
                    html, body, [data-test-id="page-content-wrapper"] {
                        background-color: #1a1a1a !important;
                        color: #e0e0e0 !important;
                    }
                    .header, .nav-bar, [data-test-id="header"] {
                        background-color: #2d2d2d !important;
                        border-color: #404040 !important;
                    }
                    .card, .exercise-card, .video-card, [data-test-id="card"] {
                        background-color: #2d2d2d !important;
                        border-color: #404040 !important;
                        color: #e0e0e0 !important;
                    }
                    input, textarea, select, [data-test-id="input"] {
                        background-color: #404040 !important;
                        border-color: #606060 !important;
                        color: #e0e0e0 !important;
                    }
                    .perseus-widget-container, .perseus-renderer {
                        background-color: #2d2d2d !important;
                        color: #e0e0e0 !important;
                    }
                    button, a {
                        color: #00d4aa !important;
                    }
                    .sidebar, .nav-sidebar {
                        background-color: #2d2d2d !important;
                    }
                    .exercise-content-wrapper {
                        background-color: #1a1a1a !important;
                    }
                `;
                document.head.appendChild(darkStyle);
            }
        } else {
            const darkStyle = document.getElementById('khan-tools-dark-mode');
            if (darkStyle) darkStyle.remove();
        }
    }
    
    // ============= INTERFACE =============
    function createInterface() {
        const watermark = document.createElement('div');
        const dropdownMenu = document.createElement('div');
        
        // Watermark
        Object.assign(watermark.style, {
            position: 'fixed', top: '0', right: '20px', width: '150px', height: '30px',
            backgroundColor: '#3f505b', color: '#faf9f5', fontSize: '15px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer', userSelect: 'none', borderRadius: '0 0 10px 10px',
            zIndex: '10001', transition: 'transform 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        });
        
        watermark.textContent = '🛠️ Khan Tools v2.2';
        
        // Dropdown
        Object.assign(dropdownMenu.style, {
            position: 'absolute', top: '100%', right: '0', width: '200px',
            backgroundColor: '#384147', borderRadius: '0 0 10px 10px',
            color: '#faf9f5', fontSize: '13px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            display: 'none', flexDirection: 'column', zIndex: '10000',
            padding: '10px', cursor: 'default', userSelect: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(5px)'
        });
        
        dropdownMenu.innerHTML = `
            <style>
                input[type="checkbox"] {
                    appearance: none; width: 15px; height: 15px;
                    background-color: #2a2f36; border: 1px solid #faf9f5;
                    border-radius: 3px; margin-right: 8px; cursor: pointer;
                }
                input[type="checkbox"]:checked {
                    background-color: #3f505b; border-color: #faf9f5;
                }
                input[type="checkbox"]:checked::after {
                    content: '✓'; display: block; text-align: center;
                    font-size: 11px; color: #faf9f5; line-height: 13px;
                }
                label {
                    display: flex; align-items: center; padding: 5px 0;
                    cursor: pointer; color: #faf9f5;
                }
                label:hover { color: #ffffff; }
            </style>
            
            <div style="padding-bottom: 10px; border-bottom: 1px solid #2a2f36; margin-bottom: 10px;">
                <strong style="font-size: 14px;">Khan Tools</strong>
            </div>
            
            <label>
                <input type="checkbox" id="videoSpoof" setting-data="features.videoSpoof" ${window.features.videoSpoof ? 'checked' : ''}>
                🎥 Video Spoof
            </label>
            
            <label>
                <input type="checkbox" id="questionSpoof" setting-data="features.questionSpoof" ${window.features.questionSpoof ? 'checked' : ''}>
                ❓ Question Spoof  
            </label>
            
            <label>
                <input type="checkbox" id="darkMode" setting-data="features.darkMode" ${window.features.darkMode ? 'checked' : ''}>
                🌙 Dark Mode
            </label>
            
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #2a2f36; font-size: 10px; color: #999;">
                v2.2 - Bugs Corrigidos
            </div>
        `;
        
        watermark.appendChild(dropdownMenu);
        document.body.appendChild(watermark);
        
        // Event listeners
        watermark.addEventListener('mouseenter', () => { 
            dropdownMenu.style.display = 'flex'; 
        });
        
        watermark.addEventListener('mouseleave', e => { 
            if (!watermark.contains(e.relatedTarget)) {
                dropdownMenu.style.display = 'none'; 
            }
        });
        
        // Handle checkboxes
        function handleInput(ids, callback = null) {
            (Array.isArray(ids) ? ids.map(id => document.getElementById(id)) : [document.getElementById(ids)])
            .forEach(element => {
                if (!element) return;
                const setting = element.getAttribute('setting-data');
                
                element.addEventListener('change', (e) => {
                    const value = e.target.checked;
                    setFeatureByPath(setting, value);
                    
                    if (callback) callback(value, e);
                    
                    const featureName = setting.split('.')[1];
                    const displayName = featureName === 'videoSpoof' ? 'Video Spoof' :
                                      featureName === 'questionSpoof' ? 'Question Spoof' : 'Dark Mode';
                    const status = value ? 'ativado' : 'desativado';
                    showToast(`${displayName} ${status}!`);
                });
            });
        }
        
        handleInput(['videoSpoof', 'questionSpoof']);
        handleInput('darkMode', (checked) => toggleDarkMode(checked));
    }
    
    // ============= INICIALIZAÇÃO =============
    // Aguarda um pouco para garantir que a página esteja carregada
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createInterface);
    } else {
        setTimeout(createInterface, 100);
    }
    
    showToast('✅ Khan Tools carregado! (v2.2 - Correções)', 3000);
    logger.log('Khan Tools inicializado com sucesso - Versão corrigida');
    
})();