import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, Zap, TrendingUp, CreditCard, Pencil, X, Check, Trash2, FileText, Printer } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
const isAdmin = (role?: string) => role ? ADMIN_ROLES.includes(role) : false;

/* ── World currencies (ISO 4217) ── */
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'din' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.' },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.S' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$' },
  { code: 'TTD', name: 'Trinidad Dollar', symbol: 'TT$' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$' },
  { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: '£' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'LD' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'IQD' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'лв' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'P' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'WS$' },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT' },
];

const fmtCurrency = (n: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  } catch {
    const sym = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
    return `${sym}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

const fmt = (n: number, currency?: string) => fmtCurrency(n, currency);

export const Payroll: React.FC = () => {
  const { user } = useAuth();
  const admin = isAdmin(user?.role);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ basicSalary: 0, allowances: 0, deductions: 0, status: 'DRAFT' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPayslip, setViewPayslip] = useState<any | null>(null);
  const [orgName, setOrgName] = useState('My Organization');
  const [currency, setCurrency] = useState('USD');
  const [savingCurrency, setSavingCurrency] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchPayroll = async () => {
    setLoading(true);
    const { data } = await api.get('/payroll', { params: { month, year, limit: 50 } });
    let list = data.payslips || [];
    if (!admin && user?.email) {
      list = list.filter((p: any) => p.employee?.email === user.email);
    }
    setPayslips(list);
    setTotal(admin ? (data.total || 0) : list.length);
    setLoading(false);
  };

  useEffect(() => { fetchPayroll(); }, [month, year, admin, user?.email]);

  useEffect(() => {
    api.get('/organization').then(r => {
      setOrgName(r.data?.name || 'My Organization');
      setCurrency(r.data?.currency || 'USD');
    }).catch(() => {});
  }, []);

  const handleCurrencyChange = async (code: string) => {
    setCurrency(code);
    setSavingCurrency(true);
    try {
      await api.put('/organization', { currency: code });
      toast.success(`Currency set to ${code}`);
    } catch { toast.error('Failed to save currency'); }
    finally { setSavingCurrency(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/payroll/generate', { month, year });
      toast.success(data.message);
      fetchPayroll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error generating payroll'); }
    finally { setGenerating(false); }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({ basicSalary: p.basicSalary, allowances: p.allowances, deductions: p.deductions, status: p.status });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const net = editForm.basicSalary + editForm.allowances - editForm.deductions;
      await api.put(`/payroll/${editingId}`, { ...editForm, netSalary: net, tax: editForm.deductions });
      toast.success('Payslip updated');
      setEditingId(null);
      fetchPayroll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/payroll/${deleteId}`);
      toast.success('Payslip deleted');
      setDeleteId(null);
      fetchPayroll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Payslip</title><style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b;font-size:13px;}
      ${content.getAttribute('data-print-css') || ''}
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const totalNet   = payslips.reduce((s, p) => s + p.netSalary, 0);
  const totalBasic = payslips.reduce((s, p) => s + p.basicSalary, 0);
  const paidCount  = payslips.filter(p => p.status === 'PAID').length;

  const selectCls = "px-3 py-2.5 text-sm rounded-xl outline-none bg-white text-slate-700";
  const selectStyle = { border: '1.5px solid #e2e8f0' };
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{admin ? 'Payroll' : 'My Salary'}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{admin ? `${total} payslips` : 'Your salary details'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency selector */}
          <div className="relative">
            <select
              value={currency}
              onChange={e => handleCurrencyChange(e.target.value)}
              disabled={savingCurrency}
              className={selectCls}
              style={{ ...selectStyle, paddingLeft: 36, minWidth: 140 }}
              title="Select currency">
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold pointer-events-none">
              {CURRENCIES.find(c => c.code === currency)?.symbol || '$'}
            </span>
          </div>

          <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls} style={selectStyle}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls} style={selectStyle}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {admin && (
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <Zap size={15} className={generating ? 'animate-pulse' : ''} />
              {generating ? 'Generating…' : `Generate ${monthName} ${year}`}
            </button>
          )}
        </div>
      </div>

      {/* Summary cards — admin only */}
      {admin && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Basic', value: fmtCurrency(totalBasic, currency), icon: DollarSign, grad: 'linear-gradient(135deg,#6366f1,#818cf8)' },
            { label: 'Net Payable', value: fmtCurrency(totalNet, currency),   icon: TrendingUp, grad: 'linear-gradient(135deg,#10b981,#34d399)' },
            { label: 'Paid',        value: `${paidCount} / ${total}`,                      icon: CreditCard, grad: 'linear-gradient(135deg,#f59e0b,#fb923c)' },
          ].map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: grad }}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-xl font-extrabold text-slate-800">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              {['Employee', 'Department', 'Basic Salary', 'Allowances', 'Deductions', 'Net Salary', 'Status', 'Payslip', ...(admin ? ['Actions'] : [])].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={admin ? 9 : 8} className="text-center py-16">
                <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : payslips.length === 0 ? (
              <tr><td colSpan={admin ? 9 : 8} className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <DollarSign size={22} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-semibold">{admin ? 'No payslips yet' : 'No payslip for this period'}</p>
                <p className="text-slate-400 text-sm mt-1">{admin ? `Click "Generate ${monthName} ${year}" to create payslips` : 'Your payslip will appear here once processed'}</p>
              </td></tr>
            ) : payslips.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors" style={{ borderBottom: '1px solid #f8fafc' }}>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-800">{p.employee?.firstName} {p.employee?.lastName}</td>
                <td className="px-5 py-3.5 text-[13px] text-slate-600">{p.employee?.department?.name || '—'}</td>
                <td className="px-5 py-3.5 text-[13px] text-slate-700 font-medium">{fmtCurrency(p.basicSalary, currency)}</td>
                <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: '#059669' }}>+{fmtCurrency(p.allowances, currency)}</td>
                <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: '#dc2626' }}>-{fmtCurrency(p.deductions, currency)}</td>
                <td className="px-5 py-3.5 text-[13px] font-bold text-slate-800">{fmtCurrency(p.netSalary, currency)}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={p.status === 'PAID'
                      ? { background: 'rgba(16,185,129,0.1)', color: '#059669' }
                      : { background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => setViewPayslip(p)} title="View Payslip"
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <FileText size={12} /> View
                  </button>
                </td>
                {admin && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => startEdit(p)} title="Edit"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} title="Delete"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Payslip Viewer Modal ── */}
      {viewPayslip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setViewPayslip(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" />
                <span className="font-bold text-slate-800">Payslip</span>
                <span className="text-xs text-slate-400">
                  {new Date(viewPayslip.year, viewPayslip.month - 1).toLocaleString('default', { month: 'long' })} {viewPayslip.year}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint}
                  className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button onClick={() => setViewPayslip(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Payslip content */}
            <div className="flex-1 overflow-y-auto p-6">
              <PrintablePayslip ref={printRef} payslip={viewPayslip} orgName={orgName} currency={currency} />
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingId && admin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Update Payslip</h3>
              <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {[['Basic Salary','basicSalary'],['Allowances','allowances'],['Deductions','deductions']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                  <input type="number" value={(editForm as any)[key]}
                    onChange={e => setEditForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500" min={0} step={100} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 outline-none focus:border-indigo-500">
                  <option value="DRAFT">Draft</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              <p className="text-sm font-semibold text-slate-600">
                Net: <span className="text-indigo-600">${(editForm.basicSalary + editForm.allowances - editForm.deductions).toLocaleString()}</span>
              </p>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Check size={16} /> Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && admin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl modal-in" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center">Delete Payslip?</h3>
            <p className="text-sm text-slate-500 text-center mt-1.5">This action cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                style={{ border: '1.5px solid #e2e8f0' }}>Cancel</button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Printable Payslip Component ── */
const PrintablePayslip = React.forwardRef<HTMLDivElement, { payslip: any; orgName: string; currency: string }>(
  ({ payslip: p, orgName, currency }, ref) => {
    const emp = p.employee || {};
    const periodMonth = new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' });
    const gross = p.basicSalary + p.allowances;
    const c = (n: number) => fmtCurrency(n, currency);
    const printCSS = `
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; font-size: 13px; padding: 32px; }
      .payslip-wrap { max-width: 720px; margin: 0 auto; }
      table { width: 100%; border-collapse: collapse; }
      td, th { padding: 8px 12px; }
    `;

    return (
      <div ref={ref} data-print-css={printCSS}>
        <div style={{
          maxWidth: 680, margin: '0 auto', background: '#fff',
          fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 13, color: '#1e293b',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: 12, padding: '28px 32px', marginBottom: 24, color: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{orgName}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Human Resources Department</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>PAYSLIP</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{periodMonth} {p.year}</div>
                <div style={{
                  marginTop: 8, display: 'inline-block', padding: '3px 12px', borderRadius: 20,
                  background: p.status === 'PAID' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                  color: p.status === 'PAID' ? '#bbf7d0' : '#fde68a', fontSize: 11, fontWeight: 700,
                }}>
                  {p.status}
                </div>
              </div>
            </div>
          </div>

          {/* Employee info */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24,
          }}>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>Employee Details</div>
              <InfoLine label="Name" value={`${emp.firstName || ''} ${emp.lastName || ''}`} />
              <InfoLine label="Employee ID" value={emp.employeeId || '—'} />
              <InfoLine label="Department" value={emp.department?.name || '—'} />
              <InfoLine label="Email" value={emp.email || '—'} />
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>Pay Period</div>
              <InfoLine label="Month" value={periodMonth} />
              <InfoLine label="Year" value={String(p.year)} />
              <InfoLine label="Pay Date" value={p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'} />
              <InfoLine label="Status" value={p.status} highlight={p.status === 'PAID' ? '#059669' : '#d97706'} />
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Earnings */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(99,102,241,0.08)', padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>Earnings</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <SlipRow label="Basic Salary" value={c(p.basicSalary)} />
                  <SlipRow label="House Allowance (10%)" value={c(p.allowances)} />
                  <SlipRow label="Gross Earnings" value={c(gross)} bold accent="#6366f1" last />
                </tbody>
              </table>
            </div>

            {/* Deductions */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(239,68,68,0.06)', padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1 }}>Deductions</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <SlipRow label="Income Tax (15%)" value={c(p.tax || p.deductions)} />
                  <SlipRow label="Other Deductions" value={c(Math.max(0, p.deductions - (p.tax || p.deductions)))} />
                  <SlipRow label="Total Deductions" value={c(p.deductions)} bold accent="#dc2626" last />
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Pay */}
          <div style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: 12, padding: '20px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20,
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: 0.5 }}>NET PAY</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                Gross {c(gross)} − Deductions {c(p.deductions)}
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
              {c(p.netSalary)}
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>
              This is a system-generated payslip and does not require a signature.
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>
              Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

const InfoLine = ({ label, value, highlight }: { label: string; value: string; highlight?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
    <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
    <span style={{ fontWeight: 600, fontSize: 12, color: highlight || '#1e293b' }}>{value}</span>
  </div>
);

const SlipRow = ({ label, value, bold, accent, last }: { label: string; value: string; bold?: boolean; accent?: string; last?: boolean }) => (
  <tr style={{ borderBottom: last ? 'none' : '1px solid #f1f5f9', background: last ? '#fafafa' : '#fff' }}>
    <td style={{ padding: '9px 16px', fontSize: 12, color: bold ? (accent || '#1e293b') : '#64748b', fontWeight: bold ? 700 : 400 }}>{label}</td>
    <td style={{ padding: '9px 16px', fontSize: 12, fontWeight: bold ? 700 : 500, color: bold ? (accent || '#1e293b') : '#1e293b', textAlign: 'right' }}>{value}</td>
  </tr>
);
