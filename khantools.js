javascript:(function(){
    'use strict';
    
    // Verificar se já está rodando
    if (window.KhanTools && window.KhanTools.state.initialized) {
        window.KhanTools.showToast('Khan Tools já está ativo!');
        return;
    }
    
    // URLs dos módulos no GitHub (substitua pelo seu repositório)
    const GITHUB_BASE = 'https://raw.githubusercontent.com/SEU_USUARIO/KhanTools/main/';
    
    const modules = [
        'functions/utils.js',
        'functions/videoSpoof.js', 
        'functions/questionSpoof.js',
        'functions/darkMode.js',
        'visuals/styles.js',
        'visuals/interface.js'
    ];
    
    // Função para carregar um módulo
    async function loadModule(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
            const code = await response.text();
            
            // Executar o código do módulo
            const script = document.createElement('script');
            script.textContent = code;
            document.head.appendChild(script);
            script.remove();
            
            return true;
        } catch (error) {
            console.error(`[KhanTools] Erro ao carregar ${url}:`, error);
            return false;
        }
    }
    
    // Função principal de inicialização
    async function initialize() {
        try {
            // Verificar se estamos na Khan Academy
            if (!window.location.href.includes('khanacademy.org')) {
                alert('Khan Tools funciona apenas na Khan Academy!');
                return;
            }
            
            console.log('[KhanTools] Iniciando carregamento dos módulos...');
            
            // Carregar todos os módulos
            let loadedCount = 0;
            for (const module of modules) {
                const url = GITHUB_BASE + module;
                const success = await loadModule(url);
                if (success) {
                    loadedCount++;
                    console.log(`[KhanTools] ✓ ${module} carregado`);
                } else {
                    console.error(`[KhanTools] ✗ Falha ao carregar ${module}`);
                }
            }
            
            // Verificar se todos os módulos foram carregados
            if (loadedCount !== modules.length) {
                throw new Error(`Apenas ${loadedCount}/${modules.length} módulos foram carregados`);
            }
            
            // Aguardar o KhanTools estar disponível
            if (typeof window.KhanTools === 'undefined') {
                throw new Error('KhanTools não foi inicializado corretamente');
            }
            
            // Inicializar funcionalidades
            console.log('[KhanTools] Inicializando funcionalidades...');
            
            // Inicializar Video Spoof se habilitado
            if (window.KhanTools.config.features.videoSpoof) {
                window.KhanTools.VideoSpoof.init();
            }
            
            // Inicializar Question Spoof se habilitado  
            if (window.KhanTools.config.features.questionSpoof) {
                window.KhanTools.QuestionSpoof.init();
            }
            
            // Aplicar Dark Mode se habilitado
            if (window.KhanTools.config.features.darkMode) {
                window.KhanTools.DarkMode.toggle(true);
            }
            
            // Criar interface
            setTimeout(() => {
                window.KhanTools.Interface.create();
                window.KhanTools.state.initialized = true;
                window.KhanTools.showToast(`Khan Tools v${window.KhanTools.config.version} carregado com sucesso!`);
                console.log(`[KhanTools] ✓ Inicializado com sucesso v${window.KhanTools.config.version}`);
            }, 1000);
            
        } catch (error) {
            console.error('[KhanTools] Erro na inicialização:', error);
            alert(`Erro ao carregar Khan Tools: ${error.message}`);
        }
    }
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initialize, 1500);
        });
    } else {
        setTimeout(initialize, 1500);
    }
    
})();