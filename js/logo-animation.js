// js/logo-animation.js - Versión corregida
console.log('✅ logo-animation.js cargado correctamente');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM completamente cargado');
    
    const acronym = document.querySelector('.acronym');
    console.log('🔍 Buscando elemento .acronym:', acronym);
    
    if (!acronym) {
        console.error('❌ No se encontró el elemento .acronym');
        return;
    }
    
    console.log('✅ Elemento .acronym encontrado');
    let isExpanded = false;
    let animationInterval = null;

    function expandText() {
        console.log('📖 Expandindo texto: LMO → La Mejor Opción');
        acronym.classList.add('expanded');
        isExpanded = true;
    }

    function contractText() {
        console.log('📘 Contrayendo texto: La Mejor Opción → LMO');
        acronym.classList.remove('expanded');
        isExpanded = false;
    }

    function startAutoAnimation() {
        console.log('🔄 Iniciando animación automática cada 8 segundos');
        
        // Primera expansión después de 3 segundos
        setTimeout(() => {
            if (!isExpanded) {
                expandText();
                setTimeout(contractText, 7000); // Contraer después de 7 segundos
            }
        }, 3000);
        
        // Luego cada 21 segundos
        animationInterval = setInterval(() => {
            if (!isExpanded) {
                expandText();
                setTimeout(contractText, 7000);
            }
        }, 21000);
    }

    // Control de hover
    acronym.addEventListener('mouseenter', function() {
        console.log('🐭 Mouse entró - expandiendo inmediatamente');
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        expandText();
    });

    acronym.addEventListener('mouseleave', function() {
        console.log('🚪 Mouse salió - contrayendo y reanudando en 3 segundos');
        contractText();
        setTimeout(startAutoAnimation, 3000);
    });

    // Iniciar todo
    startAutoAnimation();
    console.log('🎉 Animación del logo INICIADA correctamente');
});