/**
 * API: GET CATALOG
 * This function is called by the WEBSITE (index.html).
 * It acts as a bridge: parameters -> Controller -> Database
 */
function getCatalog() {
    try {
        const products = getProductsFromDB();
        // Return success response
        return { success: true, data: products };
    } catch (error) {
        // Return error if something breaks
        return { success: false, error: error.toString() };
    }
}

/**
 * API: SUBMIT ORDER
 * Called when a user completes a checkout via WhatsApp.
 * We want to log it even though the transaction happens on WhatsApp,
 * so we have a record in our "Orders" sheet.
 */
function submitOrder(orderData) {
    try {
        logOrderToDB(orderData);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}
