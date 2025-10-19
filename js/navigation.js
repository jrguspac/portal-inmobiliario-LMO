// js/navigation.js - Navegación y dropdowns para desktop
document.addEventListener('DOMContentLoaded', function() {
    const dropdowns = document.querySelectorAll('.dropdown');
    let dropdownTimeout;
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Abrir al hover
        dropdown.addEventListener('mouseenter', function() {
            clearTimeout(dropdownTimeout);
            menu.style.display = 'block';
        });
        
        // Cerrar con delay para permitir movimiento al submenú
        dropdown.addEventListener('mouseleave', function() {
            dropdownTimeout = setTimeout(() => {
                menu.style.display = 'none';
            }, 200); // 200ms de delay para mover el mouse al submenú
        });
        
        // Mantener abierto si el mouse está en el submenú
        menu.addEventListener('mouseenter', function() {
            clearTimeout(dropdownTimeout);
        });
        
        menu.addEventListener('mouseleave', function() {
            dropdownTimeout = setTimeout(() => {
                menu.style.display = 'none';
            }, 150);
        });
    });
});