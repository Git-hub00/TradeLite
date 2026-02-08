/**
 * DB: READ PRODUCTS
 * Reads all rows from 'Products' sheet and returns them as a list of objects.
 * This is "Reading from the Database".
 */
function getProductsFromDB() {
    // 1. Open the Spreadsheet using the ID we saved in CONFIG
    const ss = SpreadsheetApp.openById(CONFIG.sheetId);

    // 2. Get the specific tab named 'Products'
    const sheet = ss.getSheetByName('Products');

    // 3. Get ALL data (rows and columns)
    const data = sheet.getDataRange().getValues();

    // 4. Separate Headers (Row 1) from Data (Row 2 onwards)
    // 'shift()' removes the first item from the array and returns it
    const headers = data.shift();

    // 5. Convert Array of Arrays into Array of Objects
    // Input:  [ ["P01", "Shirt"], ["P02", "Pants"] ]
    // Output: [ {id: "P01", name: "Shirt"}, {id: "P02", name: "Pants"} ]
    return data.map(row => {
        let product = {};
        headers.forEach((header, index) => {
            // Map the header name (e.g., 'price') to the value (e.g., 100)
            product[header] = row[index];
        });
        return product;
    });
}

/**
 * DB: WRITE ORDER
 * Appends a new order row to 'Orders' sheet.
 * This is "Writing to the Database".
 */
function logOrderToDB(order) {
    const ss = SpreadsheetApp.openById(CONFIG.sheetId);
    const sheet = ss.getSheetByName('Orders');

    // appendRow adds a new line at the bottom of the sheet
    sheet.appendRow([
        order.orderId,                  // Column A: Order ID
        new Date(),                     // Column B: Timestamp (Now)
        order.customerName,             // Column C: Customer Name
        order.customerPhone,            // Column D: Phone
        JSON.stringify(order.items),    // Column E: Cart Items (saved as text)
        order.totalAmount,              // Column F: Total Price
        'New'                           // Column G: Status (Default is 'New')
    ]);
}
