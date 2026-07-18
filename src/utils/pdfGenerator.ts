import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { formatCurrency, formatDate } from './helpers';


interface InvoiceItem {
  product_name: string;
  brand?: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  date: string | Date;
  gst_enabled: boolean;
  gst_rate: number;
  gst_amount: number;
  discount: number;
  subtotal: number;
  total: number;
  invoice_items: InvoiceItem[];
}

export const pdfGenerator = {
  /**
   * Compiles invoice data into a styled HTML template and prints it to a local PDF file.
   */
  async generateInvoicePdf(invoice: InvoiceData): Promise<{ uri: string }> {
    // 1. Determine if we should display the Brand column
    const hasBrand = invoice.invoice_items.some(
      item => item.brand !== undefined && item.brand !== null && item.brand.trim() !== ''
    );

    // 2. Determine if discount exists
    const hasDiscount = invoice.discount > 0;

    // 3. Determine if GST is active
    const hasGst = invoice.gst_enabled && invoice.gst_amount > 0;

    // Build items rows
    const itemsHtml = invoice.invoice_items
      .map((item, index) => {
        return `
        <tr class="item-row">
          <td class="center">${index + 1}</td>
          <td class="desc">
            <div class="item-name">${item.product_name}</div>
          </td>
          ${hasBrand ? `<td>${item.brand || '-'}</td>` : ''}
          <td class="center">${item.quantity}</td>
          <td class="right">${formatCurrency(item.price)}</td>
          <td class="right bold">${formatCurrency(item.total)}</td>
        </tr>
      `;
      })
      .join('');

    // Compile entire invoice page HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 30px;
            font-size: 13px;
            line-height: 1.5;
            background-color: #ffffff;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .header-left {
            width: 60%;
            vertical-align: top;
          }
          .header-right {
            width: 40%;
            text-align: right;
            vertical-align: top;
          }
          .header-brand-center {
            text-align: center;
            width: 100%;
            margin-bottom: 15px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: 1px;
            margin: 0 0 5px 0;
            text-align: center;
          }
          .brand-subtitle {
            font-size: 11px;
            font-weight: 600;
            color: #d97706;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 10px 0;
          }
          .company-details {
            font-size: 11px;
            color: #64748b;
            line-height: 1.4;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: 300;
            color: #64748b;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-label {
            font-weight: 600;
            color: #1e293b;
            font-size: 11px;
            text-transform: uppercase;
          }
          .meta-value {
            color: #475569;
            margin-bottom: 5px;
          }
          .divider {
            border-bottom: 2px solid #f1f5f9;
            margin: 20px 0;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .details-column {
            width: 50%;
            vertical-align: top;
          }
          .details-header {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .details-body {
            line-height: 1.5;
            color: #334155;
          }
          .details-name {
            font-size: 14px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 4px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            text-align: left;
            border: none;
          }
          .items-table th.center {
            text-align: center;
          }
          .items-table th.right {
            text-align: right;
          }
          .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          .items-table td.center {
            text-align: center;
          }
          .items-table td.right {
            text-align: right;
          }
          .items-table td.bold {
            font-weight: 600;
          }
          .item-name {
            font-weight: 600;
            color: #1e293b;
          }
          .summary-table {
            width: 40%;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .summary-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
          }
          .summary-table tr:last-child td {
            border-bottom: 2px solid #1e293b;
            padding-top: 12px;
            font-size: 15px;
          }
          .summary-label {
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 600;
          }
          .summary-value {
            text-align: right;
            font-weight: 600;
            color: #1e293b;
          }
          .summary-grand {
            color: #d97706 !important;
            font-weight: 800 !important;
          }
          .footer-section {
            margin-top: 50px;
            text-align: center;
            color: #94a3b8;
            font-size: 11px;
            border-top: 1px solid #f1f5f9;
            padding-top: 20px;
          }
          .footer-thanks {
            font-size: 14px;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 5px;
          }
          .signature-box {
            width: 200px;
            margin-left: auto;
            margin-top: 50px;
            text-align: center;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            font-size: 11px;
            color: #475569;
            font-weight: 600;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <!-- Top Centered Brand Title -->
          <div class="header-brand-center">
            <div class="brand-title">AH&S BILLING</div>
          </div>
          <!-- Header block -->
          <table class="header-table">
            <tr>
              <td class="header-left">
                <div class="brand-subtitle">Ahmad Hasan & Sons Handloom</div>
                <div class="company-details">
                  Wholesale & Retail of Towel, Lungi, Rumal, Gamcha, Shawl and etc<br>
                  Proprietor: Ahmad Hasan & Sons<br>
                  Contact: +91 9309732378 
                </div>
              </td>
              <td class="header-right">
                <div class="invoice-title">INVOICE</div>
                <div class="meta-label">Invoice No</div>
                <div class="meta-value" style="font-weight: 700; color: #1e293b;">${invoice.invoice_number}</div>
                <div class="meta-label">Date & Time</div>
                <div class="meta-value">${formatDate(invoice.date)}</div>
              </td>
            </tr>
          </table>

          <div class="divider"></div>

          <!-- Billing address block -->
          <table class="details-table">
            <tr>
              <td class="details-column">
                <div class="details-header">Bill To:</div>
                <div class="details-body">
                  <div class="details-name">${invoice.customer_name}</div>
                  ${invoice.customer_phone ? `<div>Phone: ${invoice.customer_phone}</div>` : ''}
                  ${invoice.customer_address ? `<div>Address: ${invoice.customer_address}</div>` : ''}
                </div>
              </td>
              <td class="details-column" style="text-align: right;">
                <div class="details-header">Authorized Agent:</div>
                <div class="details-body">
                  <div>AH&S Billing Desk</div>
                  <div>Mode: Digital Invoice</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th class="center" style="width: 50px;">S.No.</th>
                <th>Product Description</th>
                ${hasBrand ? '<th style="width: 150px;">Brand</th>' : ''}
                <th class="center" style="width: 80px;">Qty</th>
                <th class="right" style="width: 120px;">Rate</th>
                <th class="right" style="width: 130px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Invoice Summary -->
          <table class="summary-table">
            <tr>
              <td class="summary-label">Subtotal</td>
              <td class="summary-value">${formatCurrency(invoice.subtotal)}</td>
            </tr>
            
            ${hasDiscount
        ? `
            <tr>
              <td class="summary-label">Discount</td>
              <td class="summary-value" style="color: #e11d48;">-${formatCurrency(invoice.discount)}</td>
            </tr>
            `
        : ''
      }

            ${hasGst
        ? `
            <tr>
              <td class="summary-label">GST (${invoice.gst_rate}%)</td>
              <td class="summary-value">+${formatCurrency(invoice.gst_amount)}</td>
            </tr>
            `
        : ''
      }

            <tr>
              <td class="summary-label" style="font-weight: 700; color: #1e293b;">Grand Total</td>
              <td class="summary-value summary-grand">${formatCurrency(invoice.total)}</td>
            </tr>
          </table>

          <!-- Signature & Footer -->
          <div class="signature-box">
            For Ahmad Hasan & Sons 
          </div>

          <div class="footer-section">
            <div class="footer-thanks">Thank You For Your Visit!</div>
            <div>This is a computer-generated invoice and requires no physical signature.</div>
          </div>
        </div>
      </body>
      </html>
    `;

    return Print.printToFileAsync({ html: htmlContent });
  },

  /**
   * Opens the share dialog for sharing the compiled PDF file (supports WhatsApp, Email, etc.)
   */
  async shareInvoicePdf(fileUri: string, invoiceNumber: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this platform');
      }

      // Define safe destination filename in app document directory
      // This solves file read permission errors on Android and gives a neat shared filename
      const cleanInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_');
      const destinationUri = `${FileSystem.documentDirectory}${cleanInvoiceNumber}.pdf`;

      // Copy the temporary file to the document directory
      await FileSystem.copyAsync({
        from: fileUri,
        to: destinationUri,
      });

      await Sharing.shareAsync(destinationUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Invoice ${invoiceNumber}`,
        UTI: 'com.adobe.pdf',
      });
      return true;
    } catch (error) {
      console.error('Error sharing PDF:', error);
      return false;
    }
  },

  /**
   * Prompts the user to choose a directory on Android, then saves the file.
   * On iOS, uses Share sheet (which includes Save to Files) to save to location.
   */
  async saveInvoicePdfToCustomLocation(tempUri: string, invoiceNumber: string): Promise<string | null> {
    try {
      const cleanInvoiceNumber = invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '_');
      const fileName = `${cleanInvoiceNumber}`; // SAF createFileAsync appends mime type extension or handles it

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          throw new Error('Directory permission not granted. Cannot save PDF.');
        }

        // Android createFileAsync: takes folderUri, filename (without extension usually, but safe to supply name), mimeType
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/pdf'
        );

        const base64Content = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await FileSystem.writeAsStringAsync(fileUri, base64Content, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return fileUri;
      } else {
        // iOS or other - copy to local doc dir first and share
        const destinationUri = `${FileSystem.documentDirectory}${cleanInvoiceNumber}.pdf`;
        await FileSystem.copyAsync({
          from: tempUri,
          to: destinationUri,
        });

        await Sharing.shareAsync(destinationUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save Invoice ${invoiceNumber}`,
          UTI: 'com.adobe.pdf',
        });
        return destinationUri;
      }
    } catch (error) {
      console.error('Error saving PDF to custom location:', error);
      throw error;
    }
  },
};

