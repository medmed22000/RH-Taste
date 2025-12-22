document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE (Persistent) ---
    let total_order = []; // Stores all confirmed orders
    let currentSelection = null; // Only exists when customizing an item
    const body = document.body;
    
    // --- GLOBAL ELEMENTS (Always present) ---
    const overlay = document.getElementById('overlay');
    const basket = document.getElementById('basket');
    const basket_button = document.querySelector('.basket_icon');
    const basketdiv = basket ? basket.querySelector('div') : null;
    const homeButton = document.querySelector('#home');
    
    // --- Price mappings (Global) ---
    const sup_05 = ["mayonnaise", "ketchup", "zaatar", "algerienne", "pinky"];
    const sup_10 = ["Rodeo 33cl"];
    const sup_15 = ["Rodeo 50cl"];
    const sup_20 = ["Jus d'orange", "Jus de banane", "fries"];

    // --- UTILITY FUNCTIONS (Global) ---
    
    function getItemNameFromData(itemSelector) {
        const containerDiv = itemSelector.closest('[data-name]');
        return containerDiv ? containerDiv.dataset.name : null;
    }

    function getTacosSizePrice(name) {
        if (name == "S") return -1;
        if (name == "M") return 0;
        if (name == "L") return 2;
        if (name == "XL") return 3.5;
        return 0;
    }

    function getExtraPrice(name) {
        if (sup_05.includes(name)) return 0.5;
        if (sup_10.includes(name)) return 1.0;
        if (sup_15.includes(name)) return 1.5;
        if (sup_20.includes(name)) return 2.0;
        return 0;
    }

    function determineCategory(name, contextElement) {
        const itemElement = contextElement ? contextElement.querySelector(`[data-name="${name}"]`) : null;
        if (itemElement && itemElement.closest('.supplements')) {
            return 'supplements';
        }
        return 'extras';
    }

    // --- BASKET MANAGEMENT (Always active) ---
    
    function updateBasketDisplay(item) {



        document.querySelector('.number_of_items_in_basket').innerText = total_order.length

        let total = 0 ;
        total_order.forEach( item => {
            total+= item.total
        })

        document.querySelector('#basket .order_total_price').innerText = total +"$"

        // --- Clear previous content ---
        let nextEl = basketdiv.nextElementSibling;
        while(nextEl) {
            let temp = nextEl.nextElementSibling;
            if (nextEl.classList.contains('choice') || nextEl.tagName === 'DETAILS') {
                nextEl.remove();
            }
            nextEl = temp;
        }
        
        // Render the current total_order array

        const index = total_order.length ;
        
            
            // Render Supplements (using the new supplements object)
            let suppsList = '';
            for (const [sup, count] of Object.entries(item.supplements)) {
                if (count > 0) {
                    suppsList += `<li>${sup.charAt(0).toUpperCase() + sup.slice(1)} x ${count}</li>`;
                }
            }
            if (!suppsList) suppsList = '<li>N/A</li>';

            // Render Extras (using the extras object)
            let extrasList = '';
            for (const [ext, count] of Object.entries(item.extras)) {
                if (count > 0) {
                    extrasList += `<li>${ext.charAt(0).toUpperCase() + ext.slice(1)} x ${count}</li>`;
                }
            }

            let type = '' ;
            // Type of item : burger , tacos , dessert ...
            if ( document.querySelector("#sections h1").className == "burgers") {
                type = `<p class='titre'>Cuisson de viande : </p> <p class='meat_cook_resume'>${item.meatCooking}</p>`
            }

            else if ( document.querySelector("#sections h1").className == "tacos") {
                type = `<p class='titre'>Taille du Tacos : </p> <p class='meat_cook_resume'>${item.meatCooking}</p>
                        <p class='titre'>Sauce choisis : </p> <p class='sauce'>${item.sauceChoisis}</p>`
            }

            // Insert new order items after the H1 title
            basketdiv.innerHTML +=  `
                <h2 class="choice">Order ${index}: ${item.itemNme}<span class="price"=>${item.total} $</span></h2>
                <details class="order_details">
                    <summary>View Details</summary>
                    <div class="resume_ordre">
                        ${type}
                        <p class="titre">Supplements : </p> <ul>${suppsList}</ul>
                        <p class="titre">Extras : </p> <ul>${extrasList}</ul>
                    </div>
                </details>`;
        

        const details_basket = document.querySelectorAll("details")
        console.log(details_basket)

        if ( details_basket ) {
            details_basket.forEach(det => {
                det.addEventListener('toggle', () => {
                    
                    if (det.open) {
                        details_basket.forEach(dett => {
                            if (dett !== det) dett.open = false;
                        });
                    }
                });
            });
        }

    }

    function renderBasketItems() {
        basket.style.display = "grid";
        overlay.style.display = "block"; // Show Overlay
    }

    function openBasket() {
        if (basket) {
            basket.style.display = "grid";
            if (overlay) overlay.style.display = "block";
            renderBasketItems(); // Ensure basket is updated when opened
        }
    }

    function closeBasket() {
        if (basket) {
            basket.style.display = "none";
            if (overlay) overlay.style.display = "none";
        }
    }


    // --- NAVIGATION (For loading pages) ---
    function setupNavigation() {
        

        const categories_div = document.querySelectorAll("#menus > div");
        
        categories_div.forEach(div => {
            div.addEventListener('click', () => {
                let name = div.querySelector("div").className;
                let fileName = name;
                if (name === "burgers") fileName = "burger";
                fileName = fileName + ".ejs";

                fetch(fileName)
                    .then(response => {
                        if (!response.ok) throw new Error("Page not found");
                        return response.text();
                    })
                    .then(html => {
                        document.getElementById('containner').innerHTML = html;
                        
                        // Close any open popup
                        closePopup();
                        
                        // Close basket if open
                        closeBasket();
                        
                        // Setup page-specific logic
                        setupPageSpecificLogic();
                        window.scrollTo(0, 0);
                    })
                    .catch(error => console.error('Error loading page:', error));
            });
        });
    }

    // --- PAGE-SPECIFIC LOGIC (Temporary - resets with page change) ---
    function setupPageSpecificLogic() {
        const currentPage = document.querySelector("#sections h1");
        if (!currentPage) return;

        currentSelection = null; // Reset current selection

        if (currentPage.classList.contains("burgers")) {
            setupBurgerLogic();
        } else if (currentPage.classList.contains("tacos")) {
            setupTacosLogic();
        }
    }

    // --- POPUP MANAGEMENT (Temporary - tied to current page) ---
    function openPopup(popUp, itemTitle, basePrice) {
        if (!popUp) return;
        
        // Initialize current selection
        currentSelection = {
            itemNme: itemTitle,
            meatCooking: 'Grilled',
            sauceChoisis: "",
            priceSize: 0,
            supplements: {},
            extras: {},
            total: parseFloat(basePrice)
        };
        
        body.style.overflow = 'hidden';
        if (overlay) overlay.style.display = "block";
        popUp.style.display = 'grid';
        popUp.removeEventListener('transitionend', closePopupHandler);
        popUp.style.transform = 'translateY(0%)';
        
        // Setup initial resume display
        const resumeDiv = popUp.querySelector('.resume');
        if (resumeDiv) {
            resumeDiv.querySelector('.total').textContent = currentSelection.total.toFixed(2) + "$";
        }
    }

    function closePopupHandler() {
        const popUp = document.querySelector('.pop_up');
        if (popUp) {
            popUp.style.display = 'none';
            popUp.removeEventListener('transitionend', closePopupHandler);
        }
        body.style.overflow = '';
        if (overlay) overlay.style.display = "none";
    }

    function closePopup() {
        const popUp = document.querySelector('.pop_up');
        if (popUp) {
            popUp.scrollTop = 0;
            popUp.style.transform = 'translateY(100%)';
            popUp.addEventListener('transitionend', closePopupHandler, { once: true });
        }
        currentSelection = null; // Clear current selection
    }

    // --- BURGER LOGIC (Page-specific) ---
    function setupBurgerLogic() {
        const burgerItems = document.querySelectorAll('#item_menu > div');
        const popUp = document.querySelector('.pop_up');
        
        if (!popUp || !burgerItems.length) return;

        // Handle Clicks Outside of Pop-up
        document.addEventListener('click', (event) => {
            const target = event.target; 
            const isBurgerItem = target.closest('#item_menu > div'); 
        
            if (popUp.style.display === 'grid' && 
                !popUp.contains(target) &&
                !isBurgerItem) {
                
            closePopUp(); 
        }
        })

        burgerItems.forEach(item => {
            item.addEventListener('click', () => {
                const title = item.querySelector('.title').innerText
                    .replace(item.querySelector('.title span').innerText, '')
                    .trim();
                const priceText = item.querySelector('.prix').innerText;
                
                openPopup(popUp, title, priceText);
                setupPopupLogic(popUp, 'burger');
            });
        });
    }

    // --- TACOS LOGIC (Page-specific) ---
    function setupTacosLogic() {
        const tacoItems = document.querySelectorAll('#item_menu > div');
        const popUp = document.querySelector('.pop_up');
        
        if (!popUp || !tacoItems.length) return;

        // Handle Clicks Outside of Pop-up
        document.addEventListener('click', (event) => {
            const target = event.target; 
            const isBurgerItem = target.closest('#item_menu > div'); 
        
            if (popUp.style.display === 'grid' && 
                !popUp.contains(target) &&
                !isBurgerItem) {
                
            closePopUp(); 
        }
        })

        tacoItems.forEach(item => {
            item.addEventListener('click', () => {
                const title = item.querySelector('.title').innerText
                    .replace(item.querySelector('.title span').innerText, '')
                    .trim();
                const priceText = item.querySelector('.prix').innerText;
                
                openPopup(popUp, title, priceText);
                setupPopupLogic(popUp, 'taco');
            });
        });
    }

    // --- POPUP LOGIC (Shared for burger and taco) ---
    function setupPopupLogic(popUp, type) {
        if (!popUp || !currentSelection) return;
        
        // Setup meat cooking/size options
        const meatCookOptions = popUp.querySelectorAll('.meat_cook > div');
        if (meatCookOptions.length) {
            // Set default selection
            meatCookOptions.forEach(opt => opt.classList.remove('selected'));
            const defaultOption = type === 'taco' ? 
                meatCookOptions[meatCookOptions.length - 1] : // Last for taco (M size)
                meatCookOptions[0]; // First for burger (Grilled)
                
            defaultOption.classList.add('selected');
            currentSelection.meatCooking = defaultOption.querySelector('p').textContent.trim();
            
            if (type === 'taco') {
                currentSelection.priceSize = getTacosSizePrice(currentSelection.meatCooking);
                currentSelection.total += currentSelection.priceSize;
            }
            
            // Add event listeners
            meatCookOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const oldValue = currentSelection.meatCooking;
                    const oldPrice = type === 'taco' ? getTacosSizePrice(oldValue) : 0;
                    
                    meatCookOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    
                    const newValue = option.querySelector('p').textContent.trim();
                    currentSelection.meatCooking = newValue;
                    
                    if (type === 'taco') {
                        const newPrice = getTacosSizePrice(newValue);
                        currentSelection.priceSize = newPrice;
                        currentSelection.total = currentSelection.total - oldPrice + newPrice;
                        updateResume(popUp);
                    } else {
                        updateResume(popUp);
                    }
                });
            });
        }
        
        // Setup sauce selection (for tacos)
        if (type === 'taco') {
            const radioSauce = popUp.querySelectorAll('.tacos_sauce > div');
            if (radioSauce.length) {
                radioSauce.forEach(sauce => {
                    const radioInput = sauce.querySelector('input');
                    sauce.addEventListener('click', () => {
                        radioSauce.forEach(otherSauce => {
                            if (otherSauce !== sauce) {
                                otherSauce.querySelector('input').checked = false;
                            }
                        });
                        radioInput.checked = true;
                        currentSelection.sauceChoisis = radioInput.value;
                        updateResume(popUp);
                    });
                });
            }
        }
        
        // Setup quantity selectors
        setupQuantitySelectors(popUp);
        
        // Setup confirmation button
        const confirmButton = popUp.querySelector('.confirmer_les_choix');
        if (confirmButton) {
            // Remove any existing listeners
            const newConfirmButton = confirmButton.cloneNode(true);
            confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
            
            newConfirmButton.addEventListener('click', () => {
                if (currentSelection) {
                    // Add to global orders
                    total_order.push({...currentSelection});
                    
                    // Update basket display
                    updateBasketDisplay(currentSelection);
                    
                    
                    
                    alert(`Order for ${currentSelection.itemNme} confirmed! Added to basket!`);
                    
                    // Close popup
                    closePopup();
                }
            });
        }
        
        // Initial resume update
        updateResume(popUp);
    }

    function setupQuantitySelectors(popUp) {
        const quantitySelectors = popUp.querySelectorAll('.quantity-selector');
        
        quantitySelectors.forEach(selector => {
            const name = getItemNameFromData(selector);
            const category = determineCategory(name, popUp);
            const itemPrice = getExtraPrice(name);
            
            if (name && currentSelection) {
                // Initialize in current selection
                if (currentSelection[category][name] === undefined) {
                    currentSelection[category][name] = 0;
                }
                
                const quantitySpan = selector.querySelector('.quantity');
                const minusButton = selector.querySelector('.minus');
                const plusButton = selector.querySelector('.plus');
                
                // Set initial display
                quantitySpan.textContent = currentSelection[category][name];
                
                // Plus button
                plusButton.addEventListener('click', () => {
                    let quantity = parseInt(quantitySpan.textContent);
                    quantity++;
                    
                    // Update price if it's an extra
                    if (itemPrice > 0) {
                        currentSelection.total += itemPrice;
                    }
                    
                    quantitySpan.textContent = quantity;
                    currentSelection[category][name] = quantity;
                    updateResume(popUp);
                });
                
                // Minus button
                minusButton.addEventListener('click', () => {
                    let quantity = parseInt(quantitySpan.textContent);
                    if (quantity > 0) {
                        quantity--;
                        
                        // Update price if it's an extra
                        if (itemPrice > 0) {
                            currentSelection.total -= itemPrice;
                        }
                        
                        quantitySpan.textContent = quantity;
                        currentSelection[category][name] = quantity;
                        updateResume(popUp);
                    }
                });
            }
        });
    }

    function updateResume(popUp) {
        if (!popUp || !currentSelection) return;
        
        const resumeDiv = popUp.querySelector('.resume');
        if (!resumeDiv) return;
        
        // Update meat cooking/size
        const meatCookingP = resumeDiv.querySelector('.meat_cook_resume');
        if (meatCookingP) {
            meatCookingP.textContent = currentSelection.meatCooking;
        }
        
        // Update sauce (for tacos)
        const sauceChoisis = resumeDiv.querySelector('.sauce');
        if (sauceChoisis) {
            sauceChoisis.textContent = currentSelection.sauceChoisis || '';
        }
        
        // Update supplements
        const supplementsUl = resumeDiv.querySelector('ul:nth-of-type(1)');
        if (supplementsUl) {
            let suppsList = [];
            for (const [name, quantity] of Object.entries(currentSelection.supplements)) {
                if (quantity > 0) {
                    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
                    suppsList.push(`<li>${displayName} x${quantity}</li>`);
                }
            }
            supplementsUl.innerHTML = suppsList.join('') || '<li>N/A</li>';
        }
        
        // Update extras
        const extrasUl = resumeDiv.querySelector('ul:nth-of-type(2)');
        if (extrasUl) {
            let extrasList = [];
            for (const [name, quantity] of Object.entries(currentSelection.extras)) {
                if (quantity > 0) {
                    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
                    extrasList.push(`<li>${displayName} x${quantity}</li>`);
                }
            }
            extrasUl.innerHTML = extrasList.join('') || '<li>N/A</li>';
        }
        
        // Update total
        const totalEl = resumeDiv.querySelector('.total');
        if (totalEl) {
            totalEl.textContent = currentSelection.total.toFixed(2) + "$";
        }
    }

    // --- EVENT DELEGATION APPROACH ---
function setupGlobalEventListeners() {
    
    
    // Use event delegation for basket button (attached to document)
    document.addEventListener('click', (event) => {
        const target = event.target;
        
        // Check if click is on basket button or its children
        if (target.closest('.basket_icon')) {
            openBasket();
            return;
        }
        
        // Close basket when clicking outside
        if (basket && basket.style.display === 'grid' && 
            !basket.contains(target) &&
            !target.closest('.basket_icon')) {
            closeBasket();
        }
        
        // Close popup when clicking outside
        const popUp = document.querySelector('.pop_up');
        if (popUp && popUp.style.display === 'grid' && 
            !popUp.contains(target) &&
            !target.closest('#item_menu > div')) {
            closePopup();
        }
    });
}

// Then in your initialize function:
function initialize() {
    setupGlobalEventListeners();
    
    // Disable scroll restoration
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    
    // Setup initial navigation
    setupNavigation();
}

// And update setupHomeButton to:
function setupHomeButton() {
    const homebutton = document.querySelector('#home')   // Use event delegation for home button too
    homebutton.addEventListener('click', (event) => {

        console.log(total_order.length)
        document.querySelector('.number_of_items_in_basket').innerText = total_order.length
        

            fetch('index.ejs')
                .then(response => {
                    if (!response.ok) throw new Error("Home page not found");
                    return response.text();
                })
                .then(html => {
                    document.getElementById('containner').innerHTML = html;
                    
                    // Close any open popup
                    closePopup();
                    
                    // Close basket if open
                    closeBasket();
                    
                    // Reinitialize navigation
                    setupNavigation();
                    
                    // Reset scrolling
                    body.style.overflow = '';
                })
                .catch(error => console.error('Error loading home page:', error));
    });
}

initialize()
setupHomeButton()
});