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
    const homeButton = document.querySelectorAll('#nav_barr .home');
    const place_order = document.querySelector('#basket .confirmer_l_ordre')
    
    // --- Price mappings (Global) ---
    const sup_05 = ["mayonnaise", "ketchup", "zaatar", "algerienne", "pinky"];
    const sup_10 = ["Rodeo 33cl"];
    const sup_15 = ["Rodeo 50cl"];
    const sup_20 = ["Jus d'orange", "Jus de banane", "fries"];


    // auto scroll 
    function autoScroll() {

        const carousel = document.getElementById('new_products');
        const productItems = carousel.querySelectorAll('li');

        // Check if there are any items
        if (productItems.length > 0) {
            // Get the width of a single item (this is '100%' of the container width)
            const itemWidth = productItems[0].offsetWidth;
            let scrollPosition = 0;

            // Set an interval for scrolling (e.g., every 3 seconds)
            const intervalTime = 2000;

            // Declare autoScroll variable outside so both events can access it
            let autoScroll = null;
            let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            // Function to start autoscroll
            function startAutoScroll() {
                if (!autoScroll) {
                    autoScroll = setInterval(() => {
                        scrollPosition += itemWidth;
                        if (scrollPosition > (carousel.scrollWidth - itemWidth)) {
                            scrollPosition = 0;
                        }
                        carousel.scroll({
                            left: scrollPosition,
                            behavior: 'smooth'
                        });
                    }, intervalTime);
                }
            }

            // Function to stop autoscroll
            function stopAutoScroll() {
                if (autoScroll) {
                    clearInterval(autoScroll);
                    autoScroll = null;
                }
            }

            startAutoScroll();

            // For mouse devices
            
            if (!isTouchDevice) {
                console.log("pc")
                carousel.addEventListener('mouseenter', stopAutoScroll , { passive: true });
                carousel.addEventListener('mouseleave', startAutoScroll , { passive: true });
            } 
            // For touch devices
            else {
                console.log("touch")
                carousel.addEventListener('touchstart', stopAutoScroll , { passive: true } );
                carousel.addEventListener('touchend', () => {
                    // Delay restart to give user time to interact
                    setTimeout(startAutoScroll, 1000); // Resume after 2 seconds
                } , { passive: true });
            }

        }
    }
    // order confirmation process 
    function restAll() {

        document.querySelector("#basket .order_details").innerHTML = '';
        document.querySelector("#basket .order_total_price").innerText = '0 €';
        document.querySelector("#nav_barr .number_of_items_in_basket p").innerText = '0';

        const inputs = document.querySelectorAll("#basket .client-info input") ;

        inputs.forEach( input => {
            input.value = '';
        })

    }

    function confirmOrder() {
            
        // 1. Validate Inputs
        const name = document.getElementById("client_name").value;
        const phone = document.getElementById("client_phone").value;
        const address = document.getElementById("client_address").value;
        const email_adress = document.getElementById("client_email").value;

        if(!name || !phone || !address) {
            alert("Please fill in your Name, Phone, and Address!");
            return;
        }

        if(total_order.length === 0) {
            alert("Your basket is empty!");
            return;
        }

        // 2. Format the Basket Data into a String
        let orderDetailsText = "";
        total_order.forEach((item, index) => {
            orderDetailsText += `${index + 1}. ${item.itemNme} (${item.meatCooking})\n`;
            if ( item.sauceChoisis.length > 2 ) {
                orderDetailsText += `      - Sauce choisis : ${item.sauceChoisis}\n`
            }
            // Add supplements if they exist
            orderDetailsText += `      - Supplements : \n`
            if ( Object.keys(item.supplements).length == 0 ) {
                { orderDetailsText += `               + None\n` }
            }
            else {
                for (const [key, val] of Object.entries(item.supplements)) {
                    if(val > 0) orderDetailsText += `               + ${key} x${val}\n`;
                }
            }

            // Add extras if they exist
            orderDetailsText += `      - Extras : \n`
            if ( Object.keys(item.extras).length == 0 ) {
                { orderDetailsText += `               + None\n` }
            }
            else {
                for (const [key, val] of Object.entries(item.extras)) {
                    if(val > 0) orderDetailsText += `               + ${key} x${val}\n`;
                }
            }
            
            orderDetailsText += `Price: ${item.total} €\n----------------\n`;
        });

        // 3. Prepare Data for EmailJS
        const templateParams = {
            from_name: name,
            phone_number: phone,
            email : email_adress ,
            address: address,
            order_details: orderDetailsText,
            total_price: document.querySelector(".order_total_price").innerText
        };

        // Show loading status
        const statusText = document.getElementById("order-status");
        statusText.style.display = "block";
        statusText.innerText = "Processing order...";

        // 4. Send the Email
        // Replace 'service_...' and 'template_...' with your actual IDs
        emailjs.send('service.client.rh.taste', 'template_bjy3z56', templateParams)
            .then(function(response) {
                console.log('SUCCESS!', response.status, response.text);
                
                // Success UI
                alert("Order Placed Successfully! We will contact you shortly.");
                
                // Clear Basket and Inputs
                total_order = [];
                document.getElementById("client_name").value = "";
                document.getElementById("client_phone").value = "";
                document.getElementById("client_address").value = "";
                statusText.style.display = "none";
                
                // Update UI
                restAll()
                closeBasket();
                
            }, function(error) {
                console.log('FAILED...', error);
                alert("Failed to send order. Please call us directly.");
                statusText.style.display = "none";
            });
    }
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



        document.querySelector('.number_of_items_in_basket p').innerText = total_order.length

        let total = 0 ;
        total_order.forEach( item => {
            total+= item.total
        })

        document.querySelector('#basket .order_total_price').innerText = total +" €"

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
            if ( item.meatCooking.length < 1 ) {
                basketdiv.innerHTML +=  `
                    <h2 class="choice">Order ${index}: ${item.itemNme+item.itemCount}<span class="price"=>${item.total} $</span></h2>`
            }
            else {
                basketdiv.innerHTML +=  `
                    <h2 class="choice">Order ${index}: ${item.itemNme+item.itemCount}<span class="price"=>${item.total} $</span></h2>
                    <details class="order_details">
                        <summary>View Details</summary>
                        <div class="resume_ordre">
                            ${type}
                            <p class="titre">Supplements : </p> <ul>${suppsList}</ul>
                            <p class="titre">Extras : </p> <ul>${extrasList}</ul>
                        </div>
                    </details>`;
            }
            
        

        const details_basket = document.querySelectorAll("details")

        
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

        place_order.addEventListener('click' , () => {
            confirmOrder()
        })
    }

    function closeBasket() {
        if (basket) {
            basket.style.display = "none";
            if (overlay) overlay.style.display = "none";
        }
        
        const details_basket = document.querySelectorAll("details")

        
        if ( details_basket ) {
            details_basket.forEach(det => {
                
                det.open = false;
                        
            });
        }
    }

    // --- HOME BUTTON (Always active) ---
    function setupHomeButton() {
        if ( homeButton) {
            homeButton.forEach( button => {

            button.addEventListener('click', () => {
                fetch('../ejs/home.ejs')
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

                        closeOthersPopup()
                        
                        // Reinitialize navigation
                        setupNavigation();

                        autoScroll();
                        
                        // Reset scrolling
                        body.style.overflow = '';
                    })
                    .catch(error => console.error('Error loading home page:', error));
            });

            })
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

                fetch("../ejs/"+fileName)
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

                        closeOthersPopup()
                        
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
        } else {
            setupOthersLogic()
        }
    }

    // scroll over to the required element missing
    function scrollToRequired(selector) {
        const popUp = document.querySelector(".pop_up")

        const el = document.querySelector(selector);
        if (!el) return;
  
        const headerOffset = 80; // height of fixed header
        let y = el.getBoundingClientRect().top - popUp.getBoundingClientRect().top + popUp.scrollTop;

  
        popUp.scrollTo({
            top: y-30,
            behavior: "smooth"
        });


    }

    // --- QuantityPopUp MANAGEMENT (Temporary - tied to current page) ---
    function openOthersPopup( QpopUp, itemTitle, basePrice) {

        if (!QpopUp) return;
        
        // Initialize current selection
        currentSelection = {
            itemNme: itemTitle,
            meatCooking: '',
            sauceChoisis: "",
            priceSize: 0,
            supplements: {},
            extras: {},
            total: parseFloat(basePrice),
            itemCount: ''
        };
        
        body.style.overflow = 'hidden';
        if (overlay) overlay.style.display = "block";
        QpopUp.style.display = 'grid';

        // Setup initial  display
        const total = QpopUp.querySelector('.total');
        if (total) {
            total.textContent = currentSelection.total.toFixed(2) + " €";
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
            total: parseFloat(basePrice),
            itemCount: ''
        };
        
        body.style.overflow = 'hidden';
        if (overlay) overlay.style.display = "block";
        popUp.style.display = 'grid';
        popUp.removeEventListener('transitionend', closePopupHandler);
        popUp.style.transform = 'translateY(0%)';
        
        // Setup initial resume display
        const resumeDiv = popUp.querySelector('.resume');
        if (resumeDiv) {
            resumeDiv.querySelector('.total').textContent = currentSelection.total.toFixed(2) + " €";
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

    function closeOthersPopup() {

        const popUp = document.querySelector('.quantity_popup');

        if (popUp) {
            popUp.style.display = 'none';
        }

        if (overlay) overlay.style.display = "none";
        currentSelection = null; // Clear current selection
    }

    // OTHERS LOGICS  
    function setupOthersLogic() {


        const othersItems = document.querySelectorAll('#item_menu > div');
        const quantity_popUp = document.querySelector('.quantity_popup');
        
        if (!quantity_popUp || !othersItems.length) return;

        // Handle Clicks Outside of Pop-up
        document.addEventListener('click', (event) => {
            const target = event.target; 
            const isItem = target.closest('#item_menu > div'); 
        
            if (quantity_popUp.style.display === 'grid' && 
                !quantity_popUp.contains(target) &&
                !isItem) {
                    
                    closeOthersPopup()
                }
            })

        othersItems.forEach(item => {



            item.addEventListener('click', () => {
                const title = item.querySelector('.title').innerText
                    .replace(item.querySelector('.title span').innerText, '')
                    .trim();
                const priceText = item.querySelector('.prix').innerText;
                
                openOthersPopup(quantity_popUp, title, priceText);
                setupOthersPopupLogic(quantity_popUp);
            });
        });
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
                
            closePopup(); 
        }
        })

        burgerItems.forEach(item => {
            item.addEventListener('click', () => {
                const title = "Burger " + item.querySelector('.title').innerText
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
                
            closePopup(); 
        }
        })

        tacoItems.forEach(item => {
            item.addEventListener('click', () => {
                const title = "Tacos " +item.querySelector('.title').innerText
                    .replace(item.querySelector('.title span').innerText, '')
                    .trim();
                const priceText = item.querySelector('.prix').innerText;
                
                openPopup(popUp, title, priceText);
                setupPopupLogic(popUp, 'taco');
            });
        });
    }

    function setupOthersPopupLogic(popUp) {

        if (!popUp || !currentSelection) return;
        
        // Setup quantity selectors
        setupQuantitySelectors(popUp);

        
        // Setup confirmation button
        const confirmButton = popUp.querySelector('.confirmer_les_choix');
        if (confirmButton) {


            // Remove any existing listeners
            const newConfirmButton = confirmButton.cloneNode(true);
            confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
            
            newConfirmButton.addEventListener('click', () => {

                let all_good = true ;

                if (currentSelection && all_good) {
                    // Add to global orders
                    total_order.push({...currentSelection});
                    
                    // Update basket display
                    updateBasketDisplay(currentSelection);
                    
                    
                    
                    alert(`Order for ${currentSelection.itemNme} confirmed! Added to basket!`);
                    
                    // Close popup
                    closeOthersPopup()
                }
            });
        }
        
        // Initial resume update
        updateResume(popUp);
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
                let all_good = true ;
                // verify required choices , ( Tacos sauce , Tacos size , meat cook )
                if ( type == 'taco') {
                    if ( !currentSelection.sauceChoisis ) {
                        // block confirmation 
                        all_good = false
                        //alert that you have to choice a sauce 
                        alert('Vous avez oublié de choisir une sauce !')
                        //rescroll to the sauces section
                        const section_title ="#containner_tacos .tacos_sauce_title"
                        scrollToRequired(section_title)
                        }
                        else {
                            //allow confirmation if all is good 
                            all_good = true
                        }
                    }

                if (currentSelection && all_good) {
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

    function setupQuantitySelectors(element) {
        
        const quantitySelectors = element.querySelectorAll('.quantity-selector');
        
        // Clear any existing event listeners by cloning and replacing
        quantitySelectors.forEach(selector => {
            const newSelector = selector.cloneNode(true);
            selector.parentNode.replaceChild(newSelector, selector);
        });
        
        // Get fresh references after cloning
        const freshSelectors = element.querySelectorAll('.quantity-selector');
        
        freshSelectors.forEach(selector => {
            const name = getItemNameFromData(selector);
            const category = determineCategory(name, element);
            let itemPrice = getExtraPrice(name);
            const others_name = currentSelection.itemNme;

            if (!itemPrice) {
                itemPrice = currentSelection.total;
            }
            
            if (currentSelection.meatCooking.length < 1 && currentSelection) {
                let item_count = parseFloat(others_name);
                const quantitySpan = selector.querySelector('.quantity');
                const minusButton = selector.querySelector('.minus');
                const plusButton = selector.querySelector('.plus');
                
                if (!item_count) {
                    item_count = 1;
                }

                // Set initial display
                quantitySpan.textContent = item_count;
                
                // Plus button
                plusButton.addEventListener('click', () => {
                    let quantity = parseInt(quantitySpan.textContent);
                    quantity++;
                    
                    // Update price if it's an extra
                    if (itemPrice > 0) {
                        currentSelection.total += itemPrice;
                    }
                    
                    quantitySpan.textContent = quantity;
                    currentSelection.itemCount = " x " + quantity + " $";
                    updateResume(element);
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
                        currentSelection.itemCount = "x" + quantity + "$";
                        updateResume(element);
                    }
                });
            }

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
                    updateResume(element);
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
                        updateResume(element);
                    }
                });
            }
        });
    }

    function updateResume(popUp) {
        if (!popUp || !currentSelection) return;


        // update total for others
        const other_elements_total = document.querySelector('.quantity_popup .total')
        if ( other_elements_total ) {
            console.log(currentSelection.total)
            other_elements_total.textContent = currentSelection.total + " €";
        }

        
        const resumeDiv = popUp.querySelector('.resume');
        if ( resumeDiv) {
        
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
                totalEl.textContent = currentSelection.total.toFixed(2) + " €";
            }

        }

    }

    // --- INITIAL SETUP ---
    function initialize() {

        fetch('../ejs/home.ejs')
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

                        closeOthersPopup()
                        
                        // Reinitialize navigation
                        setupNavigation();

                        autoScroll();
                        
                        // Reset scrolling
                        body.style.overflow = '';
                    })
                    .catch(error => console.error('Error loading home page:', error));
            
        
        // Setup basket toggle
        if (basket_button) {
            basket_button.addEventListener('click', openBasket);
        }
        
        // Close basket when clicking outside
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            if (basket && basket.style.display === 'grid' && 
                !basket.contains(target) &&
                target !== basket_button && 
                !basket_button.contains(target)) {
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

        
        // Disable scroll restoration
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
        
        // Setup initial navigation
        setupNavigation();
        

    }

    // Start everything
    initialize();
    // Setup always-active elements
    setupHomeButton();
});