// js/properties.js - Sistema optimizado con paginación, prevalencia y modo compartir
console.log('🚀 properties.js cargado - versión optimizada');

// ========== CONFIGURACIONES Y VARIABLES ==========
const CONFIG = {
    WHATSAPP_NUMBER: "573168350472",
    ITEMS_PER_PAGE: 21,
    FILTER_PRECEDENCE: [
        'filter-city',     // 1. Ciudad
        'filter-zone',     // 2. Zona  
        'filter-rooms',    // 3. Habitaciones
        'filter-bathrooms', // 4. Baños
        'filter-parking'   // 5. Garajes
    ]
};

// Estado de la aplicación
let appState = {
    allProperties: [],
    filteredProperties: [],
    currentPage: 1,
    totalFilteredItems: 0,
    sortBy: 'random',
    isShareMode: false,
    sharePropertyId: null,
    filterSelects: []
};

// ========== FUNCIONES DE UTILIDAD ==========

// Función para obtener parámetros de la URL
function getUrlParameter(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.search);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Formatear moneda en COP
function formatCurrency(amount) {
    if (!amount) return '$ 0';
    return '$ ' + parseInt(amount).toLocaleString('es-CO');
}

// Obtener valores únicos de un campo
function getUniqueValues(data, field) {
    return [...new Set(data.map(p => parseInt(p[field]) || 0).filter(v => v > 0))].sort((a, b) => a - b);
}

// Mostrar mensaje de error
function showErrorMessage(customMessage = null) {
    const grid = document.getElementById('properties-grid');
    grid.innerHTML = `
        <div class="error-message">
            <h3>⚠️ ${customMessage || 'Error al cargar las propiedades'}</h3>
            <p>${customMessage ? 'La propiedad solicitada no está disponible.' : 'No se pudieron cargar los datos. Por favor intenta más tarde.'}</p>
            <button onclick="loadProperties()" class="retry-btn">Reintentar</button>
        </div>
    `;
}

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando aplicación...');
    
    // Verificar si hay modo compartir en la URL
    const shareParam = getUrlParameter('share');
    if (shareParam) {
        appState.sharePropertyId = shareParam;
        appState.isShareMode = true;
        console.log('🔗 Modo compartir activado para propiedad:', shareParam);
    }
    
    // Iniciar aplicación
    initializeApp();
});

function initializeApp() {
    // Inicializar selects
    appState.filterSelects = [
        document.getElementById('filter-city'),
        document.getElementById('filter-zone'),
        document.getElementById('filter-rooms'),
        document.getElementById('filter-bathrooms'),
        document.getElementById('filter-parking')
    ].filter(Boolean);
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar propiedades
    loadProperties();
}

// ========== CARGA DE DATOS ==========

async function loadProperties() {
    try {
        console.log('📂 Cargando datos de propiedades...');
        const response = await fetch('data.json');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        appState.allProperties = await response.json();
        console.log(`✅ ${appState.allProperties.length} propiedades cargadas`);
        
        // Actualizar contador total
        updateTotalCounter(appState.allProperties.length);
        
        // Inicializar filtros
        initializeFilters();
        
        // Decidir qué mostrar basado en el estado
        if (appState.isShareMode && appState.sharePropertyId) {
            activateShareMode(appState.sharePropertyId);
        } else {
            applyFiltersWithPrecedence();
        }
        
    } catch (error) {
        console.error('❌ Error cargando propiedades:', error);
        showErrorMessage();
    }
}

// ========== MODO COMPARTIR ==========

function activateShareMode(propertyId) {
    console.log('🔗 Activando modo compartir para propiedad:', propertyId);
    
    // 1. Encontrar la propiedad específica
    const targetProperty = appState.allProperties.find(p => p.nid == propertyId);
    
    if (!targetProperty) {
        console.log('⚠️ Propiedad no encontrada:', propertyId);
        showErrorMessage(`Propiedad #${propertyId} no encontrada`);
        // Fallback: mostrar todas las propiedades
        appState.filteredProperties = [...appState.allProperties];
        appState.isShareMode = false;
        applyFiltersWithPrecedence();
        return false;
    }
    
    // 2. Mostrar solo esta propiedad
    appState.filteredProperties = [targetProperty];
    appState.totalFilteredItems = 1;
    appState.currentPage = 1;
    
    // 3. Crear y mostrar banner informativo
    createShareModeBanner();
    
    // 4. Deshabilitar filtros
    disableFilters();
    
    // 5. Mostrar la propiedad
    renderProperties();
    updateResultsCounter();
    
    return true;
}

function createShareModeBanner() {
    // Eliminar banner existente si hay
    const existingBanner = document.querySelector('.share-mode-banner');
    if (existingBanner) existingBanner.remove();
    
    const shareBanner = document.createElement('div');
    shareBanner.className = 'share-mode-banner';
    shareBanner.innerHTML = `
        <div class="share-banner-content">
            <span>🔗 Estás viendo una propiedad compartida</span>
            <button id="exit-share-mode" class="btn-exit-share">
                Ver todas las propiedades
            </button>
        </div>
    `;
    
    // Insertar después del header
    const header = document.querySelector('header');
    if (header) {
        header.insertAdjacentElement('afterend', shareBanner);
    }
    
    // Configurar evento para salir del modo
    document.getElementById('exit-share-mode').addEventListener('click', exitShareMode);
}

function exitShareMode() {
    console.log('👋 Saliendo del modo compartir');
    
    // Eliminar banner
    const banner = document.querySelector('.share-mode-banner');
    if (banner) banner.remove();
    
    // Resetear estado
    appState.isShareMode = false;
    appState.sharePropertyId = null;
    appState.filteredProperties = [...appState.allProperties];
    appState.currentPage = 1;
    
    // Habilitar filtros
    enableFilters();
    
    // Limpiar URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Aplicar filtros normales
    applyFiltersWithPrecedence();
}

function disableFilters() {
    appState.filterSelects.forEach(select => {
        if (select) {
            select.disabled = true;
            select.title = "Desactiva el 'Modo compartir' para usar filtros";
        }
    });
    
    // También deshabilitar inputs de precio/área
    ['filter-min-price', 'filter-max-price', 'filter-min-area', 'filter-max-area'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.disabled = true;
    });
    
    // Deshabilitar ordenamiento
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) sortSelect.disabled = true;
}

function enableFilters() {
    appState.filterSelects.forEach(select => {
        if (select) {
            select.disabled = false;
            select.title = '';
        }
    });
    
    // Habilitar inputs de precio/área
    ['filter-min-price', 'filter-max-price', 'filter-min-area', 'filter-max-area'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.disabled = false;
    });
    
    // Habilitar ordenamiento
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) sortSelect.disabled = false;
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
    // Filtros de prevalencia
    const cityFilter = document.getElementById('filter-city');
    if (cityFilter) {
        cityFilter.addEventListener('change', function() {
            updateZoneFilter();
            applyFiltersWithPrecedence();
        });
    }
    
    // Los otros filtros
    ['filter-zone', 'filter-rooms', 'filter-bathrooms', 'filter-parking'].forEach(id => {
        const filter = document.getElementById(id);
        if (filter) {
            filter.addEventListener('change', applyFiltersWithPrecedence);
        }
    });
    
    // Filtros base (precio y área)
    ['filter-min-price', 'filter-max-price', 'filter-min-area', 'filter-max-area'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', applyFiltersWithPrecedence);
        }
    });
    
    // Ordenamiento
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            appState.sortBy = this.value;
            applyFiltersWithPrecedence();
        });
    }
    
    // Botón reset
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    // Botón cargar más (configurado dinámicamente en renderProperties)
    
    // Modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    const modal = document.getElementById('property-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    // Tecla ESC para cerrar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
    
    console.log('✅ Event listeners configurados');
}

// ========== CONTADORES ==========

function updateTotalCounter(total) {
    const totalCounter = document.getElementById('total-counter');
    if (totalCounter) {
        totalCounter.textContent = `${total} Inmuebles Disponibles`;
    }
}

function updateResultsCounter() {
    const counter = document.getElementById('results-counter');
    if (counter) {
        const displayedCount = Math.min(appState.currentPage * CONFIG.ITEMS_PER_PAGE, appState.totalFilteredItems);
        counter.textContent = `${displayedCount} de ${appState.totalFilteredItems} inmuebles`;
    }
}

// ========== FILTROS DINÁMICOS ==========

function updateZoneFilter() {
    const city = document.getElementById('filter-city')?.value || '';
    const zoneSelect = document.getElementById('filter-zone');
    
    if (!zoneSelect) return;
    
    zoneSelect.innerHTML = '<option value="">Todas</option>';
    
    if (city) {
        const zones = [...new Set(
            appState.allProperties
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
        const allZones = [...new Set(appState.allProperties.map(p => p.zona_grande).filter(Boolean))].sort();
        allZones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone;
            option.textContent = zone;
            zoneSelect.appendChild(option);
        });
    }
}

function initializeFilters() {
    const citySelect = document.getElementById('filter-city');
    if (!citySelect) return;
    
    const cities = [...new Set(appState.allProperties.map(p => p.ciudad).filter(Boolean))].sort();
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
    
    updateZoneFilter();
    
    // Calcular rangos
    const prices = appState.allProperties.map(p => parseInt(p.precio_venta) || 0).filter(p => p > 0);
    const areas = appState.allProperties.map(p => parseInt(p.area) || 0).filter(a => a > 0);
    
    if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        document.getElementById('filter-min-price').placeholder = `Mín: ${formatCurrency(minPrice)}`;
        document.getElementById('filter-max-price').placeholder = `Máx: ${formatCurrency(maxPrice)}`;
    }
    
    if (areas.length > 0) {
        const minArea = Math.min(...areas);
        const maxArea = Math.max(...areas);
        document.getElementById('filter-min-area').placeholder = `Mín: ${minArea}m²`;
        document.getElementById('filter-max-area').placeholder = `Máx: ${maxArea}m²`;
    }
    
    // Inicializar opciones dinámicas
    updateDynamicFilterOptions();
}

// ========== SISTEMA DE PREVALENCIA DE FILTROS ==========

function applyFiltersWithPrecedence() {
    // No aplicar filtros si estamos en modo compartir
    if (appState.isShareMode) return;
    
    console.log('🔍 Aplicando filtros con prevalencia...');
    
    const activeFilters = getActiveFilters();
    
    if (activeFilters.length === 0) {
        applyBaseFilters();
        return;
    }
    
    let results = [];
    let appliedFilters = [];
    let ignoredFilters = [];
    
    for (const filterId of CONFIG.FILTER_PRECEDENCE) {
        const filter = activeFilters.find(f => f.id === filterId);
        if (!filter) continue;
        
        const testFilters = [...appliedFilters, filter];
        const testResults = testFilterCombination(testFilters);
        
        if (testResults.length > 0) {
            results = testResults;
            appliedFilters.push(filter);
        } else {
            ignoredFilters.push(filter);
        }
    }
    
    applyFinalFilterResult(results, appliedFilters, ignoredFilters);
}

function getActiveFilters() {
    const filters = [];
    
    const city = document.getElementById('filter-city')?.value || '';
    const zone = document.getElementById('filter-zone')?.value || '';
    const rooms = document.getElementById('filter-rooms')?.value || '';
    const bathrooms = document.getElementById('filter-bathrooms')?.value || '';
    const parking = document.getElementById('filter-parking')?.value || '';
    
    if (city) filters.push({ id: 'filter-city', value: city, name: 'Ciudad', display: city });
    if (zone) filters.push({ id: 'filter-zone', value: zone, name: 'Zona', display: zone });
    if (rooms) filters.push({ 
        id: 'filter-rooms', 
        value: rooms, 
        name: 'Habitaciones', 
        display: rooms === '3' ? '3+' : rooms 
    });
    if (bathrooms) filters.push({ 
        id: 'filter-bathrooms', 
        value: bathrooms, 
        name: 'Baños', 
        display: bathrooms === '3' ? '3+' : bathrooms 
    });
    if (parking) filters.push({ 
        id: 'filter-parking', 
        value: parking, 
        name: 'Garajes', 
        display: parking 
    });
    
    return filters;
}

function testFilterCombination(filters) {
    let results = [...appState.allProperties];
    
    results = applyBasePriceAreaFilters(results);
    
    filters.forEach(filter => {
        results = results.filter(property => {
            switch(filter.id) {
                case 'filter-city':
                    return property.ciudad === filter.value;
                case 'filter-zone':
                    return property.zona_grande === filter.value;
                case 'filter-rooms':
                    const rooms = parseInt(property.num_habitaciones) || 0;
                    const filterRooms = parseInt(filter.value);
                    return filterRooms === 3 ? rooms >= 3 : rooms === filterRooms;
                case 'filter-bathrooms':
                    const bathrooms = parseInt(property.banos) || 0;
                    const filterBathrooms = parseInt(filter.value);
                    return filterBathrooms === 3 ? bathrooms >= 3 : bathrooms === filterBathrooms;
                case 'filter-parking':
                    const parking = parseInt(property.garajes) || 0;
                    const filterParking = parseInt(filter.value);
                    return filterParking >= 2 ? parking >= filterParking : parking === filterParking;
                default:
                    return true;
            }
        });
    });
    
    return results;
}

function applyBasePriceAreaFilters(properties) {
    const minPrice = document.getElementById('filter-min-price')?.value || '';
    const maxPrice = document.getElementById('filter-max-price')?.value || '';
    const minArea = document.getElementById('filter-min-area')?.value || '';
    const maxArea = document.getElementById('filter-max-area')?.value || '';
    
    return properties.filter(property => {
        const price = parseInt(property.precio_venta) || 0;
        const area = parseInt(property.area) || 0;
        
        if (minPrice && price < parseInt(minPrice)) return false;
        if (maxPrice && price > parseInt(maxPrice)) return false;
        if (minArea && area < parseInt(minArea)) return false;
        if (maxArea && area > parseInt(maxArea)) return false;
        
        return true;
    });
}

function applyFinalFilterResult(results, appliedFilters, ignoredFilters) {
    appState.filteredProperties = results;
    
    sortProperties();
    
    appState.currentPage = 1;
    appState.totalFilteredItems = appState.filteredProperties.length;
    
    updateDynamicFilterOptions();
    renderProperties();
    updateResultsCounter();
    
    if (ignoredFilters.length > 0) {
        showPrecedenceMessage(appliedFilters, ignoredFilters);
    } else {
        hidePrecedenceMessage();
    }
}

function applyBaseFilters() {
    // Aplicar solo filtros base (precio, área)
    appState.filteredProperties = applyBasePriceAreaFilters(appState.allProperties);
    
    sortProperties();
    appState.currentPage = 1;
    appState.totalFilteredItems = appState.filteredProperties.length;
    
    // Actualizar opciones dinámicas
    updateDynamicFilterOptions();
    
    renderProperties();
    updateResultsCounter();
    hidePrecedenceMessage();
}

function showPrecedenceMessage(appliedFilters, ignoredFilters) {
    let message = document.getElementById('precedence-message');
    if (!message) {
        message = document.createElement('div');
        message.id = 'precedence-message';
        message.style.cssText = `
            background: #e3f2fd;
            border: 1px solid #90caf9;
            color: #1565c0;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
            font-size: 14px;
        `;
        const propertiesSection = document.querySelector('.properties-section .container');
        if (propertiesSection) {
            const grid = document.getElementById('properties-grid');
            if (grid) {
                propertiesSection.insertBefore(message, grid);
            }
        }
    }
    
    const appliedText = appliedFilters.map(f => 
        `<strong>${f.name}:</strong> ${f.display}`
    ).join(', ');
    
    const ignoredText = ignoredFilters.map(f => 
        `<strong>${f.name}:</strong> ${f.display}`
    ).join(', ');
    
    message.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">💡</span>
            <div>
                <strong>Mostrando resultados para:</strong> ${appliedText}<br>
                <em>No encontramos propiedades que cumplan con: ${ignoredText}</em>
            </div>
            <button onclick="this.parentElement.parentElement.style.display='none'" 
                    style="margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">
                ×
            </button>
        </div>
    `;
    message.style.display = 'block';
}

function hidePrecedenceMessage() {
    const message = document.getElementById('precedence-message');
    if (message) {
        message.style.display = 'none';
    }
}

// ========== FILTROS DINÁMICOS ==========

function updateDynamicFilterOptions() {
    if (appState.isShareMode) return;
    
    const currentData = appState.filteredProperties.length > 0 ? appState.filteredProperties : appState.allProperties;
    updateSelectOptions('filter-rooms', getUniqueValues(currentData, 'num_habitaciones'), 'Todas');
    updateSelectOptions('filter-bathrooms', getUniqueValues(currentData, 'banos'), 'Todas');
    updateSelectOptions('filter-parking', getUniqueValues(currentData, 'garajes'), 'Todas');
}

function updateSelectOptions(selectId, values, defaultText) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    
    select.innerHTML = `<option value="">${defaultText}</option>`;
    
    if (selectId === 'filter-rooms') {
        const roomOptions = [
            { value: '1', text: '1 habitacion', exists: values.includes(1) },
            { value: '2', text: '2 habitaciones', exists: values.includes(2) },
            { value: '3', text: '3+ habitaciones', exists: values.some(v => v >= 3) }
        ];
        
        roomOptions.forEach(optionData => {
            if (optionData.exists) {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                select.appendChild(option);
            }
        });
        
    } else if (selectId === 'filter-bathrooms') {
        const bathroomOptions = [
            { value: '1', text: '1 baño', exists: values.includes(1) },
            { value: '2', text: '2 baños', exists: values.includes(2) },
            { value: '3', text: '3+ baños', exists: values.some(v => v >= 3) }
        ];
        
        bathroomOptions.forEach(optionData => {
            if (optionData.exists) {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                select.appendChild(option);
            }
        });
        
    } else if (selectId === 'filter-parking') {
        const availableValues = values.filter(value => value > 0);
        availableValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            
            if (value >= 2) {
                option.textContent = `${value}+ parqueaderos`;
            } else {
                option.textContent = `${value} ${value === 1 ? 'parqueadero' : 'parqueaderos'}`;
            }
            
            select.appendChild(option);
        });
    }
    
    // Mantener el valor seleccionado si existe y está disponible
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
    } else {
        select.value = '';
    }
}

// ========== ORDENAMIENTO ==========

function sortProperties() {
    switch(appState.sortBy) {
        case 'price_asc':
            appState.filteredProperties.sort((a, b) => (parseInt(a.precio_venta) || 0) - (parseInt(b.precio_venta) || 0));
            break;
        case 'price_desc':
            appState.filteredProperties.sort((a, b) => (parseInt(b.precio_venta) || 0) - (parseInt(a.precio_venta) || 0));
            break;
        case 'area_asc':
            appState.filteredProperties.sort((a, b) => (parseInt(a.area) || 0) - (parseInt(b.area) || 0));
            break;
        case 'area_desc':
            appState.filteredProperties.sort((a, b) => (parseInt(b.area) || 0) - (parseInt(a.area) || 0));
            break;
        case 'rooms_desc':
            appState.filteredProperties.sort((a, b) => (parseInt(b.num_habitaciones) || 0) - (parseInt(a.num_habitaciones) || 0));
            break;
        case 'random':
            appState.filteredProperties = [...appState.filteredProperties].sort(() => Math.random() - 0.5);
            break;
    }
}

// ========== REINICIAR FILTROS ==========

function resetFilters() {
    console.log('🔄 Reiniciando filtros');
    
    // Resetear selects
    appState.filterSelects.forEach(select => {
        if (select) select.value = '';
    });
    
    // Resetear inputs
    ['filter-min-price', 'filter-max-price', 'filter-min-area', 'filter-max-area'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    
    // Resetear ordenamiento
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) sortSelect.value = 'random';
    
    appState.sortBy = 'random';
    appState.currentPage = 1;
    
    updateZoneFilter();
    applyFiltersWithPrecedence();
}

// ========== RENDERIZADO Y PAGINACIÓN ==========

function renderProperties() {
    const grid = document.getElementById('properties-grid');
    const loadMoreBtn = document.getElementById('load-more');
    
    if (!grid) return;
    
    const startIndex = 0;
    const endIndex = Math.min(appState.currentPage * CONFIG.ITEMS_PER_PAGE, appState.totalFilteredItems);
    const propertiesToShow = appState.filteredProperties.slice(startIndex, endIndex);
    
    if (propertiesToShow.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <h3>🔍 No se encontraron propiedades</h3>
                <p>Intenta con otros filtros o <a href="javascript:void(0)" onclick="resetFilters()">reinicia los filtros</a></p>
            </div>
        `;
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }
    
    grid.innerHTML = propertiesToShow.map(property => createPropertyCard(property)).join('');
    
    if (endIndex < appState.totalFilteredItems) {
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'block';
            const remaining = appState.totalFilteredItems - endIndex;
            loadMoreBtn.innerHTML = `Cargar más inmuebles (${Math.min(CONFIG.ITEMS_PER_PAGE, remaining)})...`;
            
            // Re-asignar evento
            loadMoreBtn.onclick = loadMoreProperties;
        }
    } else {
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }
    
    initializeTourEvents();
}

function loadMoreProperties() {
    const scrollPosition = window.pageYOffset;
    
    appState.currentPage++;
    
    const loadMoreContainer = document.querySelector('.load-more-container');
    if (loadMoreContainer) {
        loadMoreContainer.innerHTML = '<div class="loading">Cargando más propiedades...</div>';
    }
    
    setTimeout(() => {
        renderProperties();
        
        if (loadMoreContainer) {
            const remaining = appState.totalFilteredItems - (appState.currentPage * CONFIG.ITEMS_PER_PAGE);
            if (remaining > 0) {
                loadMoreContainer.innerHTML = `
                    <button id="load-more" class="btn-load-more">
                        Cargar más inmuebles (${Math.min(CONFIG.ITEMS_PER_PAGE, remaining)})
                    </button>
                `;
                document.getElementById('load-more').addEventListener('click', loadMoreProperties);
            } else {
                loadMoreContainer.innerHTML = '<div class="no-more">No hay más propiedades para mostrar</div>';
            }
        }
        
        window.scrollTo(0, scrollPosition);
        
    }, 300);
}

// ========== TARJETAS DE PROPIEDAD ==========

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
    if (!container) return;
    
    const loading = container.querySelector('.tour-loading');
    if (loading) {
        setTimeout(() => {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }, 3000);
    }
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

// ========== MODAL DE DETALLES ==========

function openModal(propertyId) {
    const property = appState.allProperties.find(p => p.nid == propertyId);
    if (!property) return;
    
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = createModalContent(property);
    
    // Configurar evento para botón compartir
    const shareBtn = modalContent.querySelector('.btn-share-link');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            const propertyId = this.getAttribute('data-property-id');
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${propertyId}`;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    const originalText = this.textContent;
                    const originalBg = this.style.background;
                    const originalColor = this.style.color;
                    
                    this.textContent = '✅ ¡Enlace copiado!';
                    this.style.background = '#4CAF50';
                    this.style.color = 'white';
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                        this.style.background = originalBg;
                        this.style.color = originalColor;
                    }, 2000);
                }).catch(err => {
                    console.error('Error al copiar:', err);
                    window.open(shareUrl, '_blank');
                });
            } else {
                window.open(shareUrl, '_blank');
            }
        });
    }
    
    document.getElementById('property-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

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
                    <button class="btn-share-link" data-property-id="${property.nid}">
                        🔗 Compartir enlace de esta propiedad
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Contactar sobre propiedad
function contactAboutProperty(propertyId) {
    const property = appState.allProperties.find(p => p.nid == propertyId);
    if (!property) return;
    
    const message = `Hola, estoy interesado en la propiedad: ${property.conjunto} - ${property.ciudad}. Precio: ${formatCurrency(property.precio_venta)}`;
    
    window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('property-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
}

// Hacer funciones disponibles globalmente (para onclick en HTML)
window.openModal = openModal;
window.contactAboutProperty = contactAboutProperty;
window.resetFilters = resetFilters;
window.loadMoreProperties = loadMoreProperties;
window.hideTourLoading = hideTourLoading;
window.closeModal = closeModal;