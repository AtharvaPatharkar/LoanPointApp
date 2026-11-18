with open('src/components/screens/HomeLoanApplyScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import { Platform } from 'react-native';", "import { Platform, Alert } from 'react-native';")

with open('src/components/screens/HomeLoanApplyScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Added Alert import to HomeLoanApplyScreen')
