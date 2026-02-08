// 1. CONFIGURATION
const CONFIG = {
  sheetId: '16xjB-m-m7TQlyDNpn8aGInDgA8k65s5LjLAUlgzTVFs',
  docId: '1Iu8IrU3_LPFnxnfIO9rrqtQnStv2fd6OvT1LH5iaQTc',
  folderId: '1WdmGAZQlNp89VKCnVcJrlxx8KFs9kjqX'
};

// ==========================================
// 2. API ENDPOINTS (The "Door" for Localhost)
// ==========================================

function doGet(e) {
  // Check if we are asking for data
  if (e.parameter && e.parameter.action === 'getCatalog') {
    return ContentService.createTextOutput(JSON.stringify(getCatalog()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: Show the Web App (Fallback)
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('TradeLite Store')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    // 1. Parse Data
    var data = JSON.parse(e.postData.contents);

    // 2. Log Order
    logOrderToDB(data);

    // 3. Generate Invoice & Email (The New Features)
    var pdfFile = createInvoice(data);
    sendInvoiceEmail(data, pdfFile);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 3. BACKEND LOGIC (Invoice & Email)
// ==========================================

function createInvoice(order) {
  // 1. Get Template and Destination Folder
  var template = DriveApp.getFileById(CONFIG.docId);
  var folder = DriveApp.getFolderById(CONFIG.folderId);

  // 2. Make a Copy of the Template
  var copy = template.makeCopy('Invoice_' + order.orderId, folder);
  var doc = DocumentApp.openById(copy.getId());
  var body = doc.getBody();

  // 3. Replace Placeholders (Simple Text Replacement)
  body.replaceText('{{Date}}', new Date().toLocaleDateString());
  body.replaceText('{{CustomerName}}', order.customerName);
  body.replaceText('{{OrderID}}', order.orderId);
  body.replaceText('{{Total}}', '$' + order.totalAmount);

  // 4. List Items
  var itemsList = "";
  order.items.forEach(item => {
    itemsList += item.name + " x" + (item.qty || 1) + " - $" + item.price + "\n";
  });
  body.replaceText('{{Items}}', itemsList);

  // 5. Save & Convert to PDF
  doc.saveAndClose();
  var pdf = copy.getAs(MimeType.PDF);
  var pdfFile = folder.createFile(pdf);

  // 6. Delete the temp doc to keep Drive clean
  copy.setTrashed(true);

  return pdfFile;
}

function sendInvoiceEmail(order, pdfFile) {
  // For demo, we email the Owner (You). 
  // To email customer, ask for email in frontend and use order.email
  var email = Session.getEffectiveUser().getEmail();

  MailApp.sendEmail({
    to: email,
    subject: "Order Invoice: " + order.orderId,
    body: "Hi " + order.customerName + ",\n\nThank you for your order! Please find your invoice attached.\n\nTotal: $" + order.totalAmount,
    attachments: [pdfFile]
  });
}

/**
 * HELPER: Include HTML Fragments
 * Allows us to split our HTML into multiple files (css.html, js.html)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}
