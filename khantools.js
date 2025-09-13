(function(){
    'use strict';
    
    console.log('🎯 Khan Tools - Teste iniciado');
    
    // Verificar se estamos na Khan Academy
    if (!window.location.href.includes('khanacademy.org')) {
        alert('Khan Tools funciona apenas na Khan Academy!');
        return;
    }
    
    // Criar interface simples de teste
    const watermark = document.createElement('div');
    watermark.style.cssText = `
        position: fixed; top: 10px; right: 20px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white; padding: 10px 15px; border-radius: 8px;
        font-family: Arial, sans-serif; font-size: 14px;
        z-index: 10001; cursor: pointer;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    `;
    watermark.textContent = 'Khan Tools v2.0';
    
    watermark.addEventListener('click', () => {
        alert('Khan Tools funcionando! 🎉');
    });
    
    document.body.appendChild(watermark);
    
    console.log('✅ Khan Tools interface criada');
    
    // Mostrar toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: #1a1a1a; color: #00d4aa;
        padding: 12px 16px; border-radius: 8px;
        font-family: Arial, sans-serif; z-index: 10002;
    `;
    toast.textContent = 'Khan Tools carregado!';
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
    
    console.log('🎉 Khan Tools teste concluído com sucesso!');
    
})();