/**
 * Khan Tools - Utilitários
 * Funções auxiliares e configurações globais
 */

window.KhanTools = window.KhanTools || {};

// Configurações globais
window.KhanTools.config = {
    features: {
        videoSpoof: true,
        questionSpoof: true,
        darkMode: false
    },
    version: '2.0',
    name: 'Khan Tools'
};

// Estado global
window.KhanTools.state = {
    processedVideos: new Set(),
    darkModeEnabled: false,
    initialized: false
};

// Sistema de logging
window.KhanTools.logger = {
    log: (msg) => console.log(`[KhanTools] ${msg}`),
    warn: (msg) => console.warn(`[KhanTools] ${msg}`),
    error: (msg) => console.error(`[KhanTools] ${msg}`)
};

// Sistema de notificações toast
window.KhanTools.showToast = function(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; background: #1a1a1a;
        color: #00d4aa; padding: 12px 16px; border-radius: 8px; z-index: 10002;
        font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px;
        box-shadow: 0 4px 16px rgba(0, 212, 170, 0.3);
        border: 1px solid #00d4aa; animation: slideIn 0.3s ease;
    `;
    
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
    window.KhanTools.logger.log(message);
};

// Utilitário para carregar scripts externos
window.KhanTools.loadScript = function(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// Utilitário para delay
window.KhanTools.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};