const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({

    cliente:{type:String,required:true},

    telefono:{type:String,required:true},

    direccion:{type:String,required:true},

    departamento:{type:String,required:true},

    ciudad:{type:String,required:true},

    envio:{type:Number,default:0},

    productos:[{
        nombre:String,
        precio:Number
    }],

    total:{type:Number,required:true},

    paymentReference:{type:String},

    createdAt:{type:Date,default:Date.now}

});

module.exports = mongoose.model("Order",OrderSchema);
