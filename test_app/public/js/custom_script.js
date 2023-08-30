function calculateAmount(frm, cdt, cdn) {
    setTimeout(function () {
        var item = locals[cdt][cdn];
        var length = item.length;
        var width = item.width;
        var quantity = item.qty;
        var rate = item.rate;

        // Calculate the item amount
        var amount = length * rate * width * quantity;
        frappe.model.set_value(cdt, cdn, 'amount', amount);

        // Calculate the total of items
        var total = 0;
        frm.doc.items.forEach(function (item) {
            total += item.amount;
        });
        frappe.model.set_value('Quotation', frm.doc.name, 'total', total);

        // Calculate the total tax amount based on tax rates
        var taxTotal = 0;
        var previousTaxTotal = total;
        for (var i = 0; i < frm.doc.taxes.length; i++) {
            var tax = frm.doc.taxes[i];
            var currentTaxAmount = 0;

            if (tax.charge_type === "Actual") {
                // Distribute the tax amount proportionally to each item row
                var actual = tax.tax_amount;
                currentTaxAmount = (total * actual) / frm.doc.net_total || 0.0;
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
            console.log('lolololo')
            console.log(currentTaxAmount, '===', tax.tax_amount)

            //calculates total inside taxes 
            taxTotal += currentTaxAmount;
            if (i === 0) {
                tax.total = previousTaxTotal + tax.tax_amount;
                console.log('firts row', tax.total)
                previousTaxTotal = tax.total;
            } else {
                tax.total = previousTaxTotal + tax.tax_amount;
                previousTaxTotal = tax.total
                console.log('others rows', tax.total)

            }
        }
        frm.refresh_field('taxes');
        // Calculate total related fields
        var grandTotal = total + taxTotal
        var baseGrandTotal = grandTotal * frm.doc.conversion_rate;
        var roundedTotal = Math.round(grandTotal);

        // Update the document fields
        frappe.model.set_value('Quotation', frm.doc.name, 'grand_total', grandTotal);
        frappe.model.set_value('Quotation', frm.doc.name, 'base_grand_total', baseGrandTotal);
        frappe.model.set_value('Quotation', frm.doc.name, 'total_taxes_and_charges', taxTotal);
        frappe.model.set_value('Quotation', frm.doc.name, 'rounded_total', roundedTotal);

        // Log the calculated values
        console.log('total', total, 'grandTotal', grandTotal, 'baseGrandTotal', baseGrandTotal, 'taxTotal', taxTotal, 'rounded total', roundedTotal);
    }, 1000);
}

frappe.ui.form.on('Quotation Item', {
    length: function (frm, cdt, cdn) {
        calculateAmount(frm, cdt, cdn);
    },
    width: function (frm, cdt, cdn) {
        calculateAmount(frm, cdt, cdn);
    },
    qty: function (frm, cdt, cdn) {
        calculateAmount(frm, cdt, cdn);
    },
    rate: function (frm, cdt, cdn) {
        calculateAmount(frm, cdt, cdn);
    },
    refresh: function (frm, cdt, cdn) {
        calculateAmount(frm, cdt, cdn);
    },
});
