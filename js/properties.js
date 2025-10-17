// js/properties.js - Sistema con paginación para mejor performance
console.log('✅ properties.js cargado - con paginación');

// Variables globales
let allProperties = [];
let filteredProperties = [];
let currentFilters = {
    city: '',
    zone: '',
    rooms: '',
    bathrooms: '',
    parking: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: ''
};
let sortBy = 'random';
const WHATSAPP_NUMBER = "573168350472";
const ITEMS_PER_PAGE = 21; // Número de ítems a mostrar por página
let currentPage = 1;
let totalFilteredItems = 0;

// Cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando sistema con paginación');
    loadProperties();
    setupEventListeners();
});

// Cargar datos del JSON
async function loadProperties() {
    try {
        console.log('📂 Cargando datos de propiedades...');
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        allProperties = await response.json();
        console.log(`✅ ${allProperties.length} propiedades cargadas`);
        
        // Mostrar contador total inicial
        updateTotalCounter(allProperties.length);
        
        initializeFilters();
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error cargando propiedades:', error);
        showErrorMessage();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Filtros
    document.getElementById('filter-city').addEventListener('change', function() {
        updateZoneFilter();
        applyFilters();
    });
    document.getElementById('filter-zone').addEventListener('change', applyFilters);
    document.getElementById('filter-rooms').addEventListener('change', applyFilters);
    document.getElementById('filter-bathrooms').addEventListener('change', applyFilters);
    document.getElementById('filter-parking').addEventListener('change', applyFilters);
    document.getElementById('filter-min-price').addEventListener('input', applyFilters);
    document.getElementById('filter-max-price').addEventListener('input', applyFilters);
    document.getElementById('filter-min-area').addEventListener('input', applyFilters);
    document.getElementById('filter-max-area').addEventListener('input', applyFilters);
    
    // Ordenamiento
    document.getElementById('sort-by').addEventListener('change', function() {
        sortBy = this.value;
        applyFilters();
    });
    
    // Botón reset
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // Botón cargar más
    document.getElementById('load-more').addEventListener('click', loadMoreProperties);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('property-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
}

// Actualizar contador total
function updateTotalCounter(total) {
    const totalCounter = document.getElementById('total-counter');
    if (totalCounter) {
        totalCounter.textContent = `${total} Inmuebles Disponibles`;
    }
}

// Actualizar filtro de zonas
function updateZoneFilter() {
    const city = document.getElementById('filter-city').value;
    const zoneSelect = document.getElementById('filter-zone');
    
    zoneSelect.innerHTML = '<option value="">Todas</option>';
    
    if (city) {
        const zones = [...new Set(
            allProperties
                .filter(p => p.ciudad === city && p.zona_grande)
                .map(p => p.zona_grande)
        )].sort();
        
        zones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone;
            option.textContent = zone;
            zoneSelect.appendChild(option);
        });
    } else {
        const allZones = [...new Set(allProperties.map(p => p.zona_grande).filter(Boolean))].sort();
        allZones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone;
            option.textContent = zone;
            zoneSelect.appendChild(option);
        });
    }
}

// Inicializar opciones de filtros
function initializeFilters() {
    const cities = [...new Set(allProperties.map(p => p.ciudad).filter(Boolean))].sort();
    const citySelect = document.getElementById('filter-city');
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
    
    updateZoneFilter();
    
    // Calcular rangos
    const prices = allProperties.map(p => parseInt(p.precio_venta) || 0).filter(p => p > 0);
    const areas = allProperties.map(p => parseInt(p.area) || 0).filter(a => a > 0);
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minArea = Math.min(...areas);
    const maxArea = Math.max(...areas);
    
    document.getElementById('filter-min-price').placeholder = `Mín: ${formatCurrency(minPrice)}`;
    document.getElementById('filter-max-price').placeholder = `Máx: ${formatCurrency(maxPrice)}`;
    document.getElementById('filter-min-area').placeholder = `Mín: ${minArea}m²`;
    document.getElementById('filter-max-area').placeholder = `Máx: ${maxArea}m²`;
}

// Aplicar filtros
function applyFilters() {
    currentFilters.city = document.getElementById('filter-city').value;
    currentFilters.zone = document.getElementById('filter-zone').value;
    currentFilters.rooms = document.getElementById('filter-rooms').value;
    currentFilters.bathrooms = document.getElementById('filter-bathrooms').value;
    currentFilters.parking = document.getElementById('filter-parking').value;
    currentFilters.minPrice = document.getElementById('filter-min-price').value;
    currentFilters.maxPrice = document.getElementById('filter-max-price').value;
    currentFilters.minArea = document.getElementById('filter-min-area').value;
    currentFilters.maxArea = document.getElementById('filter-max-area').value;
    
    console.log('🔍 Aplicando filtros...');
    
    // Filtrar propiedades
    filteredProperties = allProperties.filter(property => {
        if (currentFilters.city && property.ciudad !== currentFilters.city) return false;
        if (currentFilters.zone && property.zona_grande !== currentFilters.zone) return false;
        
        if (currentFilters.rooms) {
            const rooms = parseInt(property.num_habitaciones) || 0;
            const filterRooms = parseInt(currentFilters.rooms);
            if (filterRooms >= 4 && rooms < filterRooms) return false;
            if (filterRooms < 4 && rooms !== filterRooms) return false;
        }
        
        if (currentFilters.bathrooms) {
            const bathrooms = parseInt(property.banos) || 0;
            const filterBathrooms = parseInt(currentFilters.bathrooms);
            if (filterBathrooms >= 3 && bathrooms < filterBathrooms) return false;
            if (filterBathrooms < 3 && bathrooms !== filterBathrooms) return false;
        }
        
        if (currentFilters.parking) {
            const parking = parseInt(property.garajes) || 0;
            const filterParking = parseInt(currentFilters.parking);
            if (filterParking >= 2 && parking < filterParking) return false;
            if (filterParking < 2 && parking !== filterParking) return false;
        }
        
        const price = parseInt(property.precio_venta) || 0;
        if (currentFilters.minPrice && price < parseInt(currentFilters.minPrice)) return false;
        if (currentFilters.maxPrice && price > parseInt(currentFilters.maxPrice)) return false;
        
        const area = parseInt(property.area) || 0;
        if (currentFilters.minArea && area < parseInt(currentFilters.minArea)) return false;
        if (currentFilters.maxArea && area > parseInt(currentFilters.maxArea)) return false;
        
        return true;
    });
    
    // Actualizar opciones dinámicas
    updateDynamicFilterOptions();
    
    // Aplicar ordenamiento
    sortProperties();
    
    // Reiniciar paginación
    currentPage = 1;
    totalFilteredItems = filteredProperties.length;
    
    console.log(`📊 ${totalFilteredItems} propiedades encontradas después de filtrar`);
    renderProperties();
    updateResultsCounter();
}

// Actualizar opciones de filtros dinámicamente
function updateDynamicFilterOptions() {
    const currentData = filteredProperties.length > 0 ? filteredProperties : allProperties;
    updateSelectOptions('filter-rooms', getUniqueValues(currentData, 'num_habitaciones'), 'Todas');
    updateSelectOptions('filter-bathrooms', getUniqueValues(currentData, 'banos'), 'Todas');
    updateSelectOptions('filter-parking', getUniqueValues(currentData, 'garajes'), 'Todas');
}

function getUniqueValues(data, field) {
    return [...new Set(data.map(p => parseInt(p[field]) || 0).filter(v => v > 0))].sort((a, b) => a - b);
}

function updateSelectOptions(selectId, values, defaultText) {
    const select = document.getElementById(selectId);
    const currentValue = select.value;
    
    select.innerHTML = `<option value="">${defaultText}</option>`;
    
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        
        if (selectId === 'filter-rooms' && value >= 4) {
            option.textContent = `${value}+ habitaciones`;
        } else if (selectId === 'filter-bathrooms' && value >= 3) {
            option.textContent = `${value}+ baños`;
        } else if (selectId === 'filter-parking' && value >= 2) {
            option.textContent = `${value}+ parqueaderos`;
        } else {
            option.textContent = `${value} ${selectId === 'filter-rooms' ? 'habitación' : selectId === 'filter-bathrooms' ? 'baño' : 'parqueadero'}${value > 1 ? 'es' : ''}`;
        }
        
        select.appendChild(option);
    });
    
    if (values.includes(parseInt(currentValue))) {
        select.value = currentValue;
    }
}

// Ordenar propiedades
function sortProperties() {
    switch(sortBy) {
        case 'price_asc':
            filteredProperties.sort((a, b) => (parseInt(a.precio_venta) || 0) - (parseInt(b.precio_venta) || 0));
            break;
        case 'price_desc':
            filteredProperties.sort((a, b) => (parseInt(b.precio_venta) || 0) - (parseInt(a.precio_venta) || 0));
            break;
        case 'area_asc':
            filteredProperties.sort((a, b) => (parseInt(a.area) || 0) - (parseInt(b.area) || 0));
            break;
        case 'area_desc':
            filteredProperties.sort((a, b) => (parseInt(b.area) || 0) - (parseInt(a.area) || 0));
            break;
        case 'rooms_desc':
            filteredProperties.sort((a, b) => (parseInt(b.num_habitaciones) || 0) - (parseInt(a.num_habitaciones) || 0));
            break;
        case 'random':
            filteredProperties = filteredProperties.sort(() => Math.random() - 0.5);
            break;
    }
}

// Actualizar contador de resultados
function updateResultsCounter() {
    const counter = document.getElementById('results-counter');
    if (counter) {
        const displayedCount = Math.min(currentPage * ITEMS_PER_PAGE, totalFilteredItems);
        counter.textContent = `${displayedCount} de ${totalFilteredItems} inmuebles`;
    }
}

// Reiniciar filtros
function resetFilters() {
    console.log('🔄 Reiniciando filtros');
    
    document.getElementById('filter-city').value = '';
    document.getElementById('filter-rooms').value = '';
    document.getElementById('filter-bathrooms').value = '';
    document.getElementById('filter-parking').value = '';
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    document.getElementById('filter-min-area').value = '';
    document.getElementById('filter-max-area').value = '';
    document.getElementById('sort-by').value = 'random';
    
    sortBy = 'random';
    updateZoneFilter();
    applyFilters();
}

// Renderizar propiedades (solo las de la página actual)
function renderProperties() {
    const grid = document.getElementById('properties-grid');
    const loadMoreBtn = document.getElementById('load-more');
    
    // Calcular qué propiedades mostrar
    const startIndex = 0;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalFilteredItems);
    const propertiesToShow = filteredProperties.slice(startIndex, endIndex);
    
    if (propertiesToShow.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <h3>🔍 No se encontraron propiedades</h3>
                <p>Intenta con otros filtros o <a href="javascript:void(0)" onclick="resetFilters()">reinicia los filtros</a></p>
            </div>
        `;
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    grid.innerHTML = propertiesToShow.map(property => createPropertyCard(property)).join('');
    
    // Mostrar/ocultar botón "Cargar más"
    if (endIndex < totalFilteredItems) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.innerHTML = `Cargar más (${Math.min(ITEMS_PER_PAGE, totalFilteredItems - endIndex)} más)`;
    } else {
        loadMoreBtn.style.display = 'none';
    }
    
    // Inicializar eventos para los tours
    initializeTourEvents();
    
    console.log(`🎨 Mostrando ${propertiesToShow.length} de ${totalFilteredItems} propiedades`);
}

// Cargar más propiedades
function loadMoreProperties() {
    currentPage++;
    renderProperties();
    updateResultsCounter();
    
    // Scroll suave hacia el final de las propiedades cargadas
    setTimeout(() => {
        const grid = document.getElementById('properties-grid');
        grid.lastElementChild.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }, 100);
}

// El resto de las funciones se mantienen igual (createPropertyCard, formatCurrency, openModal, etc.)
// ... [Mantén todas las demás funciones igual que antes]

// Crear tarjeta de propiedad (función igual)
function createPropertyCard(property) {
    const hasDiscount = property.precio_anterior && property.precio_anterior > property.precio_venta;
    
    return `
        <div class="property-card" data-id="${property.nid}">
            <div class="property-image" onclick="openModal(${property.nid})">
                ${property.url_360 ? `
                    <div class="tour-container">
                        <iframe 
                            src="${property.url_360}" 
                            frameborder="0" 
                            allowfullscreen
                            class="tour-iframe"
                            loading="lazy"
                            title="Tour 360° de ${property.conjunto}"
                            onload="hideTourLoading(this)"
                        ></iframe>
                        <div class="tour-loading">Cargando tour 360°...</div>
                    </div>
                ` : '<div class="no-image">🏠 Imagen no disponible</div>'}
                
                <div class="tour-badge">🔄 Recorrido 360°</div>
            </div>
            
            <div class="property-info">
                <div class="property-location">${property.ciudad || 'Ciudad'}</div>
                
                <div class="property-pricing">
                    <span class="current-price">${formatCurrency(property.precio_venta)}</span>
                    ${hasDiscount ? `
                        <span class="original-price">${formatCurrency(property.precio_anterior)}</span>
                    ` : ''}
                </div>
                
                <h3 class="property-title">${property.conjunto || 'Sin nombre'}</h3>
                <p class="property-address">${property.barrio || ''}${property.direccion ? ', ' + property.direccion : ''}</p>
                
                <div class="property-features">
                    <span>${property.area || '0'}m²</span> •
                    <span>${property.num_habitaciones || '0'} Hab.</span> •
                    <span>${property.banos || '0'} Baños</span> •
                    <span>${property.garajes || '0'} Parq.</span>
                    ${property.num_piso ? ` • <span>Piso ${property.num_piso}</span>` : ''}
                </div>
                
                <div class="property-actions">
                    <button class="btn-view-more" onclick="openModal(${property.nid})">Ver Más</button>
                    <button class="btn-contact" onclick="contactAboutProperty(${property.nid})">Contactar</button>
                </div>
            </div>
        </div>
    `;
}

// Ocultar loading del tour
function hideTourLoading(iframe) {
    const container = iframe.closest('.tour-container');
    const loading = container.querySelector('.tour-loading');
    
    setTimeout(() => {
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }, 3000);
}

// Inicializar eventos para tours
function initializeTourEvents() {
    document.querySelectorAll('.tour-iframe').forEach(iframe => {
        iframe.addEventListener('click', function(e) {
            e.stopPropagation();
            const src = this.src.split('#')[0];
            window.open(src, '_blank');
        });
    });
}

// Formatear moneda en COP
function formatCurrency(amount) {
    if (!amount) return '$ 0';
    return '$ ' + parseInt(amount).toLocaleString('es-CO');
}

// Abrir modal de detalles
function openModal(propertyId) {
    const property = allProperties.find(p => p.nid == propertyId);
    if (!property) return;
    
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = createModalContent(property);
    
    document.getElementById('property-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Crear contenido del modal
function createModalContent(property) {
    const hasDiscount = property.precio_anterior && property.precio_anterior > property.precio_venta;
    
    return `
        <div class="modal-property">
            <div class="modal-tour">
                ${property.url_360 ? `
                    <div class="modal-tour-container">
                        <div class="tour-actions">
                            <button class="btn-open-tour" onclick="window.open('${property.url_360.split('#')[0]}', '_blank')">
                                🔄 Abrir Tour 360° en Nueva Ventana
                            </button>
                        </div>
                        <iframe 
                            src="${property.url_360}" 
                            frameborder="0" 
                            allowfullscreen
                            class="modal-tour-iframe"
                            title="Tour 360° completo de ${property.conjunto}"
                            onload="hideTourLoading(this)"
                        ></iframe>
                        <div class="tour-loading">Cargando tour 360°...</div>
                    </div>
                ` : '<div class="no-image-large">🏠 Tour 360° no disponible</div>'}
            </div>
            
            <div class="modal-details">
                <h2>${property.titulo || property.conjunto || 'Propiedad'}</h2>
                
                <div class="modal-pricing">
                    <span class="modal-current-price">${formatCurrency(property.precio_venta)}</span>
                    ${hasDiscount ? `
                        <span class="modal-original-price">${formatCurrency(property.precio_anterior)}</span>
                    ` : ''}
                </div>
                
                <div class="modal-location">
                    <p><strong>📍 Ubicación:</strong> ${property.direccion || ''}, ${property.barrio || ''}, ${property.ciudad || ''}</p>
                    ${property.zona_grande ? `<p><strong>🗺️ Zona:</strong> ${property.zona_grande}</p>` : ''}
                </div>
                
                <div class="modal-features">
                    <h3>📊 Características</h3>
                    <div class="features-grid">
                        <div class="feature"><span>Área:</span> <strong>${property.area || '0'} m²</strong></div>
                        <div class="feature"><span>Habitaciones:</span> <strong>${property.num_habitaciones || '0'}</strong></div>
                        <div class="feature"><span>Baños:</span> <strong>${property.banos || '0'}</strong></div>
                        <div class="feature"><span>Parqueaderos:</span> <strong>${property.garajes || '0'}</strong></div>
                        ${property.num_piso ? `<div class="feature"><span>Piso:</span> <strong>${property.num_piso}</strong></div>` : ''}
                        ${property.estrato ? `<div class="feature"><span>Estrato:</span> <strong>${property.estrato}</strong></div>` : ''}
                        ${property.anos_antiguedad ? `<div class="feature"><span>Antigüedad:</span> <strong>${property.anos_antiguedad} años</strong></div>` : ''}
                        ${property.tiene_ascensor ? `<div class="feature"><span>Ascensor:</span> <strong>Sí ${property.num_ascensores ? '(' + property.num_ascensores + ')' : ''}</strong></div>` : ''}
                        ${property.costo_administracion ? `<div class="feature"><span>Administración:</span> <strong>${formatCurrency(property.costo_administracion)}</strong></div>` : ''}
                    </div>
                </div>
                
                ${property.descripcion ? `
                <div class="modal-description">
                    <h3>📝 Descripción</h3>
                    <p>${property.descripcion}</p>
                </div>
                ` : ''}
                
                <div class="modal-actions">
                    <button class="btn-contact-large" onclick="contactAboutProperty(${property.nid})">
                        📞 Contactar sobre esta propiedad
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Contactar sobre propiedad
function contactAboutProperty(propertyId) {
    const property = allProperties.find(p => p.nid == propertyId);
    if (!property) return;
    
    const message = `Hola, estoy interesado en la propiedad: ${property.conjunto} - ${property.ciudad}. Precio: ${formatCurrency(property.precio_venta)}`;
    
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

// Cerrar modal
function closeModal() {
    document.getElementById('property-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Mostrar mensaje de error
function showErrorMessage() {
    const grid = document.getElementById('properties-grid');
    grid.innerHTML = `
        <div class="error-message">
            <h3>⚠️ Error al cargar las propiedades</h3>
            <p>No se pudieron cargar los datos. Por favor intenta más tarde.</p>
            <button onclick="loadProperties()" class="retry-btn">Reintentar</button>
        </div>
    `;
}

// Cerrar con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

