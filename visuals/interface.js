/**
 * Khan Tools - Interface
 * Interface principal do usuário
 */

window.KhanTools = window.KhanTools || {};

window.KhanTools.Interface = {
    
    elements: {},
    
    create() {
        this.createWatermark();
        this.createDropdown();
        this.bindEvents();
        this.appendToDOM();
    },
    
    createWatermark() {
        this.elements.watermark = document.createElement('div');
        this.elements.watermark.id = 'khantools-watermark';
        
        // Aplicar estilos
        window.KhanTools.Styles.applyStylesToElement(
            this.elements.watermark, 
            window.KhanTools.Styles.getWatermarkStyles()
        );
        
        // Conteúdo HTML
        this.elements.watermark.innerHTML = `
            <span class="khantools-watermark-text">${window.KhanTools.config.name}</span>
            <span class="khantools-watermark-version">v${window.KhanTools.config.version}</span>
        `;
    },
    
    createDropdown() {
        this.elements.dropdown = document.createElement('div');
        this.elements.dropdown.id = 'khantools-dropdown';
        
        // Aplicar estilos
        window.KhanTools.Styles.applyStylesToElement(
            this.elements.dropdown,
            window.KhanTools.Styles.getDropdownStyles()
        );
        
        // Adicionar CSS interno
        this.elements.dropdown.innerHTML = window.KhanTools.Styles.getDropdownCSS();
        
        // Criar features
        this.createFeatureItems();
    },
    
    createFeatureItems() {
        const features = [
            { id: 'videoSpoof', label: 'Video Spoof', enabled: window.KhanTools.config.features.videoSpoof },
            { id: 'questionSpoof', label: 'Question Spoof', enabled: window.KhanTools.config.features.questionSpoof },
            { id: 'darkMode', label: 'Dark Mode', enabled: window.KhanTools.config.features.darkMode }
        ];
        
        features.forEach(feature => {
            const featureDiv = document.createElement('div');
            featureDiv.className = 'khantools-feature-item';
            featureDiv.innerHTML = `
                <input type="checkbox" 
                       class="khantools-feature-checkbox" 
                       id="khantools-${feature.id}" 
                       ${feature.enabled ? 'checked' : ''}>
                <label class="khantools-feature-label" 
                       for="khantools-${feature.id}">${feature.label}</label>
                <span class="khantools-feature-status">${feature.enabled ? 'ON' : 'OFF'}</span>
            `;
            
            this.elements.dropdown.appendChild(featureDiv);
        });
    },
    
    bindEvents() {
        // Eventos do dropdown (toggle features)
        this.elements.dropdown.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.handleFeatureToggle(e.target);
            }
        });
        
        // Eventos do watermark (hover)
        this.elements.watermark.addEventListener('mouseenter', () => {
            this.showDropdown();
        });
        
        this.elements.watermark.addEventListener('mouseleave', (e) => {
            if (!this.elements.watermark.contains(e.relatedTarget)) {
                this.hideDropdown();
            }
        });
        
        this.elements.dropdown.addEventListener('mouseleave', (e) => {
            if (!this.elements.watermark.contains(e.relatedTarget)) {
                this.hideDropdown();
            }
        });
    },
    
    handleFeatureToggle(checkbox) {
        const featureId = checkbox.id.replace('khantools-', '');
        const isEnabled = checkbox.checked;
        
        // Atualizar configuração
        window.KhanTools.config.features[featureId] = isEnabled;
        
        // Atualizar status visual
        const statusSpan = checkbox.parentElement.querySelector('.khantools-feature-status');
        statusSpan.textContent = isEnabled ? 'ON' : 'OFF';
        
        // Executar ações específicas
        this.executeFeatureAction(featureId, isEnabled);
        
        // Mostrar notificação
        window.KhanTools.showToast(`${featureId} ${isEnabled ? 'ativado' : 'desativado'}`);
        window.KhanTools.logger.log(`${featureId} ${isEnabled ? 'enabled' : 'disabled'}`);
    },
    
    executeFeatureAction(featureId, isEnabled) {
        switch (featureId) {
            case 'videoSpoof':
                if (isEnabled) {
                    window.KhanTools.VideoSpoof.init();
                } else {
                    window.KhanTools.VideoSpoof.destroy();
                }
                break;
                
            case 'questionSpoof':
                if (isEnabled) {
                    window.KhanTools.QuestionSpoof.init();
                } else {
                    window.KhanTools.QuestionSpoof.destroy();
                }
                break;
                
            case 'darkMode':
                window.KhanTools.DarkMode.toggle(isEnabled);
                break;
        }
    },
    
    showDropdown() {
        this.elements.dropdown.style.display = 'flex';
        this.elements.watermark.style.transform = 'scale(1.05)';
    },
    
    hideDropdown() {
        this.elements.dropdown.style.display = 'none';
        this.elements.watermark.style.transform = 'scale(1)';
    },
    
    appendToDOM() {
        // Adicionar dropdown ao watermark
        this.elements.watermark.appendChild(this.elements.dropdown);
        
        // Adicionar watermark ao body
        document.body.appendChild(this.elements.watermark);
        
        // Injetar CSS
        window.KhanTools.Styles.injectCSS(window.KhanTools.Styles.getDropdownCSS());
    },
    
    destroy() {
        if (this.elements.watermark) {
            this.elements.watermark.remove();
        }
        window.KhanTools.logger.log('Interface removida');
    }
};