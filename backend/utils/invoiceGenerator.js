const PDFDocument = require('pdfkit');
const path = require('path');

/**
 * Generate a maintenance payment invoice PDF
 * @param {object} payment - Payment document
 * @param {object} user - User document
 * @param {object} res - Express response (pipes directly)
 */
const generateInvoicePDF = (payment, user, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Pipe to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice_${payment._id}.pdf`);
  doc.pipe(res);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const primaryColor = '#4F46E5';
  const grayColor = '#6B7280';
  const darkColor = '#111827';

  // ── Header ────────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
  doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('Smart Society ERP', 50, 30);
  doc.fontSize(10).font('Helvetica').text('Maintenance Invoice', 50, 60);
  doc.fillColor('white').fontSize(10).text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 400, 30, { align: 'right' });

  // ── Invoice ID ────────────────────────────────────────────────────────────
  doc.moveDown(4).fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
  doc.fillColor(grayColor).fontSize(9).font('Helvetica').text(`#INV-${payment._id.toString().slice(-8).toUpperCase()}`, { align: 'right' });

  // ── Divider ────────────────────────────────────────────────────────────────
  doc.moveDown(1).strokeColor(primaryColor).lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // ── Resident Info ──────────────────────────────────────────────────────────
  const infoY = doc.y;
  doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text('Billed To:', 50, infoY);
  doc.fontSize(10).font('Helvetica').fillColor(grayColor)
    .text(user.name, 50, infoY + 18)
    .text(`Flat: ${user.wing ? `${user.wing}-` : ''}${user.flatNumber || 'N/A'}`, 50, infoY + 34)
    .text(user.email, 50, infoY + 50);

  doc.fontSize(11).font('Helvetica-Bold').fillColor(darkColor).text('Payment Period:', 350, infoY);
  doc.fontSize(10).font('Helvetica').fillColor(grayColor)
    .text(`${months[payment.month - 1]} ${payment.year}`, 350, infoY + 18)
    .text(`Status: ${payment.status.toUpperCase()}`, 350, infoY + 34)
    .text(`Paid on: ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-IN') : 'N/A'}`, 350, infoY + 50);

  doc.moveDown(5);

  // ── Table Header ───────────────────────────────────────────────────────────
  const tableTop = doc.y + 10;
  doc.rect(50, tableTop, 495, 28).fill('#F3F4F6');
  doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold')
    .text('Description', 60, tableTop + 8)
    .text('Period', 260, tableTop + 8)
    .text('Amount', 450, tableTop + 8);

  // ── Table Row ──────────────────────────────────────────────────────────────
  const rowY = tableTop + 36;
  doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, rowY - 4).lineTo(545, rowY - 4).stroke();
  doc.fillColor(grayColor).fontSize(10).font('Helvetica')
    .text('Society Maintenance Fee', 60, rowY)
    .text(`${months[payment.month - 1]} ${payment.year}`, 260, rowY)
    .text(`₹${payment.amount?.toLocaleString('en-IN')}`, 450, rowY);

  // Late fee if applicable
  let yAfterRows = rowY + 24;
  if (payment.lateFee && payment.lateFee > 0) {
    doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, yAfterRows - 4).lineTo(545, yAfterRows - 4).stroke();
    doc.fillColor('#DC2626').fontSize(10).font('Helvetica')
      .text('Late Payment Fee', 60, yAfterRows)
      .text('After 10th of month', 260, yAfterRows)
      .text(`₹${payment.lateFee?.toLocaleString('en-IN')}`, 450, yAfterRows);
    yAfterRows += 24;
  }

  // ── Total ──────────────────────────────────────────────────────────────────
  doc.rect(350, yAfterRows + 4, 195, 30).fill(primaryColor);
  const totalAmount = (payment.amount || 0) + (payment.lateFee || 0);
  doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
    .text(`Total: ₹${totalAmount.toLocaleString('en-IN')}`, 360, yAfterRows + 12);

  // ── Payment Details ────────────────────────────────────────────────────────
  doc.moveDown(4).strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1).fillColor(grayColor).fontSize(9).font('Helvetica');

  if (payment.razorpayPaymentId) {
    doc.text(`Payment ID: ${payment.razorpayPaymentId}`, 50);
    doc.text(`Order ID: ${payment.razorpayOrderId}`, 50);
  }
  doc.text(`Receipt No: ${payment.receipt || payment._id}`, 50);

  // ── Footer ─────────────────────────────────────────────────────────────────
  doc.fontSize(8).fillColor(grayColor)
    .text('This is a computer-generated invoice and does not require a signature.', 50, 720, { align: 'center' })
    .text('Smart Society ERP System | For queries contact your society admin', 50, 733, { align: 'center' });

  doc.end();
};

module.exports = { generateInvoicePDF };
