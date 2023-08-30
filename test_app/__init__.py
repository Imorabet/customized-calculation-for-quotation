
__version__ = '0.0.1'

from erpnext.controllers.taxes_and_totals import calculate_taxes_and_totals
from test_app.override import Calculating

calculate_taxes_and_totals.calculate_item_values=Calculating.calculate_item_values