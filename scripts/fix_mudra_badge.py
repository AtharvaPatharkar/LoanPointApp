with open('src/components/screens/MudraLoanApplyScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("style={styles.aadhaarBadgeText}", "style={styles.aadhaarBadgeLabel}")

with open('src/components/screens/MudraLoanApplyScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed aadhaarBadgeLabel in MudraLoanApplyScreen')
