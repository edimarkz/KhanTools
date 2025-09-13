/**
 * Khan Tools - Dark Mode
 * Sistema de tema escuro para Khan Academy
 */

window.KhanTools = window.KhanTools || {};

window.KhanTools.DarkMode = {
    
    styleId: 'khantools-dark-mode',
    
    toggle(enabled) {
        window.KhanTools.state.darkModeEnabled = enabled;
        
        if (enabled) {
            this.enable();
        } else {
            this.disable();
        }
    },
    
    enable() {
        if (document.getElementById(this.styleId)) {
            return; // Já habilitado
        }
        
        const darkStyle = document.createElement('style');
        darkStyle.id = this.styleId;
        darkStyle.textContent = this.getDarkModeCSS();
        document.head.appendChild(darkStyle);
        
        window.KhanTools.logger.log('Dark Mode ativado');
    },
    
    disable() {
        const darkStyle = document.getElementById(this.styleId);
        if (darkStyle) {
            darkStyle.remove();
            window.KhanTools.logger.log('Dark Mode desativado');
        }
    },
    
    getDarkModeCSS() {
        return `
            /* Khan Tools Dark Mode Styles */
            body, .page-container { 
                background-color: #1a1a1a !important; 
                color: #e0e0e0 !important; 
            }
            
            /* Headers e Navigation */
            .header, .nav-bar, .navbar { 
                background-color: #2d2d2d !important; 
                border-color: #404040 !important; 
            }
            
            /* Cards e Containers */
            .card, .exercise-card, .video-card, .content-card {
                background-color: #2d2d2d !important;
                border-color: #404040 !important;
                color: #e0e0e0 !important;
            }
            
            /* Inputs e Forms */
            input, textarea, select {
                background-color: #404040 !important;
                border-color: #606060 !important;
                color: #e0e0e0 !important;
            }
            
            /* Botões */
            .btn, button {
                background-color: #404040 !important;
                color: #e0e0e0 !important;
                border-color: #606060 !important;
            }
            
            .btn:hover, button:hover {
                background-color: #505050 !important;
            }
            
            /* Sidebar */
            .sidebar, .drawer {
                background-color: #2d2d2d !important;
                border-color: #404040 !important;
            }
            
            /* Progress bars */
            .progress-bar {
                background-color: #404040 !important;
            }
            
            /* Video player */
            .video-player, .video-container {
                background-color: #1a1a1a !important;
            }
            
            /* Exercise area */
            .exercise-container, .problem-container {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
            }
            
            /* Khan Academy specific */
            [data-test-id], .test-id {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
            }
            
            /* Modals e Overlays */
            .modal, .overlay, .popup {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
            }
            
            /* Text colors */
            p, span, div, h1, h2, h3, h4, h5, h6 {
                color: inherit !important;
            }
            
            /* Links */
            a {
                color: #667eea !important;
            }
            
            a:hover {
                color: #764ba2 !important;
            }
        `;
    }
};