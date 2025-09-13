/**
 * Khan Tools - Styles
 * Estilos CSS para a interface
 */

window.KhanTools = window.KhanTools || {};

window.KhanTools.Styles = {
    
    getWatermarkStyles() {
        return {
            position: 'fixed',
            top: '10px',
            left: 'calc(100% - 180px)',
            width: '160px',
            height: '35px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '16px',
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '12px',
            zIndex: '10001',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        };
    },
    
    getDropdownStyles() {
        return {
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '200px',
            background: 'rgba(0, 0, 0, 0.95)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '13px',
            fontFamily: '"Segoe UI", system-ui, sans-serif',
            display: 'none',
            flexDirection: 'column',
            zIndex: '10000',
            padding: '12px',
            cursor: 'default',
            userSelect: 'none',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            marginTop: '5px'
        };
    },
    
    getDropdownCSS() {
        return `
            <style>
                .khantools-feature-item {
                    display: flex;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.2s ease;
                }
                .khantools-feature-item:hover {
                    background: rgba(102, 126, 234, 0.2);
                    border-radius: 6px;
                    padding: 8px 6px;
                }
                .khantools-feature-item:last-child {
                    border-bottom: none;
                }
                .khantools-feature-checkbox {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid #667eea;
                    border-radius: 4px;
                    margin-right: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .khantools-feature-checkbox:checked {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-color: #667eea;
                }
                .khantools-feature-checkbox:checked::after {
                    content: '✓';
                    display: block;
                    color: white;
                    font-size: 12px;
                    text-align: center;
                    line-height: 14px;
                }
                .khantools-feature-label {
                    flex: 1;
                    font-weight: 500;
                    color: #e0e0e0;
                    cursor: pointer;
                }
                .khantools-feature-status {
                    font-size: 11px;
                    color: #00d4aa;
                    margin-left: auto;
                }
                
                .khantools-watermark-text {
                    font-weight: bold; 
                    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                
                .khantools-watermark-version {
                    font-size: 10px; 
                    margin-left: 5px; 
                    opacity: 0.8;
                }
            </style>
        `;
    },
    
    applyStylesToElement(element, styles) {
        Object.assign(element.style, styles);
    },
    
    injectCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
};