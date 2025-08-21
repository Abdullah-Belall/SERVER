import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { rabi3BillView } from './view/rabi3-bill.view';
import { rabi3DailyReportView } from './view/rabi3-daily-report.view';

@Injectable()
export class PdfGeneratorService {
  async generateInvoicePdf(
    domain: string,
    data: any,
    billName: string,
    billView: 'rabi3-bill' | 'rabi3-daily-report',
  ): Promise<string> {
    const ProductionObj = {
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
    const LocalObj = {
      headless: true,
    };
    const browser = await puppeteer.launch(
      process.env.NODE_ENV === 'production' ? ProductionObj : LocalObj,
    );
    const page = await browser.newPage();
    const html =
      billView === 'rabi3-bill'
        ? rabi3BillView(domain, data)
        : rabi3DailyReportView(domain, data);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const filePath = path.join(__dirname, `${billName}-${Date.now()}.pdf`);
    await page.pdf({ path: filePath, format: 'A4', printBackground: true });

    await browser.close();
    return filePath;
  }
}
