with open('src/components/screens/CarLoanApplyScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = "import { isUserDocUploaded, getUserIncomeFormatted, getUserEmploymentType } from '../../utils/formPreFill';"
replacement = """import { isUserDocUploaded, getUserIncomeFormatted, getUserEmploymentType, findUserDocument } from '../../utils/formPreFill';
import { LoanDocItemRow } from '../common/LoanDocItemRow';
import { DocumentViewPreviewModal } from '../common/DocumentViewPreviewModal';
import { GoogleCitySearchInput } from '../common/GoogleCitySearchInput';
import { CalendarPickerModal } from '../common/CalendarPickerModal';
import { DocumentItem } from '../../types';
import { documentService } from '../../services/documentService';
import { Platform } from 'react-native';"""

text = text.replace(target, replacement, 1)

with open('src/components/screens/CarLoanApplyScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('CarLoan imports fixed!')
