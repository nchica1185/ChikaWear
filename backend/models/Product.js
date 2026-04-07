const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({

    nombre:{type:String,required:true},

    precio:{type:Number,required:true},

    imagen:{type:String,required:true},

    descripcion:{type:String,default:""},

    createdAt:{type:Date,default:Date.now}

});

module.exports = mongoose.model("Product",ProductSchema);
