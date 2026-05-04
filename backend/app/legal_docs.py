from html import escape
from typing import Any


def _style_block() -> str:
    return """
<style>
body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 24px; }
.doc { max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe3ef; border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
.header { border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px; }
.title { margin: 0; font-size: 24px; letter-spacing: 0.2px; }
.subtitle { margin: 6px 0 0; font-size: 13px; color: #334155; }
.meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; margin: 16px 0 20px; font-size: 14px; }
.section { margin: 16px 0; }
.section h3 { margin: 0 0 8px; font-size: 16px; color: #1e3a8a; }
.section p, .section li { line-height: 1.55; font-size: 14px; }
.note { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px 12px; font-size: 13px; color: #1e3a8a; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
th, td { border: 1px solid #dbe3ef; padding: 8px 10px; text-align: left; }
th { background: #f1f5f9; }
.totals { margin-top: 12px; }
.totals p { margin: 4px 0; font-size: 14px; }
.footer { margin-top: 28px; font-size: 12px; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
</style>
"""


def build_contract_html(*, contract_number: str, job_date: str, time_window: str, service_label: str, client_name: str, client_id: str, worker_name: str, worker_id: str, city: str) -> str:
    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Employment Contract {escape(contract_number)}</title>
{_style_block()}
</head>
<body>
  <div class="doc">
    <div class="header">
      <h1 class="title">Domestic Service Employment Contract</h1>
      <p class="subtitle">Contract Ref: {escape(contract_number)} • Jurisdiction: Republic of Kenya</p>
    </div>
    <div class="meta">
      <div><strong>Client:</strong> {escape(client_name)} ({escape(client_id)})</div>
      <div><strong>Worker:</strong> {escape(worker_name)} ({escape(worker_id)})</div>
      <div><strong>Service:</strong> {escape(service_label)}</div>
      <div><strong>Work Location:</strong> {escape(city) if city else "As agreed by parties"}</div>
      <div><strong>Start Date:</strong> {escape(job_date)}</div>
      <div><strong>Time/Schedule:</strong> {escape(time_window)}</div>
    </div>
    <div class="section">
      <h3>1. Engagement</h3>
      <p>The Client engages the Worker to perform the above domestic service in a professional manner and in compliance with applicable Kenyan labour and safety standards.</p>
    </div>
    <div class="section">
      <h3>2. Duties and Performance</h3>
      <p>The Worker shall provide the agreed services with due care, punctuality, and respect for the Client's property and household policies.</p>
    </div>
    <div class="section">
      <h3>3. Compensation and Deductions</h3>
      <p>Payment shall be documented through a formal invoice generated upon completion. Where applicable, statutory deductions are itemized to ensure legal compliance and transparency.</p>
    </div>
    <div class="section">
      <h3>4. Conduct, Privacy, and Safety</h3>
      <p>Both parties agree to respectful communication, data privacy, and observance of safety procedures. Any disputes should be documented through platform records.</p>
    </div>
    <div class="section">
      <h3>5. Records and Acceptance</h3>
      <p>This document is system-generated after booking confirmation and serves as the initial legal engagement record for the job.</p>
      <p class="note">By proceeding with this booking, both parties acknowledge this contract record and any subsequent invoice records tied to this job.</p>
    </div>
    <div class="footer">
      Issued by TrustHome Digital Records Service • This is a digitally generated legal record.
    </div>
  </div>
</body>
</html>
"""


def build_invoice_html(*, invoice_number: str, invoice_date: str, service_label: str, job_date: str, client_name: str, worker_name: str, gross: float, net: float, hours_worked: float, deductions_payload: dict[str, Any] | None) -> str:
    deductions = (deductions_payload or {}).get("deductions", [])
    rows = ""
    for item in deductions:
        rows += (
            f"<tr><td>{escape(str(item.get('name', 'Deduction')))}</td>"
            f"<td>{escape(str(item.get('code', '-')))}</td>"
            f"<td>{escape(str(item.get('pay_to', '-')))}</td>"
            f"<td>KSh {float(item.get('amount', 0)):.2f}</td></tr>"
        )
    if not rows:
        rows = "<tr><td colspan='4'>No statutory deductions applied.</td></tr>"

    total_deductions = float((deductions_payload or {}).get("totalDeductions", max(gross - net, 0)))
    disclaimer = escape(str((deductions_payload or {}).get("disclaimer", "")))

    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice {escape(invoice_number)}</title>
{_style_block()}
</head>
<body>
  <div class="doc">
    <div class="header">
      <h1 class="title">Official Service Invoice</h1>
      <p class="subtitle">Invoice No: {escape(invoice_number)} • Issued: {escape(invoice_date)}</p>
    </div>
    <div class="meta">
      <div><strong>Billed To:</strong> {escape(client_name)}</div>
      <div><strong>Service Worker:</strong> {escape(worker_name)}</div>
      <div><strong>Service:</strong> {escape(service_label)}</div>
      <div><strong>Job Date:</strong> {escape(job_date)}</div>
      <div><strong>Hours Worked:</strong> {hours_worked:.2f}</div>
      <div><strong>Currency:</strong> Kenyan Shilling (KSh)</div>
    </div>
    <div class="section">
      <h3>Statutory Deductions Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Deduction</th>
            <th>Code</th>
            <th>Pay To</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <div class="totals">
        <p><strong>Gross Amount:</strong> KSh {gross:.2f}</p>
        <p><strong>Total Deductions:</strong> KSh {total_deductions:.2f}</p>
        <p><strong>Net Amount Payable:</strong> KSh {net:.2f}</p>
      </div>
      {f'<p class="note">{disclaimer}</p>' if disclaimer else ''}
    </div>
    <div class="footer">
      Issued by TrustHome Billing & Compliance Records • This invoice is digitally generated and retained for legal audit trail.
    </div>
  </div>
</body>
</html>
"""
