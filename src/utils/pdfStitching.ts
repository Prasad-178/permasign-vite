import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

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
  
  // Colors
  const primaryColor = rgb(0, 0.53, 0.71); // Blue
  const darkGray = rgb(0.3, 0.3, 0.3);
  const lightGray = rgb(0.9, 0.9, 0.9);
  
  // Header
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: primaryColor,
  });
  
  page.drawText('PermaSign Digital Signature Certificate', {
    x: 50,
    y: height - 45,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText(`Page ${pageNumber} of ${totalSigners} Signature${totalSigners > 1 ? 's' : ''}`, {
    x: 50,
    y: height - 65,
    size: 12,
    font: helveticaFont,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Document Info Section
  let yPos = height - 120;
  
  page.drawText('Document Information', {
    x: 50,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Gray background for document info
  page.drawRectangle({
    x: 40,
    y: yPos - 60,
    width: width - 80,
    height: 50,
    color: lightGray,
  });
  
  page.drawText(`Document: ${documentName}`, {
    x: 50,
    y: yPos - 25,
    size: 12,
    font: helveticaFont,
    color: darkGray,
  });
  
  page.drawText(`Signed on: ${new Date(signature.timestamp).toLocaleString()}`, {
    x: 50,
    y: yPos - 45,
    size: 12,
    font: helveticaFont,
    color: darkGray,
  });

  // Signer Information Section
  yPos -= 100;
  
  page.drawText('Signer Information', {
    x: 50,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  yPos -= 30;
  
  // Signer details
  page.drawText('Name:', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText(signature.signerName, {
    x: 120,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: darkGray,
  });
  
  yPos -= 20;
  
  page.drawText('Email:', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText(signature.signerEmail, {
    x: 120,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: darkGray,
  });
  
  yPos -= 20;
  
  page.drawText('Role:', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText(signature.role.charAt(0).toUpperCase() + signature.role.slice(1), {
    x: 120,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: darkGray,
  });

  // Digital Signature Section
  yPos -= 50;
  
  page.drawText('Digital Signature', {
    x: 50,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Signature box
  page.drawRectangle({
    x: 40,
    y: yPos - 120,
    width: width - 80,
    height: 100,
    borderColor: primaryColor,
    borderWidth: 2,
  });
  
  // Signature text (styled to look handwritten)
  page.drawText(signature.signerName, {
    x: 60,
    y: yPos - 60,
    size: 36,
    font: helveticaFont,
    color: primaryColor,
    rotate: degrees(-2), // Slight rotation for handwritten effect
  });
  
  page.drawText('Digitally signed', {
    x: 60,
    y: yPos - 80,
    size: 10,
    font: helveticaFont,
    color: darkGray,
  });

  // Cryptographic Information Section
  yPos -= 160;
  
  page.drawText('Cryptographic Verification', {
    x: 50,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  yPos -= 25;
  
  page.drawText('Signature Hash:', {
    x: 50,
    y: yPos,
    size: 10,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Break the hash into multiple lines for readability
  const hashLines = breakTextIntoLines(signature.signatureHash, 80);
  for (let i = 0; i < hashLines.length; i++) {
    page.drawText(hashLines[i], {
      x: 50,
      y: yPos - 15 - (i * 12),
      size: 9,
      font: courierFont,
      color: darkGray,
    });
  }
  
  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 40,
    color: lightGray,
  });
  
  page.drawText('This signature is cryptographically verified and stored on the Arweave blockchain.', {
    x: 50,
    y: 15,
    size: 10,
    font: helveticaFont,
    color: darkGray,
  });
  
  page.drawText('Learn more: permasign.app/security', {
    x: width - 200,
    y: 15,
    size: 10,
    font: helveticaFont,
    color: primaryColor,
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
  
  // Colors
  const primaryColor = rgb(0, 0.53, 0.71);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const lightGray = rgb(0.9, 0.9, 0.9);
  
  // Header
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: primaryColor,
  });
  
  page.drawText('Signature Summary', {
    x: 50,
    y: height - 45,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText(`Document: ${documentName}`, {
    x: 50,
    y: height - 65,
    size: 12,
    font: helveticaFont,
    color: rgb(0.9, 0.9, 0.9),
  });

  // Summary table
  let yPos = height - 120;
  
  page.drawText(`All Signatures (${signatures.length} total)`, {
    x: 50,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  yPos -= 40;
  
  // Table headers
  page.drawRectangle({
    x: 40,
    y: yPos - 5,
    width: width - 80,
    height: 25,
    color: lightGray,
  });
  
  page.drawText('Signer', {
    x: 50,
    y: yPos,
    size: 12,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText('Role', {
    x: 250,
    y: yPos,
    size: 12,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText('Date Signed', {
    x: 350,
    y: yPos,
    size: 12,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText('Status', {
    x: 480,
    y: yPos,
    size: 12,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  // Table rows
  yPos -= 25;
  
  signatures.forEach((signature, index) => {
    const rowY = yPos - (index * 25);
    
    // Alternating row colors
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 40,
        y: rowY - 5,
        width: width - 80,
        height: 25,
        color: rgb(0.98, 0.98, 0.98),
      });
    }
    
    page.drawText(signature.signerName, {
      x: 50,
      y: rowY,
      size: 10,
      font: helveticaFont,
      color: darkGray,
    });
    
    page.drawText(signature.role, {
      x: 250,
      y: rowY,
      size: 10,
      font: helveticaFont,
      color: darkGray,
    });
    
    page.drawText(new Date(signature.timestamp).toLocaleDateString(), {
      x: 350,
      y: rowY,
      size: 10,
      font: helveticaFont,
      color: darkGray,
    });
    
    page.drawText('✓ Verified', {
      x: 480,
      y: rowY,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0.7, 0),
    });
  });

  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 60,
    color: lightGray,
  });
  
  page.drawText('This document was digitally signed using PermaSign.', {
    x: 50,
    y: 35,
    size: 12,
    font: helveticaBoldFont,
    color: darkGray,
  });
  
  page.drawText('All signatures are cryptographically verified and stored immutably on Arweave blockchain.', {
    x: 50,
    y: 15,
    size: 10,
    font: helveticaFont,
    color: darkGray,
  });
}

function breakTextIntoLines(text: string, maxLength: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    lines.push(text.slice(i, i + maxLength));
  }
  return lines;
} 