const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    // define your method to get cart data
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    // define your method to get inventory data
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    // define your method to update an item in cart
  };

  const deleteFromCart = (id) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
    }).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }
    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }

  return {
    State,
    ...API,
  };
})();

const View = (() => {
  // implement your logic for View
  const inventoryEl = document.querySelector(".inventory__list");
  const cartEl = document.querySelector(".cart__list");
  const checkoutEl = document.querySelector(".checkout-btn");

  const renderInventory = (inventory) => {
    let inventoryTemplate = "";
    inventory.forEach((item) => {
      const inventoryItem = `<li id=${item.id} class="item__card">
              <div class="item__content">
                <span>${item.content}</span>
                <div class="qty-btn-container">
                  <button class="minus-btn" data-id="${item.id}">-</button>
                  <span class="qty-span" data-id="${item.id}">1</span>
                  <button class="plus-btn" data-id="${item.id}">+</button>
                </div>
                <button class="add-btn" data-id="${item.id}">add to cart</button>
              </div>
            </li>`;
            inventoryTemplate += inventoryItem;
    });

    inventoryEl.innerHTML = inventoryTemplate;
  };

  const renderCart = (cart) => {
    let cartTemplate = "";
    cart.forEach((item) => {
      const cartItem = `<li class="item__card">
                <div class="item__content">
                  <span>${item.content} x ${item.quantity}</span>
                  <button class="delete-btn" data-id="${item.id}">delete</button>
                  <button class="edit-btn" data-id="${item.id}">edit</button>
                </div>
              </li>`;
      cartTemplate += cartItem;
    });
  
    cartEl.innerHTML = cartTemplate;
  };

  return {
    renderInventory,
    renderCart,
    inventoryEl,
    checkoutEl
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleAddToCart = (event) => {
    const target = event.target;

    if (target.classList.contains("add-btn")) {
      const itemId = target.getAttribute("data-id");

      const qtySpan = document.querySelector(`.qty-span[data-id="${itemId}"]`);
      const quantity = parseInt(qtySpan.textContent, 10);

      const selectedItem = state.inventory.find(item => item.id == itemId);

      if (selectedItem) {
        const cartItem = {
          id: selectedItem.id,
          content: selectedItem.content,
          quantity: quantity
        };

        API.addToCart(cartItem).then(() => {
          console.log(`Added to cart: ${selectedItem.content} x ${quantity}`);
          
          const updatedCart = [...state.cart, cartItem];
          state.cart = updatedCart;
        });
      }
    }
  };

  const handleEdit = () => {};

  const handleEditAmount = (event) => {
    const target = event.target;
    if (target.classList.contains("plus-btn") || target.classList.contains("minus-btn")) {
      const itemId = target.getAttribute("data-id");
      const qtySpan = document.querySelector(`.qty-span[data-id="${itemId}"]`);
      let currentQty = parseInt(qtySpan.textContent, 10);

      if (target.classList.contains("plus-btn")) {
        currentQty++;
      } else if (target.classList.contains("minus-btn") && currentQty > 1) {
        currentQty--;
      }

      qtySpan.textContent = currentQty;
    }
  };

  const handleDelete = (event) => {
    const target = event.target;

    if (target.classList.contains("delete-btn")) {
      const itemId = target.getAttribute("data-id");
  
      API.deleteFromCart(itemId).then(() => {
        console.log(`Deleted item with ID: ${itemId}`);

        const updatedCart = state.cart.filter(item => item.id !== itemId);
        state.cart = updatedCart;
      });
    }
  };

  const handleCheckout = () => {
    API.checkout().then(() => {
      console.log("All items removed from cart.");
      state.cart = [];
    });
  };

  const init = () => {
    state.subscribe(() => {
      View.renderInventory(state.inventory);
      View.renderCart(state.cart);
    });

    API.getInventory().then((data) => {
      state.inventory = data;
    });
    API.getCart().then((cartData) => {
      state.cart = cartData;
    });

    View.inventoryEl.addEventListener("click", handleEditAmount);
    View.inventoryEl.addEventListener("click", handleAddToCart);
    View.checkoutEl.addEventListener("click", handleCheckout);
    View.cartEl.addEventListener("click", handleDelete);
  };

  return {
    init,
  };
})(Model, View);

Controller.init();
