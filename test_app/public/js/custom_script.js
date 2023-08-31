function calculateAmount(frm) {
    setTimeout(function () {
        var total = 0;

        frm.doc.items.forEach(function (item) {
            //calculating amount and total
            var amount = item.length * item.rate * item.width * item.qty;
            frappe.model.set_value(item.doctype, item.name, 'amount', amount);

            total += amount;
            
            //tax calculations
            var taxTotal = 0;
            var previousTaxTotal = total || 0;
            for (var i = 0; i < frm.doc.taxes.length; i++) {
                var tax = frm.doc.taxes[i];
                var currentTaxAmount = 0;
                // Distribute the tax amount to each item row
                if (tax.charge_type === "Actual") {
                    currentTaxAmount = (total * tax.tax_amount) / frm.doc.net_total || 0.0;
                } else if (tax.charge_type === "On Net Total") {
                    currentTaxAmount = (tax.rate / 100.0) * total;
                } else if (tax.charge_type === "On Previous Row Amount") {
                    currentTaxAmount = (tax.rate / 100.0) * frm.doc.taxes[i - 1].base_tax_amount;
                } else if (tax.charge_type === "On Previous Row Total") {
                    currentTaxAmount = (tax.rate / 100.0) * frm.doc.taxes[i - 1].base_total;
                } else if (tax.charge_type === "On Item Quantity") {
                    currentTaxAmount = tax.rate * frm.doc.total_qty;
                }
                tax.tax_amount = currentTaxAmount;

                //calculates total inside taxes 
                taxTotal += currentTaxAmount;
                if (i === 0) {
                    tax.total = previousTaxTotal + tax.tax_amount;
                    previousTaxTotal = tax.total;
                } else {
                    tax.total = previousTaxTotal + tax.tax_amount;
                    previousTaxTotal = tax.total

                }
            }
            frm.refresh_field('taxes');
            //other fields calculations
            var grandTotal = total + taxTotal;
            var baseGrandTotal = grandTotal * frm.doc.conversion_rate;
            var roundedTotal = Math.round(grandTotal);

             // Updating fields 
            frappe.model.set_value('Quotation', frm.doc.name, 'total', total);
            frappe.model.set_value('Quotation', frm.doc.name, 'total_taxes_and_charges', taxTotal);
            frappe.model.set_value('Quotation', frm.doc.name, 'grand_total', grandTotal);
            frappe.model.set_value('Quotation', frm.doc.name, 'base_grand_total', baseGrandTotal);
            frappe.model.set_value('Quotation', frm.doc.name, 'rounded_total', roundedTotal);

            frappe.model.set_value('Quotation', frm.doc.name, 'in_words', '');
        });


    }, 1000);
}

frappe.ui.form.on('Quotation Item', {
    length: calculateAmount,
    width: calculateAmount,
    qty: calculateAmount,
    rate: calculateAmount,
    refresh: calculateAmount,
});
