import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CertificateService {
  async download(courseTitle: string, studentName: string, completedDate: string): Promise<void> {
    const { jsPDF } = await import('jspdf');

    // A4 Landscape: 297 x 210 mm
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297;
    const H = 210;

    // Background
    doc.setFillColor(8, 14, 26);
    doc.rect(0, 0, W, H, 'F');

    // Outer gold border
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(1.2);
    doc.rect(4, 4, W - 8, H - 8);

    // Inner teal border
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.5);
    doc.rect(7, 7, W - 14, H - 14);

    // Brand name — top left
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212);
    doc.text('Learn With Hamster', 14, 22);

    // Teal hairline below brand
    doc.setDrawColor(6, 182, 212);
    doc.setLineWidth(0.3);
    doc.line(14, 26, W - 14, 26);

    // Certificate of Completion — centred, gold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(251, 191, 36);
    doc.text('Certificate of Completion', W / 2, 52, { align: 'center' });

    // "This certifies that" — slate italic
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text('This certifies that', W / 2, 70, { align: 'center' });

    // Student name — white bold large
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(241, 245, 249);
    doc.text(studentName, W / 2, 90, { align: 'center' });

    // Underline beneath name
    const nameWidth = doc.getTextWidth(studentName);
    const nameX = W / 2 - nameWidth / 2;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.4);
    doc.line(nameX, 93, nameX + nameWidth, 93);

    // "has successfully completed" — slate
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text('has successfully completed', W / 2, 108, { align: 'center' });

    // Course title — teal bold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(6, 182, 212);
    doc.text(courseTitle, W / 2, 126, { align: 'center' });

    // Cert number generation
    const rawId = btoa(courseTitle + studentName + completedDate)
      .replace(/[^A-Z0-9]/gi, '')
      .substring(0, 8)
      .toUpperCase();
    const certNumber = `LWH-${rawId}`;

    // Footer — date and cert number, slate small
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Date: ${completedDate}    Cert: ${certNumber}`, W / 2, H - 16, { align: 'center' });

    doc.save(`Certificate - ${courseTitle}.pdf`);
  }
}
