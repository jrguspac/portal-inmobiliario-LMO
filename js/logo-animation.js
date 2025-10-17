// js/logo-animation.js - Versión móvil compatible
console.log('✅ logo-animation.js cargado - móvil compatible');

function initLogoAnimation() {
    const acronym = document.querySelector('.acronym');
    
    if (!acronym) {
        console.error('❌ No se encontró el elemento .acronym');
        return;
    }
    
    console.log('✅ Animación LMO activada para todos los dispositivos');
    let isExpanded = false;
    let animationInterval = null;

    function expandText() {
        acronym.classList.add('expanded');
        isExpanded = true;
    }

    function contractText() {
        acronym.classList.remove('expanded');
        isExpanded = false;
    }

    // Animación automática para TODOS los dispositivos
    function startAutoAnimation() {
        console.log('🔄 Animación automática activada cada 10 segundos');
        
        // Primera animación después de 3 segundos
        setTimeout(() => {
            if (!isExpanded) {
                expandText();
                setTimeout(contractText, 3000);
            }
        }, 3000);
        
        // Luego cada 10 segundos
        animationInterval = setInterval(() => {
            if (!isExpanded) {
                expandText();
                setTimeout(contractText, 3000);
            }
        }, 10000);
    }

    // Iniciar la animación automática
    startAutoAnimation();
    
    console.log('🎉 Animación LMO → La Mejor Opción ACTIVADA en móvil');
}

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogoAnimation);
} else {
    initLogoAnimation();
}