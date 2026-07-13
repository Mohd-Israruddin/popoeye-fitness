const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const LOGO_PATH = path.join(__dirname, '../../public/popoeye-logo.jpeg');
const PAGE_MARGIN = 50;
const ACCENT_COLOR = '#2563EB';

function getServerUrl() {
  const url =
    process.env.SERVER_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.PUBLIC_API_URL ||
    (process.env.NODE_ENV !== 'production'
      ? `http://localhost:${process.env.PORT || 5000}`
      : '');

  if (!url) {
    console.error(
      '❌ SERVER_URL is not set. Add SERVER_URL=https://popoeye-fitness.onrender.com on Render.'
    );
    return 'https://popoeye-fitness.onrender.com';
  }

  return url.replace(/\/$/, '');
}

function getInvoiceUrl(memberId) {
  return `${getServerUrl()}/api/members/${memberId}/invoice`;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getInvoiceBranding() {
  return {
    gymName: process.env.GYM_NAME || 'Popoeye Fitness',
    email: process.env.INVOICE_EMAIL || 'popoeye.fitness@gmail.com',
    phone: process.env.INVOICE_PHONE || '6300946075',
    gstin: process.env.GSTIN || '36CAUPP4987R1Z4',
  };
}

function drawInvoiceContent(doc, member) {
  const branding = getInvoiceBranding();
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const pending = Number(member.total_amount || 0) - Number(member.paid_amount || 0);
  const invoiceNo = `INV-${member.member_id}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  let y = PAGE_MARGIN;

  // Logo — top center
  if (fs.existsSync(LOGO_PATH)) {
    const logoWidth = 72;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.image(LOGO_PATH, logoX, y, { width: logoWidth });
    y += logoWidth + 12;
  }

  // Gym name — centered below logo
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#111111');
  doc.text(branding.gymName, PAGE_MARGIN, y, { width: contentWidth, align: 'center' });
  y = doc.y + 14;

  // Contact — right aligned
  doc.font('Helvetica').fontSize(10).fillColor('#444444');
  doc.text(`Email: ${branding.email}`, PAGE_MARGIN, y, { width: contentWidth, align: 'right' });
  doc.text(`Number: ${branding.phone}`, PAGE_MARGIN, doc.y + 4, { width: contentWidth, align: 'right' });
  y = doc.y + 24;

  // Divider
  doc.moveTo(PAGE_MARGIN, y).lineTo(pageWidth - PAGE_MARGIN, y).strokeColor(ACCENT_COLOR).lineWidth(1).stroke();
  y += 20;

  // Invoice meta
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111');
  doc.text('Membership Invoice', PAGE_MARGIN, y);
  doc.font('Helvetica').fontSize(10).fillColor('#666666');
  doc.text(`Invoice No: ${invoiceNo}`, PAGE_MARGIN, doc.y + 6);
  doc.text(`Date: ${formatDate(new Date())}`, PAGE_MARGIN, doc.y + 4);
  y = doc.y + 22;

  const tableLeft = PAGE_MARGIN;
  const tableRight = pageWidth - PAGE_MARGIN;

  // Member & payment details
  const details = [
    ['Member ID', member.member_id || '—'],
    ['Name', member.name || '—'],
    ['Total Cost', formatCurrency(member.total_amount)],
    ['Payment Due', formatCurrency(pending)],
    ['Paid', formatCurrency(member.paid_amount)],
    ['Number', member.phone || '—'],
    ['Email', member.email || '—'],
  ];

  doc.font('Helvetica-Bold').fontSize(11).fillColor(ACCENT_COLOR);
  doc.text('Member Details', PAGE_MARGIN, y);
  y = doc.y + 10;

  const labelX = tableLeft + 10;
  const valueX = tableLeft + 130;

  details.forEach(([label, value], index) => {
    const isDue = label === 'Payment Due' && pending > 0;
    const bg = index % 2 === 0 ? '#f5f5f5' : '#ffffff';
    doc.rect(tableLeft, y - 2, contentWidth, 24).fill(bg);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333');
    doc.text(`${label}:`, labelX, y + 5, { width: 115, lineBreak: false });
    doc
      .font(isDue ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(isDue ? '#c0392b' : '#333333')
      .text(String(value), valueX, y + 5, { width: contentWidth - 140, lineBreak: false });
    y += 26;
  });

  // GSTIN — bottom of page
  const footerY = doc.page.height - PAGE_MARGIN - 20;
  doc.moveTo(PAGE_MARGIN, footerY - 12).lineTo(tableRight, footerY - 12).strokeColor('#dddddd').lineWidth(0.5).stroke();
  doc.font('Helvetica').fontSize(10).fillColor('#333333');
  doc.text(`GSTIN: ${branding.gstin}`, PAGE_MARGIN, footerY, {
    width: contentWidth,
    align: 'center',
  });
}

function generateMemberInvoicePdf(member, res) {
  const safeName = (member.name || 'member').replace(/[^\w\-]+/g, '_');
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="invoice-${safeName}-${member.member_id}.pdf"`
  );

  doc.pipe(res);
  drawInvoiceContent(doc, member);
  doc.end();
}

module.exports = {
  getServerUrl,
  getInvoiceUrl,
  generateMemberInvoicePdf,
};
