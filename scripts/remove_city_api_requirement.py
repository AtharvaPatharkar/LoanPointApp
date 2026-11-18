import glob
import re

def update_all_screens():
    screens_group1 = [
        'src/components/screens/PersonalLoanApplyScreen.tsx',
        'src/components/screens/HomeLoanApplyScreen.tsx',
        'src/components/screens/BusinessLoanApplyScreen.tsx',
        'src/components/screens/CarLoanApplyScreen.tsx',
        'src/components/screens/EducationLoanApplyScreen.tsx',
    ]

    screens_group2 = [
        'src/components/screens/MortgageLoanApplyScreen.tsx',
        'src/components/screens/AgricultureLoanApplyScreen.tsx',
        'src/components/screens/MudraLoanApplyScreen.tsx',
    ]

    old_g1 = """                <View style={styles.halfColGroup}>
                  <View style={styles.twoColRight}>
                    <GoogleCitySearchInput
                      value={city}
                      onSelectCity={setCity}
                      label="City"
                      required
                      placeholder="Type city name"
                    />
                  </View>
                </View>"""

    new_g1 = """                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <Ionicons name="location-outline" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      City (Optional)
                    </Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter city name"
                        placeholderTextColor="#94a3b8"
                        value={city}
                        onChangeText={setCity}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                </View>"""

    for s in screens_group1:
        with open(s, 'r', encoding='utf-8') as f:
            text = f.read()

        if old_g1 in text:
            text = text.replace(old_g1, new_g1, 1)
            print(s + ': replaced GoogleCitySearchInput')

        text = text.replace("import { GoogleCitySearchInput } from '../common/GoogleCitySearchInput';\n", "")
        text = text.replace("import { GoogleCitySearchInput } from '../common/GoogleCitySearchInput';", "")

        text = re.sub(
            r'if\s*\(!city\.trim\(\)\)\s*\{\s*setFormError\([^\)]+\);\s*return;\s*\}',
            '// City is optional',
            text
        )

        with open(s, 'w', encoding='utf-8') as f:
            f.write(text)

    for s in screens_group2:
        with open(s, 'r', encoding='utf-8') as f:
            text = f.read()

        pattern_g2 = re.compile(
            r'<View style=\{\[styles\.fieldGroup,\s*\{\s*flex:\s*1,\s*marginLeft:\s*8\s*\}\]\}>\s*<GoogleCitySearchInput[^>]*\/>\s*<\/View>',
            re.MULTILINE
        )

        label_name = "District / City (Optional)" if "Agriculture" in s else "City (Optional)"
        placeholder_name = "Enter district/city" if "Agriculture" in s else "Enter city name"

        replacement_g2 = (
            "<View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>\n"
            "                <Text style={styles.fieldLabel}>" + label_name + "</Text>\n"
            "                <View style={styles.inputWrapper}>\n"
            "                  <View style={styles.inputIconBox}>\n"
            '                    <Ionicons name="location-outline" size={18} color="#64748b" />\n'
            "                  </View>\n"
            "                  <TextInput\n"
            "                    style={styles.textInput}\n"
            '                    placeholder="' + placeholder_name + '"\n'
            '                    placeholderTextColor="#94a3b8"\n'
            "                    value={city}\n"
            "                    onChangeText={setCity}\n"
            '                    autoCapitalize="words"\n'
            "                  />\n"
            "                </View>\n"
            "              </View>"
        )

        if pattern_g2.search(text):
            text = pattern_g2.sub(replacement_g2, text, count=1)
            print(s + ': replaced GoogleCitySearchInput')
        else:
            print(s + ': pattern_g2 NOT matched!')

        text = text.replace("import { GoogleCitySearchInput } from '../common/GoogleCitySearchInput';\n", "")
        text = text.replace("import { GoogleCitySearchInput } from '../common/GoogleCitySearchInput';", "")

        text = re.sub(
            r'if\s*\(!city\.trim\(\)\)\s*\{\s*setFormError\([^\)]+\);\s*return;\s*\}',
            '// City is optional',
            text
        )

        with open(s, 'w', encoding='utf-8') as f:
            f.write(text)

    print("All screens processed successfully!")

if __name__ == '__main__':
    update_all_screens()
