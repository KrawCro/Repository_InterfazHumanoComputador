/* =========================================
   1. CONFIGURACIÓN INICIAL
   ========================================= */
const datosIniciales = [
    { id: 1, titulo: 'Recarga Móvil', precio: 0, stock: 999, categoria: 'recargas', descripcion: 'Recarga personalizada.', imagenes: ['https://cdn-icons-png.flaticon.com/512/2333/2333336.png'] },
    { id: 8, titulo: 'iPhone 15 Pro', precio: 1099, stock: 5, categoria: 'dispositivos', descripcion: '256GB - Titanio Natural.', imagenes: ['https://cdn-icons-png.flaticon.com/512/644/644458.png'] },

    { id: 11, titulo: 'Monedas de Juego', precio: 0, stock: 999, categoria: 'monedas', descripcion: 'Compra paquetes de monedas para tus juegos favoritos.', imagenes: ['https://cdn-icons-png.flaticon.com/512/3135/3135715.png'] },

];

let esAdmin = false;
let usuarioLogueado = null;
let carrito = [];
let productos = JSON.parse(localStorage.getItem('misProductos')) || [];
// Variable para controlar la edición
let idProductoEditando = null; 
// Variable temporal para recargas
let idProductoRecargaTemp = null; 
// Variable temporal para venta de monedas
let idProductoMonedaTemp = null;

if (productos.length === 0) {
    productos = datosIniciales;
    localStorage.setItem('misProductos', JSON.stringify(productos));
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarProductos('todos');
    actualizarContadorCarrito();
    if(typeof iniciarCarrusel === 'function') iniciarCarrusel();
});

/* =========================================
   2. LOGIN Y PANTALLA DIVIDIDA
   ========================================= */
function mostrarLoginModal() { document.getElementById('login-container').style.display = 'flex'; }
function cerrarLoginModal() { document.getElementById('login-container').style.display = 'none'; }

function iniciarSesion() {
    const usuarioInput = document.getElementById('usuarioInput').value.trim();
    const adminPanel = document.getElementById('admin-panel');
    const menuContainer = document.getElementById('userMenuContainer');
    const mainContainer = document.getElementById('mainContainer');
    const heroCarrusel = document.querySelector('.hero-carrusel'); 
    const filtrosSection = document.querySelector('.filtros');

    if (!usuarioInput) { alert("Escribe un usuario"); return; }
    const nombreDisplay = usuarioInput.toUpperCase();

    if (usuarioInput.toLowerCase() === 'admin') {
        esAdmin = true;
        usuarioLogueado = 'ADMIN';
        mainContainer.classList.add('modo-admin-activo');
        adminPanel.style.display = 'block';
        if(heroCarrusel) heroCarrusel.style.display = 'none';
        if(filtrosSection) filtrosSection.style.display = 'none';
        document.querySelector('.site-footer').style.display = 'none'; // Ocultar footer
        alert("Modo Admin: Edición habilitada");
    } else {
        esAdmin = false;
        usuarioLogueado = nombreDisplay;
        mainContainer.classList.remove('modo-admin-activo');
        adminPanel.style.display = 'none';
        if(heroCarrusel) heroCarrusel.style.display = 'block';
        if(filtrosSection) filtrosSection.style.display = 'flex';
        document.querySelector('.site-footer').style.display = 'block';
        alert(`Bienvenido ${nombreDisplay}`);
    }
    
    menuContainer.innerHTML = `
        <button class="btn-header" style="background:#00c6fb; color:#1e272e;">
            <i class="fas fa-user-circle"></i> ${usuarioLogueado}
        </button>
        <div class="dropdown-logout">
            <div class="dropdown-content">
                <button onclick="cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
            </div>
        </div>
    `;
    cerrarLoginModal();
    renderizarProductos('todos'); 
}

function cerrarSesion() { location.reload(); }

/* =========================================
   3. GESTIÓN DE PRODUCTOS (ADMIN - CREAR Y EDITAR)
   ========================================= */

// Función modificada para manejar CREAR y EDITAR
async function agregarProducto() {
    const titulo = document.getElementById('prodTitulo').value;
    const precio = document.getElementById('prodPrecio').value;
    const stock = document.getElementById('prodStock').value;
    const categoria = document.getElementById('prodCategoria').value;
    const desc = document.getElementById('prodDesc').value;
    const inputImagenes = document.getElementById('prodImagenes');

    if (!titulo || !precio) { alert("Faltan datos obligatorios"); return; }

    // Manejo de Imágenes
    let imagenesBase64 = [];
    
    // Si estamos editando y NO subieron imagen nueva, mantenemos la vieja
    if (idProductoEditando !== null && inputImagenes.files.length === 0) {
        const prodExistente = productos.find(p => p.id === idProductoEditando);
        imagenesBase64 = prodExistente.imagenes;
    } else if (inputImagenes.files.length > 0) {
        // Si subieron nuevas, las procesamos
        imagenesBase64 = await Promise.all(Array.from(inputImagenes.files).map(file => convertirImagenABase64(file)));
    } else {
        // Imagen por defecto
        imagenesBase64 = ['https://cdn-icons-png.flaticon.com/512/263/263142.png'];
    }

    const checkboxes = document.querySelectorAll('.pago-check:checked');
    const metodosPago = Array.from(checkboxes).map(cb => cb.value);

    if (idProductoEditando !== null) {
        // --- MODO EDICIÓN ---
        const index = productos.findIndex(p => p.id === idProductoEditando);
        if (index !== -1) {
            productos[index] = {
                ...productos[index], // Mantiene datos viejos que no cambiemos
                titulo, precio: parseFloat(precio), stock: parseInt(stock), categoria, descripcion: desc, pagos: metodosPago, imagenes: imagenesBase64
            };
            alert("✅ Producto Actualizado Correctamente");
        }
        idProductoEditando = null; // Resetear modo edición
        document.getElementById('btnAccionAdmin').innerText = "Guardar Nuevo"; // Volver botón a normal
        document.getElementById('btnAccionAdmin').style.background = "#28a745";
    } else {
        // --- MODO CREACIÓN ---
        const nuevo = {
            id: Date.now(), titulo, precio: parseFloat(precio), stock: parseInt(stock) || 0, categoria, descripcion: desc, pagos: metodosPago, imagenes: imagenesBase64
        };
        productos.push(nuevo);
        alert("✅ Producto Agregado");
    }

    localStorage.setItem('misProductos', JSON.stringify(productos));
    limpiarFormulario();
    renderizarProductos('todos');
}

// Nueva función: Cargar datos en el formulario
function cargarDatosParaEditar(id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    // Llenar inputs
    document.getElementById('prodTitulo').value = prod.titulo;
    document.getElementById('prodPrecio').value = prod.precio;
    document.getElementById('prodStock').value = prod.stock;
    document.getElementById('prodCategoria').value = prod.categoria;
    document.getElementById('prodDesc').value = prod.descripcion;

    // Cambiar estado a "Editando"
    idProductoEditando = id;
    
    // Cambiar visualmente el botón
    const btnGuardar = document.getElementById('btnAccionAdmin');
    if(btnGuardar) {
        btnGuardar.innerText = "🔄 Actualizar Producto";
        btnGuardar.style.background = "#007bff"; // Azul para modo editar
        btnGuardar.style.color = "#fff";
    }
    
    // Scroll hacia arriba para ver el formulario
    document.getElementById('admin-panel').scrollTop = 0;
}

function borrarProducto(id) {
    if(confirm("¿Eliminar?")) {
        productos = productos.filter(p => p.id !== id);
        localStorage.setItem('misProductos', JSON.stringify(productos));
        renderizarProductos('todos');
    }
}

function limpiarFormulario() {
    document.getElementById('prodTitulo').value = '';
    document.getElementById('prodPrecio').value = '';
    document.getElementById('prodStock').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodImagenes').value = '';
    idProductoEditando = null;
    const btn = document.getElementById('btnAccionAdmin');
    if(btn) { btn.innerText = "Guardar"; btn.style.background = "#28a745"; }
}

function convertirImagenABase64(file) {
    return new Promise((r, j) => {
        const reader = new FileReader();
        reader.onload = () => r(reader.result);
        reader.onerror = j;
        reader.readAsDataURL(file);
    });
}

/* =========================================
   4. RENDERIZADO
   ========================================= */
// Resalta el botón de filtro seleccionado y renderiza los productos
function filtrarProductos(cat) {
    const filtros = document.querySelectorAll('.btn-filtro');
    filtros.forEach(f => {
        const catAttr = f.dataset ? f.dataset.cat : null;
        if (catAttr) {
            f.classList.toggle('active', catAttr === cat);
        } else {
            // Fallback: comparar con el onclick si no hay data-cat
            const onclick = f.getAttribute('onclick') || '';
            f.classList.toggle('active', onclick.includes(`'${cat}'`) || onclick.includes(`"${cat}"`));
        }
    });
    renderizarProductos(cat);
}

function renderizarProductos(filtro) {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = '';
    const visibles = filtro === 'todos' ? productos : productos.filter(p => p.categoria === filtro);

    if (visibles.length === 0) { contenedor.innerHTML = '<p>No hay productos</p>'; return; }

    visibles.forEach(p => {
        const img = p.imagenes[0];
        
        // BOTONES DE ACCIÓN (Admin ve Editar/Eliminar, Cliente ve Añadir)
        let botonesHTML = '';
        if (esAdmin) {
            botonesHTML = `
                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button onclick="cargarDatosParaEditar(${p.id})" style="flex:1; background:#007bff; border:none; padding:8px; cursor:pointer; color:white; border-radius:4px;">Editar</button>
                    <button onclick="borrarProducto(${p.id})" style="flex:1; background:#dc3545; border:none; padding:8px; cursor:pointer; color:white; border-radius:4px;">Eliminar</button>
                </div>
            `;
        } else {
            botonesHTML = `<button onclick="verificarYAgregar(${p.id})" style="background:#28a745; color:white; border:none; padding:10px; width:100%; cursor:pointer; margin-top:10px; border-radius:4px;">Añadir al Carrito</button>`;
        }

        const stockInfo = esAdmin ? `<p style="color:red; font-size:0.8em;">Stock: ${p.stock}</p>` : '';

        const card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML = `
            <div class="carrusel"><img src="${img}" style="width:100%; height:150px; object-fit:contain;"></div>
            <h3>${p.titulo}</h3>
            <p class="precio">$${p.precio}</p>
            <div class="descripcion-producto"><p>${p.descripcion || ''}</p></div>
            ${stockInfo}
            ${botonesHTML}
        `;
        contenedor.appendChild(card);
    });
}

/* =========================================
   5. LÓGICA DE CARRITO Y RECARGAS
   ========================================= */

// Paso 1: Verifica si es Recarga o Producto Normal
function verificarYAgregar(id) {
    if (!usuarioLogueado) { alert("Ingresa primero."); mostrarLoginModal(); return; }

    const producto = productos.find(p => p.id === id);
    
    // Si es recarga, abrimos modal de configuración
    if (producto.categoria === 'recargas') {
        idProductoRecargaTemp = id; // Guardamos ID temporalmente
        document.getElementById('modalRecarga').style.display = 'flex';
    } else if (producto.categoria === 'monedas') {
        idProductoMonedaTemp = id;
        document.getElementById('modalMonedas').style.display = 'flex';
    } else {
        // Si es dispositivo, añade directo
        agregarAlCarritoDirecto(producto);
    }
}

// Paso 2: Confirmar Recarga desde el Modal
function confirmarRecarga() {
    const operadora = document.getElementById('recargaOperadora').value;
    const combo = document.getElementById('recargaCombo').value;
    const numero = document.getElementById('recargaNumero').value;

    if (!numero || numero.length < 10) { alert("Ingresa un número de celular válido."); return; }

    const productoBase = productos.find(p => p.id === idProductoRecargaTemp);
    
    // Creamos un producto "personalizado" para el carrito
    const itemPersonalizado = {
        ...productoBase,
        titulo: `Recarga ${operadora} - Combo $${combo}`,
        precio: parseFloat(combo), // El precio es el combo elegido
        descripcion: `Número: ${numero} | Combo: ${combo}`
    };

    agregarAlCarritoDirecto(itemPersonalizado);
    cerrarModalRecarga();
}

function cerrarModalRecarga() {
    document.getElementById('modalRecarga').style.display = 'none';
    document.getElementById('recargaNumero').value = ''; // Limpiar
}

// Función final de añadir al array
function agregarAlCarritoDirecto(item) {
    carrito.push(item);
    actualizarContadorCarrito();
    alert(`¡${item.titulo} añadido!`);
}

// FUNCIONES PARA VENTA DE MONEDAS
function confirmarMoneda() {
    const paquete = document.getElementById('monedaPaquete').value;
    const juego = document.getElementById('monedaJuego').value;
    const usuarioJuego = document.getElementById('monedaUsuario').value.trim();

    if (!usuarioJuego) { alert('Ingresa tu usuario en el juego.'); return; }

    const productoBase = productos.find(p => p.id === idProductoMonedaTemp);
    // Crear título según paquete
    const titulo = `${paquete} Monedas - ${juego}`;
    const precio = parseFloat(document.querySelector(`#monedaPaquete option[value="${paquete}"]`).dataset.precio || paquete);

    const itemPersonalizado = {
        ...productoBase,
        titulo: titulo + ` (Usuario: ${usuarioJuego})`,
        precio: precio,
        descripcion: `Juego: ${juego} | Usuario: ${usuarioJuego}`
    };

    agregarAlCarritoDirecto(itemPersonalizado);
    cerrarModalMonedas();
}

function cerrarModalMonedas() {
    document.getElementById('modalMonedas').style.display = 'none';
    document.getElementById('monedaUsuario').value = '';
}

function actualizarContadorCarrito() { document.getElementById('cartCount').innerText = carrito.length; }
function openCart() { document.getElementById('cartModal').style.display = 'flex'; renderCart(); }
function closeCart() { document.getElementById('cartModal').style.display = 'none'; }

function renderCart() {
    const items = document.getElementById('cartItems');
    const totalDiv = document.getElementById('cartTotal');
    if(carrito.length === 0) { items.innerHTML = '<p>Vacío</p>'; totalDiv.innerHTML=''; return; }
    
    let html = ''; let total = 0;
    carrito.forEach((p, i) => {
        total += p.precio;
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding:5px;">
            <div><strong>${p.titulo}</strong><br><small>${p.descripcion || ''}</small><br><strong>$${p.precio}</strong></div>
            <button onclick="eliminarDelCarrito(${i})" style="color:red; background:none; border:none; cursor:pointer;">X</button>
        </div>`;
    });
    items.innerHTML = html;
    // CAMBIO: El botón Pagar ahora abre el modal de pagos
    totalDiv.innerHTML = `<h3>Total: $${total.toFixed(2)}</h3><button onclick="abrirModalPago()" style="width:100%; padding:10px; background:#007bff; color:white; margin-top:10px; cursor:pointer;">Pagar Ahora</button>`;
}

function eliminarDelCarrito(i) { carrito.splice(i,1); actualizarContadorCarrito(); renderCart(); }

/* =========================================
   6. PROCESO DE PAGO (CHECKOUT)
   ========================================= */
function abrirModalPago() {
    closeCart(); // Cierra carrito
    document.getElementById('modalPago').style.display = 'flex';
}

function cerrarModalPago() {
    document.getElementById('modalPago').style.display = 'none';
}

function cambiarMetodoPago(metodo) {
    // Control visual de pestañas
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(t => t.classList.remove('active'));
    
    if(metodo === 'transferencia') {
        tabs[0].classList.add('active');
        document.getElementById('pagoTransferencia').style.display = 'block';
        document.getElementById('pagoTarjeta').style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        document.getElementById('pagoTransferencia').style.display = 'none';
        document.getElementById('pagoTarjeta').style.display = 'block';
    }
}

function procesarPago(tipo) {
    if (tipo === 'transferencia') {
        const file = document.getElementById('comprobanteFile').value;
        if (!file) { alert("Por favor sube el comprobante."); return; }
    }
    
    // Simulación de proceso
    alert("✅ Pago procesado correctamente. ¡Gracias por tu compra!");
    carrito = [];
    actualizarContadorCarrito();
    cerrarModalPago();
}

/* =========================================
   7. CARRUSEL
   ========================================= */
let slideIndex = 0;
const slides = document.querySelectorAll('.slide');
const barraProgreso = document.getElementById('barraProgreso');
const tiempoSlide = 7000; 
let intervaloCarrusel;

function iniciarCarrusel() {
    const localSlides = document.querySelectorAll('.slide');
    if(localSlides.length === 0) return;
    mostrarSlide(slideIndex);
    animarBarra();
    intervaloCarrusel = setInterval(siguienteSlide, tiempoSlide);
}
function mostrarSlide(n) {
    const localSlides = document.querySelectorAll('.slide');
    localSlides.forEach(s => {
        s.classList.remove('activo');
        s.style.opacity = '0';
        s.style.visibility = 'hidden';
        const v = s.querySelector('video');
        if (v) {
            try { v.pause(); } catch (e) {}
            try { v.currentTime = 0; } catch (e) {}
        }
    });

    if (n >= localSlides.length) slideIndex = 0;
    if (n < 0) slideIndex = localSlides.length - 1;

    const active = localSlides[slideIndex];
    if (!active) return;
    active.classList.add('activo');
    active.style.opacity = '1';
    active.style.visibility = 'visible';

    const vActive = active.querySelector('video');
    if (vActive) {
        try { vActive.play().catch(() => {}); } catch (e) {}
    }
}
function siguienteSlide() { slideIndex++; mostrarSlide(slideIndex); animarBarra(); }
function animarBarra() {
    barraProgreso.style.transition='none'; barraProgreso.style.width='0%';
    setTimeout(() => { barraProgreso.style.transition=`width ${tiempoSlide}ms linear`; barraProgreso.style.width='100%'; }, 50);
}