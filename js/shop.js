document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("productos");
    const loader = document.getElementById("productLoader");
    const emptyMessage = document.getElementById("catalogEmpty");
    const modal = document.getElementById("productModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalDescription = document.getElementById("modalDescription");
    const modalPrice = document.getElementById("modalPrice");
    const modalAdd = document.getElementById("modalAdd");
    const modalCloseButtons = Array.from(document.querySelectorAll("[data-modal-close]"));
    const catalogoSection = document.getElementById("catalogo");
    const detailSection = document.getElementById("detalleProducto");
    const detailImg = document.getElementById("detalleImg");
    const detailNombre = document.getElementById("detalleNombre");
    const detailDescripcion = document.getElementById("detalleDescripcion");
    const detailPrecio = document.getElementById("detallePrecio");
    const detailAdd = document.getElementById("detalleAgregar");
    const logo = document.querySelector(".logo");
    const navbar = document.querySelector(".navbar");
    const cartTriggers = document.querySelectorAll("[data-open-cart]");
    const apiRoot = typeof API !== "undefined" ? API : "http://localhost:3000";
    let activeProduct = null;
    const productCache = new Map(); // id => producto fresco

    const formatMoney = value => "$" + Number(value || 0).toLocaleString("es-CO", { minimumFractionDigits: 0 });

    const toggleLoader = visible => {
        if (!loader) return;
        loader.classList.toggle("hide", !visible);
        loader.setAttribute("aria-busy", visible ? "true" : "false");
    };

    const showEmpty = text => {
        if (emptyMessage) {
            emptyMessage.textContent = text;
            emptyMessage.classList.remove("hide");
        }
        if (grid) {
            grid.innerHTML = "";
        }
    };

    const showProductModal = product => {
        if (!modal) return;
        activeProduct = product;
        modalTitle.textContent = product.nombre;
        modalDescription.textContent = product.descripcion || "Detalle por definir";
        modalPrice.textContent = formatMoney(product.precio);
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
    };

    const showProductDetail = product => {
        activeProduct = product;
        if (detailSection && detailImg && detailNombre && detailDescripcion && detailPrecio) {
            detailNombre.textContent = product.nombre;
            detailDescripcion.textContent = product.descripcion || "Detalle del producto";
            detailPrecio.textContent = formatMoney(product.precio);
            detailImg.src = product.imagen || "img/no-image.png";
            detailImg.onerror = function () {
                this.onerror = null;
                this.src = "img/no-image.png";
            };
            if (detailAdd) {
                detailAdd.onclick = () => {
                    addToCart({ id: product.id || product._id || "", nombre: product.nombre, precio: Number(product.precio) || 0 });
                    animateButton(detailAdd);
                    flashNotice("Producto agregado al carrito");
                };
            }
            detailSection.classList.remove("hide");
            detailSection.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            showProductModal(product);
        }
    };

    const hideProductModal = () => {
        if (!modal) return;
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
    };

    modalCloseButtons.forEach(btn => btn.addEventListener("click", hideProductModal));
    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target === modal) hideProductModal();
        });
    }
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") hideProductModal();
    });
    if (modalAdd) {
        modalAdd.addEventListener("click", () => {
            if (!activeProduct) return;
            addToCart({ nombre: activeProduct.nombre, precio: Number(activeProduct.precio) || 0 });
            animateButton(modalAdd);
            flashNotice("Producto agregado al carrito");
        });
    }

    const animateButton = button => {
        if (!button) return;
        button.classList.add("is-adding");
        setTimeout(() => button.classList.remove("is-adding"), 600);
    };

    const flashNotice = message => {
        const notice = document.getElementById("notificacion");
        if (!notice) return;
        notice.textContent = message;
        notice.classList.add("activa");
        setTimeout(() => notice.classList.remove("activa"), 2000);
    };

    const handleNavbar = () => {
        if (!navbar) return;
        if (window.scrollY > 70) navbar.classList.add("sticky");
        else navbar.classList.remove("sticky");
    };

    if (logo && catalogoSection) {
        logo.style.cursor = "pointer";
        logo.addEventListener("click", event => {
            event.preventDefault();
            catalogoSection.scrollIntoView({ behavior: "smooth" });
        });
    }

    const bindCartTriggers = () => {
        if (!cartTriggers.length) return;
        cartTriggers.forEach(btn => {
            btn.addEventListener("click", event => {
                event.preventDefault();
                const handler = window.toggleCarrito;
                if (typeof handler === "function") handler();
            });
        });
    };

    window.addEventListener("scroll", handleNavbar);
    handleNavbar();
    loadProducts();
    bindCartTriggers();

    async function loadProducts() {
        toggleLoader(true);
        if (emptyMessage) emptyMessage.classList.add("hide");
        if (!grid) return;
        try {
            const response = await fetch(`${apiRoot}/productos`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const productos = await response.json();
            if (!Array.isArray(productos) || productos.length === 0) {
                showEmpty("Todavía no hay productos disponibles.");
                return;
            }
            productCache.clear();
            productos.forEach(p => {
                const pid = p.id || p._id;
                if (pid) productCache.set(pid, { ...p, descripcion: p.descripcion || "" });
            });
            renderProducts(productos);
        } catch (error) {
            console.error("Error al cargar productos:", error);
            showEmpty("Ocurrió un problema cargando el catálogo.");
        } finally {
            toggleLoader(false);
        }
    }

    function renderProducts(items) {
        grid.innerHTML = "";
        const fragment = document.createDocumentFragment();
        items.forEach((item, index) => {
            fragment.appendChild(createCard(item, index));
        });
        grid.appendChild(fragment);
    }

    function createCard(item, index) {
        const card = document.createElement("article");
        card.className = "catalogo-card";
        const cardId = item.id || item._id || "";
        if (cardId) card.dataset.id = cardId;
        if (item.descripcion) card.dataset.desc = item.descripcion;
        card.style.animationDelay = `${index * 0.04}s`;

        const imgBox = document.createElement("div");
        imgBox.className = "img-box";
        const img = document.createElement("img");
        img.src = item.imagen || "img/no-image.png";
        img.alt = `Gorra ${item.nombre}`;
        img.loading = "lazy";
        img.onerror = function () {
            this.onerror = null;
            this.src = "img/no-image.png";
        };
        imgBox.appendChild(img);

        const title = document.createElement("h3");
        title.textContent = item.nombre;

        const description = document.createElement("p");
        description.className = "card-description";
        description.textContent = item.descripcion || "Detalle del producto";

        const price = document.createElement("p");
        price.textContent = formatMoney(item.precio);

        const actions = document.createElement("div");
        actions.className = "catalogo-actions";
        const addBtn = document.createElement("button");
        addBtn.className = "primary";
        addBtn.textContent = "Agregar";
        addBtn.addEventListener("click", () => {
            addToCart({ id: item.id || item._id || "", nombre: item.nombre, precio: Number(item.precio) || 0 });
            animateButton(addBtn);
            flashNotice("Producto agregado al carrito");
        });

        const infoBtn = document.createElement("button");
        infoBtn.className = "secondary";
        infoBtn.textContent = "Ver detalles";
        infoBtn.addEventListener("click", () => handleDetailRequest(card, item));

        actions.append(addBtn, infoBtn);
        card.append(imgBox, title, description, price, actions);
        return card;
    }

    async function handleDetailRequest(card, fallback) {
        const id = card?.dataset?.id;
        if (id) {
            try {
                const res = await fetch(`${apiRoot}/productos/${id}`);
                if (res.ok) {
                    const fresh = await res.json();
                    const pid = fresh.id || fresh._id || id;
                    if (pid) productCache.set(pid, { ...fresh, descripcion: fresh.descripcion || "" });
                    showProductDetail({ ...fresh, descripcion: fresh.descripcion || "" });
                    return;
                }
            } catch (err) {
                console.warn("No se pudo refrescar producto, usando fallback", err);
            }
        }
        if (productCache.size) {
            const match = id
                ? productCache.get(id)
                : Array.from(productCache.values()).find(p => p.nombre === fallback.nombre);
            if (match) {
                showProductDetail(match);
                return;
            }
        }
        const descFallback = fallback.descripcion || card?.dataset?.desc || "Detalle del producto";
        showProductDetail({ ...fallback, descripcion: descFallback });
    }

    grid?.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.classList.contains("primary")) {
            const card = target.closest(".catalogo-card");
            if (!card) return;
            const name = card.querySelector("h3")?.textContent || "Producto";
            const priceText = card.querySelector("p:nth-of-type(2)")?.textContent?.replace(/[^\d]/g, "") || "0";
            const price = Number(priceText) || 0;
            addToCart({ id: card.dataset.id || "", nombre: name, precio: price });
            animateButton(target);
            flashNotice("Producto agregado al carrito");
        }
        if (target.classList.contains("secondary")) {
            const card = target.closest(".catalogo-card");
            if (!card) return;
            const name = card.querySelector("h3")?.textContent || "Producto";
            const desc = card.querySelector(".card-description")?.textContent || "Detalle del producto";
            const priceText = card.querySelector("p:nth-of-type(2)")?.textContent?.replace(/[^\d]/g, "") || "0";
            const price = Number(priceText) || 0;
            const imgSrc = card.querySelector("img")?.getAttribute("src") || "img/no-image.png";
            handleDetailRequest(card, { id: card.dataset.id, nombre: name, descripcion: desc, precio: price, imagen: imgSrc });
        }
    });
});
