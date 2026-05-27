import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  HelpCircle,
  AlertTriangle,
  X,
  Download,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';
import { Order } from '../types';

const CURRENCY_RATES: Record<string, { symbol: string; rate: number }> = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.92 },
  CNY: { symbol: '¥', rate: 7.24 },
  GBP: { symbol: '£', rate: 0.78 },
  JPY: { symbol: '¥', rate: 155.0 }
};

const Sparkline = ({ values, width = 75, height = 20, strokeColor = "#a78bfa", cityKey }: { 
  values: number[]; 
  width?: number; 
  height?: number; 
  strokeColor?: string;
  cityKey: string;
}) => {
  if (!values || values.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-40 select-none">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#4c3d99" strokeWidth="1.2" strokeDasharray="3 2" />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;

  const points = values.map((val, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  const lastPoint = points[points.length - 1];
  const safeGradientId = `grad-${cityKey.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      <defs>
        <linearGradient id={safeGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${safeGradientId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill="#ffffff" stroke={strokeColor} strokeWidth="1" className="animate-pulse" />
    </svg>
  );
};

interface OrdersRegistryViewProps {
  orders: Order[];
  onSendMessage: (msg: string) => void;
  convert: (amount: number) => string;
  language?: 'CN' | 'EN';
  selectedCurrency?: 'EUR' | 'USD' | 'CNY' | 'GBP' | 'JPY';
  setSelectedCurrency?: (currency: 'EUR' | 'USD' | 'CNY' | 'GBP' | 'JPY') => void;
}

export default function OrdersRegistryView({ 
  orders, 
  onSendMessage, 
  convert, 
  language = 'CN',
  selectedCurrency = 'EUR',
  setSelectedCurrency
}: OrdersRegistryViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<'amount' | 'date' | 'order_id' | 'city' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);

  const [sparklineGroupType, setSparklineGroupType] = useState<'city' | 'customer'>('city');
  
  // Selection States
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkRefundModal, setShowBulkRefundModal] = useState(false);

  const historyGroups = useMemo(() => {
    const cityGroups: Record<string, { date: string; amount: number }[]> = {};
    const custGroups: Record<string, { date: string; amount: number }[]> = {};

    orders.forEach(ord => {
      const city = ord.city;
      if (!cityGroups[city]) cityGroups[city] = [];
      cityGroups[city].push({ date: ord.date, amount: ord.amount });

      const cust = ord.customer_id;
      if (!custGroups[cust]) custGroups[cust] = [];
      custGroups[cust].push({ date: ord.date, amount: ord.amount });
    });

    const cityTrends: Record<string, number[]> = {};
    Object.keys(cityGroups).forEach(city => {
      cityGroups[city].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      cityTrends[city] = cityGroups[city].map(item => item.amount);
    });

    const custTrends: Record<string, number[]> = {};
    Object.keys(custGroups).forEach(cust => {
      custGroups[cust].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      custTrends[cust] = custGroups[cust].map(item => item.amount);
    });

    return { city: cityTrends, customer: custTrends };
  }, [orders]);

  const [amountThresholdActive, setAmountThresholdActive] = useState(false);
  const [amountValueThreshold, setAmountValueThreshold] = useState<number>(500);

  const rate = CURRENCY_RATES[selectedCurrency]?.rate || 1.0;

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.order_id.toLowerCase().includes(search.toLowerCase()) || 
                            o.customer_id.toLowerCase().includes(search.toLowerCase()) || 
                            o.city.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status.toLowerCase() === statusFilter.toLowerCase();
      
      const matchesAmountThreshold = !amountThresholdActive || 
                                    (o.amount * rate >= amountValueThreshold);

      return matchesSearch && matchesStatus && matchesAmountThreshold;
    });
  }, [orders, search, statusFilter, amountThresholdActive, amountValueThreshold, rate]);

  const requestSort = (field: 'amount' | 'date' | 'order_id' | 'city' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const maxDateTimestamp = useMemo(() => {
    if (orders.length === 0) return 0;
    return Math.max(...orders.map(o => new Date(o.date).getTime()));
  }, [orders]);

  const sortedAndFiltered = useMemo(() => {
    const list = [...filtered];

    list.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        aVal = Number(a.amount);
        bVal = Number(b.amount);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortField, sortOrder]);

  const issueRefund = (id: string, amount: number) => {
    onSendMessage(`Refunding order ID '${id}' for amount of $${amount}. Update DB state to 'Refunded'.`);
  };

  const handleExportCSV = () => {
    const headers = [
      language === 'CN' ? '系统单号' : 'Order ID',
      language === 'CN' ? '买家画像ID' : 'Customer ID',
      language === 'CN' ? '目的城市' : 'City',
      language === 'CN' ? '下单日期' : 'Date',
      language === 'CN' ? '履行状态' : 'Status',
      language === 'CN' ? '基础金额 (USD)' : 'Base Amount (USD)',
      `${language === 'CN' ? '记账总额' : 'Reporting Total'} (${selectedCurrency})`
    ];

    const convertToSelectedCurrency = (amountInUsd: number) => {
      const rate = CURRENCY_RATES[selectedCurrency]?.rate || 1.0;
      return (amountInUsd * rate).toFixed(2);
    };

    const escapeCSV = (val: string) => {
      const sanitized = val.replace(/"/g, '""');
      return sanitized.includes(',') || sanitized.includes('\n') || sanitized.includes('"') 
        ? `"${sanitized}"` 
        : sanitized;
    };

    const rows = sortedAndFiltered.map(o => [
      escapeCSV(o.order_id),
      escapeCSV(o.customer_id),
      escapeCSV(o.city),
      escapeCSV(o.date),
      escapeCSV(o.status),
      o.amount.toFixed(2),
      convertToSelectedCurrency(o.amount)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    try {
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${selectedCurrency.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onSendMessage(
        language === 'CN' 
          ? `[系统指令] 成功导出 ${sortedAndFiltered.length} 行过滤交易账目至 CSV 文件 (${selectedCurrency} 记账汇率)`
          : `[System] Exported ${sortedAndFiltered.length} filtered transaction records to CSV under currency reporting context ${selectedCurrency}.`
      );
    } catch (err) {
      console.error('Failed to export CSV: ', err);
    }
  };

  // Bulk Operations Handlers
  const toggleSelectRow = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = useMemo(() => {
    if (sortedAndFiltered.length === 0) return false;
    return sortedAndFiltered.every(o => selectedOrderIds.includes(o.order_id));
  }, [sortedAndFiltered, selectedOrderIds]);

  const isAnySelected = useMemo(() => {
    return sortedAndFiltered.some(o => selectedOrderIds.includes(o.order_id));
  }, [sortedAndFiltered, selectedOrderIds]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = sortedAndFiltered.map(o => o.order_id);
      setSelectedOrderIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const visibleIds = sortedAndFiltered.map(o => o.order_id);
      setSelectedOrderIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const eligibleSelectedForRefund = useMemo(() => {
    return sortedAndFiltered.filter(o => selectedOrderIds.includes(o.order_id) && o.status !== 'Refunded');
  }, [sortedAndFiltered, selectedOrderIds]);

  const handleBulkExportCSV = () => {
    const selectedOrders = sortedAndFiltered.filter(o => selectedOrderIds.includes(o.order_id));
    if (selectedOrders.length === 0) return;

    const headers = [
      language === 'CN' ? '系统单号' : 'Order ID',
      language === 'CN' ? '买家画像ID' : 'Customer ID',
      language === 'CN' ? '目的城市' : 'City',
      language === 'CN' ? '下单日期' : 'Date',
      language === 'CN' ? '履行状态' : 'Status',
      language === 'CN' ? '基础金额 (USD)' : 'Base Amount (USD)',
      `${language === 'CN' ? '记账总额' : 'Reporting Total'} (${selectedCurrency})`
    ];

    const convertToSelectedCurrency = (amountInUsd: number) => {
      const rate = CURRENCY_RATES[selectedCurrency]?.rate || 1.0;
      return (amountInUsd * rate).toFixed(2);
    };

    const escapeCSV = (val: string) => {
      const sanitized = val.replace(/"/g, '""');
      return sanitized.includes(',') || sanitized.includes('\n') || sanitized.includes('"') 
        ? `"${sanitized}"` 
        : sanitized;
    };

    const rows = selectedOrders.map(o => [
      escapeCSV(o.order_id),
      escapeCSV(o.customer_id),
      escapeCSV(o.city),
      escapeCSV(o.date),
      escapeCSV(o.status),
      o.amount.toFixed(2),
      convertToSelectedCurrency(o.amount)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    try {
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `selected_orders_export_${selectedCurrency.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onSendMessage(
        language === 'CN' 
          ? `[系统指令] 成功批量导出选中的 ${selectedOrders.length} 行交易账目至 CSV 文件`
          : `[System] Successfully exported ${selectedOrders.length} selected transaction records to CSV.`
      );
    } catch (err) {
      console.error('Failed to export selected CSV: ', err);
    }
  };

  const handleBulkExportPendingRefundCSV = () => {
    const selectedOrders = sortedAndFiltered.filter(o => selectedOrderIds.includes(o.order_id));
    if (selectedOrders.length === 0) return;

    const headers = [
      language === 'CN' ? '退款批次ID' : 'Refund Voucher ID',
      language === 'CN' ? '原始订单ID' : 'Original Order ID',
      language === 'CN' ? '客户账户ID' : 'Customer Account ID',
      language === 'CN' ? '交易日期' : 'Transaction Date',
      language === 'CN' ? '基础金额 (USD)' : 'Original Amount (USD)',
      language === 'CN' ? '记账汇总汇率' : 'Exchange Rate Applied',
      `${language === 'CN' ? '退款记账总计' : 'Pending Reimbursement'} (${selectedCurrency})`,
      language === 'CN' ? '原始履行状态' : 'Original Status',
      language === 'CN' ? '会计借贷科目' : 'Accounting Ledger Code',
      language === 'CN' ? '财务合规校验码' : 'Ledger Security Hash',
      language === 'CN' ? '对账结算优先级' : 'Ledger Priority'
    ];

    const conversionRate = CURRENCY_RATES[selectedCurrency]?.rate || 1.0;

    const escapeCSV = (val: string) => {
      const sanitized = val.toLowerCase().includes('null') || !val ? '' : val.replace(/"/g, '""');
      return sanitized.includes(',') || sanitized.includes('\n') || sanitized.includes('"') 
        ? `"${sanitized}"` 
        : sanitized;
    };

    const rows = selectedOrders.map((o, idx) => {
      const voucherId = `REF-${new Date().getFullYear()}-${selectedCurrency}-${1000 + idx}`;
      const convertedAmt = (o.amount * conversionRate).toFixed(2);
      const isOkToRefund = o.status !== 'Refunded';
      const ledgerCode = isOkToRefund ? 'AC2120-UNEARNED-REVENUE' : 'AC1010-CASH-CONTRA';
      const securityHash = `SEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${o.order_id.substring(0, 4)}`;
      const priority = isOkToRefund ? 'HIGH_PRIORITY' : 'AUDIT_FLAGGED';

      return [
        escapeCSV(voucherId),
        escapeCSV(o.order_id),
        escapeCSV(o.customer_id),
        escapeCSV(o.date),
        o.amount.toFixed(2),
        conversionRate.toFixed(4),
        convertedAmt,
        escapeCSV(o.status),
        escapeCSV(ledgerCode),
        escapeCSV(securityHash),
        escapeCSV(priority)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    try {
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `pending_refund_ledger_${selectedCurrency.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onSendMessage(
        language === 'CN' 
          ? `[系统指令] 成功生成并下载专用的 '${selectedOrders.length}x 待退款明细' 对账 CSV 报表（财务系统101专用借贷模版）`
          : `[System] Compiled and downloaded standard "Pending Refund Ledger CSV" for ${selectedOrders.length} selected items.`
      );
    } catch (err) {
      console.error('Failed to export Pending Refund CSV: ', err);
    }
  };

  const handleBulkExportPDF = () => {
    const selectedOrders = sortedAndFiltered.filter(o => selectedOrderIds.includes(o.order_id));
    if (selectedOrders.length === 0) return;

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      const formattedTime = today.toUTCString();

      // Color palette (RGB codes)
      const primaryColor = [124, 58, 237]; // Purple #7c3aed
      const secondaryColor = [22, 18, 51]; // Dark slate #161233
      const textColorPrimary = [17, 12, 40]; // Deep black/slate
      const textColorSecondary = [100, 100, 115]; // Charcoal/grey
      const tableHeadBg = [24, 20, 50]; // Table header dark background
      const tableRowAltBg = [248, 247, 252]; // Soft alternate row tint

      // Page numbers helper
      let pageCount = 1;
      
      const drawHeader = (currentPageNum: number) => {
        // Draw top aesthetic accent bar
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(14, 12, 182, 3, 'F');

        // Main Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('MUSE COCKPIT / SYSTEM REGISTER', 14, 24);

        // Subtitle
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(textColorSecondary[0], textColorSecondary[1], textColorSecondary[2]);
        doc.text(`AUDIT GRADE INVOICE SUMMARY REPORT  |  PAGE ${currentPageNum}`, 14, 29);

        // Right aligned metadata block
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(textColorPrimary[0], textColorPrimary[1], textColorPrimary[2]);
        doc.text(`REPORT ID: MCC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 196, 24, { align: 'right' });
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(textColorSecondary[0], textColorSecondary[1], textColorSecondary[2]);
        doc.text(`TIMESTAMP: ${formattedTime}`, 196, 29, { align: 'right' });

        // Divider Line
        doc.setDrawColor(220, 220, 228);
        doc.setLineWidth(0.3);
        doc.line(14, 33, 196, 33);
      };

      const drawFooter = (currentPageNum: number) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 150);
        doc.text('CONFIDENTIAL - MUSE CONSCIOUSNESS APPAREL INTERNAL COMPLIANCE UNDER NATIONAL LEDGER PROTOCOL.', 14, 287);
        doc.text(`Page ${currentPageNum}`, 196, 287, { align: 'right' });
      };

      // Draw first page template
      drawHeader(pageCount);

      // Section: Summary Meta Box
      doc.setFillColor(245, 242, 254);
      doc.rect(14, 38, 182, 22, 'F');
      doc.setDrawColor(210, 202, 240);
      doc.setLineWidth(0.4);
      doc.rect(14, 38, 182, 22, 'S');

      // Add metrics inside box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('INVOICE META ACCOUNT METRICS', 20, 44);

      // Total orders
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(textColorSecondary[0], textColorSecondary[1], textColorSecondary[2]);
      doc.text('Selected Invoices:', 20, 49.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorPrimary[0], textColorPrimary[1], textColorPrimary[2]);
      doc.text(`${selectedOrders.length} transaction entries`, 54, 49.5);

      // Timestamp of query
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorSecondary[0], textColorSecondary[1], textColorSecondary[2]);
      doc.text('Reporting Frame:', 20, 54.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColorPrimary[0], textColorPrimary[1], textColorPrimary[2]);
      doc.text(`Fulfilling status [${statusFilter.toUpperCase()}] / Live Database Register`, 54, 54.5);

      // Net sums in selected currency
      const rateLabel = CURRENCY_RATES[selectedCurrency]?.symbol || '$';
      const conversionRate = CURRENCY_RATES[selectedCurrency]?.rate || 1.0;
      const totalUSDValue = selectedOrders.reduce((sum, o) => sum + o.amount, 0);
      const convertedTotal = (totalUSDValue * conversionRate).toFixed(2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColorSecondary[0], textColorSecondary[1], textColorSecondary[2]);
      doc.text('Selected Net Value:', 115, 44);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${rateLabel}${convertedTotal} ${selectedCurrency}`, 115, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(textColorSecondary[0], textColorSecondary[1], textColorSecondary[2]);
      doc.text(`Base Combined Value: $${totalUSDValue.toFixed(2)} USD (Exchange multiplier: ${conversionRate.toFixed(4)})`, 115, 54.5);

      // Start Table
      let yPosition = 68;

      // Table Headers definitions
      const cols = [
        { title: 'Order ID', width: 35, x: 14 },
        { title: 'Buyer Profile ID', width: 28, x: 49 },
        { title: 'Date Scheduled', width: 20, x: 77 },
        { title: 'Destination', width: 24, x: 97 },
        { title: 'Fulfillment', width: 22, x: 121 },
        { title: 'Net (USD)', width: 25, x: 143 },
        { title: 'Charged (' + selectedCurrency + ')', width: 28, x: 168 }
      ];

      // Draw table header background
      doc.setFillColor(tableHeadBg[0], tableHeadBg[1], tableHeadBg[2]);
      doc.rect(14, yPosition, 182, 8, 'F');

      // Draw header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      cols.forEach(col => {
        if (col.title.startsWith('Net') || col.title.startsWith('Charged')) {
          doc.text(col.title, col.x + col.width - 2, yPosition + 5.5, { align: 'right' });
        } else {
          doc.text(col.title, col.x + 2, yPosition + 5.5);
        }
      });

      yPosition += 8;

      // Iterate records and print
      selectedOrders.forEach((o, index) => {
        // Manage vertical pagination
        if (yPosition + 9 > 275) {
          // Draw footer for current page before advancing
          drawFooter(pageCount);

          doc.addPage();
          pageCount += 1;
          yPosition = 38;

          // Re-draw standard headers
          drawHeader(pageCount);

          // Re-draw table header
          doc.setFillColor(tableHeadBg[0], tableHeadBg[1], tableHeadBg[2]);
          doc.rect(14, yPosition, 182, 8, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          cols.forEach(col => {
            if (col.title.startsWith('Net') || col.title.startsWith('Charged')) {
              doc.text(col.title, col.x + col.width - 2, yPosition + 5.5, { align: 'right' });
            } else {
              doc.text(col.title, col.x + 2, yPosition + 5.5);
            }
          });

          yPosition += 8;
        }

        // Draw zebra rows tint helper
        if (index % 2 === 1) {
          doc.setFillColor(tableRowAltBg[0], tableRowAltBg[1], tableRowAltBg[2]);
          doc.rect(14, yPosition, 182, 7.5, 'F');
        }

        // Horizontal soft row border
        doc.setDrawColor(230, 230, 236);
        doc.setLineWidth(0.15);
        doc.line(14, yPosition + 7.5, 196, yPosition + 7.5);

        // Render record fields
        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(textColorPrimary[0], textColorPrimary[1], textColorPrimary[2]);
        doc.text(o.order_id, 14 + 2, yPosition + 5);

        doc.setFont('helvetica', 'normal');
        doc.text(o.customer_id, 49 + 2, yPosition + 5);
        doc.text(o.date, 77 + 2, yPosition + 5);
        doc.text(o.city, 97 + 2, yPosition + 5);

        // Status pill highlight coloring
        const stat = o.status.trim();
        if (stat === 'Refunded') {
          doc.setTextColor(220, 38, 38);
        } else if (stat === 'Delivered') {
          doc.setTextColor(5, 150, 105);
        } else if (stat === 'Shipped') {
          doc.setTextColor(37, 99, 235);
        } else {
          doc.setTextColor(180, 83, 9);
        }
        doc.setFont('helvetica', 'bold');
        doc.text(stat, 121 + 2, yPosition + 5);

        // Prices details
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColorPrimary[0], textColorPrimary[1], textColorPrimary[2]);
        doc.text(`$${o.amount.toFixed(2)}`, 143 + 25 - 2, yPosition + 5, { align: 'right' });
        
        doc.setFont('helvetica', 'bold');
        const rateAmtStr = `${rateLabel}${(o.amount * conversionRate).toFixed(2)}`;
        doc.text(rateAmtStr, 168 + 28 - 2, yPosition + 5, { align: 'right' });

        yPosition += 7.5;
      });

      // Show totals line
      if (yPosition + 12 > 275) {
        drawFooter(pageCount);
        doc.addPage();
        pageCount += 1;
        yPosition = 38;
        drawHeader(pageCount);
      }

      // Draw double ledger line
      doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setLineWidth(0.4);
      doc.line(14, yPosition + 1.5, 196, yPosition + 1.5);
      doc.line(14, yPosition + 2.4, 196, yPosition + 2.4);

      yPosition += 8;

      // Report final block details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(textColorPrimary[0], textColorPrimary[1], textColorPrimary[2]);
      doc.text('TOTAL REPORT SUMMARY:', 14, yPosition);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`This document serves as an official transactional audit report generated by the smart workspace client on ${formattedDate}.`, 14, yPosition + 4.5);
      doc.text('Authorized & certified by Muse Consciousness Apparel digital ledger API.', 14, yPosition + 8.5);

      // Save page footer
      drawFooter(pageCount);

      // Output to user download
      doc.save(`selected_invoices_registry_${selectedCurrency.toLowerCase()}_${formattedDate}.pdf`);

      onSendMessage(
        language === 'CN' 
          ? `[系统指令] 成功生成并下载选中的 ${selectedOrders.length} 行对账单 PDF 合成文件 (${selectedCurrency} 汇率体系)`
          : `[System] Beautifully compiled and downloaded custom PDF summary invoice for the ${selectedOrders.length} selected orders in currency [${selectedCurrency}].`
      );

    } catch (err) {
      console.error('Failed to compile PDF summary: ', err);
    }
  };

  const executeBulkRefund = () => {
    const refundList = eligibleSelectedForRefund;
    if (refundList.length === 0) return;

    const idsString = refundList.map(o => o.order_id).join(', ');
    const totalRefundAmt = refundList.reduce((acc, curr) => acc + curr.amount, 0);

    onSendMessage(`Bulk refunding ${refundList.length} orders for total of $${totalRefundAmt.toFixed(2)}. List of order IDs: [${idsString}]. Update state to 'Refunded'.`);
    setSelectedOrderIds([]);
    setShowBulkRefundModal(false);
  };

  const renderSortIndicator = (field: 'amount' | 'date' | 'order_id' | 'city' | 'status') => {
    if (sortField !== field) {
      return (
        <span className="p-0.5 rounded hover:bg-[#251e44] transition-colors">
          <ArrowUpDown size={11} className="text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
        </span>
      );
    }
    return (
      <span className="p-0.5 bg-[#8b5cf6] text-white rounded shadow-sm flex items-center justify-center shrink-0">
        {sortOrder === 'asc' ? <ArrowUp size={10} className="stroke-[3]" /> : <ArrowDown size={10} className="stroke-[3]" />}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Configuration row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#120f26] p-6 rounded-2xl border border-[#231b45]">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative flex items-center bg-[#1a1538] border border-[#2d245e] rounded-lg px-3 py-2 w-full sm:w-64 shrink-0">
            <Search size={14} className="text-zinc-400 mr-2.5" />
            <input 
              placeholder="Search by ID, customer or city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-13 outline-none text-white placeholder:text-zinc-500 w-full font-medium"
            />
          </div>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1a1538] border border-[#2d245e] text-white text-13 px-4 py-2 rounded-lg font-medium outline-none w-full sm:w-auto"
          >
            <option value="all">All Registries</option>
            <option value="delivered">Delivered</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delayed">Delayed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Toggle Amount Filter with dynamic currency indicator */}
          <div className={cn(
            "flex items-center gap-2 bg-[#1a1538] border rounded-lg px-3 py-1.5 transition-all w-full sm:w-auto select-none",
            amountThresholdActive ? "border-[#baa4f9]/80 shadow-[0_0_12px_rgba(186,164,249,0.15)]" : "border-[#2d245e]"
          )}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={amountThresholdActive}
                onChange={(e) => setAmountThresholdActive(e.target.checked)}
                id="amount-threshold-toggle"
              />
              <div className="w-8 h-4 bg-zinc-700/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 peer-checked:after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-2 text-xs font-mono font-bold text-zinc-300 peer-checked:text-purple-300 mr-2">
                {language === 'CN' ? '起额过滤' : 'Min Total'}
              </span>
            </label>
            
            <div className="flex items-center gap-1 border-l border-[#2d245e] pl-2">
              <span className="text-xs text-[#baa4f9] font-bold font-mono">
                {CURRENCY_RATES[selectedCurrency]?.symbol || '$'}
              </span>
              <input 
                type="number"
                min="0"
                value={amountValueThreshold === 0 ? '' : amountValueThreshold}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  setAmountValueThreshold(val);
                }}
                disabled={!amountThresholdActive}
                className={cn(
                  "bg-transparent text-xs font-mono font-bold w-16 text-white outline-none focus:text-purple-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  !amountThresholdActive && "opacity-40 cursor-not-allowed"
                )}
                placeholder="500"
                id="amount-threshold-input"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 mt-2 lg:mt-0 self-end lg:self-auto w-full lg:w-auto justify-end">
          <span className="text-[11px] font-mono text-zinc-400 block font-semibold uppercase text-right">
            SHOWING {sortedAndFiltered.length} TRANSACTION ENTRIES
          </span>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b153c] hover:bg-[#251d52] text-xs font-mono font-bold text-[#c084fc] hover:text-[#d8b4fe] border border-[#372c6e] hover:border-[#4c3d99] rounded-lg shadow-sm transition-all duration-150 cursor-pointer self-stretch sm:self-auto justify-center"
            id="orders-export-csv-btn"
            title={language === 'CN' ? '导出当前过滤与排序的数据' : 'Export current filtered & sorted database records'}
          >
            <Download size={13} className="shrink-0" />
            <span>{language === 'CN' ? '导出 CSV' : 'EXPORT CSV'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Trend Analysis Guide Alert */}
      <div className="bg-[#151130] border border-[#2e245c] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <h4 className="font-mono font-bold text-white uppercase tracking-wider text-11">Interactive Trend Analysis Center (交易分析看板)</h4>
          </div>
          <p className="text-zinc-400 text-11">
            Click column headers for <strong className="text-white">Purchase Date</strong> or <strong className="text-white">Basket Amount</strong> to swap sort direction. This automatically realigns metrics for seasonal trends and basket size density checks.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#1b163f] border border-[#302660] px-3 py-1.5 rounded-lg shrink-0">
          <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Active Scope:</span>
          <span className="font-mono text-[11px] text-[#baa4f9] font-bold">
            {sortField === 'date' 
              ? (sortOrder === 'desc' ? 'Chronological Pattern (Newest First)' : 'Chronological Pattern (Oldest First)')
              : sortField === 'amount'
              ? (sortOrder === 'desc' ? 'Volume Density (Highest Basket First)' : 'Volume Density (Lowest Basket First)')
              : `Ordered by ${sortField} (${sortOrder})`}
          </span>
        </div>
      </div>

      {/* Database Table Design */}
      <div className="bg-[#120f26] rounded-3xl border border-[#231b45] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto text-13 font-medium">
            <thead>
              <tr className="bg-[#181432] border-b border-[#2d255c] select-none text-[10px] font-mono text-zinc-400 uppercase">
                <th className="px-4 py-4 w-12 text-center select-none">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) {
                          input.indeterminate = isAnySelected && !isAllSelected;
                        }
                      }}
                      onChange={toggleSelectAll}
                      className="rounded bg-[#1a1538] border-[#372c6e] checked:bg-purple-600 checked:border-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4 transition-all"
                      id="select-all-orders-checkbox"
                      title="Select/Deselect visible entries"
                    />
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('order_id')} 
                  className="px-6 py-4 font-bold cursor-pointer hover:bg-[#201a45] group transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Transaction ID
                    {renderSortIndicator('order_id')}
                  </div>
                </th>
                <th className="px-6 py-4 font-bold">Customer ID</th>
                <th 
                  onClick={() => requestSort('city')} 
                  className="px-6 py-4 font-bold cursor-pointer hover:bg-[#201a45] group transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Destination City
                    {renderSortIndicator('city')}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('date')} 
                  className={cn(
                    "px-6 py-4 font-bold cursor-pointer group transition-all duration-200 select-none",
                    sortField === 'date' ? "bg-[#211a4e]/90 text-purple-300 border-b-2 border-purple-500" : "hover:bg-[#201a45] text-zinc-400"
                  )}
                  title="Click to sort & analyze chronological purchase patterns"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span>Purchase Date</span>
                      {sortField === 'date' ? (
                        <span className="flex items-center justify-center bg-purple-500 text-white rounded p-0.5 shadow-sm transition-all duration-300 scale-105">
                          {sortOrder === 'asc' ? (
                            <ArrowUp size={12} className="stroke-[3]" />
                          ) : (
                            <ArrowDown size={12} className="stroke-[3]" />
                          )}
                        </span>
                      ) : (
                        <ArrowUpDown size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors opacity-60 group-hover:opacity-100" />
                      )}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] tracking-[0.05em] font-bold font-mono text-purple-400 bg-purple-900/40 border border-purple-800/20 px-1.5 py-0.5 rounded">TREND</span>
                    </div>
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('amount')} 
                  className={cn(
                    "px-6 py-4 font-bold cursor-pointer group transition-all duration-200 select-none",
                    sortField === 'amount' ? "bg-[#211a4e]/90 text-purple-300 border-b-2 border-purple-500" : "hover:bg-[#201a45] text-zinc-400"
                  )}
                  title="Click to sort & analyze transaction volume density"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span>Basket (USD)</span>
                      {sortField === 'amount' ? (
                        <span className="flex items-center justify-center bg-purple-500 text-white rounded p-0.5 shadow-sm transition-all duration-300 scale-105">
                          {sortOrder === 'asc' ? (
                            <ArrowUp size={12} className="stroke-[3]" />
                          ) : (
                            <ArrowDown size={12} className="stroke-[3]" />
                          )}
                        </span>
                      ) : (
                        <ArrowUpDown size={11} className="text-zinc-600 group-hover:text-zinc-400 transition-colors opacity-60 group-hover:opacity-100" />
                      )}
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 font-bold select-none text-[#baa4f9] border-l border-[#2d255c]">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{language === 'CN' ? '双币换算' : 'REPORTING TOTAL'}</span>
                      <span className="text-white text-xs font-bold font-sans flex items-center gap-1.5">
                        {language === 'CN' ? '报告总额' : 'Total'} 
                        <span className="text-[10px] text-[#a78bfa] bg-[#1d163d] px-1.5 py-0.5 rounded border border-[#3e327a] font-mono">
                          {selectedCurrency}
                        </span>
                      </span>

                      {/* Interactive Sparkline Mode Switcher */}
                      <div className="flex items-center gap-1 mt-1.5 bg-[#151032] p-0.5 rounded-md border border-[#2c2063] w-max">
                        <button
                          onClick={() => setSparklineGroupType('city')}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer",
                            sparklineGroupType === 'city' 
                              ? "bg-purple-600 text-white shadow-sm" 
                              : "text-zinc-500 hover:text-zinc-300"
                          )}
                          title="Show Sparkline Trend grouped by City"
                        >
                          City
                        </button>
                        <button
                          onClick={() => setSparklineGroupType('customer')}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer",
                            sparklineGroupType === 'customer' 
                              ? "bg-purple-600 text-white shadow-sm" 
                              : "text-zinc-500 hover:text-zinc-300"
                          )}
                          title="Show Sparkline Trend grouped by Customer"
                        >
                          Cust
                        </button>
                      </div>
                    </div>

                    {setSelectedCurrency && (
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value as any)}
                        className="bg-[#1b153c] text-white font-mono text-[10px] font-bold py-1 px-2 rounded-lg border border-[#372c6e] outline-none cursor-pointer focus:border-[#baa4f9] transition-all self-start mt-0.5"
                        id="table-header-currency-select"
                        title="Click to switch currency report dynamically"
                      >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="CNY">CNY (¥)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('status')} 
                  className="px-6 py-4 font-bold cursor-pointer hover:bg-[#201a45] group transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Fulfillment Status
                    {renderSortIndicator('status')}
                  </div>
                </th>
                <th className="px-6 py-4 font-bold text-right">Magic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e193d] text-zinc-300">
              {sortedAndFiltered.map((o) => {
                const isAmountSorted = sortField === 'amount';
                const isDateSorted = sortField === 'date';
                
                const isHighValue = o.amount >= 120;
                // Within 14 days of the latest transaction is considered recent trend
                const isRecent = (maxDateTimestamp - new Date(o.date).getTime()) <= 14 * 24 * 60 * 60 * 1000;

                const isHighValueHighlight = isAmountSorted && isHighValue;
                const isRecentTrendHighlight = isDateSorted && isRecent;
                const isHighlighted = isHighValueHighlight || isRecentTrendHighlight;

                return (
                  <tr 
                    key={o.order_id} 
                    className={cn(
                      "transition-all duration-200", 
                      isHighlighted 
                        ? (isHighValueHighlight 
                            ? "bg-[#211545]/60 hover:bg-[#281a54]/70 text-purple-100" 
                            : "bg-[#0b2725]/60 hover:bg-[#103633]/70 text-emerald-100")
                        : "hover:bg-[#1a153a]/50"
                    )}
                  >
                    <td className="px-4 py-4 text-center select-none w-12">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox"
                          checked={selectedOrderIds.includes(o.order_id)}
                          onChange={() => toggleSelectRow(o.order_id)}
                          className="rounded bg-[#1a1538] border-[#372c6e] checked:bg-purple-600 checked:border-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4 transition-all"
                          id={`select-row-checkbox-${o.order_id}`}
                          title="Select row"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white text-xs">
                      <div className="flex items-center gap-1.5">
                        {isHighlighted && (
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isHighValueHighlight ? "bg-purple-400 animate-pulse" : "bg-emerald-400 animate-pulse"
                          )} />
                        )}
                        <span>{o.order_id.slice(0, 12)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400 font-mono">{o.customer_id.substring(0, 8)}@mail.com</td>
                    <td className="px-6 py-4 text-neutral-300 capitalize">{o.city}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>{new Date(o.date).toLocaleDateString()}</span>
                        {isRecentTrendHighlight && (
                          <span className="text-[8px] font-mono leading-none tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 animate-pulse">
                            TREND
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-zinc-400">
                      ${o.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-bold text-white border-l border-[#231b45]/40 pl-4 bg-[#14102c]/20">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[#c084fc] font-extrabold font-mono">{convert(o.amount)}</span>
                          {isHighValueHighlight && (
                            <span className="text-[8px] font-mono leading-none tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50 animate-pulse mt-1 inline-block">
                              HIGH VALUE
                            </span>
                          )}
                        </div>

                        {/* Sparkline Container */}
                        {(() => {
                          const trendKey = sparklineGroupType === 'city' ? o.city : o.customer_id;
                          const trendValues = historyGroups[sparklineGroupType][trendKey] || [];
                          const avgValue = trendValues.length ? (trendValues.reduce((a, b) => a + b, 0) / trendValues.length) : 0;
                          const maxValue = trendValues.length ? Math.max(...trendValues) : 0;
                          const minValue = trendValues.length ? Math.min(...trendValues) : 0;

                          return (
                            <div className="relative group/sparkline flex items-center justify-end shrink-0 cursor-help py-1">
                              <Sparkline values={trendValues} strokeColor="#c084fc" cityKey={trendKey} />

                              {/* Rich interactive group hover tooltip with precise stats */}
                              <div className="absolute bottom-full mb-2 right-0 hidden group-hover/sparkline:block bg-[#161233] border border-[#4c3d99]/80 text-white rounded-xl p-3 shadow-2xl z-50 pointer-events-none whitespace-nowrap text-[10px] font-mono min-w-[170px]">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-4 border-b border-[#2d245e] pb-1">
                                    <span className="font-bold text-purple-300 uppercase tracking-wider text-[9px] truncate max-w-[90px]">
                                      {sparklineGroupType === 'city' ? `${o.city}` : `Customer`}
                                    </span>
                                    <span className="bg-[#2d245e] px-1.5 py-0.5 rounded text-[8px] text-[#baa4f9]">
                                      {trendValues.length} {language === 'CN' ? '笔订单' : 'Orders'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-zinc-400">{language === 'CN' ? '历史平均' : 'Avg Spend'}:</span>
                                    <span className="text-white font-bold">{convert(avgValue)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-zinc-400">{language === 'CN' ? '单笔峰值' : 'Peak Spend'}:</span>
                                    <span className="text-emerald-400 font-bold">{convert(maxValue)}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-zinc-400">{language === 'CN' ? '最低单笔' : 'Min Spend'}:</span>
                                    <span className="text-zinc-300 font-bold">{convert(minValue)}</span>
                                  </div>
                                </div>
                                <div className="absolute top-full right-4 transform -translate-y-[1px] w-2 h-2 bg-[#161233] border-r border-b border-[#4c3d99]/80 rotate-45" />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full border uppercase inline-block leading-normal",
                      o.status === 'Delivered' ? "bg-emerald-900/25 border-emerald-800/40 text-emerald-400" :
                      o.status === 'Delayed' ? "bg-rose-900/25 border-rose-800/40 text-rose-400" :
                      o.status === 'Refunded' ? "bg-zinc-800/40 border-zinc-700/40 text-zinc-400" :
                      "bg-amber-900/25 border-amber-800/40 text-amber-400"
                    )}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {o.status !== 'Refunded' ? (
                      <button 
                        onClick={() => setConfirmingOrder(o)}
                        className="px-3 py-1 bg-[#1b1738] hover:bg-rose-950/20 text-rose-300 hover:text-rose-400 border border-[#2d255c] hover:border-rose-800/40 text-[10px] font-mono font-bold rounded duration-150 inline-block leading-none mr-2 shadow-sm"
                        id={`refund-btn-${o.order_id}`}
                      >
                        REFUND $$
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-zinc-500 select-none py-1">- No Action -</span>
                    )}

                    {o.status === 'Delayed' && (
                      <button 
                        onClick={() => onSendMessage(`Investigate delivery delayed bottleneck route status for order ${o.order_id} destination ${o.city}. Give precise diagnostic.`)}
                        className="px-3 py-1 bg-[#8b5cf6] text-white text-[10px] font-mono font-bold rounded duration-150 hover:bg-[#7c3aed] shadow"
                      >
                        TRACK ROUTE
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-zinc-500">
                    No order registries matched query filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmingOrder && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setConfirmingOrder(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              id="confirm-modal-backdrop"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md bg-[#120f26] border border-[#342a63] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              id="confirm-modal-content"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => setConfirmingOrder(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-[#1f193d] transition-colors"
                id="confirm-modal-close"
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-950/35 border border-rose-800/30 text-rose-400 shrink-0">
                  <AlertTriangle size={24} className="animate-pulse" />
                </div>
                
                <div className="space-y-4 w-full">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {language === 'CN' ? '确认发起退款请求' : 'Confirm Refund Action'}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {language === 'CN' 
                        ? '此操作将立刻调用智慧引擎修改系统后台数据库，向此客户的支付网关发起原路退款，并生成对应的致歉邮件。此操作不可逆。' 
                        : 'This will initiate a refund with the payment gateway, update the database state, and compose an automated service apology. This action is irreversible.'}
                    </p>
                  </div>

                  {/* Summary of invoice details */}
                  <div className="bg-[#181434] border border-[#231d4d] rounded-2xl p-4 font-mono space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 uppercase font-semibold tracking-wider">
                        {language === 'CN' ? '交易单号' : 'TX ID'}
                      </span>
                      <span className="text-white font-bold select-all">
                        {confirmingOrder.order_id}
                      </span>
                    </div>
                    <div className="h-px bg-[#231d4d]" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 uppercase font-semibold tracking-wider">
                        {language === 'CN' ? '收货城市' : 'Destination'}
                      </span>
                      <span className="text-zinc-300 capitalize font-medium">
                        {confirmingOrder.city}
                      </span>
                    </div>
                    <div className="h-px bg-[#231d4d]" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 uppercase font-semibold tracking-wider">
                        {language === 'CN' ? '退款金额' : 'Refund Value'}
                      </span>
                      <span className="text-rose-400 font-extrabold text-sm">
                        {convert(confirmingOrder.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setConfirmingOrder(null)}
                      className="flex-1 py-2.5 bg-transparent hover:bg-[#1a1438] text-zinc-400 hover:text-zinc-200 border border-[#2d2459] text-xs font-mono font-bold rounded-xl transition-all duration-150 cursor-pointer text-center"
                      id="confirm-modal-cancel-btn"
                    >
                      {language === 'CN' ? '取消返回' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => {
                        issueRefund(confirmingOrder.order_id, confirmingOrder.amount);
                        setConfirmingOrder(null);
                      }}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-xl shadow-[0_4px_12px_rgba(239,68,68,0.2)] transition-all duration-150 cursor-pointer hover:scale-[1.01] text-center"
                      id="confirm-modal-action-btn"
                    >
                      {language === 'CN' ? '确定退款' : 'Proceed Refund'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedOrderIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#161233]/95 backdrop-blur-md border border-purple-500/40 rounded-2xl px-6 py-4 flex items-center justify-between gap-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-white w-full max-w-xl"
            id="orders-bulk-action-bar"
          >
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-6 w-6 rounded-lg bg-purple-900/50 flex items-center justify-center text-xs font-mono font-bold text-purple-300 border border-purple-700/40 animate-pulse">
                {selectedOrderIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {language === 'CN' ? '已选择条目' : 'Selected Entries'}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {language === 'CN' ? '可批量执行退款或账目导出' : 'Perform bulk accounting or refund'}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-zinc-800 shrink-0" />

            <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-end">
              {/* Clear Selection */}
              <button
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-1.5 hover:bg-[#201a45] text-zinc-400 hover:text-zinc-200 text-xs font-mono font-bold rounded-lg transition-all border border-[#2d2459] cursor-pointer"
                title="Deselect all records"
              >
                {language === 'CN' ? '清除选中' : 'CLEAR'}
              </button>

              {/* Bulk Export CSV */}
              <button
                onClick={handleBulkExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b153c] hover:bg-[#251d52] text-xs font-mono font-bold text-[#baa4f9] hover:text-[#d8b4fe] border border-[#372c6e] hover:border-[#4c3d99] rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Export only selected orders as a CSV file"
              >
                <Download size={13} />
                <span>{language === 'CN' ? '常规导出' : 'EXPORT'} ({selectedOrderIds.length})</span>
              </button>

              {/* Bulk Export Pending Refund CSV */}
              <button
                onClick={handleBulkExportPendingRefundCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1c102a] hover:bg-[#2c1a42] text-xs font-mono font-bold text-rose-300 hover:text-rose-100 border border-rose-950/55 hover:border-rose-900/50 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Download selected orders in a dedicated 'Pending Refund' CSV format for accounting"
                id="orders-bulk-export-pending-refund"
              >
                <Download size={13} className="text-rose-400" />
                <span>{language === 'CN' ? '退款账目 CSV' : 'REFUND CSV'}</span>
              </button>

              {/* Bulk Export PDF Summary */}
              <button
                onClick={handleBulkExportPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1f163f] hover:bg-[#2b1f57] text-xs font-mono font-bold text-amber-200 hover:text-amber-100 border border-purple-400/30 hover:border-purple-400/50 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Generate and download a formatted PDF invoice summary for current selected orders"
                id="orders-bulk-export-pdf"
              >
                <FileText size={13} className="text-amber-400" />
                <span>{language === 'CN' ? '对账单 PDF' : 'PDF INVOICE'}</span>
              </button>

              {/* Bulk Refund */}
              <button
                onClick={() => setShowBulkRefundModal(true)}
                disabled={eligibleSelectedForRefund.length === 0}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all text-white shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                  eligibleSelectedForRefund.length > 0
                    ? "bg-rose-600 hover:bg-rose-500 hover:scale-[1.01]"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed"
                )}
                title={eligibleSelectedForRefund.length === 0 ? "No refund-eligible orders selected" : "Bulk refund selected orders"}
              >
                <span>{language === 'CN' ? '退款' : 'REFUND'} ({eligibleSelectedForRefund.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Refund Confirmation Modal */}
      <AnimatePresence>
        {showBulkRefundModal && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowBulkRefundModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              id="bulk-refund-modal-backdrop"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md bg-[#120f26] border border-[#342a63] rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              id="bulk-refund-modal-content"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => setShowBulkRefundModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-[#1f193d] transition-colors"
                id="bulk-refund-modal-close"
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-950/35 border border-rose-800/30 text-rose-400 shrink-0">
                  <AlertTriangle size={24} className="animate-pulse" />
                </div>
                
                <div className="space-y-4 w-full">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {language === 'CN' ? '确认批量发起退款' : 'Confirm Bulk Refund Action'}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {language === 'CN' 
                        ? `此操作将对所选的 ${eligibleSelectedForRefund.length} 笔订单发起退款，修改系统后台数据库状态为 'Refunded'。该操作不可撤销，请仔细核对。` 
                        : `This will launch bulk refunds for ${eligibleSelectedForRefund.length} selected eligible orders and set their fulfillment status to 'Refunded'. This action is irreversible.`}
                    </p>
                  </div>

                  {/* Summary of invoice details */}
                  <div className="bg-[#181434] border border-[#231d4d] rounded-2xl p-4 font-mono space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 uppercase font-semibold tracking-wider">
                        {language === 'CN' ? '退款订单数' : 'Refund Count'}
                      </span>
                      <span className="text-white font-bold">
                        {eligibleSelectedForRefund.length} {language === 'CN' ? '笔订单' : 'item(s)'}
                      </span>
                    </div>
                    <div className="h-px bg-[#231d4d]" />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500 uppercase font-semibold tracking-wider">
                        {language === 'CN' ? '合并总计金额' : 'Combined Total'}
                      </span>
                      <span className="text-rose-400 font-extrabold text-sm">
                        {convert(eligibleSelectedForRefund.reduce((acc, c) => acc + c.amount, 0))}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowBulkRefundModal(false)}
                      className="flex-1 py-2.5 bg-transparent hover:bg-[#1a1438] text-zinc-400 hover:text-zinc-200 border border-[#2d2459] text-xs font-mono font-bold rounded-xl transition-all duration-150 cursor-pointer text-center"
                      id="bulk-refund-modal-cancel-btn"
                    >
                      {language === 'CN' ? '取消返回' : 'Cancel'}
                    </button>
                    <button
                      onClick={executeBulkRefund}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded-xl shadow-[0_4px_12px_rgba(239,68,68,0.2)] transition-all duration-150 cursor-pointer hover:scale-[1.01] text-center"
                      id="bulk-refund-modal-action-btn"
                    >
                      {language === 'CN' ? '确定批量退款' : 'Proceed Refund'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
