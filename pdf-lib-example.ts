import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";

/**
 * 使用 pdf-lib 创建和修改 PDF
 * 功能更强大，支持创建、修改、合并 PDF
 */

// 示例 1: 创建一个简单的 PDF
async function createPDF() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("Hello, TypeScript PDF!", {
    x: 50,
    y: 350,
    size: 24,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText("This is a PDF document created with pdf-lib", {
    x: 50,
    y: 300,
    size: 14,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync("./created.pdf", pdfBytes);
  console.log("✓ PDF created: created.pdf");
}

// 示例 2: 修改现有 PDF
async function modifyPDF(inputPath: string, outputPath: string) {
  if (!fs.existsSync(inputPath)) {
    console.log(`File not found: ${inputPath}`);
    return;
  }

  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 在第一页添加文本
  firstPage.drawText("Modified", {
    x: 50,
    y: 50,
    size: 12,
    font: font,
    color: rgb(1, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ PDF modified: ${outputPath}`);
}

// 示例 3: 合并多个 PDF
async function mergePDFs(inputPaths: string[], outputPath: string) {
  const mergedPdf = await PDFDocument.create();

  for (const inputPath of inputPaths) {
    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping non-existent file: ${inputPath}`);
      continue;
    }

    const pdfBytes = fs.readFileSync(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedPdfBytes);
  console.log(`✓ PDFs merged: ${outputPath}`);
}

// 运行示例
async function main() {
  console.log("PDF-lib Examples\n");

  // 1. 创建新 PDF
  await createPDF();

  // 2. 修改 PDF (如果存在)
  await modifyPDF("./created.pdf", "./modified.pdf");

  // 3. 合并 PDF (如果存在多个文件)
  await mergePDFs(["./created.pdf", "./modified.pdf"], "./merged.pdf");
}

main();