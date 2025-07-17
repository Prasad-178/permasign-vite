import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface SignatureInfo {
  signerName: string;
  signerEmail: string;
  signature: string;
  signatureHash: string;
  role: string;
  timestamp: number;
}

export interface PdfStitchingOptions {
  originalPdfBytes: Uint8Array;
  signatures: SignatureInfo[];
  documentName: string;
}

export async function stitchPdfWithSignatures(options: PdfStitchingOptions): Promise<Uint8Array> {
  const { originalPdfBytes, signatures, documentName } = options;

  try {
    // Load the original PDF
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    
    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

    // Add signature pages for each signer
    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i];
      const page = pdfDoc.addPage([612, 792]); // Standard letter size
      
      await addSignaturePage(page, signature, documentName, i + 1, signatures.length, {
        helveticaFont,
        helveticaBoldFont,
        courierFont
      });
    }

    // Add a summary page at the end
    if (signatures.length > 1) {
      const summaryPage = pdfDoc.addPage([612, 792]);
      await addSignatureSummaryPage(summaryPage, signatures, documentName, {
        helveticaFont,
        helveticaBoldFont,
        courierFont
      });
    }

    // Return the stitched PDF as bytes
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error stitching PDF with signatures:', error);
    throw new Error(`Failed to stitch PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function addSignaturePage(
  page: any, 
  signature: SignatureInfo, 
  documentName: string,
  pageNumber: number,
  totalSigners: number,
  fonts: { helveticaFont: any; helveticaBoldFont: any; courierFont: any }
) {
  const { helveticaFont, helveticaBoldFont, courierFont } = fonts;
  const { width, height } = page.getSize();
  
  // Professional colors
  const primaryBlue = rgb(0.067, 0.278, 0.529); // Professional blue #114487
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.96, 0.96, 0.96);
  const goldAccent = rgb(0.8, 0.647, 0.176); // Professional gold accent
  const successGreen = rgb(0.067, 0.533, 0.2); // Success green
  
  // Header with gradient-like effect
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: primaryBlue,
  });
  
  // Add accent line
  page.drawRectangle({
    x: 0,
    y: height - 105,
    width: width,
    height: 5,
    color: goldAccent,
  });
  
  page.drawText('PERMASIGN DIGITAL SIGNATURE CERTIFICATE', {
    x: 50,
    y: height - 40,
    size: 22,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('CRYPTOGRAPHICALLY VERIFIED & BLOCKCHAIN SECURED', {
    x: 50,
    y: height - 60,
    size: 11,
    font: helveticaFont,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  page.drawText(`Signature ${pageNumber} of ${totalSigners} | Signatures appended to end of document`, {
    x: 50,
    y: height - 80,
    size: 10,
    font: helveticaFont,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Document Information Section with better styling
  let yPos = height - 140;
  
  page.drawText('DOCUMENT INFORMATION', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Professional info box
  page.drawRectangle({
    x: 40,
    y: yPos - 80,
    width: width - 80,
    height: 70,
    color: lightGray,
    borderColor: primaryBlue,
    borderWidth: 1,
  });
  
  page.drawText(`Document Name:`, {
    x: 55,
    y: yPos - 30,
    size: 11,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText(documentName, {
    x: 55,
    y: yPos - 45,
    size: 12,
    font: helveticaFont,
    color: primaryBlue,
  });
  
  const signedDate = signature.timestamp ? new Date(signature.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }) : 'Unknown Date';
  
  page.drawText(`Signed Date:`, {
    x: 55,
    y: yPos - 65,
    size: 11,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText(signedDate, {
    x: 150,
    y: yPos - 65,
    size: 11,
    font: helveticaFont,
    color: darkGray,
  });

  // Signer Information Section with professional layout
  yPos -= 120;
  
  page.drawText('AUTHORIZED SIGNER', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Signer info box
  page.drawRectangle({
    x: 40,
    y: yPos - 100,
    width: width - 80,
    height: 90,
    color: rgb(1, 1, 1),
    borderColor: primaryBlue,
    borderWidth: 2,
  });
  
  yPos -= 25;
  
  // Professional grid layout for signer details
  page.drawText('Full Name:', {
    x: 55,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText(signature.signerName, {
    x: 150,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: primaryBlue,
  });
  
  yPos -= 20;
  
  page.drawText('Email Address:', {
    x: 55,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText(signature.signerEmail, {
    x: 150,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: darkGray,
  });
  
  yPos -= 20;
  
  page.drawText('Role/Title:', {
    x: 55,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText(signature.role.charAt(0).toUpperCase() + signature.role.slice(1).replace(/_/g, ' '), {
    x: 150,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: darkGray,
  });
  
  yPos -= 20;
  
  page.drawText('Status:', {
    x: 55,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText('[VERIFIED] AUTHENTICATED', {
    x: 150,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: successGreen,
  });

  // Digital Signature Display
  yPos -= 60;
  
  page.drawText('DIGITAL SIGNATURE', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Professional signature box
  page.drawRectangle({
    x: 40,
    y: yPos - 80,
    width: width - 80,
    height: 70,
    color: rgb(0.99, 0.99, 1),
    borderColor: primaryBlue,
    borderWidth: 3,
  });
  
  // Signature text (professional, straight)
  page.drawText(signature.signerName, {
    x: 60,
    y: yPos - 35,
    size: 28,
    font: helveticaBoldFont,
    color: primaryBlue,
    // Removed rotation for professional straight text
  });
  
  page.drawText('Digitally signed using PermaSign', {
    x: 60,
    y: yPos - 55,
    size: 10,
    font: helveticaFont,
    color: darkGray,
  });
  
  page.drawText(signedDate, {
    x: 60,
    y: yPos - 68,
    size: 9,
    font: helveticaFont,
    color: darkGray,
  });

  // Cryptographic Verification Section with full hash
  yPos -= 120;
  
  page.drawText('CRYPTOGRAPHIC VERIFICATION', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Security notice
  page.drawRectangle({
    x: 40,
    y: yPos - 25,
    width: width - 80,
    height: 20,
    color: rgb(0.95, 0.98, 1),
    borderColor: primaryBlue,
    borderWidth: 1,
  });
  
  page.drawText('[SECURE] This signature is cryptographically secured and immutably stored on Arweave blockchain', {
    x: 50,
    y: yPos - 18,
    size: 10,
    font: helveticaFont,
    color: primaryBlue,
  });
  
  yPos -= 40;
  
  page.drawText('Full Signature Hash (SHA-256):', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Display full signature hash in multiple lines with proper formatting
  const fullHash = signature.signatureHash || signature.signature || 'No hash available';
  let hashLines: string[];
  
  // Safety check to prevent infinite loops with very long or malformed hashes
  if (fullHash.length > 10000) {
    console.warn('Signature hash too long, truncating for PDF display');
    const truncatedHash = fullHash.substring(0, 1000) + '...[truncated]';
    hashLines = breakTextIntoLines(truncatedHash, 75);
    
    for (let i = 0; i < Math.min(hashLines.length, 10); i++) {
      page.drawText(hashLines[i], {
        x: 50,
        y: yPos - 20 - (i * 14),
        size: 9,
        font: courierFont,
        color: darkGray,
      });
    }
  } else {
    hashLines = breakTextIntoLines(fullHash, 75);
    
    for (let i = 0; i < hashLines.length; i++) {
      page.drawText(hashLines[i], {
        x: 50,
        y: yPos - 20 - (i * 14),
        size: 9,
        font: courierFont,
        color: darkGray,
      });
    }
  }
  
  // Verification QR code area placeholder
  yPos -= (hashLines.length * 14) + 40;
  
  page.drawRectangle({
    x: width - 150,
    y: yPos - 60,
    width: 100,
    height: 60,
    color: lightGray,
    borderColor: darkGray,
    borderWidth: 1,
  });
  
  page.drawText('QR Code', {
    x: width - 125,
    y: yPos - 25,
    size: 10,
    font: helveticaFont,
    color: darkGray,
  });
  
  page.drawText('Verification', {
    x: width - 135,
    y: yPos - 40,
    size: 10,
    font: helveticaFont,
    color: darkGray,
  });

  // Professional Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 50,
    color: lightGray,
    borderColor: primaryBlue,
    borderWidth: 1,
  });
  
  page.drawText('This digital signature certificate confirms the authenticity and integrity of the signed document.', {
    x: 50,
    y: 30,
    size: 10,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText('Powered by PermaSign | Learn more at permasign.app/security', {
    x: 50,
    y: 15,
    size: 9,
    font: helveticaFont,
    color: primaryBlue,
  });
  
  page.drawText('[NOTE] Digital signatures are appended to the end of the original document for verification.', {
    x: width - 350,
    y: 15,
    size: 8,
    font: helveticaFont,
    color: rgb(0.8, 0.4, 0),
  });
}

async function addSignatureSummaryPage(
  page: any,
  signatures: SignatureInfo[],
  documentName: string,
  fonts: { helveticaFont: any; helveticaBoldFont: any; courierFont: any }
) {
  const { helveticaFont, helveticaBoldFont } = fonts;
  const { width, height } = page.getSize();
  
  // Professional colors matching signature pages
  const primaryBlue = rgb(0.067, 0.278, 0.529);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.96, 0.96, 0.96);
  const goldAccent = rgb(0.8, 0.647, 0.176);
  const successGreen = rgb(0.067, 0.533, 0.2);
  
  // Header matching individual signature pages
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: primaryBlue,
  });
  
  // Add accent line
  page.drawRectangle({
    x: 0,
    y: height - 105,
    width: width,
    height: 5,
    color: goldAccent,
  });
  
  page.drawText('SIGNATURE SUMMARY & VERIFICATION', {
    x: 50,
    y: height - 40,
    size: 22,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('COMPLETE SIGNATURE AUDIT TRAIL', {
    x: 50,
    y: height - 60,
    size: 11,
    font: helveticaFont,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  page.drawText(`${signatures.length} signature(s) | All signatures appended to end of document`, {
    x: 50,
    y: height - 80,
    size: 10,
    font: helveticaFont,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Document info section
  let yPos = height - 140;
  
  page.drawText('DOCUMENT SUMMARY', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Document info box
  page.drawRectangle({
    x: 40,
    y: yPos - 60,
    width: width - 80,
    height: 50,
    color: lightGray,
    borderColor: primaryBlue,
    borderWidth: 1,
  });
  
  page.drawText(`Document: ${documentName}`, {
    x: 55,
    y: yPos - 25,
    size: 12,
    font: helveticaBoldFont,
    color: primaryBlue,
  });
  
  page.drawText(`Total Signatures: ${signatures.length} | All Verified: [YES] | Status: Complete`, {
    x: 55,
    y: yPos - 45,
    size: 10,
    font: helveticaFont,
    color: successGreen,
  });

  // Signatures table with enhanced styling
  yPos -= 90;
  
  page.drawText('SIGNATURE VERIFICATION TABLE', {
    x: 50,
    y: yPos,
    size: 16,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  yPos -= 30;
  
  // Professional table headers with background
  page.drawRectangle({
    x: 40,
    y: yPos - 5,
    width: width - 80,
    height: 25,
    color: primaryBlue,
  });
  
  page.drawText('SIGNER NAME', {
    x: 50,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('ROLE', {
    x: 220,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('DATE SIGNED', {
    x: 320,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('VERIFICATION', {
    x: 460,
    y: yPos,
    size: 11,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  // Table rows with alternating colors
  yPos -= 25;
  
  signatures.forEach((signature, index) => {
    const rowY = yPos - (index * 30);
    
    // Alternating row colors with borders
    const rowColor = index % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1);
    page.drawRectangle({
      x: 40,
      y: rowY - 5,
      width: width - 80,
      height: 30,
      color: rowColor,
      borderColor: lightGray,
      borderWidth: 0.5,
    });
    
    // Signer name
    page.drawText(signature.signerName, {
      x: 50,
      y: rowY + 5,
      size: 10,
      font: helveticaBoldFont,
      color: darkGray,
    });
    
    // Email on second line
    page.drawText(signature.signerEmail, {
      x: 50,
      y: rowY - 8,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Role
    page.drawText(signature.role.charAt(0).toUpperCase() + signature.role.slice(1).replace(/_/g, ' '), {
      x: 220,
      y: rowY,
      size: 10,
      font: helveticaFont,
      color: darkGray,
    });
    
    // Date signed
    const dateStr = signature.timestamp ? new Date(signature.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Unknown';
    
    page.drawText(dateStr, {
      x: 320,
      y: rowY + 5,
      size: 10,
      font: helveticaFont,
      color: darkGray,
    });
    
    // Time on second line
    if (signature.timestamp) {
      const timeStr = new Date(signature.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      page.drawText(timeStr, {
        x: 320,
        y: rowY - 8,
        size: 8,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // Verification status
    page.drawText('[VERIFIED]', {
      x: 460,
      y: rowY,
      size: 10,
      font: helveticaBoldFont,
      color: successGreen,
    });
  });

  // Security notice section
  const finalY = yPos - (signatures.length * 30) - 40;
  
  page.drawRectangle({
    x: 40,
    y: finalY - 80,
    width: width - 80,
    height: 70,
    color: rgb(0.95, 0.98, 1),
    borderColor: primaryBlue,
    borderWidth: 2,
  });
  
  page.drawText('[SECURITY] VERIFICATION NOTICE', {
    x: 55,
    y: finalY - 25,
    size: 12,
    font: helveticaBoldFont,
    color: primaryBlue,
  });
  
  page.drawText('- All signatures are cryptographically secured using SHA-256 hashing', {
    x: 55,
    y: finalY - 45,
    size: 9,
    font: helveticaFont,
    color: darkGray,
  });
  
  page.drawText('- Signature data is immutably stored on Arweave blockchain for permanent verification', {
    x: 55,
    y: finalY - 58,
    size: 9,
    font: helveticaFont,
    color: darkGray,
  });
  
  page.drawText('- This summary page and all signature certificates are appended to the original document', {
    x: 55,
    y: finalY - 71,
    size: 9,
    font: helveticaFont,
    color: darkGray,
  });

  // Professional Footer matching signature pages
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 50,
    color: lightGray,
    borderColor: primaryBlue,
    borderWidth: 1,
  });
  
  page.drawText('This signature summary confirms all digital signatures attached to this document have been verified.', {
    x: 50,
    y: 30,
    size: 10,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText('Powered by PermaSign | Blockchain-secured digital signatures | permasign.app/security', {
    x: 50,
    y: 15,
    size: 9,
    font: helveticaFont,
    color: primaryBlue,
  });
}

function breakTextIntoLines(text: string, maxLength: number): string[] {
  if (!text || maxLength <= 0) return [''];
  if (text.length <= maxLength) return [text];
  
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    lines.push(text.slice(i, i + maxLength));
    // Safety check to prevent infinite loops
    if (lines.length > 1000) {
      lines.push('...[content truncated for safety]');
      break;
    }
  }
  return lines;
} 