/* 1. CONFIGURATION */
const CONFIG = {
  sheetId: '16xjB-m-m7TQlyDNpn8aGInDgA8k65s5LjLAUlgzTVFs',
  docId: '1Iu8IrU3_LPFnxnfIO9rrqtQnStv2fd6OvT1LH5iaQTc',
  folderId: '1WdmGAZQlNp89VKCnVcJrlxx8KFs9kjqX'
};

/* 2. API ENDPOINTS (The "Door" for Localhost) */
function doGet(e) {
  // Check if we are asking for DATA
  if (e.parameter && e.parameter.action === 'getCatalog') {

    var data = JSON.stringify(getCatalog());
    var callback = e.parameter.callback;

    // --- JSONP SUPPORT (Bypasses CORS) ---
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + data + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    // -------------------------------------

    return ContentService.createTextOutput(data)
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default: Show the WEBSITE (Fallback)
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

    // 3. Generate Invoice & Email
    var pdfFile = createInvoice(data);
    sendInvoiceEmail(data, pdfFile);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* 3. INVOICE LOGIC */
function createInvoice(order) {
  var template = DriveApp.getFileById(CONFIG.docId);
  var folder = DriveApp.getFolderById(CONFIG.folderId);
  var copy = template.makeCopy('Invoice_' + order.orderId, folder);
  var doc = DocumentApp.openById(copy.getId());
  var body = doc.getBody();

  body.replaceText('{{Date}}', new Date().toLocaleDateString());
  body.replaceText('{{CustomerName}}', order.customerName);
  body.replaceText('{{OrderID}}', order.orderId);
  body.replaceText('{{Total}}', '$' + order.totalAmount);

  var itemsList = "";
  if (order.items) {
    order.items.forEach(item => {
      itemsList += item.name + " - $" + item.price + "\n";
    });
  }
  body.replaceText('{{Items}}', itemsList);

  doc.saveAndClose();
  var pdf = copy.getAs(MimeType.PDF);
  var pdfFile = folder.createFile(pdf);
  copy.setTrashed(true);
  return pdfFile;
}

function sendInvoiceEmail(order, pdfFile) {
  var email = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({
    to: email,
    subject: "Order Invoice: " + order.orderId,
    body: "Hi " + order.customerName + ",\n\nOrder Total: $" + order.totalAmount,
    attachments: [pdfFile]
  });
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
