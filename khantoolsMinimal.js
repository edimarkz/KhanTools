javascript:(function() {
    'use strict';
    
    if (window.KhanToolsLoaded) {
        alert('Khan Tools já está ativo!');
        return;
    }
    
    if (!window.location.hostname.includes('khanacademy.org')) {
        alert('Este script funciona apenas no Khan Academy!');
        return;
    }
    
    window.KhanToolsLoaded = true;
    
    // ============= CONFIGURAÇÕES GLOBAIS (IGUAL KHANWARE) =============
    window.features = {
        videoSpoof: true,
        questionSpoof: true,
        darkMode: false
    };
    
    window.featureConfigs = {};
    
    // Estado global
    let processedVideos = new Set();
    
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
    
    // Função do KhanWare para setar features
    const setFeatureByPath = (path, value) => {
        let obj = window;
        const parts = path.split('.');
        while (parts.length > 1) obj = obj[parts.shift()];
        obj[parts[0]] = value;
    };
    
    // ============= VIDEO SPOOF (BASEADO NO KHANWARE) =============
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
        let body;
        if (input instanceof Request) body = await input.clone().text();
        else if (init && init.body) body = init.body;
        
        // Video Spoof
        if (features.videoSpoof && body && body.includes('"operationName":"updateUserVideoProgress"')) {
            try {
                let bodyObj = JSON.parse(body);
                if (bodyObj.variables && bodyObj.variables.input) {
                    const durationSeconds = bodyObj.variables.input.durationSeconds;
                    bodyObj.variables.input.secondsWatched = durationSeconds;
                    bodyObj.variables.input.lastSecondWatched = durationSeconds;
                    body = JSON.stringify(bodyObj);
                    if (input instanceof Request) { input = new Request(input, { body: body }); }
                    else init.body = body;
                    showToast("🎥 Vídeo exploitado.", 1000);
                }
            } catch (e) { logger.error(`Erro no VideoSpoof: ${e}`); }
        }
        
        // Question Spoof
        const originalResponse = await originalFetch.apply(this, arguments);
        const clonedResponse = originalResponse.clone();
        
        try {
            const responseBody = await clonedResponse.text();
            let responseObj = JSON.parse(responseBody);
            if (features.questionSpoof && responseObj?.data?.assessmentItem?.item?.itemData) {
                let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);
                if(itemData.question.content[0] === itemData.question.content[0].toUpperCase()){
                    itemData.answerArea = { "calculator": false, "chi2Table": false, "periodicTable": false, "tTable": false, "zTable": false };
                    itemData.question.content = "Qual é a resposta correta? [[☃ radio 1]]";
                    itemData.question.widgets = { 
                        "radio 1": { 
                            type: "radio", 
                            options: { 
                                choices: [ 
                                    { content: "Esta é a resposta correta", correct: true }, 
                                    { content: "Esta é incorreta", correct: false },
                                    { content: "Esta também é incorreta", correct: false }
                                ] 
                            } 
                        } 
                    };
                    responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                    showToast("🔓 Questão exploitada.", 1000);
                    return new Response(JSON.stringify(responseObj), { 
                        status: originalResponse.status, 
                        statusText: originalResponse.statusText, 
                        headers: originalResponse.headers 
                    });
                }
            }
        } catch (e) { logger.error(`Erro no QuestionSpoof: ${e}`); }
        return originalResponse;
    };
    
    // ============= DARK MODE =============
    function toggleDarkMode(enabled) {
        if (enabled) {
            if (!document.getElementById('khan-tools-dark-mode')) {
                const darkStyle = document.createElement('style');
                darkStyle.id = 'khan-tools-dark-mode';
                darkStyle.textContent = `
                    html,body,[data-test-id="page-content-wrapper"]{background-color:#1a1a1a!important;color:#e0e0e0!important;}
                    .header,.nav-bar,[data-test-id="header"]{background-color:#2d2d2d!important;border-color:#404040!important;}
                    .card,.exercise-card,.video-card,[data-test-id="card"]{background-color:#2d2d2d!important;border-color:#404040!important;color:#e0e0e0!important;}
                    input,textarea,select,[data-test-id="input"]{background-color:#404040!important;border-color:#606060!important;color:#e0e0e0!important;}
                    .perseus-widget-container,.perseus-renderer{background-color:#2d2d2d!important;color:#e0e0e0!important;}
                    button,a{color:#00d4aa!important;}
                `;
                document.head.appendChild(darkStyle);
            }
        } else {
            const darkStyle = document.getElementById('khan-tools-dark-mode');
            if (darkStyle) darkStyle.remove();
        }
    }
    
    // ============= INTERFACE (BASEADA NO KHANWARE) =============
    function createInterface() {
        const watermark = document.createElement('div');
        const dropdownMenu = document.createElement('div');
        
        // Watermark (igual KhanWare mas com nossas cores)
        Object.assign(watermark.style, {
            position: 'fixed', top: '0', right: '20px', width: '150px', height: '30px',
            backgroundColor: '#3f505b', color: '#faf9f5', fontSize: '15px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'default', userSelect: 'none', borderRadius: '0 0 10px 10px',
            zIndex: '1001', transition: 'transform 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        });
        
        watermark.textContent = '🛠️ Khan Tools v2.0';
        
        // Dropdown (baseado no KhanWare)
        Object.assign(dropdownMenu.style, {
            position: 'absolute', top: '100%', right: '0', width: '200px',
            backgroundColor: '#384147', borderRadius: '0 0 10px 10px',
            color: '#faf9f5', fontSize: '13px',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            display: 'none', flexDirection: 'column', zIndex: '1000',
            padding: '10px', cursor: 'default', userSelect: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(5px)'
        });
        
        // CSS interno (igual KhanWare)
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
                <input type="checkbox" id="videoSpoof" setting-data="features.videoSpoof" ${features.videoSpoof ? 'checked' : ''}>
                🎥 Video Spoof
            </label>
            
            <label>
                <input type="checkbox" id="questionSpoof" setting-data="features.questionSpoof" ${features.questionSpoof ? 'checked' : ''}>
                ❓ Question Spoof  
            </label>
            
            <label>
                <input type="checkbox" id="darkMode" setting-data="features.darkMode" ${features.darkMode ? 'checked' : ''}>
                🌙 Dark Mode
            </label>
        `;
        
        watermark.appendChild(dropdownMenu);
        document.body.appendChild(watermark);
        
        // Event listeners (igual KhanWare - HOVER!)
        watermark.addEventListener('mouseenter', () => { 
            dropdownMenu.style.display = 'flex'; 
        });
        
        watermark.addEventListener('mouseleave', e => { 
            if (!watermark.contains(e.relatedTarget)) {
                dropdownMenu.style.display = 'none'; 
            }
        });
        
        // Handle checkboxes (baseado no KhanWare)
        function handleInput(ids, callback = null) {
            (Array.isArray(ids) ? ids.map(id => document.getElementById(id)) : [document.getElementById(ids)])
            .forEach(element => {
                if (!element) return;
                const setting = element.getAttribute('setting-data');
                
                element.addEventListener('change', (e) => {
                    const value = e.target.checked;
                    setFeatureByPath(setting, value);
                    
                    if (callback) callback(value, e);
                    
                    // Feedback visual
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
    createInterface();
    showToast('Khan Tools carregado!', 2000);
    logger.log('Khan Tools inicializado com sucesso');
    
})();