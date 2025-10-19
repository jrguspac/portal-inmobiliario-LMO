// Bottom Sheet Mobile Navigation
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');
    const bottomSheet = document.getElementById('bottom-sheet');
    const closeBottomSheet = document.getElementById('close-bottom-sheet');
    const bottomSheetLinks = document.querySelectorAll('.bottom-sheet-link');

    // Abrir Bottom Sheet
    function openBottomSheet() {
        bottomSheetOverlay.classList.add('active');
        setTimeout(() => {
            bottomSheet.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    }

    // Cerrar Bottom Sheet
    function closeBottomSheetFunc() {
        bottomSheet.classList.remove('active');
        setTimeout(() => {
            bottomSheetOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }, 300);
    }

    // Event Listeners
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openBottomSheet);
    }

    if (closeBottomSheet) {
        closeBottomSheet.addEventListener('click', closeBottomSheetFunc);
    }

    // Cerrar al hacer clic fuera
    if (bottomSheetOverlay) {
        bottomSheetOverlay.addEventListener('click', function(e) {
            if (e.target === bottomSheetOverlay) {
                closeBottomSheetFunc();
            }
        });
    }

    // Cerrar al seleccionar enlace
    bottomSheetLinks.forEach(link => {
        link.addEventListener('click', closeBottomSheetFunc);
    });

    // Cerrar con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && bottomSheetOverlay.classList.contains('active')) {
            closeBottomSheetFunc();
        }
    });
});