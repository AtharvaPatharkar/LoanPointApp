import sys

def update_personal_loan():
    file_path = 'src/components/screens/PersonalLoanApplyScreen.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Update imports
    old_imp = "import { isUserDocUploaded, getUserIncomeFormatted, getUserEmploymentType } from '../../utils/formPreFill';"
    new_imp = """import { isUserDocUploaded, getUserIncomeFormatted, getUserEmploymentType, findUserDocument } from '../../utils/formPreFill';
import { LoanDocItemRow } from '../common/LoanDocItemRow';
import { DocumentViewPreviewModal } from '../common/DocumentViewPreviewModal';
import { GoogleCitySearchInput } from '../common/GoogleCitySearchInput';
import { DocumentItem } from '../../types';
import { documentService } from '../../services/documentService';
import { Platform } from 'react-native';"""

    if old_imp not in text:
        print("old_imp not found!")
        return False
    text = text.replace(old_imp, new_imp, 1)

    # 2. Make fullName editable={false}
    old_fn = """                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94a3b8"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>"""
    new_fn = """                  <View style={[styles.inputBox, { backgroundColor: '#f8fafc' }]}>
                    <TextInput
                      style={[styles.textInput, { color: '#475569' }]}
                      placeholder="Enter your full name"
                      placeholderTextColor="#94a3b8"
                      value={fullName}
                      onChangeText={setFullName}
                      editable={false}
                    />
                  </View>"""
    if old_fn not in text:
        print("old_fn not found!")
        return False
    text = text.replace(old_fn, new_fn, 1)

    # 3. Add preview doc state and upload handler
    old_modals_state = "  // ---------------- Modals State ----------------"
    new_modals_state = """  // Document Preview & Upload State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isDocUploading, setIsDocUploading] = useState<boolean>(false);

  // Handle View Document Modal
  const handleViewDocument = (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setShowPreviewModal(true);
  };

  // Central Document Upload & Re-upload Handler
  const handleUploadOrReuploadDoc = (docKey: string, defaultTitle: string, category: DocumentItem['category']) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png,image/*,application/pdf';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target?.files?.[0];
        if (!file) return;

        const validation = documentService.validateFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
        });

        if (!validation.valid) {
          Alert.alert('Invalid File', validation.error || 'Please select a valid PDF, JPG, or PNG under 5MB.');
          return;
        }

        setIsDocUploading(true);
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const newDoc = await documentService.uploadDocument(
              {
                name: defaultTitle || file.name,
                size: file.size,
                type: file.type || 'application/pdf',
                uri: reader.result as string,
              },
              category,
              user?.mobile,
              docKey
            );
            if (user) {
              if (!user.documents) user.documents = [];
              const idx = user.documents.findIndex((d) => d.docKey === docKey || d.name.toLowerCase().includes(docKey.replace(/_/g, ' ')));
              if (idx >= 0) {
                user.documents[idx] = newDoc;
              } else {
                user.documents.push(newDoc);
              }
            }
            Alert.alert('Success', `"${defaultTitle}" uploaded successfully!`);
          } catch {
            Alert.alert('Error', 'Document upload failed. Please try again.');
          } finally {
            setIsDocUploading(false);
          }
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    Alert.alert(
      'Upload Document',
      `Upload authentic file for ${defaultTitle}:`,
      [
        {
          text: 'Choose Document (PDF/Doc)',
          onPress: async () => {
            try {
              const DocumentPicker = require('expo-document-picker');
              const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
              });
              if (res.canceled || !res.assets || res.assets.length === 0) return;
              const asset = res.assets[0];
              setIsDocUploading(true);
              const newDoc = await documentService.uploadDocument(
                {
                  name: defaultTitle || asset.name,
                  size: asset.size || 0,
                  type: asset.mimeType || 'application/pdf',
                  uri: asset.uri,
                },
                category,
                user?.mobile,
                docKey
              );
              if (user) {
                if (!user.documents) user.documents = [];
                const idx = user.documents.findIndex((d) => d.docKey === docKey || d.name.toLowerCase().includes(docKey.replace(/_/g, ' ')));
                if (idx >= 0) {
                  user.documents[idx] = newDoc;
                } else {
                  user.documents.push(newDoc);
                }
              }
              Alert.alert('Success', `"${defaultTitle}" uploaded successfully!`);
            } catch (err) {
              Alert.alert('Error', 'Unable to pick or upload document.');
            } finally {
              setIsDocUploading(false);
            }
          },
        },
        {
          text: 'Take Photo / Choose Photo',
          onPress: async () => {
            try {
              const ImagePicker = require('expo-image-picker');
              const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
              });
              if (res.canceled || !res.assets || res.assets.length === 0) return;
              const asset = res.assets[0];
              setIsDocUploading(true);
              const newDoc = await documentService.uploadDocument(
                {
                  name: `${defaultTitle}.jpg`,
                  size: asset.fileSize || 0,
                  type: 'image/jpeg',
                  uri: asset.uri,
                },
                category,
                user?.mobile,
                docKey
              );
              if (user) {
                if (!user.documents) user.documents = [];
                const idx = user.documents.findIndex((d) => d.docKey === docKey || d.name.toLowerCase().includes(docKey.replace(/_/g, ' ')));
                if (idx >= 0) {
                  user.documents[idx] = newDoc;
                } else {
                  user.documents.push(newDoc);
                }
              }
              Alert.alert('Success', `"${defaultTitle}" photo uploaded successfully!`);
            } catch (err) {
              Alert.alert('Error', 'Unable to choose photo.');
            } finally {
              setIsDocUploading(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ---------------- Modals State ----------------"""
    if old_modals_state not in text:
        print("old_modals_state not found!")
        return False
    text = text.replace(old_modals_state, new_modals_state, 1)

    # 4. Replace city dropdown in step 1 with GoogleCitySearchInput
    old_city_box = """                <View style={styles.halfColGroup}>
                  <View style={styles.twoColIconCol}>
                    <Ionicons name="location-outline" size={24} color="#0f172a" />
                  </View>
                  <View style={styles.twoColRight}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>
                      City <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.dropdownBox}
                      onPress={() => setShowCityModal(true)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {city || 'Select City'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#0f172a" />
                    </TouchableOpacity>
                  </View>
                </View>"""
    new_city_box = """                <View style={styles.halfColGroup}>
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
    if old_city_box not in text:
        print("old_city_box not found!")
        return False
    text = text.replace(old_city_box, new_city_box, 1)

    # 5. Replace Step 4 doc list with LoanDocItemRow
    # Find start and end of docListContainer in Step 4
    start_tag = '<View style={styles.docListContainer}>'
    end_tag = '</View>\n\n            {/* Bottom 100% Safe & Secure Card */}'
    
    idx_start = text.find(start_tag)
    idx_end = text.find(end_tag)
    if idx_start == -1 or idx_end == -1:
        print("Step 4 docListContainer bounds not found!")
        return False

    new_doc_list = """<View style={styles.docListContainer}>
              {/* Row 1: PAN Card (Mandatory) */}
              <LoanDocItemRow
                title="PAN Card"
                subtitle="Copy of your PAN Card (Front Side)"
                isMandatory
                iconNode={
                  <View style={styles.panBadgeFrame}>
                    <Text style={styles.panBadgeText}>PAN</Text>
                    <View style={styles.panBadgeLines}>
                      <View style={styles.panBadgeLine} />
                      <View style={[styles.panBadgeLine, { width: '60%' }]} />
                    </View>
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'pan_card', ['pan'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('pan_card', 'PAN Card', 'Identity')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 2: Aadhaar Card (Mandatory) */}
              <LoanDocItemRow
                title="Aadhaar Card"
                subtitle="Front & Back (Both Sides)"
                isMandatory
                iconNode={
                  <View style={styles.aadhaarBadgeFrame}>
                    <Ionicons name="sunny-outline" size={14} color="#dc2626" />
                    <Text style={styles.aadhaarBadgeText}>AADHAAR</Text>
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'aadhaar_card', ['aadhaar', 'uidai'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('aadhaar_card', 'Aadhaar Card', 'Identity')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 3: Address Proof */}
              <LoanDocItemRow
                title="Address Proof"
                subtitle="Utility bill (Electricity / Water / Gas) / Rent Agreement"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="home-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'address_proof', ['electricity', 'utility', 'rent'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('address_proof', 'Address Proof', 'Address')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 4: Income Proof */}
              <LoanDocItemRow
                title="Income Proof"
                subtitle="Last 3 months' salary slips / Form 16 / ITR"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'salary_slips', ['salary', 'payslip', 'itr', 'income'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('salary_slips', 'Income Proof', 'Income')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 5: Bank Statements */}
              <LoanDocItemRow
                title="Bank Statements"
                subtitle="Last 6 months' salary account bank statements"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="bank" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'bank_statement', ['statement', 'passbook'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('bank_statement', 'Bank Statement', 'Bank Statement')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 6: Existing Loan Statement (if Available) */}
              <LoanDocItemRow
                title="Existing Loan Statement"
                subtitle="Latest statement of your existing loan / credit card (if any)"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-check-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'existing_loan', ['existing loan', 'loan statement'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('existing_loan', 'Existing Loan Statement', 'Other')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 7: Photograph (Applicant) */}
              <LoanDocItemRow
                title="Photograph (Applicant)"
                subtitle="Recent passport-size photo (clear and front facing)"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="person-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'passport_photo', ['photo', 'passport'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('passport_photo', 'Passport Size Photo', 'Identity')}
              />
            </View>"""

    text = text[:idx_start] + new_doc_list + text[idx_end + len('</View>'):]

    # 6. Render DocumentViewPreviewModal at bottom
    modal_anchor = "{/* City Modal */}"
    if modal_anchor not in text:
        print("modal_anchor not found!")
        return False

    new_modals = """{/* Document View Preview Modal */}
      <DocumentViewPreviewModal
        visible={showPreviewModal}
        doc={previewDoc}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewDoc(null);
        }}
      />

      {/* City Modal */}"""
    text = text.replace(modal_anchor, new_modals, 1)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("PersonalLoanApplyScreen successfully updated!")
    return True

if __name__ == '__main__':
    update_personal_loan()
