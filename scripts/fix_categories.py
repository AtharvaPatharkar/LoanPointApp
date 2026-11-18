with open('src/components/screens/PersonalLoanApplyScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("'Identity'", "'Identity Proof'")
text = text.replace("'Address'", "'Address Proof'")
text = text.replace("'Income'", "'Income Proof'")
text = text.replace("'Bank Statement'", "'Income Proof'")

with open('src/components/screens/PersonalLoanApplyScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Categories replaced successfully!")
