const API = "http://localhost:3000";

const SHIPPING_DATA = [
    {departamento:"Amazonas",ciudades:["Leticia"],costo:34000},
    {departamento:"Antioquia",ciudades:["Medellín","Envigado","Rionegro","Bello"],costo:15000},
    {departamento:"Arauca",ciudades:["Arauca","Arauquita"],costo:23000},
    {departamento:"Atlántico",ciudades:["Barranquilla","Soledad","Malambo"],costo:17000},
    {departamento:"Bogotá D.C.",ciudades:["Bogotá"],costo:14000},
    {departamento:"Bolívar",ciudades:["Cartagena","Arjona","Magangué"],costo:20000},
    {departamento:"Boyacá",ciudades:["Tunja","Duitama","Sogamoso"],costo:18000},
    {departamento:"Caldas",ciudades:["Manizales","Villamaría","Chinchiná"],costo:16000},
    {departamento:"Caquetá",ciudades:["Florencia","San Vicente del Caguán"],costo:22000},
    {departamento:"Casanare",ciudades:["Yopal","Aguazul"],costo:21000},
    {departamento:"Cauca",ciudades:["Popayán","Santander de Quilichao","Puerto Tejada"],costo:21000},
    {departamento:"Cesar",ciudades:["Valledupar","Aguachica"],costo:18000},
    {departamento:"Chocó",ciudades:["Quibdó","Istmina"],costo:26000},
    {departamento:"Córdoba",ciudades:["Montería","Cereté","Lorica"],costo:19000},
    {departamento:"Cundinamarca",ciudades:["Facatativá","Girardot","Soacha"],costo:15000},
    {departamento:"Guainía",ciudades:["Inírida"],costo:36000},
    {departamento:"Guaviare",ciudades:["San José del Guaviare"],costo:32000},
    {departamento:"Huila",ciudades:["Neiva","Pitalito"],costo:17000},
    {departamento:"La Guajira",ciudades:["Riohacha","Maicao"],costo:23000},
    {departamento:"Magdalena",ciudades:["Santa Marta","Ciénaga","Plato"],costo:20000},
    {departamento:"Meta",ciudades:["Villavicencio","Acacías"],costo:19000},
    {departamento:"Nariño",ciudades:["Pasto","Ipiales","Tumaco"],costo:22000},
    {departamento:"Norte de Santander",ciudades:["Cúcuta","Ocaña"],costo:21000},
    {departamento:"Putumayo",ciudades:["Mocoa","Puerto Asís"],costo:24000},
    {departamento:"Quindío",ciudades:["Armenia","Calarcá","Montenegro"],costo:14000},
    {departamento:"Risaralda",ciudades:["Pereira","Dosquebradas","La Virginia"],costo:15000},
    {departamento:"San Andrés y Providencia",ciudades:["San Andrés"],costo:30000},
    {departamento:"Santander",ciudades:["Bucaramanga","Floridablanca","Piedecuesta"],costo:18000},
    {departamento:"Sucre",ciudades:["Sincelejo","Tolú"],costo:20000},
    {departamento:"Tolima",ciudades:["Ibagué","Espinal","Honda"],costo:17000},
    {departamento:"Valle del Cauca",ciudades:["Cali","Palmira","Jamundí"],costo:16000},
    {departamento:"Vaupés",ciudades:["Mitú"],costo:36000},
    {departamento:"Vichada",ciudades:["Puerto Carreño"],costo:38000}
];

const CART_STORAGE_KEY = "chikawear_cart_v2";
const SHIPPING_STORAGE_KEY = "chikawear_shipping_v2";

let carrito = loadJSON(CART_STORAGE_KEY, []);
let selectedShipping = loadJSON(SHIPPING_STORAGE_KEY, {departamento:"",ciudad:"",cost:0});
const cartSubscribers = [];

function loadJSON(key, fallback){
    try{
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    }catch{
        return fallback;
    }
}

function safeStore(key,value){
    try{
        localStorage.setItem(key,JSON.stringify(value));
    }catch{}
}

function persistCart(){
    safeStore(CART_STORAGE_KEY,carrito);
}

function persistShipping(){
    safeStore(SHIPPING_STORAGE_KEY,selectedShipping);
}

function subscribeCart(callback){
    if(typeof callback === "function"){
        cartSubscribers.push(callback);
        callback();
    }
}

function notifyCartSubscribers(){
    cartSubscribers.forEach(cb=>cb());
    refreshCartBadges();
}

function refreshCartBadges(){
    const count = getCartCount();
    if(typeof document === "undefined") return;
    document.querySelectorAll("[data-cart-count]").forEach(el=>{
        el.textContent = count;
    });
}

function addToCart(item){
    carrito.push(item);
    persistCart();
    notifyCartSubscribers();
}

function removeFromCart(index){
    if(index<0||index>=carrito.length) return;
    carrito.splice(index,1);
    persistCart();
    notifyCartSubscribers();
}

function clearCart(){
    carrito = [];
    persistCart();
    notifyCartSubscribers();
}

function setShipping(depto,ciudad,cost){
    selectedShipping = {
        departamento:depto||"",
        ciudad:ciudad||"",
        cost:cost||0
    };
    persistShipping();
    notifyCartSubscribers();
}

function resetShipping(){
    setShipping("","",0);
}

function getCart(){
    return [...carrito];
}

function getCartCount(){
    return carrito.length;
}

function getCartSubtotal(){
    return carrito.reduce((sum,item)=>sum+(Number(item.precio)||0),0);
}

function getShippingCost(){
    return selectedShipping.cost||0;
}

function getCartTotal(){
    return getCartSubtotal()+getShippingCost();
}

function getSelectedShipping(){
    return {...selectedShipping};
}

function getShippingList(){
    return [...SHIPPING_DATA];
}

function formatMoney(amount){
    if(typeof amount !== "number") amount = Number(amount)||0;
    return "$"+amount.toLocaleString("es-CO",{minimumFractionDigits:0});
}

refreshCartBadges();
