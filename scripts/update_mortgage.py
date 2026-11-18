import os

def update_mortgage_loan():
    file_path = 'src/components/screens/MortgageLoanApplyScreen.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Imports
    old_imp = "import { isUserDocUploaded, getUserIncomeFormatted } from '../../utils/formPreFill';"
    new_imp = """import { isUserDocUploaded, getUserIncomeFormatted, findUserDocument } from '../../utils/formPreFill';
import { LoanDocItemRow } from '../common/LoanDocItemRow';
import { DocumentViewPreviewModal } from '../common/DocumentViewPreviewModal';
import { GoogleCitySearchInput } from '../common/GoogleCitySearchInput';
import { CalendarPickerModal } from '../common/CalendarPickerModal';
import { DocumentItem } from '../../types';
import { documentService } from '../../services/documentService';
import { Platform } from 'react-native';"""
    text = text.replace(old_imp, new_imp, 1)

    # 2. Lock Full Name
    old_fn = """                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="person-outline" size={18} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter property owner full name"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>"""
    new_fn = """                <View style={[styles.inputWrapper, { backgroundColor: '#f8fafc' }]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="person-outline" size={18} color="#64748b" />
                  </View>
                  <TextInput
                    style={[styles.textInput, { color: '#475569' }]}
                    placeholder="Enter property owner full name"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                    editable={false}
                  />
                </View>"""
    text = text.replace(old_fn, new_fn, 1)

    # 3. State & Handlers
    old_modals_state = "  // ---------------- Modals State ----------------"
    new_modals_state = """  // Calendar & Document Preview & Upload State
  const [showDobCalendar, setShowDobCalendar] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [isDocUploading, setIsDocUploading] = useState<boolean>(false);

  const handleViewDocument = (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setShowPreviewModal(true);
  };

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
    text = text.replace(old_modals_state, new_modals_state, 1)

    # 4. Replace DOB & City Row
    old_dob_city = """            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Date of Birth <Text style={styles.asterisk}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor="#94a3b8"
                    value={dob}
                    onChangeText={setDob}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>City <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowCityModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputIconBox}>
                    <Ionicons name="location-outline" size={18} color="#64748b" />
                  </View>
                  <Text style={styles.dropdownPickerText} numberOfLines={1}>
                    {city || 'Select City'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>"""

    new_dob_city = """            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Date of Birth <Text style={styles.asterisk}>*</Text></Text>
                <TouchableOpacity
                  style={styles.dropdownPickerBox}
                  onPress={() => setShowDobCalendar(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.inputIconBox}>
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  </View>
                  <Text style={[styles.dropdownPickerText, !dob && { color: '#94a3b8' }]} numberOfLines={1}>
                    {dob || 'DD/MM/YYYY'}
                  </Text>
                  <Ionicons name="calendar" size={16} color="#004aad" />
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <GoogleCitySearchInput
                  value={city}
                  onSelectCity={setCity}
                  label="City"
                  required
                  placeholder="Type city name"
                />
              </View>
            </View>"""
    text = text.replace(old_dob_city, new_dob_city, 1)

    # 5. Replace Step 4 doc list
    start_tag = '<View style={styles.docListContainer}>'
    end_tag = '</View>\n\n            {/* Bottom 100% Safe & Secure Card */}'
    idx_s = text.find(start_tag)
    idx_e = text.find(end_tag)
    if idx_s != -1 and idx_e != -1:
        new_doc_list = """<View style={styles.docListContainer}>
              {/* Row 1: PAN Card (Mandatory) */}
              <LoanDocItemRow
                title="Borrower PAN Card"
                subtitle="Copy of Borrower PAN Card (Front Side)"
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
                onUploadOrReupload={() => handleUploadOrReuploadDoc('pan_card', 'PAN Card', 'Identity Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 2: Aadhaar Card (Mandatory) */}
              <LoanDocItemRow
                title="Borrower Aadhaar Card"
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
                onUploadOrReupload={() => handleUploadOrReuploadDoc('aadhaar_card', 'Aadhaar Card', 'Identity Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 3: Registered Title Deed Chain */}
              <LoanDocItemRow
                title="Registered Title Deed Chain"
                subtitle="Sale Deed / Conveyance Deed / Gift Deed of the property"
                isMandatory
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-certificate-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'property_title_deed', ['title deed', 'sale deed', 'deed', 'property'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('property_title_deed', 'Title Deed', 'Property Document')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 4: Sanctioned Plan & Municipal Tax Receipt */}
              <LoanDocItemRow
                title="Sanctioned Plan & Municipal Tax Receipt"
                subtitle="Approved building blueprint & latest paid property tax receipt"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="home-city-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'sanction_plan_tax_receipt', ['sanction', 'blueprint', 'tax receipt', 'municipal'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('sanction_plan_tax_receipt', 'Sanctioned Plan & Tax Receipt', 'Property Document')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 5: Income Proof */}
              <LoanDocItemRow
                title="Income Proof (ITR / Salary Slips)"
                subtitle="Last 3 years ITR with computation or 6 months salary slips"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="file-document-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'salary_slips', ['salary', 'payslip', 'itr', 'income'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('salary_slips', 'Income Proof', 'Income Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 6: Bank Statements */}
              <LoanDocItemRow
                title="Bank Statements (Last 12 Months)"
                subtitle="Operating savings / current account statements (PDF)"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <MaterialCommunityIcons name="bank" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'bank_statement', ['statement', 'passbook'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('bank_statement', 'Bank Statement', 'Income Proof')}
              />
              <View style={styles.docRowDivider} />

              {/* Row 7: Property Elevation Photograph */}
              <LoanDocItemRow
                title="Property Elevation Photograph"
                subtitle="Front view exterior & interior photograph of mortgaged property"
                iconNode={
                  <View style={styles.docRoundIconWrap}>
                    <Ionicons name="image-outline" size={24} color="#002e75" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'property_photo', ['property photo', 'elevation', 'photo'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('property_photo', 'Property Elevation Photo', 'Property Document')}
              />
            </View>"""
        text = text[:idx_s] + new_doc_list + text[idx_e + len('</View>'):]

    # Modals at bottom
    modal_anchor = "{/* City Modal */}"
    new_modals = """{/* Calendar Picker Modal for DOB */}
      <CalendarPickerModal
        visible={showDobCalendar}
        currentDateStr={dob}
        onSelectDate={(selectedDate) => {
          setDob(selectedDate);
          setShowDobCalendar(false);
        }}
        onClose={() => setShowDobCalendar(false)}
      />

      {/* Document View Preview Modal */}
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
    print("MortgageLoanApplyScreen updated successfully!")

if __name__ == '__main__':
    update_mortgage_loan()
