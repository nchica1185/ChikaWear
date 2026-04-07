const selectDepto = document.getElementById("selectDepto");
const selectCiudad = document.getElementById("selectCiudad");
const coberturaGrid = document.getElementById("coberturaGrid");
const shippingWarning = document.getElementById("shippingWarning");
const shippingChoice = document.getElementById("shippingChoice");
const statusEl = document.getElementById("adminStatus");
const listaCarrito = document.getElementById("listaCarrito");
const contador = document.getElementById("contador");
const previewItemsCount = document.getElementById("previewItemsCount");
const previewSubtotal = document.getElementById("previewSubtotal");
const previewShipping = document.getElementById("previewShipping");
const previewTotal = document.getElementById("previewTotal");

function setStatus(message, type = "info") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "status-message";
    if (type) {
        statusEl.classList.add(`status-${type}`);
    }
}

async function cargarTodo() {
    setStatus("Cargando inventario...");
    try {
        const [resP, resO] = await Promise.all([
            fetch(`${API}/productos`),
            fetch(`${API}/pedidos`)
        ]);
        const productos = await resP.json();
        const pedidos = await resO.json();
        renderInventario(productos);
        renderPedidos(pedidos);
        const totalVendido = calcularVentas(pedidos);
        document.getElementById("statVentas").textContent = formatMoney(totalVendido);
        document.getElementById("statPedidos").textContent = pedidos.length;
        document.getElementById("statStock").textContent = productos.length + " Items";
        setStatus("Inventario actualizado. Los cambios están disponibles en la tienda.", "success");
    } catch (error) {
        console.error("Error cargando datos:", error);
        setStatus("No se pudo cargar el inventario, inténtalo de nuevo.", "error");
    }
}

function renderInventario(productos) {
    const lista = document.getElementById("listaProductos");
    if (!lista) return;
    lista.innerHTML = productos.map(p => `<tr>
        <td><img src="${p.imagen}" class="img-tabla" onerror="this.src='https://via.placeholder.com/50'"></td>
        <td>${p.nombre}</td>
        <td>${p.descripcion || '—'}</td>
        <td>$${Number(p.precio).toLocaleString()}</td>
        <td><button onclick="eliminar('${p.id || p._id || ''}')" style="color:red;border:none;background:none;cursor:pointer;font-size:18px">×</button></td>
    </tr>`).join("");
}

function renderPedidos(pedidos) {
    const lista = document.getElementById("listaPedidos");
    if (!lista) return;
    lista.innerHTML = pedidos.slice().reverse().map(ped => {
        const items = Array.isArray(ped.productos)
            ? ped.productos.map(i => i.nombre).join(", ")
            : "Sin productos";
        return `<tr>
            <td><strong>${ped.cliente}</strong></td>
            <td>${ped.direccion || 'Sin dirección'}<br><small>${ped.telefono || ''}</small></td>
            <td>${items}</td>
            <td>
                <button class="btn-print" onclick="imprimirGuia('${ped.cliente}','${ped.direccion}','${ped.telefono}','${items}')">✈️ Guía</button>
                <button onclick="eliminarO('${ped.id || ped._id || ''}')" style="border:none;background:none;cursor:pointer;font-size:18px">✓</button>
            </td>
        </tr>`;
    }).join("");
}

function calcularVentas(pedidos) {
    return pedidos.reduce((total, ped) => {
        if (Array.isArray(ped.productos)) {
            return total + ped.productos.reduce((sum, i) => sum + (Number(i.precio) || 0), 0);
        }
        return total;
    }, 0);
}

function renderCobertura() {
    if (!coberturaGrid) return;
    const highlights = [
        { titulo: "24-48h Colombia", texto: "Despachamos en la ventana más rápida disponible con prioridad en capitales." },
        { titulo: "Empaque premium", texto: "Cajas rígidas, protección antihumedad y sellos de seguridad." },
        { titulo: "Seguimiento real", texto: "Te enviamos la guía y asistimos por WhatsApp hasta la entrega." }
    ];
    coberturaGrid.innerHTML = highlights.map(card => `<article class="cobertura-card">
        <h4>${card.titulo}</h4>
        <p>${card.texto}</p>
    </article>`).join("");
}

function llenarDepartamentos() {
    if (!selectDepto) return;
    selectDepto.innerHTML = "<option value=\"\">Selecciona departamento</option>";
    getShippingList().forEach(item => {
        const option = document.createElement("option");
        option.value = item.departamento;
        option.textContent = item.departamento;
        selectDepto.appendChild(option);
    });
}

function actualizarCiudades(depto) {
    if (!selectCiudad) return;
    selectCiudad.innerHTML = "<option value=\"\">Selecciona ciudad</option>";
    selectCiudad.disabled = true;
    if (!depto) {
        setStatusBaseline();
        setShipping("", "", 0);
        return;
    }
    const datos = getShippingList().find(item => item.departamento === depto);
    if (datos) {
        datos.ciudades.forEach(ciudad => {
            const option = document.createElement("option");
            option.value = ciudad;
            option.textContent = ciudad;
            selectCiudad.appendChild(option);
        });
        selectCiudad.disabled = false;
        setShipping(datos.departamento, "", datos.costo);
        shippingWarning.textContent = `Costo base para ${datos.departamento}: ${formatMoney(datos.costo)}.`;
    }
}

function actualizarCiudad(ciudad) {
    const shipping = getSelectedShipping();
    setShipping(shipping.departamento, ciudad, shipping.cost);
    if (ciudad) {
        shippingChoice.textContent = `${ciudad}, ${shipping.departamento} • ${formatMoney(shipping.cost)}`;
    } else {
        shippingChoice.textContent = "Selecciona un departamento y ciudad para ver el costo final.";
    }
}

function setStatusBaseline() {
    if (!shippingWarning) return;
    shippingWarning.textContent = "Selecciona un departamento y ciudad para mostrar el valor del envío.";
    shippingChoice.textContent = "Selecciona un departamento y ciudad para ver el costo final.";
}

function actualizarCarrito() {
    if (!listaCarrito) return;
    const carritoActual = getCart();
    listaCarrito.innerHTML = carritoActual.map((prod, index) => `<li>
        <div class="item-meta">
            <span class="item-name">${prod.nombre}</span>
            <span class="item-price">${formatMoney(prod.precio)}</span>
        </div>
        <button class="item-remove" onclick="eliminar(${index})" aria-label="Eliminar ${prod.nombre}">×</button>
    </li>`).join("");
    const subtotal = getCartSubtotal();
    const shippingCost = getShippingCost();
    document.getElementById("resSub").textContent = formatMoney(subtotal);
    document.getElementById("resEnv").textContent = formatMoney(shippingCost);
    document.getElementById("total").textContent = formatMoney(subtotal + shippingCost);
    if (contador) contador.textContent = carritoActual.length;
    const shipping = getSelectedShipping();
    if (shipping.departamento && shipping.ciudad) {
        shippingChoice.textContent = `${shipping.ciudad}, ${shipping.departamento} • ${formatMoney(shipping.cost)}`;
    } else {
        shippingChoice.textContent = "Selecciona un departamento y ciudad para ver el costo final.";
    }
}

function refreshCartPreview() {
    if (previewItemsCount) previewItemsCount.textContent = getCartCount();
    if (previewSubtotal) previewSubtotal.textContent = formatMoney(getCartSubtotal());
    if (previewShipping) previewShipping.textContent = formatMoney(getShippingCost());
    if (previewTotal) previewTotal.textContent = formatMoney(getCartTotal());
}

function imprimirGuia(nombre, dir, tel, items) {
    const ventana = window.open('', '', 'width=600,height=400');
    ventana.document.write(`<html><body style="font-family:sans-serif;padding:40px;border:2px dashed #000"><h1 style="text-align:center">CHIKAWEAR - ENVÍO</h1><hr><p><strong>DESTINATARIO:</strong> ${nombre}</p><p><strong>DIRECCIÓN:</strong> ${dir}</p><p><strong>TELÉFONO:</strong> ${tel}</p><p><strong>CONTENIDO:</strong> ${items}</p><div style="margin-top:50px;text-align:center;font-size:12px">Remite: CHIKAWEAR • Armenia, Quindío</div><script>window.print();window.close();<\/script></body></html>`);
}

function toggleCarrito() {
    document.getElementById("carritoPanel").classList.toggle("activo");
}

function toggleLogin() {
    document.getElementById("loginPanel").classList.toggle("activo");
}

const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            document.getElementById('dragArea').textContent = "Imagen seleccionada: " + this.files[0].name;
            document.getElementById('dragArea').style.borderColor = "#34a853";
        }
    });
}

function prepararArchivo() {
    document.getElementById('dragArea').addEventListener('dragover', e => {
        e.preventDefault();
        document.getElementById('dragArea').style.borderColor = '#34a853';
    });
}

async function subirImagen(file) {
    const formData = new FormData();
    formData.append("imagen", file);
    setStatus("Subiendo imagen...", "info");
    const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData
    });
    if (!res.ok) {
        throw new Error("No fue posible almacenar la imagen");
    }
    const data = await res.json();
    return data.imagen;
}

async function agregar() {
    const nombre = document.getElementById("nombre").value.trim();
    const precio = Number(document.getElementById("precio").value);
    const descripcion = document.getElementById("descripcion").value.trim();
    const archivo = fileInput?.files?.[0];
    if (!nombre || !precio || !archivo) {
        alert("Completa todos los campos");
        return;
    }
    try {
        const rutaImagen = await subirImagen(archivo);
        const nuevoProducto = {
            id: Date.now().toString(),
            nombre,
            precio,
            imagen: rutaImagen,
            descripcion
        };
        const res = await fetch(`${API}/productos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoProducto)
        });
        if (!res.ok) {
            throw new Error("No se pudo guardar el producto");
        }
        document.getElementById("nombre").value = "";
        document.getElementById("precio").value = "";
        fileInput.value = "";
        document.getElementById("descripcion").value = "";
        document.getElementById('dragArea').textContent = "Arrastra imagen o haz clic aquí";
        document.getElementById('dragArea').style.borderColor = "#ccc";
        await cargarTodo();
        setStatus("Producto guardado correctamente. Recarga la tienda para verlo en el catálogo.", "success");
    } catch (e) {
        console.error("Error al agregar producto:", e);
        alert("Error al conectar con el servidor");
        setStatus("Error guardando el producto. Inténtalo de nuevo.", "error");
    }
}

function initSeleccionInicial() {
    const shipping = getSelectedShipping();
    if (shipping.departamento) {
        selectDepto.value = shipping.departamento;
        actualizarCiudades(shipping.departamento);
        if (shipping.ciudad) {
            selectCiudad.value = shipping.ciudad;
            actualizarCiudad(shipping.ciudad);
        }
    }
}

function inicializarEventos() {
    if (selectDepto) {
        selectDepto.addEventListener("change", e => actualizarCiudades(e.target.value));
    }
    if (selectCiudad) {
        selectCiudad.addEventListener("change", e => actualizarCiudad(e.target.value));
    }
}

renderCobertura();
llenarDepartamentos();
initSeleccionInicial();
inicializarEventos();

subscribeCart(() => {
    actualizarCarrito();
    refreshCartPreview();
});

cargarTodo();
