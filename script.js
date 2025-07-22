class CartApp {
    constructor() {
        this.cartId = 2;
        this.baseUrl = 'https://fakestoreapi.com';
        this.cartData = null;
        this.products = [];
        this.totalAmount = 0;
        
        this.initElements();
        this.bindEvents();
        this.loadCart();
    }
    
    initElements() {
        this.loadingEl = document.getElementById('loading');
        this.errorEl = document.getElementById('error');
        this.cartContainerEl = document.getElementById('cart-container');
        this.cartInfoEl = document.getElementById('cart-info');
        this.productsGridEl = document.getElementById('products-grid');
        this.totalAmountEl = document.getElementById('total-amount');
        this.retryBtn = document.getElementById('retry-btn');
    }
    
    bindEvents() {
        this.retryBtn.addEventListener('click', () => {
            this.loadCart();
        });
    }
    
    showLoading() {
        this.loadingEl.classList.remove('hidden');
        this.errorEl.classList.add('hidden');
        this.cartContainerEl.classList.add('hidden');
    }
    
    showError() {
        this.loadingEl.classList.add('hidden');
        this.errorEl.classList.remove('hidden');
        this.cartContainerEl.classList.add('hidden');
    }
    
    showCart() {
        this.loadingEl.classList.add('hidden');
        this.errorEl.classList.add('hidden');
        this.cartContainerEl.classList.remove('hidden');
    }
    
    async fetchCart() {
        try {
            const response = await fetch(`${this.baseUrl}/carts/${this.cartId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching cart:', error);
            throw error;
        }
    }
    
    async fetchProduct(productId) {
        try {
            const response = await fetch(`${this.baseUrl}/products/${productId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching product ${productId}:`, error);
            throw error;
        }
    }
    
    async loadCart() {
        this.showLoading();
        
        try {
            // Fetch cart data
            this.cartData = await this.fetchCart();
            
            // Display cart info
            this.displayCartInfo();
            
            // Show cart container
            this.showCart();
            
            // Create placeholder product cards
            this.createProductPlaceholders();
            
            // Fetch all product details concurrently
            await this.loadProducts();
            
        } catch (error) {
            console.error('Failed to load cart:', error);
            this.showError();
        }
    }
    
    displayCartInfo() {
        const cartDate = new Date(this.cartData.date).toLocaleDateString();
        const totalItems = this.cartData.products.reduce((sum, item) => sum + item.quantity, 0);
        
        this.cartInfoEl.innerHTML = `
            <p><strong>Date:</strong> ${cartDate}</p>
            <p><strong>Total Items:</strong> ${totalItems}</p>
            <p><strong>User ID:</strong> ${this.cartData.userId}</p>
        `;
    }
    
    createProductPlaceholders() {
        this.productsGridEl.innerHTML = '';
        
        this.cartData.products.forEach((cartItem, index) => {
            const placeholderCard = document.createElement('div');
            placeholderCard.className = 'product-card product-loading';
            placeholderCard.id = `product-${cartItem.productId}`;
            placeholderCard.innerHTML = `
                <div class="spinner"></div>
                <p>Loading product...</p>
            `;
            this.productsGridEl.appendChild(placeholderCard);
        });
    }
    
    async loadProducts() {
        this.totalAmount = 0;
        
        // Create promises for all product fetches
        const productPromises = this.cartData.products.map(async (cartItem) => {
            try {
                const product = await this.fetchProduct(cartItem.productId);
                return {
                    ...product,
                    quantity: cartItem.quantity,
                    totalPrice: product.price * cartItem.quantity
                };
            } catch (error) {
                console.error(`Failed to load product ${cartItem.productId}:`, error);
                return {
                    id: cartItem.productId,
                    title: 'Failed to load product',
                    price: 0,
                    image: '',
                    quantity: cartItem.quantity,
                    totalPrice: 0,
                    error: true
                };
            }
        });
        
        // Wait for all products to load
        this.products = await Promise.all(productPromises);
        
        // Display all products
        this.displayProducts();
        
        // Update total amount
        this.updateTotalAmount();
    }
    
    displayProducts() {
        this.products.forEach((product) => {
            const productCard = document.getElementById(`product-${product.id}`);
            
            if (product.error) {
                productCard.innerHTML = this.createErrorProductHTML(product);
                productCard.className = 'product-card error-product';
            } else {
                productCard.innerHTML = this.createProductHTML(product);
                productCard.className = 'product-card';
                
                // Add to total amount
                this.totalAmount += product.totalPrice;
            }
        });
    }
    
    createProductHTML(product) {
        return `
            <img src="${product.image}" alt="${product.title}" class="product-image" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzU3NjA2ZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">$${product.price.toFixed(2)} each</div>
            <div class="product-quantity">Qty: ${product.quantity}</div>
            <div class="product-total" style="margin-top: 10px; font-weight: bold; color: #2f3542;">
                Total: $${product.totalPrice.toFixed(2)}
            </div>
        `;
    }
    
    createErrorProductHTML(product) {
        return `
            <div style="text-align: center; color: #ff4757; padding: 20px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">❌</div>
                <h3>Failed to load product</h3>
                <p>Product ID: ${product.id}</p>
                <div class="product-quantity" style="margin-top: 10px;">Qty: ${product.quantity}</div>
            </div>
        `;
    }
    
    updateTotalAmount() {
        this.totalAmountEl.innerHTML = `
            <h3>Cart Total: $${this.totalAmount.toFixed(2)}</h3>
        `;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CartApp();
});