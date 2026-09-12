const defaultProducts = [
  {
    id: "prod-1",
    name: "Royal Silk Saree",
    code: "AS-101",
    price: 3499,
    image: "hero_img.webp",
    description: "A premium silk saree with rich texture and elegant drape.",
  },
  {
    id: "prod-2",
    name: "Pink Festive Saree",
    code: "AS-102",
    price: 2799,
    image: "hero_img.webp",
    description: "Soft pastel tones designed for festive celebrations.",
  },
  {
    id: "prod-3",
    name: "Golden Embroidered Saree",
    code: "AS-103",
    price: 3899,
    image: "hero_img.webp",
    description: "Intricate embroidery paired with a luxurious golden finish.",
  },
  {
    id: "prod-4",
    name: "Classic Black Saree",
    code: "AS-104",
    price: 3299,
    image: "hero_img.webp",
    description: "Timeless black elegance for evening events and weddings.",
  },
];

let products = [...defaultProducts];

const DELIVERY_OPTIONS = {
  insideDhaka: { label: "ভিতরে ঢাকা", fee: 100 },
  outsideDhaka: { label: "বাইরে ঢাকা", fee: 150 },
};

const ADMIN_AUTH_KEY = "adityaAdminAuth";
const VALID_ADMIN_CREDENTIALS = {
  username: "Aditya@3017",
  password: "Aditya@3017",
  secretCode: "7890123",
};

const adminLoginScreen = document.getElementById("adminLoginScreen");
const adminAuthenticatedContent = document.getElementById("adminAuthenticatedContent");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

const productGrid = document.getElementById("productGrid");
const productModal = document.getElementById("productModal");
const productModalContent = document.getElementById("productModalContent");
const productModalClose = document.getElementById("productModalClose");
const productModalBackdrop = document.getElementById("productModalBackdrop");
const orderForm = document.getElementById("orderForm");
const formMessage = document.getElementById("formMessage");
const orderPreview = document.getElementById("orderPreview");
const deliveryTypeInputs = Array.from(document.querySelectorAll('input[name="deliveryType"]'));
const totalPriceInput = document.getElementById("totalPrice");
const submitOrderBtn = document.getElementById("submitOrderBtn");
const adminTableBody = document.getElementById("adminTableBody");
const adminOrderCount = document.getElementById("orderCount");
const overviewTotalOrders = document.getElementById("overviewTotalOrders");
const overviewNewOrders = document.getElementById("overviewNewOrders");
const overviewOnHoldOrders = document.getElementById("overviewOnHoldOrders");
const overviewConfirmedOrders = document.getElementById("overviewConfirmedOrders");
const overviewDeliveredOrders = document.getElementById("overviewDeliveredOrders");
const deleteSelectedOrdersButton = document.getElementById("deleteSelectedOrders");
const selectAllOrdersCheckbox = document.getElementById("selectAllOrders");
const adminProductTableBody = document.getElementById("adminProductTableBody");
const productForm = document.getElementById("productForm");
const productIdField = document.getElementById("productId");
const productFormSubmitButton = document.getElementById("productFormSubmit");
const resetProductFormButton = document.getElementById("resetProductForm");
const imageFilesInput = document.getElementById("imageFiles");
const selectedImagesStatus = document.getElementById("selectedImagesStatus");
const selectedImagesPreview = document.getElementById("selectedImagesPreview");
const cart = [];
let orderButtonResetTimer = null;

function updateSelectedImagesPreview() {
  if (!imageFilesInput || !selectedImagesStatus || !selectedImagesPreview) {
    return;
  }

  const files = Array.from(imageFilesInput.files || []);
  selectedImagesPreview.innerHTML = "";

  if (!files.length) {
    selectedImagesStatus.textContent = "No photos selected";
    return;
  }

  selectedImagesStatus.textContent = `${files.length} photo${files.length === 1 ? "" : "s"} selected`;
  files.slice(0, 6).forEach((file) => {
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = file.name;
    image.onload = () => URL.revokeObjectURL(image.src);
    selectedImagesPreview.appendChild(image);
  });
}

function getProductImages(product) {
  return Array.isArray(product.images) && product.images.length ? product.images : [product.image];
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 200);
    throw new Error(`Unexpected server response: ${preview}`);
  }
}

function setAdminAuthState(isAuthenticated) {
  if (adminLoginScreen) {
    adminLoginScreen.classList.toggle("d-none", isAuthenticated);
  }

  if (adminAuthenticatedContent) {
    adminAuthenticatedContent.classList.toggle("d-none", !isAuthenticated);
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.classList.toggle("d-none", !isAuthenticated);
  }
}

function attemptAdminLogin(event) {
  event.preventDefault();

  if (!adminLoginForm) {
    return;
  }

  const formData = new FormData(adminLoginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const secretCode = String(formData.get("secretCode") || "").trim();

  const isValid =
    username === VALID_ADMIN_CREDENTIALS.username &&
    password === VALID_ADMIN_CREDENTIALS.password &&
    secretCode === VALID_ADMIN_CREDENTIALS.secretCode;

  if (!isValid) {
    window.alert("Invalid admin credentials. Please try again.");
    return;
  }

  localStorage.setItem(ADMIN_AUTH_KEY, "true");
  setAdminAuthState(true);
  adminLoginForm.reset();
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
  setAdminAuthState(false);

  if (adminLoginForm) {
    adminLoginForm.reset();
  }
}

function resetOrderButtonState() {
  if (!submitOrderBtn) {
    return;
  }

  submitOrderBtn.classList.remove("order-success");
  submitOrderBtn.innerHTML = '<span class="btn-text">অর্ডার পাঠান</span>';
}

function showOrderSuccessState() {
  if (!submitOrderBtn) {
    return;
  }

  clearTimeout(orderButtonResetTimer);
  submitOrderBtn.classList.add("order-success");
  submitOrderBtn.innerHTML = '<span class="btn-text"><i class="fa-solid fa-check"></i></span>';

  orderButtonResetTimer = setTimeout(() => {
    resetOrderButtonState();
  }, 5000);
}

function getSelectedDeliveryType() {
  const selectedInput = deliveryTypeInputs.find((input) => input.checked);
  return selectedInput?.value || "insideDhaka";
}

function getSelectedDeliveryFee() {
  const selectedType = getSelectedDeliveryType();
  return DELIVERY_OPTIONS[selectedType]?.fee || 0;
}

function updateTotalPrice() {
  if (!totalPriceInput) {
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cart.length ? getSelectedDeliveryFee() : 0;
  const total = subtotal + deliveryFee;

  totalPriceInput.value = `৳${total.toLocaleString()}`;
}

function updateOrderPreview() {
  if (cart.length > 0 && submitOrderBtn && submitOrderBtn.classList.contains("order-success")) {
    resetOrderButtonState();
  }

  if (!orderPreview) {
    return;
  }

  const sareeHidden = document.getElementById("sareeHidden");

  if (!cart.length) {
    orderPreview.innerHTML = `
      <div class="order-preview-empty">
        <i class="fa-solid fa-bag-shopping"></i>
        <span>কোনো পণ্য বেছে নিন</span>
      </div>
    `;

    if (sareeHidden) {
      sareeHidden.value = "";
    }

    return;
  }

  if (sareeHidden) {
    sareeHidden.value = cart.map((item) => `${item.name} (${item.code})`).join(", ");
  }

  orderPreview.innerHTML = cart
    .map(
      (item) => `
        <div class="order-product-summary">
          <img src="${item.image}" alt="${item.name}" />
          <div class="order-product-info">
            <p class="order-product-label">আপনার পছন্দ</p>
            <h3>${item.name}</h3>
            <p class="order-product-code">কোড: ${item.code}</p>
            <div class="qty-control">
              <button class="qty-btn" type="button" data-qty-action="decrease" data-code="${item.code}">
                <i class="fa-solid fa-minus"></i>
              </button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" type="button" data-qty-action="increase" data-code="${item.code}">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
          <button class="btn btn-remove-item" type="button" data-remove-code="${item.code}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `
    )
    .join("");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = getSelectedDeliveryFee();
  const total = subtotal + deliveryFee;
  orderPreview.insertAdjacentHTML(
    "beforeend",
    `<div class="order-total-summary">
      <div><span>পণ্যের মূল্য</span><strong>৳${subtotal.toLocaleString()}</strong></div>
      <div><span>ডেলিভারি চার্জ</span><strong>৳${deliveryFee.toLocaleString()}</strong></div>
      <div class="order-grand-total"><span>সর্বমোট</span><strong>৳${total.toLocaleString()} BDT</strong></div>
    </div>`
  );

  const removeButtons = document.querySelectorAll("[data-remove-code]");
  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.dataset.removeCode;
      const itemIndex = cart.findIndex((item) => item.code === code);

      if (itemIndex !== -1) {
        cart.splice(itemIndex, 1);
        updateOrderPreview();
        updateTotalPrice();
      }
    });
  });

  const qtyButtons = document.querySelectorAll("[data-qty-action]");
  qtyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const code = button.dataset.code;
      const action = button.dataset.qtyAction;
      const itemIndex = cart.findIndex((item) => item.code === code);

      if (itemIndex === -1) {
        return;
      }

      if (action === "increase") {
        cart[itemIndex].quantity += 1;
      } else if (action === "decrease") {
        if (cart[itemIndex].quantity > 1) {
          cart[itemIndex].quantity -= 1;
        } else {
          cart.splice(itemIndex, 1);
        }
      }

      updateOrderPreview();
      updateTotalPrice();
    });
  });
}

function openProductModal(product) {
  if (!productModal || !productModalContent) {
    return;
  }

  const productImages = getProductImages(product);
  let activeImageIndex = 0;

  productModalContent.innerHTML = `
    <div class="product-modal-body">
      <div class="product-modal-image-wrap">
        <div class="product-modal-gallery">
          <button class="product-modal-gallery-button product-modal-gallery-prev" type="button" aria-label="Previous image" ${productImages.length < 2 ? "disabled" : ""}>
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <img src="${productImages[0]}" class="product-modal-image" alt="${product.name} - image 1" />
          <button class="product-modal-gallery-button product-modal-gallery-next" type="button" aria-label="Next image" ${productImages.length < 2 ? "disabled" : ""}>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
        ${productImages.length > 1 ? `<div class="product-modal-dots" role="tablist" aria-label="Product images">${productImages.map((_, index) => `<button type="button" class="product-modal-dot${index === 0 ? " is-active" : ""}" data-image-index="${index}" aria-label="Show image ${index + 1}"></button>`).join("")}</div>` : ""}
      </div>
      <div class="product-modal-text">
        <p class="product-modal-label">কোড: ${product.code}</p>
        <h3 id="productModalTitle">${product.name}</h3>
        <p class="product-modal-price">৳${product.price.toLocaleString()}</p>
        <p class="product-modal-description">${product.description}</p>
        <button class="btn btn-order-card fizzy-btn" type="button" data-modal-product-code="${product.code}">
          <span class="btn-text">
            <i class="fa-solid fa-cart-plus"></i>
            Order now
          </span>
        </button>
      </div>
    </div>
  `;

  const modalImage = productModalContent.querySelector(".product-modal-image");
  const galleryDots = Array.from(productModalContent.querySelectorAll(".product-modal-dot"));
  const updateModalImage = (nextIndex) => {
    activeImageIndex = (nextIndex + productImages.length) % productImages.length;
    modalImage.src = productImages[activeImageIndex];
    modalImage.alt = `${product.name} - image ${activeImageIndex + 1}`;
    galleryDots.forEach((dot, index) => dot.classList.toggle("is-active", index === activeImageIndex));
  };

  productModalContent.querySelector(".product-modal-gallery-prev")?.addEventListener("click", () => updateModalImage(activeImageIndex - 1));
  productModalContent.querySelector(".product-modal-gallery-next")?.addEventListener("click", () => updateModalImage(activeImageIndex + 1));
  galleryDots.forEach((dot) => dot.addEventListener("click", () => updateModalImage(Number(dot.dataset.imageIndex))));

  const modalCartButton = productModalContent.querySelector("[data-modal-product-code]");
  modalCartButton?.addEventListener("click", () => {
    const selected = products.find((item) => item.code === product.code);

    if (selected) {
      const existingItem = cart.find((item) => item.code === selected.code);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ ...selected, quantity: 1 });
      }

      updateOrderPreview();
      updateTotalPrice();
      closeProductModal();
      document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
    }
  });

  productModal.classList.add("is-open");
  productModal.setAttribute("aria-hidden", "false");
}

function closeProductModal() {
  if (!productModal || !productModalContent) {
    return;
  }

  productModal.classList.remove("is-open");
  productModal.setAttribute("aria-hidden", "true");
  productModalContent.innerHTML = "";
}

function renderProducts() {
  if (!productGrid) {
    return;
  }

  productGrid.innerHTML = products
    .map(
      (product) => `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="card h-100 product-card" data-product-code="${product.code}" tabindex="0" role="button" aria-label="View ${product.name}">
            <img src="${product.image}" class="card-img-top" alt="${product.name}" />
            <div class="card-body d-flex flex-column">
              <div class="product-meta">
                <span class="product-code">কোড: ${product.code}</span>
              </div>
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text text-muted">${product.description}</p>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <span class="price">৳${product.price.toLocaleString()}</span>
              </div>
              <button class="btn btn-order-card fizzy-btn" type="button" data-product-code="${product.code}">
                <span class="btn-text">
                  <i class="fa-solid fa-cart-plus"></i>
                  Order now
                </span>
              </button>
            </div>
          </div>
        </div>
      `
    )
    .join("");

  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest(".btn-order-card")) {
        return;
      }

      const selected = products.find((product) => product.code === card.dataset.productCode);

      if (selected) {
        openProductModal(selected);
      }
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const selected = products.find((product) => product.code === card.dataset.productCode);

        if (selected) {
          openProductModal(selected);
        }
      }
    });
  });

  const orderButtons = document.querySelectorAll(".btn-order-card[data-product-code]");
  orderButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const selected = products.find((product) => product.code === button.dataset.productCode);

      if (selected) {
        const existingItem = cart.find((item) => item.code === selected.code);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({ ...selected, quantity: 1 });
        }

        updateOrderPreview();
        updateTotalPrice();
        document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error("Unable to load products.");
    }

    const serverProducts = await readJsonResponse(response);
    products = serverProducts.length ? serverProducts : [...defaultProducts];
    renderProducts();

    if (adminProductTableBody) {
      renderAdminProducts();
    }
  } catch (error) {
    products = [...defaultProducts];
    renderProducts();

    if (adminProductTableBody) {
      renderAdminProducts();
    }
  }
}

function resetProductForm() {
  if (!productForm) {
    return;
  }

  productForm.reset();

  if (productIdField) {
    productIdField.value = "";
  }

  if (productFormSubmitButton) {
    productFormSubmitButton.textContent = "Add Product";
  }
}

function setProductFormMode(product) {
  if (!productForm || !productIdField) {
    return;
  }

  productIdField.value = product.id;
  productForm.elements.name.value = product.name;
  productForm.elements.code.value = product.code;
  productForm.elements.price.value = product.price;
  productForm.elements.description.value = product.description || "";

  if (productForm.elements.imageFiles) {
    productForm.elements.imageFiles.value = "";
  }

  updateSelectedImagesPreview();

  if (productFormSubmitButton) {
    productFormSubmitButton.textContent = "Update Product";
  }

  productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderAdminProducts() {
  if (!adminProductTableBody) {
    return;
  }

  adminProductTableBody.innerHTML = products
    .map(
      (product, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${product.name}</td>
          <td>${product.code}</td>
          <td>৳${product.price.toLocaleString()}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img src="${product.image}" alt="${product.name}" width="48" height="48" style="object-fit: cover; border-radius: 8px;" />
              <span>${getProductImages(product).length} image${getProductImages(product).length === 1 ? "" : "s"}</span>
            </div>
          </td>
          <td>${product.description || "-"}</td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" type="button" data-move-product="up" data-product-id="${product.id}" ${index === 0 ? "disabled" : ""}>
                <i class="fa-solid fa-arrow-up"></i>
              </button>
              <button class="btn btn-sm btn-outline-secondary" type="button" data-move-product="down" data-product-id="${product.id}" ${index === products.length - 1 ? "disabled" : ""}>
                <i class="fa-solid fa-arrow-down"></i>
              </button>
            </div>
          </td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary" type="button" data-edit-product="${product.id}">Edit</button>
              <button class="btn btn-sm btn-outline-danger" type="button" data-delete-product="${product.id}">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

async function handleProductFormSubmit(event) {
  event.preventDefault();

  if (!productForm) {
    return;
  }

  const formData = new FormData(productForm);
  const payload = {
    name: formData.get("name")?.trim(),
    code: formData.get("code")?.trim(),
    price: Number(formData.get("price") || 0),
    description: formData.get("description")?.trim() || "",
  };

  const imageFiles = formData.getAll("imageFiles");

  if (!payload.name || !payload.code || !payload.price) {
    window.alert("Please fill in product name, code, and price.");
    return;
  }

  try {
    const isEditing = Boolean(productIdField?.value);
    const requestUrl = isEditing ? `/api/products/${productIdField.value}` : "/api/products";
    const method = isEditing ? "PATCH" : "POST";

    const requestBody = new FormData();
    requestBody.append("name", payload.name);
    requestBody.append("code", payload.code);
    requestBody.append("price", String(payload.price));
    requestBody.append("description", payload.description);

    imageFiles.forEach((imageFile) => {
      if (imageFile && imageFile.size > 0) {
        requestBody.append("imageFiles", imageFile);
      }
    });

    const response = await fetch(requestUrl, {
      method,
      body: requestBody,
    });

    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.message || "Unable to save product.");
    }

    resetProductForm();
    await loadProducts();
    window.alert(result.message || "Product saved successfully.");
  } catch (error) {
    window.alert(error.message);
  }
}

function initProductManagement() {
  if (!productForm) {
    return;
  }

  productForm.addEventListener("submit", handleProductFormSubmit);

  if (resetProductFormButton) {
    resetProductFormButton.addEventListener("click", resetProductForm);
  }

  adminProductTableBody.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit-product]");
    const deleteButton = event.target.closest("[data-delete-product]");
    const moveButton = event.target.closest("[data-move-product]");

    if (editButton) {
      const product = products.find((item) => item.id === editButton.dataset.editProduct);

      if (product) {
        setProductFormMode(product);
      }

      return;
    }

    if (deleteButton) {
      const productId = deleteButton.dataset.deleteProduct;

      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: "DELETE",
        });

        const result = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(result.message || "Unable to delete product.");
        }

        await loadProducts();
        resetProductForm();
      } catch (error) {
        window.alert(error.message);
      }

      return;
    }

    if (moveButton) {
      const productId = moveButton.dataset.productId;
      const direction = moveButton.dataset.moveProduct;

      try {
        const response = await fetch(`/api/products/${productId}/move`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ direction }),
        });

        const result = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(result.message || "Unable to reorder product.");
        }

        await loadProducts();
      } catch (error) {
        window.alert(error.message);
      }
    }
  });

  resetProductForm();
}

async function handleOrderSubmit(event) {
  event.preventDefault();

  if (!cart.length) {
    formMessage.textContent = "অন্তত একটি পণ্য কার্টে যোগ করুন।";
    formMessage.className = "mt-3 text-center text-danger fw-semibold";
    return;
  }

  const formData = new FormData(orderForm);
  const payload = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    saree: cart.map((item) => `${item.name} (${item.code}) x${item.quantity}`).join(", "),
    quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
    items: cart.map((item) => ({
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      price: item.price,
    })),
    subtotal: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + getSelectedDeliveryFee(),
    address: formData.get("address"),
    deliveryType: getSelectedDeliveryType(),
    deliveryFee: getSelectedDeliveryFee(),
  };

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.message || "Unable to submit order.");
    }

    formMessage.textContent = result.message;
    formMessage.className = "mt-3 text-center text-success fw-semibold";
    orderForm.reset();
    cart.length = 0;
    updateOrderPreview();
    updateTotalPrice();
    showOrderSuccessState();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.className = "mt-3 text-center text-danger fw-semibold";
  }
}

function updateOrderOverview(orders) {
  const counts = {
    new: 0,
    "on hold": 0,
    confirmed: 0,
    delivered: 0,
  };

  orders.forEach((order) => {
    if (counts[order.status] !== undefined) {
      counts[order.status] += 1;
    } else {
      counts.new += 1;
    }
  });

  if (overviewTotalOrders) {
    overviewTotalOrders.textContent = String(orders.length);
  }

  if (overviewNewOrders) {
    overviewNewOrders.textContent = String(counts.new);
  }

  if (overviewOnHoldOrders) {
    overviewOnHoldOrders.textContent = String(counts["on hold"]);
  }

  if (overviewConfirmedOrders) {
    overviewConfirmedOrders.textContent = String(counts.confirmed);
  }

  if (overviewDeliveredOrders) {
    overviewDeliveredOrders.textContent = String(counts.delivered);
  }
}

function initAdminOrderPage() {
  if (!adminTableBody) {
    return;
  }

  adminTableBody.addEventListener("change", async (event) => {
    if (event.target.matches(".order-status-select")) {
      const orderId = event.target.dataset.orderId;
      const status = event.target.value;

      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        const result = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(result.message || "Unable to update order status.");
        }

        await loadAdminOrders();
      } catch (error) {
        window.alert(error.message);
      }
    }
  });

  adminTableBody.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-id]");

    if (!deleteButton) {
      return;
    }

    const orderId = deleteButton.dataset.deleteId;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete order.");
      }

      await loadAdminOrders();
    } catch (error) {
      window.alert(error.message);
    }
  });

  if (deleteSelectedOrdersButton) {
    deleteSelectedOrdersButton.addEventListener("click", async () => {
      const selectedCheckboxes = adminTableBody.querySelectorAll(".order-select-checkbox:checked");
      const selectedIds = Array.from(selectedCheckboxes).map((checkbox) => checkbox.dataset.orderId);

      if (!selectedIds.length) {
        return;
      }

      try {
        for (const orderId of selectedIds) {
          const response = await fetch(`/api/orders/${orderId}`, {
            method: "DELETE",
          });

          const result = await readJsonResponse(response);

          if (!response.ok) {
            throw new Error(result.message || "Unable to delete selected orders.");
          }
        }

        await loadAdminOrders();
      } catch (error) {
        window.alert(error.message);
      }
    });
  }

  if (selectAllOrdersCheckbox) {
    selectAllOrdersCheckbox.addEventListener("change", () => {
      const isChecked = selectAllOrdersCheckbox.checked;
      adminTableBody.querySelectorAll(".order-select-checkbox").forEach((checkbox) => {
        checkbox.checked = isChecked;
      });
    });
  }

  async function loadAdminOrders() {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Unable to load orders.");
      }

      const orders = await readJsonResponse(response);

      updateOrderOverview(orders);

      if (!orders.length) {
        adminTableBody.innerHTML = `
          <tr>
            <td colspan="9" class="text-center text-muted">No orders yet.</td>
          </tr>
        `;

        if (adminOrderCount) {
          adminOrderCount.textContent = "0 orders";
        }

        if (selectAllOrdersCheckbox) {
          selectAllOrdersCheckbox.checked = false;
        }

        return;
      }

      adminTableBody.innerHTML = orders
        .map(
          (order) => `
            <tr>
              <td><input type="checkbox" class="order-select-checkbox" data-order-id="${order.id}" /></td>
              <td>${order.id}</td>
              <td><div class="order-cell-primary">${order.name}</div></td>
              <td><div class="order-cell-primary">${order.phone}</div></td>
              <td><div class="order-cell-address">${order.address}</div></td>
              <td>
                <div class="order-line-items">
                  ${(order.items || []).length
                    ? order.items.map((item) => `<div class="order-line-item"><span>${item.name} × ${item.quantity}</span><small>৳${Number(item.price || 0).toLocaleString()} each</small></div>`).join("")
                    : `<div class="order-line-item"><span>${order.saree || "-"}</span><small>Quantity: ${order.quantity || 1}</small></div>`}
                </div>
              </td>
              <td>${order.quantity}</td>
              <td>
                <div class="order-total-cell">
                  <strong>৳${Number(order.totalAmount || 0).toLocaleString()} BDT</strong>
                  <small>৳${Number(order.subtotal || 0).toLocaleString()} + ৳${Number(order.deliveryFee || 0).toLocaleString()} delivery</small>
                </div>
              </td>
              <td>
                <select class="form-select form-select-sm order-status-select" data-order-id="${order.id}">
                  <option value="new" ${order.status === "new" ? "selected" : ""}>new</option>
                  <option value="on hold" ${order.status === "on hold" ? "selected" : ""}>on hold</option>
                  <option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>confirmed</option>
                  <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>delivered</option>
                </select>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-danger" type="button" data-delete-id="${order.id}">
                  Delete
                </button>
              </td>
            </tr>
          `
        )
        .join("");

      if (adminOrderCount) {
        adminOrderCount.textContent = `${orders.length} orders`;
      }

      if (selectAllOrdersCheckbox) {
        selectAllOrdersCheckbox.checked = false;
      }
    } catch (error) {
      adminTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-danger">Failed to load orders.</td>
        </tr>
      `;
    }
  }

  loadAdminOrders();
  window.setInterval(loadAdminOrders, 10000);
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", attemptAdminLogin);
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener("click", logoutAdmin);
}

if (orderForm) {
  orderForm.addEventListener("submit", handleOrderSubmit);
}

if (deliveryTypeInputs.length) {
  deliveryTypeInputs.forEach((input) => {
    input.addEventListener("change", updateTotalPrice);
  });
}

if (imageFilesInput) {
  imageFilesInput.addEventListener("change", updateSelectedImagesPreview);
}

if (productModalClose) {
  productModalClose.addEventListener("click", closeProductModal);
}

if (productModalBackdrop) {
  productModalBackdrop.addEventListener("click", closeProductModal);
}

setAdminAuthState(localStorage.getItem(ADMIN_AUTH_KEY) === "true");
loadProducts();
updateOrderPreview();
initProductManagement();
initAdminOrderPage();

if (typeof gsap !== "undefined") {
  gsap.from(".hero h1", { duration: 1, y: 40, opacity: 0, ease: "power2.out" });
  gsap.from(".hero .lead", { duration: 1.1, y: 30, opacity: 0, delay: 0.1, ease: "power2.out" });
  gsap.from(".floating-card", { duration: 1.2, x: 40, opacity: 0, delay: 0.15, ease: "power2.out" });
}
