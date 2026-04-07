document.addEventListener("DOMContentLoaded",()=>{
    const listEl = document.getElementById("cartItemsList");
    const resumenSub = document.getElementById("summarySubtotal");
    const resumenEnv = document.getElementById("summaryEnvio");
    const resumenTotal = document.getElementById("summaryTotal");
    const shippingWarning = document.getElementById("shippingWarningPage");
    const shippingChoice = document.getElementById("shippingChoicePage");
    const selectDepto = document.getElementById("selectDeptoPage");
    const selectCiudad = document.getElementById("selectCiudadPage");
    const grid = document.getElementById("shippingGrid");

    function renderItems(){
        if(!listEl) return;
        const items = getCart();
        if(items.length === 0){
            listEl.innerHTML = "<p class='empty-cart'>Todavía no hay artículos en el carrito.</p>";
            return;
        }
        listEl.innerHTML = items.map((prod,index)=>`<article>
            <div class="item-meta">
                <h3>${prod.nombre}</h3>
                <strong>${formatMoney(prod.precio)}</strong>
            </div>
            <button class="item-remove" onclick="eliminar(${index})" aria-label="Eliminar ${prod.nombre}">×</button>
        </article>`).join("");
    }

    function llenarGrid(){
        if(!grid) return;
        grid.innerHTML = getShippingList().map(item=>`<article>
            <h4>${item.departamento}</h4>
            <p>${item.ciudades.join(", ")}</p>
            <span>${formatMoney(item.costo)} envío base</span>
        </article>`).join("");
    }

    function llenarSelects(){
        if(!selectDepto) return;
        selectDepto.innerHTML = "<option value=\"\">Selecciona departamento</option>";
        getShippingList().forEach(item=>{
            const option = document.createElement("option");
            option.value = item.departamento;
            option.textContent = item.departamento;
            selectDepto.appendChild(option);
        });
        selectCiudad.innerHTML = "<option value=\"\">Selecciona ciudad</option>";
        selectCiudad.disabled = true;
    }

    function handleDepto(depto){
        if(!selectCiudad) return;
        selectCiudad.innerHTML = "<option value=\"\">Selecciona ciudad</option>";
        selectCiudad.disabled = true;
        if(!depto){
            shippingWarning.textContent = "Selecciona un departamento para ver los precios de envío";
            setShipping("","",0);
            return;
        }
        const datos = getShippingList().find(item=>item.departamento===depto);
        if(datos){
            datos.ciudades.forEach(ciudad=>{
                const option = document.createElement("option");
                option.value = ciudad;
                option.textContent = ciudad;
                selectCiudad.appendChild(option);
            });
            selectCiudad.disabled = false;
            shippingWarning.textContent = `Costo base ${datos.departamento}: ${formatMoney(datos.costo)}`;
            setShipping(datos.departamento,"",datos.costo);
        }
    }

    function handleCiudad(ciudad){
        const shipping = getSelectedShipping();
        setShipping(shipping.departamento,ciudad,shipping.cost);
        if(ciudad){
            shippingChoice.textContent = `${ciudad}, ${shipping.departamento} • ${formatMoney(shipping.cost)}`;
        }else{
            shippingChoice.textContent = "Selecciona ciudad para conocer el costo final";
        }
    }

    function actualizarResumen(){
        if(!resumenSub || !resumenEnv || !resumenTotal) return;
        resumenSub.textContent = formatMoney(getCartSubtotal());
        resumenEnv.textContent = formatMoney(getShippingCost());
        resumenTotal.textContent = formatMoney(getCartTotal());
    }

    selectDepto?.addEventListener("change", e=>handleDepto(e.target.value));
    selectCiudad?.addEventListener("change", e=>handleCiudad(e.target.value));

    subscribeCart(()=>{
        renderItems();
        actualizarResumen();
        const shipping = getSelectedShipping();
        if(shipping.departamento && shipping.ciudad){
            shippingChoice.textContent = `${shipping.ciudad}, ${shipping.departamento} • ${formatMoney(shipping.cost)}`;
            shippingWarning.textContent = "Datos de envío guardados";
        }else{
            shippingChoice.textContent = "Selecciona un departamento y ciudad para ver el total";
        }
    });

    llenarGrid();
    llenarSelects();

    const savedShipping = getSelectedShipping();
    if(savedShipping.departamento){
        selectDepto.value = savedShipping.departamento;
        handleDepto(savedShipping.departamento);
        if(savedShipping.ciudad){
            selectCiudad.value = savedShipping.ciudad;
            handleCiudad(savedShipping.ciudad);
        }
    }
});
