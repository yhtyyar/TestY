import pytest
from openpyxl import Workbook
from io import BytesIO

from testy.tests_description.services.zephyr_parser import ZephyrScaleParser


def _make_xlsx(rows):
    """Create an in-memory XLSX file from a list of row tuples."""
    wb = Workbook()
    ws = wb.active
    ws.title = 'Sheet0'
    headers = [
        'Key', 'Name', 'Status', 'Precondition', 'Objective', 'Folder',
        'Priority', 'Component', 'Labels', 'Owner', 'Estimated Time',
        'Coverage (Issues)', 'Coverage (Pages)',
        'Test Script (Step-by-Step) - Step',
        'Test Script (Step-by-Step) - Test Data',
        'Test Script (Step-by-Step) - Expected Result',
        'Test Script (Plain Text)', 'Test Script (BDD)',
    ]
    ws.append(headers)
    for row in rows:
        padded = list(row) + [None] * (18 - len(row))
        ws.append(padded)
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


class TestZephyrScaleParser:

    def test_parse_single_test_case_no_steps(self):
        data = _make_xlsx([
            ('TC-1', 'Login test', 'Draft', 'Setup browser', 'Verify login',
             '/Auth', 'High', None, '', 'user1', '', '', '',
             None, None, None, None, None),
        ])
        parser = ZephyrScaleParser(data)
        result = parser.parse()
        assert len(result) == 1
        tc = result[0]
        assert tc.key == 'TC-1'
        assert tc.name == 'Login test'
        assert tc.status == 'Draft'
        assert tc.precondition == 'Setup browser'
        assert tc.objective == 'Verify login'
        assert tc.folder == '/Auth'
        assert tc.priority == 'High'
        assert len(tc.steps) == 0

    def test_parse_test_case_with_steps(self):
        data = _make_xlsx([
            ('TC-2', 'Checkout flow', 'Approved', '', '', '/Shop/Cart', 'Normal',
             None, '', '', '', '', '',
             'Open cart page', 'item=1', 'Cart is displayed',
             None, None),
            (None, None, None, None, None, None, None,
             None, None, None, None, None, None,
             'Click checkout', '', 'Checkout page opens',
             None, None),
            (None, None, None, None, None, None, None,
             None, None, None, None, None, None,
             'Confirm order', '', 'Order confirmed',
             None, None),
        ])
        parser = ZephyrScaleParser(data)
        result = parser.parse()
        assert len(result) == 1
        tc = result[0]
        assert tc.name == 'Checkout flow'
        assert len(tc.steps) == 3
        assert tc.steps[0].step == 'Open cart page'
        assert tc.steps[0].test_data == 'item=1'
        assert tc.steps[0].expected_result == 'Cart is displayed'
        assert tc.steps[1].step == 'Click checkout'
        assert tc.steps[2].step == 'Confirm order'

    def test_parse_multiple_test_cases(self):
        data = _make_xlsx([
            ('TC-1', 'Test A', 'Draft', '', '', '/Suite1', 'Normal',
             None, '', '', '', '', '', 'Step 1', '', 'Expected 1', None, None),
            ('TC-2', 'Test B', 'Approved', '', '', '/Suite2', 'High',
             None, '', '', '', '', '', 'Step 1', '', 'Expected 1', None, None),
            (None, None, None, None, None, None, None,
             None, None, None, None, None, None,
             'Step 2', '', 'Expected 2', None, None),
        ])
        parser = ZephyrScaleParser(data)
        result = parser.parse()
        assert len(result) == 2
        assert result[0].name == 'Test A'
        assert len(result[0].steps) == 1
        assert result[1].name == 'Test B'
        assert len(result[1].steps) == 2

    def test_parse_empty_file(self):
        data = _make_xlsx([])
        parser = ZephyrScaleParser(data)
        result = parser.parse()
        assert len(result) == 0

    def test_get_folder_tree(self):
        data = _make_xlsx([
            ('TC-1', 'Test', 'Draft', '', '', '/Root/Sub1/Sub2', 'Normal',
             None, '', '', '', '', '', None, None, None, None, None),
        ])
        parser = ZephyrScaleParser(data)
        parser.parse()
        folders = parser.get_folder_tree()
        assert '/Root' in folders
        assert '/Root/Sub1' in folders
        assert '/Root/Sub1/Sub2' in folders

    def test_parse_strips_whitespace(self):
        data = _make_xlsx([
            ('  TC-3  ', '  Whitespace test  ', 'Draft', '', '', '/Folder ', 'Normal',
             None, '', '', '', '', '', '  Step text  ', '', '  Expected  ', None, None),
        ])
        parser = ZephyrScaleParser(data)
        result = parser.parse()
        assert result[0].key == 'TC-3'
        assert result[0].name == 'Whitespace test'
        assert result[0].steps[0].step == 'Step text'
