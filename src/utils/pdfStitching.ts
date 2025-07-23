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

// Enhanced safe string truncation with different limits for different fields
function safeTruncate(input: any, maxLength: number): string {
  try {
    if (!input) return 'N/A';
    const str = String(input);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  } catch {
    return 'N/A';
  }
}

// Format timestamp to readable date
function formatTimestamp(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return 'Date unavailable';
  }
}

export async function stitchPdfWithSignatures(options: PdfStitchingOptions): Promise<Uint8Array> {
  try {
    // Validate inputs
    if (!options || !options.originalPdfBytes || !Array.isArray(options.signatures)) {
      throw new Error('Invalid input');
    }

    // Load PDF
    const pdfDoc = await PDFDocument.load(options.originalPdfBytes);
    
    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add signature certificate page
    const certPage = pdfDoc.addPage([612, 792]);
    const { width, height } = certPage.getSize();
    
    // Safe document name
    const docName = safeTruncate(options.documentName, 50);
    
    // Header section
    certPage.drawText('DIGITAL SIGNATURE CERTIFICATE', {
      x: width / 2 - 150,
      y: height - 60,
      size: 18,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    certPage.drawText('Powered by PermaSign', {
      x: width / 2 - 70,
      y: height - 85,
      size: 12,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Document info section
    let yPos = height - 130;
    certPage.drawText('Document Information', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPos -= 25;
    certPage.drawText(`Document: ${docName}`, {
      x: 70,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    yPos -= 20;
    certPage.drawText(`Total Signatures: ${options.signatures.length}`, {
      x: 70,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    yPos -= 20;
    certPage.drawText(`Certificate Generated: ${formatTimestamp(Date.now())}`, {
      x: 70,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Signatures section
    yPos -= 40;
    certPage.drawText('Digital Signatures', {
      x: 50,
      y: yPos,
      size: 14,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Process each signature
    const maxSignatures = Math.min(options.signatures.length, 8);
    
    for (let i = 0; i < maxSignatures; i++) {
      const sig = options.signatures[i];
      if (!sig || yPos < 100) break;
      
      yPos -= 30;
      
      // Signature details with safe truncation
      const signerName = safeTruncate(sig.signerName, 40);
      const signerEmail = safeTruncate(sig.signerEmail, 40);
      const role = safeTruncate(sig.role, 20);
      const signatureHash = safeTruncate(sig.signatureHash || sig.signature, 32);
      
      // Signature header
      certPage.drawText(`${i + 1}. ${signerName}`, {
        x: 70,
        y: yPos,
        size: 12,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPos -= 18;
      certPage.drawText(`Email: ${signerEmail}`, {
        x: 90,
        y: yPos,
        size: 10,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      yPos -= 15;
      certPage.drawText(`Role: ${role}`, {
        x: 90,
        y: yPos,
        size: 10,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      yPos -= 15;
      certPage.drawText(`Signed: ${formatTimestamp(sig.timestamp)}`, {
        x: 90,
        y: yPos,
        size: 10,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      yPos -= 15;
      certPage.drawText(`Signature Hash: ${signatureHash}`, {
        x: 90,
        y: yPos,
        size: 9,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
      });

      yPos -= 5;
      // Add line separator
      certPage.drawLine({
        start: { x: 70, y: yPos },
        end: { x: width - 70, y: yPos },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
    }

    // Footer section
    if (yPos > 120) {
      yPos = 80;
      certPage.drawText('Verification', {
        x: 50,
        y: yPos,
        size: 12,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPos -= 20;
      certPage.drawText('This certificate verifies the digital signatures applied to the above document.', {
        x: 70,
        y: yPos,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });

      yPos -= 15;
      certPage.drawText('All signatures are cryptographically secured and stored on the blockchain.', {
        x: 70,
        y: yPos,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    return await pdfDoc.save();
    
  } catch (error) {
    console.error('PDF signature certificate generation failed:', error);
    
    // Return minimal fallback PDF
    try {
      const fallbackDoc = await PDFDocument.create();
      const fallbackFont = await fallbackDoc.embedFont(StandardFonts.Helvetica);
      const fallbackPage = fallbackDoc.addPage([612, 792]);
      
      fallbackPage.drawText('Signature Certificate Generation Failed', {
        x: 50,
        y: 750,
        size: 14,
        font: fallbackFont,
        color: rgb(0.8, 0.2, 0.2),
      });

      fallbackPage.drawText('Please contact support for assistance.', {
        x: 50,
        y: 720,
        size: 12,
        font: fallbackFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      return await fallbackDoc.save();
    } catch {
      throw new Error('PDF processing failed completely');
    }
  }
} 