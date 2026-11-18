with open('scripts/update_home.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("end_tag = '</View>\\n\\n            {/* Bottom 100% Safe & Secure Card */}'", "end_tag = '</View>\\n\\n            {/* Safe & Secure Notice */}'")

with open('scripts/update_home.py', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated update_home.py!')
