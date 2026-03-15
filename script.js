/* ======================
DATA DE MUNICIPIOS
====================== */
const municipiosData = {
    quindio: [{n:"ARMENIA",v:0},{n:"CALARCÁ",v:7000},{n:"CIRCASIA",v:7000},{n:"QUIMBAYA",v:9000},{n:"MONTENEGRO",v:9000}],
    antioquia: [{n:"MEDELLÍN",v:12500},{n:"ENVIGADO",v:12500},{n:"RIONEGRO",v:15000}],
    bogota: [{n:"BOGOTÁ D.C.",v:12500},{n:"CHÍA",v:14500},{n:"SOACHA",v:14500}],
    valle: [{n:"CALI",v:12500},{n:"PALMIRA",v:13500},{n:"TULUÁ",v:13500}],
    costa: [{n:"BARRANQUILLA",v:18500},{n:"CARTAGENA",v:18500},{n:"SANTA MARTA",v:18500}],
    nacional: [{n:"IBAGUÉ",v:16000},{n:"NEIVA",v:16000},{n:"VILLAVICENCIO",v:16000},{n:"PASTO",v:18000}]
};

function cargarMunicipios() {
    const depto = document.getElementById("selectDepto").value;
    const ciudadSelect = document.getElementById("ciudadEnvio");

    ciudadSelect.innerHTML = '<option value="0">Seleccionar Municipio</option>';

    if(depto && municipiosData[depto]){
        municipiosData[depto].forEach(m => {
            let opt = document.createElement("option");
            opt.value = m.v;
            opt.textContent = `${m.n} (+$${m.v.toLocaleString()})`;
            ciudadSelect.appendChild(opt);
        });
    }

    actualizarCarrito();
}


/* ======================
CARGAR PRODUCTOS DESDE BACKEND
====================== */
async function cargarProductos(){

    const respuesta = await fetch("http://localhost:3000/productos");
    const productos = await respuesta.json();

    const contenedor = document.getElementById("productos");

    contenedor.innerHTML = "";

    productos.forEach(p => {

        contenedor.innerHTML += `
        <div class="gorra">

            <img src="${p.imagen}">

            <h3>${p.nombre.toUpperCase()}</h3>

            <p>$${Number(p.precio).toLocaleString()} COP</p>

            <button class="boton"
            onclick="agregar('${p.nombre}', ${p.precio})">

            Comprar

            </button>

        </div>
        `;

    });

}

cargarProductos();


/* ======================
CARRITO
====================== */

let carrito = JSON.parse(localStorage.getItem("carritoCHIKA")) || [];
let descuento = 0;

actualizarCarrito();


function agregar(nombre, precio){

    carrito.push({nombre,precio});

    localStorage.setItem("carritoCHIKA", JSON.stringify(carrito));

    actualizarCarrito();

    const notif = document.getElementById("notificacion");

    if(notif){
        notif.classList.add("activa");

        setTimeout(()=>{
            notif.classList.remove("activa");
        },2000);
    }

}


function actualizarCarrito(){

    const lista = document.getElementById("listaCarrito");
    const subtotalE = document.getElementById("subtotal");
    const envioE = document.getElementById("costoEnvio");
    const totalE = document.getElementById("total");

    if(!lista) return;

    lista.innerHTML = "";

    let subtotal = 0;

    carrito.forEach((p,i)=>{

        lista.innerHTML += `
        <li style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:13px;">

        <span>${p.nombre.toUpperCase()}</span>

        <span>

        $${p.precio.toLocaleString()}

        <button onclick="eliminar(${i})"
        style="color:#e63946;background:none;border:none;cursor:pointer;">
        ×
        </button>

        </span>

        </li>
        `;

        subtotal += p.precio;

    });

    let costoEnvio = 0;

    const ciudad = document.getElementById("ciudadEnvio");

    if(ciudad){
        costoEnvio = parseInt(ciudad.value) || 0;
    }

    let totalFinal = (subtotal - (subtotal * descuento)) + costoEnvio;

    const contador = document.getElementById("contador");

    if(contador) contador.textContent = carrito.length;
    if(subtotalE) subtotalE.textContent = "$" + subtotal.toLocaleString();
    if(envioE) envioE.textContent = "$" + costoEnvio.toLocaleString();
    if(totalE) totalE.textContent = "$" + totalFinal.toLocaleString();

}


function eliminar(i){

    carrito.splice(i,1);

    localStorage.setItem("carritoCHIKA", JSON.stringify(carrito));

    actualizarCarrito();

}


function vaciarCarrito(){

    carrito = [];

    localStorage.removeItem("carritoCHIKA");

    actualizarCarrito();

}


function toggleCarrito(){

    document.getElementById("carritoPanel").classList.toggle("activo");

}

function toggleLogin(){

    document.getElementById("loginPanel").classList.toggle("activo");

}


/* ======================
DESCUENTOS
====================== */

function aplicarDescuento(){

    const cod = document.getElementById("codigoDescuento").value;
    const msj = document.getElementById("mensajeDescuento");

    if(cod === "1010"){
        descuento = 0.10;
        msj.textContent="10% OFF!";
        msj.style.color="#25D366";
    }

    else if(cod === "2020"){
        descuento = 0.20;
        msj.textContent="20% VIP OFF!";
        msj.style.color="#25D366";
    }

    else{
        descuento = 0;
        msj.textContent="CÓDIGO INVÁLIDO";
        msj.style.color="red";
    }

    actualizarCarrito();

}


/* ======================
ENVIAR PEDIDO AL BACKEND
====================== */

async function hacerPedido(){

    const cliente = document.getElementById("cliente").value;
    const direccion = document.getElementById("direccion").value;
    const telefono = document.getElementById("telefono").value;

    const total = document.getElementById("total").textContent;

    if(carrito.length === 0){
        alert("Tu carrito está vacío");
        return;
    }

    const pedido = {
        cliente,
        direccion,
        telefono,
        productos: carrito,
        total
    };

    await fetch("http://localhost:3000/pedidos",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body: JSON.stringify(pedido)

    });

    alert("Pedido enviado correctamente 🎉");

    carrito = [];

    localStorage.removeItem("carritoCHIKA");

    actualizarCarrito();

}
