function eliminar(indice){
    removeFromCart(indice);
}

function vaciarCarrito(){
    clearCart();
    resetShipping();
    document.querySelectorAll("#clienteNombre,#clienteTel,#clienteDir").forEach(el=>{
        if(el) el.value = "";
    });
    document.querySelectorAll(".shipping-selectors select").forEach(el=>{
        if(el) el.selectedIndex = 0;
    });
}

function obtenerDatosCliente(){
    return {
        nombre:(document.getElementById("clienteNombre")?.value || "").trim(),
        telefono:(document.getElementById("clienteTel")?.value || "").trim(),
        direccion:(document.getElementById("clienteDir")?.value || "").trim()
    };
}

function formatoMensajeWhatsApp(productos, shipping, cliente){
    let texto = "*NUEVO PEDIDO CHIKAWEAR*";
    texto += "\n\n";
    productos.forEach(item=>{
        texto += `- ${item.nombre} ($${Number(item.precio).toLocaleString()})\n`;
    });
    texto += `\nENVÍO: ${shipping.ciudad}, ${shipping.departamento} - $${Number(shipping.cost).toLocaleString()}`;
    texto += `\nTOTAL: $${Number(getCartTotal()).toLocaleString()}`;
    texto += `\n\nCliente: ${cliente.nombre}`;
    texto += `\nDirección: ${cliente.direccion}`;
    texto += `\nWhatsApp: ${cliente.telefono}`;
    return encodeURIComponent(texto);
}

async function hacerPedido(){
    const carritoActual = getCart();
    if(carritoActual.length === 0) return alert("El carrito está vacío");
    const shipping = getSelectedShipping();
    if(!shipping.departamento || !shipping.ciudad){
        return alert("Selecciona departamento y ciudad para calcular el envío.");
    }
    const cliente = obtenerDatosCliente();
    if(!cliente.nombre || !cliente.telefono || !cliente.direccion){
        alert("Completa los datos de envío");
        return;
    }

    const payload = {
        cliente:cliente.nombre,
        telefono:cliente.telefono,
        direccion:cliente.direccion,
        productos:carritoActual,
        total:getCartTotal(),
        departamento:shipping.departamento,
        ciudad:shipping.ciudad,
        envio:shipping.cost
    };
    try{
        await fetch(`${API}/pedidos`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload)
        });
    }catch(error){
        console.error("No se pudo guardar pedido",error);
    }
    const mensaje = formatoMensajeWhatsApp(carritoActual, shipping, cliente);
    window.open(`https://wa.me/573238459904?text=${mensaje}`);
}

async function iniciarCheckout(){
    const carritoActual = getCart();
    if(carritoActual.length === 0) return alert("El carrito está vacío");
    const shipping = getSelectedShipping();
    if(!shipping.departamento || !shipping.ciudad){
        return alert("Selecciona departamento y ciudad para el envío antes de pagar.");
    }
    const cliente = obtenerDatosCliente();
    if(!cliente.nombre || !cliente.telefono || !cliente.direccion){
        alert("Completa los datos de envío antes de iniciar el pago.");
        return;
    }
    const payload = {
        cliente:cliente.nombre,
        telefono:cliente.telefono,
        direccion:cliente.direccion,
        departamento:shipping.departamento,
        ciudad:shipping.ciudad,
        envio:shipping.cost,
        productos:carritoActual,
        total:getCartTotal()
    };
    try{
        const res = await fetch(`${API}/checkout`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(payload)
        });
        const data = await res.json();
        if(data.url){
            window.open(data.url,"_blank");
        }else{
            alert("No se pudo conectar con la pasarela de pagos.");
        }
    }catch(error){
        console.error("Error iniciando checkout",error);
        alert("No se pudo iniciar el pago en línea.");
    }
}
