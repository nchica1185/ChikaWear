const express = require("express")
const cors = require("cors")
const fs = require("fs")

const app = express()

app.use(cors())
app.use(express.json())

// ===============================
// OBTENER PRODUCTOS
// ===============================

app.get("/productos", (req, res) => {

const productos = JSON.parse(
fs.readFileSync("./productos.json", "utf8")
)

res.json(productos)

})


// ===============================
// AGREGAR PRODUCTO
// ===============================

app.post("/productos", (req, res) => {

let productos = JSON.parse(
fs.readFileSync("./productos.json", "utf8")
)

const nuevo = req.body

productos.push(nuevo)

fs.writeFileSync(
"./productos.json",
JSON.stringify(productos, null, 2)
)

res.json({mensaje:"Producto agregado"})

})


// ===============================
// ELIMINAR PRODUCTO
// ===============================

app.delete("/productos/:id", (req,res)=>{

const id = parseInt(req.params.id)

let productos = JSON.parse(
fs.readFileSync("./productos.json","utf8")
)

productos = productos.filter(p => p.id !== id)

fs.writeFileSync(
"./productos.json",
JSON.stringify(productos,null,2)
)

res.json({mensaje:"Producto eliminado"})

})


// ===============================
// EDITAR PRODUCTO
// ===============================

app.put("/productos/:id", (req,res)=>{

const id = parseInt(req.params.id)

let productos = JSON.parse(
fs.readFileSync("./productos.json","utf8")
)

const index = productos.findIndex(p => p.id === id)

if(index !== -1){

productos[index].nombre = req.body.nombre
productos[index].precio = req.body.precio
productos[index].imagen = req.body.imagen   // 🔥 ESTA LINEA FALTABA

}

fs.writeFileSync(
"./productos.json",
JSON.stringify(productos,null,2)
)

res.json({mensaje:"Producto actualizado"})

})


// ===============================
// CREAR PEDIDO
// ===============================

app.post("/pedidos", (req, res) => {

const pedidos = JSON.parse(
fs.readFileSync("./pedidos.json", "utf8")
)

const nuevoPedido = {
id: Date.now(),
cliente: req.body.cliente,
direccion: req.body.direccion,
telefono: req.body.telefono,
productos: req.body.productos,
total: req.body.total,
fecha: new Date()
}

pedidos.push(nuevoPedido)

fs.writeFileSync(
"./pedidos.json",
JSON.stringify(pedidos, null, 2)
)

res.json({mensaje:"Pedido guardado"})

})


// ===============================
// VER PEDIDOS
// ===============================

app.get("/pedidos", (req,res)=>{

const pedidos = JSON.parse(
fs.readFileSync("./pedidos.json","utf8")
)

res.json(pedidos)

})


// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(3000, () => {

console.log("Servidor corriendo en http://localhost:3000")

}) 