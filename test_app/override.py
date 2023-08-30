import frappe
from frappe import _, scrub
from frappe.utils import flt
from erpnext.controllers.taxes_and_totals import calculate_taxes_and_totals
from erpnext.accounts.doctype.pricing_rule.utils import get_applied_pricing_rules


# def update_item_amount(doc, method):
#     total_amount = 0
#     for item in doc.items:
#         item.amount = flt(item.qty) * flt(item.rate) * flt(item.length) * flt(item.width)
#         frappe.db.set_value('Quotation Item', item.name, 'amount', item.amount)
# total_amount += item.amount
# doc.total = total_amount
# frappe.db.set_value('Quotation', doc.name, 'total', total_amount)

class Calculating(calculate_taxes_and_totals):
    def calculate_item_values(self):
        if self.doc.get("is_consolidated"):
            return

        if not self.discount_amount_applied:
            for item in self._items:
                self.doc.round_floats_in(item)

                if item.discount_percentage == 100:
                    item.rate = 0.0
                elif item.price_list_rate:
                    if not item.rate or (
                        item.pricing_rules and item.discount_percentage > 0
                    ):
                        item.rate = flt(
                            item.price_list_rate
                            * (1.0 - (item.discount_percentage / 100.0)),
                            item.precision("rate"),
                        )

                        item.discount_amount = item.price_list_rate * (
                            item.discount_percentage / 100.0
                        )

                    elif item.discount_amount and item.pricing_rules:
                        item.rate = item.price_list_rate - item.discount_amount

                if item.doctype in [
                    "Quotation Item",
                    "Sales Order Item",
                    "Delivery Note Item",
                    "Sales Invoice Item",
                    "POS Invoice Item",
                    "Purchase Invoice Item",
                    "Purchase Order Item",
                    "Purchase Receipt Item",
                ]:
                    (
                        item.rate_with_margin,
                        item.base_rate_with_margin,
                    ) = self.calculate_margin(item)
                    if flt(item.rate_with_margin) > 0:
                        item.rate = flt(
                            item.rate_with_margin
                            * (1.0 - (item.discount_percentage / 100.0)),
                            item.precision("rate"),
                        )

                        if item.discount_amount and not item.discount_percentage:
                            item.rate = item.rate_with_margin - item.discount_amount
                        else:
                            item.discount_amount = item.rate_with_margin - item.rate

                    elif flt(item.price_list_rate) > 0:
                        item.discount_amount = item.price_list_rate - item.rate
                elif flt(item.price_list_rate) > 0 and not item.discount_amount:
                    item.discount_amount = item.price_list_rate - item.rate

                item.net_rate = item.rate

                if not item.qty and self.doc.get("is_return"):
                    item.amount = flt(-1 * item.rate, item.precision("amount"))
                elif not item.qty and self.doc.get("is_debit_note"):
                    item.amount = flt(item.rate, item.precision("amount"))
                else:
                    item.amount = flt(
                        item.rate * item.qty * item.length * item.width,
                        item.precision("amount"),
                    )

                item.net_amount = item.amount

                self._set_in_company_currency(
                    item,
                    ["price_list_rate", "rate", "net_rate", "amount", "net_amount"],
                )

                item.item_tax_amount = 0.0

    def _set_in_company_currency(self, doc, fields):
            # set values in base currency
            for f in fields:
                val = flt(
                    flt(
                        doc.get(f),
                        doc.precision(f) * self.doc.conversion_rate,
                        doc.precision("base_" + f),
                    )
                )
                doc.set("base_" + f, val)

    def calculate_margin(self, item):
            rate_with_margin = 0.0
            base_rate_with_margin = 0.0
            if item.price_list_rate:
                if item.pricing_rules and not self.doc.ignore_pricing_rule:
                    has_margin = False
                    for d in get_applied_pricing_rules(item.pricing_rules):
                        pricing_rule = frappe.get_cached_doc("Pricing Rule", d)
                        if pricing_rule.margin_rate_or_amount and (
                            (
                                pricing_rule.currency == self.doc.currency
                                and pricing_rule.margin_type in ["Amount", "Percentage"]
                            )
                            or pricing_rule.margin_type == "Percentage"
                        ):
                            item.margin_type = pricing_rule.margin_type
                            item.margin_rate_or_amount = pricing_rule.margin_rate_or_amount
                            has_margin = True
                    if not has_margin:
                        item.margin_type = None
                        item.margin_rate_or_amount=0.0
                if not item.pricing_rules and flt(item.rate)>flt(item.price_list_rate):
                    item.margin_type="Amount"
                    item.margin_rate_or_amount=flt(
                        item.rate-item.price_list_rate,item.precision("margin_rate_or_amount")
                    )
                    item.rate_with_margin = item.rate
                elif item.margin_type and item.margin_rate_or_amount:
                    margin_value = (
                        item.margin_rate_or_amount
                        if item.margin_type == "Amount"
                        else flt(item.price_list_rate) * flt(item.margin_rate_or_amount) / 100
                    )
                    rate_with_margin = flt(item.price_list_rate) + flt(margin_value)
                    base_rate_with_margin = flt(rate_with_margin) * flt(self.doc.conversion_rate)
            

            return rate_with_margin, base_rate_with_margin
