require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const fs = require("fs");
const Product = require("./models/Product");
const Order = require("./models/Order");

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecret ? require("stripe")(stripeSecret) : null;
const stripeSuccess = process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/stripe/success";
const stripeCancel = process.env.STRIPE_CANCEL_URL || "http://localhost:3000/stripe/cancel";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const app = express();

app.use(cors());

// Stripe webhooks necesitan el raw body para validar la firma.
app.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripeClient || !stripeWebhookSecret) {
        return res.status(400).send("Stripe webhook no configurado");
    }
    const signature = req.headers["stripe-signature"];
    let event;
    try {
        event = stripeClient.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
    } catch (err) {
        console.error("Webhook signature inválida:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const metadata = session.metadata || {};
            const body = {
                cliente: metadata.cliente || "Pago Stripe",
                telefono: metadata.telefono || "",
                direccion: metadata.direccion || "",
                productos: safeParseJSON(metadata.productos, []),
                total: Number(metadata.total) || 0,
                departamento: metadata.departamento || "",
                ciudad: metadata.ciudad || "",
                envio: Number(metadata.envio) || 0,
                stripeSessionId: session.id,
                stripePaymentStatus: session.payment_status || "",
                createdAt: new Date()
            };

            if (useMongo) {
                await Order.create(body);
            } else {
                const pedidos = leerArchivo(pedidosFile);
                const nuevo = { ...body, id: Date.now().toString() };
                pedidos.push(nuevo);
                escribirArchivo(pedidosFile, pedidos);
            }
        }
        res.json({ received: true });
    } catch (err) {
        console.error("Error procesando webhook:", err);
        res.status(500).send("Webhook handler error");
    }
});

app.use(express.json());

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, path.join(__dirname,"../img"));
    },
    filename: function(req,file,cb){
        const nombre = Date.now() + "-" + file.originalname;
        cb(null,nombre);
    }
});

const upload = multer({storage});

app.use("/img", express.static(path.join(__dirname,"../img")));

const productosFile = path.join(__dirname,"productos.json");
const pedidosFile = path.join(__dirname,"pedidos.json");

let useMongo = false;

function leerArchivo(ruta){
    try{
        return JSON.parse(fs.readFileSync(ruta,"utf8"));
    }catch{
        return [];
    }
}

function escribirArchivo(ruta,data){
    fs.writeFileSync(ruta,JSON.stringify(data,null,2));
}

function safeParseJSON(raw, fallback){
    try{
        if(!raw) return fallback;
        return JSON.parse(raw);
    }catch{
        return fallback;
    }
}

const connectDb = async () => {
    if(!process.env.MONGO_URI){
        console.warn("MONGO_URI no configurado. Se usará almacenamiento local.");
        return;
    }
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        });
        useMongo = true;
        console.log("MongoDB conectado");
    }catch(error){
        console.error("Error conectando a MongoDB:",error.message);
    }
};

connectDb();

app.get("/productos", async (req,res)=>{
    try{
        if(useMongo){
            const productos = await Product.find().sort({createdAt:-1});
            return res.json(productos);
        }
        const productos = leerArchivo(productosFile).map(p=>({
            ...p,
            descripcion: p.descripcion || ""
        }));
        res.json(productos);
    }catch(error){
        console.error("Error obteniendo productos:",error);
        res.status(500).json({error:"No se pudo obtener los productos"});
    }
});

app.get("/productos/:id", async (req,res)=>{
    try{
        if(useMongo){
            const producto = await Product.findById(req.params.id);
            if(!producto) return res.status(404).json({error:"Producto no encontrado"});
            return res.json(producto);
        }
        const productos = leerArchivo(productosFile);
        const item = productos.find(p=>p.id===req.params.id);
        if(!item) return res.status(404).json({error:"Producto no encontrado"});
        res.json({...item, descripcion:item.descripcion||""});
    }catch(error){
        console.error("Error obteniendo producto:",error);
        res.status(500).json({error:"No se pudo obtener el producto"});
    }
});

app.post("/upload", upload.single("imagen"), (req,res)=>{
    if(!req.file){
        return res.status(400).json({error:"No se recibió imagen"});
    }
    const ruta = "img/" + req.file.filename;
    res.json({imagen:ruta});
});

app.post("/productos", async (req,res)=>{
    try{
        const {nombre,precio,imagen,descripcion} = req.body;
        if(!nombre || !precio || !imagen){
            return res.status(400).json({error:"Nombre, precio e imagen son obligatorios"});
        }
        if(useMongo){
            const producto = await Product.create({nombre,precio,imagen,descripcion});
            return res.json(producto);
        }
        const productos = leerArchivo(productosFile);
        const nuevo = {
            id:Date.now().toString(),
            nombre,
            precio,
            imagen,
            descripcion: descripcion || "",
            createdAt:new Date()
        };
        productos.push(nuevo);
        escribirArchivo(productosFile,productos);
        res.json(nuevo);
    }catch(error){
        console.error("Error creando producto:",error);
        res.status(500).json({error:"No se pudo guardar el producto"});
    }
});

app.put("/productos/:id", async (req,res)=>{
    try{
        const {nombre,precio,imagen,descripcion} = req.body;
        if(useMongo){
            const producto = await Product.findById(req.params.id);
            if(!producto){
                return res.status(404).json({error:"Producto no encontrado"});
            }
            producto.nombre = nombre || producto.nombre;
            producto.precio = precio || producto.precio;
            producto.imagen = imagen || producto.imagen;
            if (typeof descripcion !== "undefined") {
                producto.descripcion = descripcion;
            }
            await producto.save();
            return res.json(producto);
        }
        const productos = leerArchivo(productosFile);
        const index = productos.findIndex(p=>p.id===req.params.id);
        if(index===-1){
            return res.status(404).json({error:"Producto no encontrado"});
        }
        productos[index] = {
            ...productos[index],
            nombre:nombre||productos[index].nombre,
            precio:precio||productos[index].precio,
            imagen:imagen||productos[index].imagen
            ,descripcion: (req.body.hasOwnProperty("descripcion") ? descripcion : productos[index].descripcion)
        };
        escribirArchivo(productosFile,productos);
        res.json(productos[index]);
    }catch(error){
        console.error("Error actualizando producto:",error);
        res.status(500).json({error:"No se pudo actualizar el producto"});
    }
});

app.delete("/productos/:id", async (req,res)=>{
    try{
        if(useMongo){
            const producto = await Product.findByIdAndDelete(req.params.id);
            if(!producto){
                return res.status(404).json({error:"Producto no encontrado"});
            }
            return res.json({mensaje:"Producto eliminado"});
        }
        const productos = leerArchivo(productosFile);
        const lista = productos.filter(p=>p.id!==req.params.id);
        if(lista.length===productos.length){
            return res.status(404).json({error:"Producto no encontrado"});
        }
        escribirArchivo(productosFile,lista);
        res.json({mensaje:"Producto eliminado"});
    }catch(error){
        console.error("Error eliminando producto:",error);
        res.status(500).json({error:"No se pudo eliminar el producto"});
    }
});

app.post("/pedidos", async (req,res)=>{
    try{
        const body = {
            cliente:req.body.cliente,
            telefono:req.body.telefono,
            direccion:req.body.direccion,
            productos:req.body.productos,
            total:req.body.total,
            departamento:req.body.departamento,
            ciudad:req.body.ciudad,
            envio:req.body.envio
        };
        if(useMongo){
            const pedido = await Order.create(body);
            return res.json(pedido);
        }
        const pedidos = leerArchivo(pedidosFile);
        const nuevo = {...body,id:Date.now().toString(),createdAt:new Date()};
        pedidos.push(nuevo);
        escribirArchivo(pedidosFile,pedidos);
        res.json(nuevo);
    }catch(error){
        console.error("Error guardando pedido:",error);
        res.status(500).json({error:"No se pudo guardar el pedido"});
    }
});

app.get("/pedidos", async (req,res)=>{
    try{
        if(useMongo){
            const pedidos = await Order.find().sort({createdAt:-1});
            return res.json(pedidos);
        }
        const pedidos = leerArchivo(pedidosFile);
        res.json(pedidos);
    }catch(error){
        console.error("Error listando pedidos:",error);
        res.status(500).json({error:"No se pudo obtener los pedidos"});
    }
});

app.delete("/pedidos/:id", async (req,res)=>{
    try{
        if(useMongo){
            const pedido = await Order.findByIdAndDelete(req.params.id);
            if(!pedido){
                return res.status(404).json({error:"Pedido no encontrado"});
            }
            return res.json({mensaje:"Pedido eliminado"});
        }
        const pedidos = leerArchivo(pedidosFile);
        const lista = pedidos.filter(p=>p.id!==req.params.id);
        if(lista.length===pedidos.length){
            return res.status(404).json({error:"Pedido no encontrado"});
        }
        escribirArchivo(pedidosFile,lista);
        res.json({mensaje:"Pedido eliminado"});
    }catch(error){
        console.error("Error eliminando pedido:",error);
        res.status(500).json({error:"No se pudo eliminar el pedido"});
    }
});

app.post("/checkout", async (req,res)=>{
    if(!stripeClient){
        return res.status(500).json({error:"Stripe no está configurado"});
    }
    const {productos,total,cliente,telefono,direccion,departamento,ciudad,envio} = req.body;
    if(!Array.isArray(productos) || productos.length===0){
        return res.status(400).json({error:"Carrito vacío"});
    }
    try{
        // Recalcular en servidor (evita montos manipulados desde el navegador).
        let catalog = [];
        if(useMongo){
            catalog = await Product.find().select({ nombre: 1, precio: 1 }).lean();
        }else{
            catalog = leerArchivo(productosFile);
        }

        const resolved = productos.map(item=>{
            const id = item.id || item._id;
            let match = null;
            if(id){
                match = catalog.find(p=> String(p._id || p.id) === String(id));
            }
            if(!match && item.nombre){
                match = catalog.find(p=> p.nombre === item.nombre);
            }
            const nombreFinal = match?.nombre || item.nombre || "Producto";
            const precioFinal = Number(match?.precio ?? item.precio) || 0;
            return { id: id || String(match?._id || match?.id || ""), nombre: nombreFinal, precio: precioFinal };
        }).filter(p=>p.precio > 0);

        if(resolved.length === 0){
            return res.status(400).json({error:"No se pudieron validar los productos"});
        }

        const lineItems = resolved.map(item=>{
            const amount = Math.max(100, Math.round(Number(item.precio) || 0));
            return {
                price_data:{
                    currency:"cop",
                    product_data:{name:item.nombre || "Producto"},
                    unit_amount:amount
                },
                quantity:1
            };
        });

        const shippingAmount = Math.max(0, Math.round(Number(envio) || 0));
        if(shippingAmount > 0){
            lineItems.push({
                price_data:{
                    currency:"cop",
                    product_data:{name:"Envío"},
                    unit_amount:shippingAmount
                },
                quantity:1
            });
        }

        const computedTotal = resolved.reduce((sum,i)=>sum+i.precio,0) + shippingAmount;
        const totalSafe = Math.round(Number(total) || computedTotal);

        const session = await stripeClient.checkout.sessions.create({
            payment_method_types:["card"],
            line_items:lineItems,
            mode:"payment",
            success_url:stripeSuccess,
            cancel_url:stripeCancel,
            metadata:{
                cliente: cliente || "",
                telefono: telefono || "",
                direccion: direccion || "",
                departamento: departamento || "",
                ciudad: ciudad || "",
                total: String(totalSafe),
                envio: String(shippingAmount),
                productos: JSON.stringify(resolved)
            }
        });
        res.json({url:session.url});
    }catch(error){
        console.error("Error generando checkout:",error);
        res.status(500).json({error:"No se pudo iniciar el pago"});
    }
});

app.get("/stripe/success", (req,res)=>{
    res.type("html").send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago exitoso</title></head>
<body style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 16px">
<h1>Pago confirmado</h1>
<p>Gracias por tu compra. Si pagaste con Stripe, el pedido queda registrado cuando Stripe confirma el pago.</p>
<p><a href="../index.html">Volver a CHIKAWEAR</a></p>
</body></html>`);
});

app.get("/stripe/cancel", (req,res)=>{
    res.type("html").send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago cancelado</title></head>
<body style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 16px">
<h1>Pago cancelado</h1>
<p>No se completó el pago. Puedes intentarlo de nuevo desde el carrito.</p>
<p><a href="../index.html">Volver a CHIKAWEAR</a></p>
</body></html>`);
});

const PORT=process.env.PORT||3000;

app.listen(PORT,()=>{
    console.log(`Servidor CHIKAWEAR corriendo en http://localhost:${PORT}`);
    if(!useMongo){
        console.log("Modo offline: se está usando el almacenamiento JSON local.");
    }
});
