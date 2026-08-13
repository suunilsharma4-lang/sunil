import React, { useRef, useState } from 'react';
import { BusinessInfo, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { BarcodeSvg } from '../Common/BarcodeSvg';
import { Printer, Download, X, CheckCircle2, Loader2, Trash2, KeyRound, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoiceModalProps {
  sale: Sale | null;
  businessInfo: BusinessInfo;
  onClose: () => void;
  onDeleteSale?: (saleId: string) => void;
  triggerConfetti?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  sale,
  businessInfo,
  onClose,
  onDeleteSale,
  triggerConfetti = false,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Delete Bill Password Protection State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDeleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;
    const cleanPass = deletePassword.trim();
    if (cleanPass === '23571113' || cleanPass === 'Sunil369@' || cleanPass === 'Sunil 359@') {
      if (onDeleteSale) {
        onDeleteSale(sale.id);
      }
      setIsDeleteModalOpen(false);
      onClose();
    } else {
      setDeleteError('Invalid Password!');
    }
  };

  React.useEffect(() => {
    if (triggerConfetti) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [triggerConfetti]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || isDownloading) return;
    try {
      setIsDownloading(true);
      const element = printRef.current;

      // Helper to convert oklch(...) strings to rgb(...) using browser computed style
      const sanitizeOklch = (str: string): string => {
        if (!str || !str.includes('oklch')) return str;
        return str.replace(/oklch\s*\([^)]+\)/gi, (match) => {
          try {
            const temp = document.createElement('div');
            temp.style.color = match;
            temp.style.display = 'none';
            document.body.appendChild(temp);
            const computed = window.getComputedStyle(temp).color;
            document.body.removeChild(temp);
            if (computed && !computed.includes('oklch')) {
              return computed;
            }
          } catch (e) {
            // fallback
          }
          return 'rgb(30, 41, 59)';
        });
      };

      // Render DOM element to canvas with high fidelity
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 1. Sanitize all <style> tags in cloned document to remove unsupported oklch color functions
          clonedDoc.querySelectorAll('style').forEach((styleEl) => {
            if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
              styleEl.textContent = sanitizeOklch(styleEl.textContent);
            }
          });

          // 2. Sanitize inline cssText for all elements
          clonedDoc.querySelectorAll('*').forEach((node) => {
            const el = node as HTMLElement;
            if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
              el.style.cssText = sanitizeOklch(el.style.cssText);
            }
          });

          // 3. Format printable bill box
          const el = clonedDoc.getElementById('printable-bill');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.border = '1px solid #94a3b8';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      // Create A5 format PDF (148mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 148 mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, 210));

      const fileName = `Invoice_${sale.invoiceNo}.pdf`;

      // Primary download trigger
      pdf.save(fileName);

      // Backup trigger for browser preview environments
      try {
        const dataUrl = pdf.output('datauristring');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = fileName;
        downloadLink.target = '_blank';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        setTimeout(() => {
          if (document.body.contains(downloadLink)) {
            document.body.removeChild(downloadLink);
          }
        }, 1500);
      } catch (dataErr) {
        console.warn('Data URL backup download notice:', dataErr);
      }

    } catch (err) {
      console.error('PDF download error:', err);
      // Fallback: trigger native browser print dialog to save as PDF
      alert('Generating PDF... Opening print window where you can select "Save as PDF".');
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Invoice / Bill Receipt</h3>
              <p className="text-xs text-slate-300">Bill No: {sale.invoiceNo}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill (A5)</span>
            </button>

            {onDeleteSale && (
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(true);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Delete this Bill"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Bill Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 flex justify-center">
          
          {/* Half A4 Bill Formatted Box (A5 dimensions 148mm x 210mm proportional container) */}
          <div
            ref={printRef}
            id="printable-bill"
            className="invoice-half-a4 bg-white text-black border border-slate-900 shadow-md p-5 sm:p-6 w-full max-w-[148mm] min-h-[210mm] flex flex-col justify-between font-sans text-xs relative select-text"
          >
            <div>
              {/* Header section */}
              <div className="border-b-2 border-black pb-3 mb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 pr-2">
                    {/* Institute Logo or Text Badge */}
                    <div className="flex items-center space-x-2 mb-2">
                      {businessInfo.showLogoOnInvoice !== false && (
                        businessInfo.logoUrl ? (
                          <img
                            src={businessInfo.logoUrl}
                            alt="Institute Logo"
                            className="h-12 w-auto max-w-[140px] object-contain rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
                            {businessInfo.name
                              ? businessInfo.name
                                  .split(' ')
                                  .map((w) => w[0])
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()
                              : 'SC'}
                          </div>
                        )
                      )}
                      <span className="text-[10px] font-bold tracking-wider uppercase text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {sale.saleType}
                      </span>
                    </div>

                    <h1 className="text-base font-extrabold text-black leading-snug">
                      {businessInfo.name}
                    </h1>
                    <p className="text-[11px] text-black font-medium mt-0.5">
                      📍 {businessInfo.location} | 📞 Contact: {businessInfo.contact}
                    </p>
                    <p className="text-[10px] text-slate-800 mt-0.5">
                      ✉️ Email: {businessInfo.email || 'sunshinecomputer2080@gmail.com'} | Founder: {businessInfo.founder} {businessInfo.panVatNo && `| PAN/VAT: ${businessInfo.panVatNo}`}
                    </p>
                  </div>

                  {/* Bill Details Right side */}
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-xs font-black uppercase text-black px-2 py-0.5 bg-slate-100 rounded border border-black">
                      TAX INVOICE / BILL
                    </span>
                    <p className="font-bold text-xs text-black mt-1"># {sale.invoiceNo}</p>
                    <p className="text-[10px] text-slate-800 mt-0.5">{formatDateTime(sale.date)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info & Payment Status */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-white rounded-lg border border-black mb-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-black font-bold">Billed To (Customer):</p>
                  <p className="font-extrabold text-xs text-black mt-0.5">{sale.customerName}</p>
                  <p className="text-[10px] text-black font-semibold">{sale.customerPhone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-black font-bold">Payment Details:</p>
                  <div className="inline-flex items-center space-x-1.5 mt-0.5">
                    <span className="font-bold text-black text-[11px]">{sale.paymentMethod}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                        sale.paymentStatus === 'Paid'
                          ? 'bg-slate-100 text-black border-black'
                          : sale.paymentStatus === 'Partial'
                          ? 'bg-slate-100 text-black border-black'
                          : 'bg-slate-100 text-black border-black'
                      }`}
                    >
                      {sale.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse mb-3">
                <thead>
                  <tr className="bg-black text-white text-[10px] uppercase tracking-wider border border-black">
                    <th className="py-1.5 px-2 text-left w-6">#</th>
                    <th className="py-1.5 px-2 text-left">Particulars / Description</th>
                    <th className="py-1.5 px-2 text-center w-12">Qty</th>
                    <th className="py-1.5 px-2 text-right w-16">Rate</th>
                    <th className="py-1.5 px-2 text-right w-20">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-black text-[11px] border-b border-black">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="bg-white">
                      <td className="py-1.5 px-2 font-semibold text-black">{idx + 1}</td>
                      <td className="py-1.5 px-2 font-bold text-black">
                        {item.productName}
                      </td>
                      <td className="py-1.5 px-2 text-center font-bold text-black">{item.qty}</td>
                      <td className="py-1.5 px-2 text-right font-medium text-black">{formatCurrency(item.sellingRate)}</td>
                      <td className="py-1.5 px-2 text-right font-black text-black">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Calculation Box */}
              <div className="flex justify-between items-start pt-2 border-t border-black">
                <div className="w-1/2 pr-3">
                  {sale.notes && (
                    <div className="p-2 bg-slate-50 border border-black rounded text-[10px] text-black mb-2">
                      <span className="font-bold">Note:</span> {sale.notes}
                    </div>
                  )}
                  {/* Barcode representation */}
                  <div className="mt-1">
                    <BarcodeSvg value={sale.invoiceNo} width={140} height={38} showText={true} />
                  </div>
                </div>

                <div className="w-1/2 text-right text-[11px] space-y-1">
                  <div className="flex justify-between py-0.5">
                    <span className="text-black font-semibold">Subtotal:</span>
                    <span className="font-bold text-black">{formatCurrency(sale.subtotal)}</span>
                  </div>

                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between py-0.5 text-black">
                      <span>Discount:</span>
                      <span className="font-bold">- {formatCurrency(sale.discountAmount)}</span>
                    </div>
                  )}

                  {sale.taxAmount > 0 && (
                    <div className="flex justify-between py-0.5 text-black">
                      <span>VAT ({sale.taxPercent}%):</span>
                      <span className="font-bold">{formatCurrency(sale.taxAmount)}</span>
                    </div>
                  )}

                  {sale.previousDueAdded && sale.previousDueAdded > 0 ? (
                    <div className="flex justify-between py-0.5 text-black font-bold bg-slate-100 px-1 rounded border border-slate-300">
                      <span>Previous Due Balance Added:</span>
                      <span>+ {formatCurrency(sale.previousDueAdded)}</span>
                    </div>
                  ) : null}

                  <div className="flex justify-between py-1.5 border-t-2 border-b-2 border-black font-black text-sm text-black my-1">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(sale.grandTotal)}</span>
                  </div>

                  <div className="flex justify-between py-0.5 text-black">
                    <span className="font-bold">Paid Amount:</span>
                    <span className="font-extrabold text-black">{formatCurrency(sale.paidAmount)}</span>
                  </div>

                  {sale.dueAmount > 0 ? (
                    <div className="flex justify-between py-1 px-2 bg-slate-100 text-black rounded font-black text-xs border border-black">
                      <span>Due Amount:</span>
                      <span>{formatCurrency(sale.dueAmount)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between py-0.5 text-black font-black text-[10px]">
                      <span>Balance:</span>
                      <span>PAID IN FULL</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer & Signatures */}
            <div className="mt-6 pt-3 border-t border-dashed border-black">
              <div className="flex justify-end text-center text-[10px] text-black mb-3">
                <div className="flex flex-col items-center justify-end h-10">
                  <div className="border-b border-black w-36 mb-1"></div>
                  <span className="font-extrabold text-black">
                    Received By: {businessInfo.founder || 'Sunil Sharma'}
                  </span>
                </div>
              </div>

              {businessInfo.invoiceNotice && (
                <div className="text-center text-[10px] text-black bg-white py-1.5 rounded border border-black">
                  <p className="font-bold text-black">{businessInfo.invoiceNotice}</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Password Protected Delete Bill Modal */}
      {isDeleteModalOpen && sale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Security Authorization Required</h3>
                <p className="text-xs text-slate-500">Deleting bill/invoice record requires password.</p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-800 bg-slate-100 p-3 rounded-xl border border-slate-200">
              Bill: <span className="text-rose-700 font-extrabold">#{sale.invoiceNo}</span> ({sale.customerName} - {formatCurrency(sale.grandTotal)})
            </p>

            <form onSubmit={handleConfirmDeleteSale} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter security password..."
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Delete Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
