from __future__ import annotations

from dataclasses import asdict, dataclass
from decimal import Decimal, ROUND_HALF_UP


def _money(x: Decimal) -> Decimal:
    return x.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class DeductionLine:
    code: str
    name: str
    rate: Decimal  # fraction (e.g. 0.015 = 1.5%)
    amount: Decimal
    pay_to: str
    reference: str
    note: str | None = None

    def to_json(self) -> dict:
        d = asdict(self)
        d["rate"] = float(self.rate)
        d["amount"] = float(self.amount)
        return d


@dataclass(frozen=True)
class PayrollBreakdown:
    hours_worked: Decimal
    hourly_rate: Decimal
    gross: Decimal
    total_deductions: Decimal
    net: Decimal
    deductions: list[DeductionLine]
    disclaimer: str

    def to_json(self) -> dict:
        return {
            "hoursWorked": float(self.hours_worked),
            "hourlyRate": float(self.hourly_rate),
            "gross": float(self.gross),
            "totalDeductions": float(self.total_deductions),
            "net": float(self.net),
            "deductions": [d.to_json() for d in self.deductions],
            "disclaimer": self.disclaimer,
        }


def compute_payroll_breakdown(hourly_rate: Decimal, hours_worked: Decimal) -> PayrollBreakdown:
    """
    Kenyan statutory-style deductions breakdown for display on invoices.

    IMPORTANT:
    - This is an ESTIMATE for transparency, not payroll/tax advice.
    - Exact obligations depend on employment type, thresholds, and current law.
    """

    hr = Decimal(str(hourly_rate or 0))
    hw = Decimal(str(hours_worked or 0))
    if hr < 0:
        hr = Decimal("0")
    if hw < 0:
        hw = Decimal("0")

    gross = _money(hr * hw)

    # Conservative simple rates for UI breakdown (can be adjusted later).
    # PAYE is progressive in reality; we show a placeholder estimate line at 0% by default.
    paye_rate = Decimal("0.00")
    nssf_rate = Decimal("0.06")  # placeholder
    shif_rate = Decimal("0.0275")  # placeholder
    housing_levy_rate = Decimal("0.015")  # placeholder

    deductions: list[DeductionLine] = []
    deductions.append(
        DeductionLine(
            code="PAYE",
            name="PAYE (Income Tax) — estimate",
            rate=paye_rate,
            amount=_money(gross * paye_rate),
            pay_to="KRA (Kenya Revenue Authority)",
            reference="iTax / PAYE remittance",
            note="PAYE is progressive; this line is a simple estimate.",
        )
    )
    deductions.append(
        DeductionLine(
            code="NSSF",
            name="NSSF (Pension) — estimate",
            rate=nssf_rate,
            amount=_money(gross * nssf_rate),
            pay_to="NSSF",
            reference="Employer portal / NSSF number",
        )
    )
    deductions.append(
        DeductionLine(
            code="SHIF",
            name="SHIF (Health) — estimate",
            rate=shif_rate,
            amount=_money(gross * shif_rate),
            pay_to="SHIF",
            reference="SHIF portal / member number",
        )
    )
    deductions.append(
        DeductionLine(
            code="HOUSING_LEVY",
            name="Housing Levy — estimate",
            rate=housing_levy_rate,
            amount=_money(gross * housing_levy_rate),
            pay_to="KRA (Housing Levy)",
            reference="iTax / Housing Levy remittance",
        )
    )

    total = _money(sum((d.amount for d in deductions), Decimal("0")))
    net = _money(gross - total)

    return PayrollBreakdown(
        hours_worked=_money(hw),
        hourly_rate=_money(hr),
        gross=gross,
        total_deductions=total,
        net=net,
        deductions=deductions,
        disclaimer=(
            "Estimates shown for transparency. Actual statutory deductions depend on employment type, "
            "thresholds, and current Kenyan law. Confirm with KRA/NSSF/SHIF guidance."
        ),
    )

