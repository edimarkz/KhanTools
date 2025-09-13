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
        autoAnswer: true,
        darkMode: true,
        minuteFarm: true
    };
    
    window.featureConfigs = {};
    
    // ============= UTILITÁRIOS =============
    const logger = {
        log: (msg) => console.log(`[KhanTools] ${msg}`),
        error: (msg) => console.error(`[KhanTools] ${msg}`)
    };
    
    function showToast(message, duration = 2000) {
        // Carrega Toastify se não estiver carregado
        if (typeof Toastify === 'undefined') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css';
            document.head.appendChild(link);
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
            script.onload = () => {
                Toastify({
                    text: message,
                    duration: duration,
                    gravity: "bottom",
                    position: "right",
                    stopOnFocus: true,
                    style: { background: "#000000" }
                }).showToast();
            };
            document.head.appendChild(script);
            return;
        }
        Toastify({
            text: message,
            duration: duration,
            gravity: "bottom",
            position: "right",
            stopOnFocus: true,
            style: { background: "#000000" }
        }).showToast();
    }
    
    const setFeatureByPath = (path, value) => {
        let obj = window;
        const parts = path.split('.');
        while (parts.length > 1) obj = obj[parts.shift()];
        obj[parts[0]] = value;
    };
    
    // ============= SPLASH SCREEN =============
    const splashScreen = document.createElement('div');
    async function showSplashScreen() {
        splashScreen.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background-color:#000;display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;transition:opacity 0.5s ease;user-select:none;color:white;font-family:Arial,sans-serif;font-size:30px;text-align:center;";
        splashScreen.innerHTML = '<span style="color:white;">KHAN</span><span style="color:#72ff72;">TOOLS</span><br><small style="font-size:14px;opacity:0.7;">Versão 1.0 BETA</small>';
        document.body.appendChild(splashScreen);
        setTimeout(() => splashScreen.style.opacity = '1', 10);
    }
    async function hideSplashScreen() {
        splashScreen.style.opacity = '0';
        setTimeout(() => splashScreen.remove(), 500);
    }
    
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // ============= DARK MODE COM DARKREADER =============
    let darkReaderLoaded = false;
    async function loadDarkReader() {
        if (darkReaderLoaded) return;
        try {
            const script = await fetch('https://cdn.jsdelivr.net/npm/darkreader@4.9.92/darkreader.min.js').then(r => r.text());
            eval(script);
            DarkReader.setFetchMethod(window.fetch);
            darkReaderLoaded = true;
        } catch (e) {
            logger.error(`Erro ao carregar DarkReader: ${e}`);
        }
    }
    
    function toggleDarkMode(enabled) {
        if (!darkReaderLoaded) {
            if (enabled) loadDarkReader().then(() => toggleDarkMode(true));
            return;
        }
        if (enabled) {
            DarkReader.enable();
            showToast("🌙 Dark Mode ativado!", 1500);
        } else {
            DarkReader.disable();
            showToast("☀️ Dark Mode desativado!", 1500);
        }
    }
    
    // ============= FETCH INTERCEPT (BASEADO NO KHANWAREMINIMAL) =============
    const originalFetch = window.fetch;
    
    window.fetch = async function(input, init = {}) {
        let body;
        if (input instanceof Request) {
            body = await input.text();
        } else if (init && init.body) {
            body = init.body;
        }
        
        // ===== MINUTE FARM =====
        if (window.features.minuteFarm && body && input.url.includes("mark_conversions")) {
            try {
                if (body.includes("termination_event")) {
                    showToast("🚫 Limitador de tempo bloqueado.", 1000);
                    return originalFetch.apply(this, arguments);
                }
            } catch (e) {
                logger.error(`Erro no MinuteFarm: ${e}`);
            }
        }
        
        // ===== VIDEO SPOOF (GRADUAL, SEM PAUSA) =====
        if (window.features.videoSpoof && body && body.includes('"operationName":"updateUserVideoProgress"')) {
            try {
                let bodyObj = JSON.parse(body);
                if (bodyObj.variables && bodyObj.variables.input) {
                    const durationSeconds = bodyObj.variables.input.durationSeconds;
                    bodyObj.variables.input.secondsWatched = durationSeconds;
                    bodyObj.variables.input.lastSecondWatched = durationSeconds;
                    const newBody = JSON.stringify(bodyObj);
                    if (input instanceof Request) {
                        input = new Request(input, { ...init, body: newBody });
                    } else {
                        init.body = newBody;
                    }
                    showToast("🔓 Vídeo exploitado.", 1000);
                }
            } catch (e) {
                logger.error(`Erro no VideoSpoof: ${e}`);
            }
        }
        
        const originalResponse = await originalFetch.apply(this, arguments);
        const clonedResponse = originalResponse.clone();
        
        // ===== QUESTION SPOOF =====
        if (window.features.questionSpoof) {
            try {
                const responseBody = await clonedResponse.text();
                let responseObj = JSON.parse(responseBody);
                if (responseObj?.data?.assessmentItem?.item?.itemData) {
                    let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);
                    if (itemData.question?.content && Array.isArray(itemData.question.content) && itemData.question.content[0] === itemData.question.content[0].toUpperCase()) {
                        itemData.answerArea = { "calculator": false, "chi2Table": false, "periodicTable": false, "tTable": false, "zTable": false };
                        const phrases = [
                            "🔥 Get good, get KhanTools!",
                            "🤍 Made by User.",
                            "☄️ By KhanTools.",
                            "🌟 Star the project!",
                            "🪶 Lite mode @ KhanToolsMinimal.js",
                        ];
                        itemData.question.content = [phrases[Math.floor(Math.random() * phrases.length)] + ` [[☃ radio 1]]`];
                        itemData.question.widgets = { "radio 1": { type: "radio", options: { choices: [ { content: "Resposta correta.", correct: true }, { content: "Resposta incorreta.", correct: false } ] } } };
                        responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                        showToast("🔓 Questão exploitada.", 1000);
                        return new Response(JSON.stringify(responseObj), { 
                            status: originalResponse.status, 
                            statusText: originalResponse.statusText, 
                            headers: originalResponse.headers 
                        });
                    }
                }
            } catch (e) {
                // Silencioso
            }
        }
        
        return originalResponse;
    };
    
    // ============= AUTO ANSWER =============
    let khanToolsDominates = true;
    const baseSelectors = [
        `[data-testid="choice-icon__library-choice-icon"]`,
        `[data-testid="exercise-check-answer"]`, 
        `[data-testid="exercise-next-question"]`, 
        `._1udzurba`,
        `._awve9b`
    ];
    
    function findAndClickBySelector(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.click();
            if (document.querySelector(selector + "> div") && document.querySelector(selector + "> div").innerText === "Mostrar resumo") {
                showToast("🎉 Exercício concluído!", 3000);
                // Play audio if desired, but omitted for simplicity
            }
        }
    }
    
    if (window.features.autoAnswer) {
        (async () => { 
            while (khanToolsDominates) {
                const selectorsToCheck = [...baseSelectors];
                for (const q of selectorsToCheck) {
                    findAndClickBySelector(q);
                }
                await delay(800);
            }
        })();
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
        
        watermark.textContent = '🛠️ Khan Tools v1.0 BETA';
        
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
                <input type="checkbox" id="autoAnswer" setting-data="features.autoAnswer" ${window.features.autoAnswer ? 'checked' : ''}>
                ⚡ Auto Answer
            </label>
            
            <label>
                <input type="checkbox" id="minuteFarm" setting-data="features.minuteFarm" ${window.features.minuteFarm ? 'checked' : ''}>
                ⏱️ Minute Farm
            </label>
            
            <label>
                <input type="checkbox" id="darkMode" setting-data="features.darkMode" ${window.features.darkMode ? 'checked' : ''}>
                🌙 Dark Mode
            </label>
            
            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #2a2f36; font-size: 10px; color: #999;">
                Versão 1.0 BETA
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
                    const displayName = {
                        videoSpoof: 'Video Spoof',
                        questionSpoof: 'Question Spoof',
                        autoAnswer: 'Auto Answer',
                        minuteFarm: 'Minute Farm',
                        darkMode: 'Dark Mode'
                    }[featureName] || featureName;
                    const status = value ? 'ativado' : 'desativado';
                    showToast(`${displayName} ${status}!`, 1500);
                });
            });
        }
        
        handleInput(['videoSpoof', 'questionSpoof', 'autoAnswer', 'minuteFarm']);
        handleInput('darkMode', (checked) => toggleDarkMode(checked));
    }
    
    // ============= INICIALIZAÇÃO =============
    showSplashScreen();
    
    // Aguarda um pouco para garantir que a página esteja carregada
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                createInterface();
                if (window.features.darkMode) toggleDarkMode(true);
                hideSplashScreen();
                showToast('✅ Khan Tools carregado! (Versão 1.0 BETA)', 3000);
                logger.log('Khan Tools inicializado com sucesso - Versão 1.0 BETA');
            }, 500);
        });
    } else {
        setTimeout(() => {
            createInterface();
            if (window.features.darkMode) toggleDarkMode(true);
            hideSplashScreen();
            showToast('✅ Khan Tools carregado! (Versão 1.0 BETA)', 3000);
            logger.log('Khan Tools inicializado com sucesso - Versão 1.0 BETA');
        }, 100);
    }
    
})();