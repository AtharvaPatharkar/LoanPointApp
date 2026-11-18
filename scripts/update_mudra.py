import os

def update_mudra_loan():
    file_path = 'src/components/screens/MudraLoanApplyScreen.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. Imports
    old_imp = "import { isUserDocUploaded } from '../../utils/formPreFill';"
    new_imp = """import { isUserDocUploaded, findUserDocument } from '../../utils/formPreFill';
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
                    placeholder="Enter entrepreneur full name"
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
                    placeholder="Enter entrepreneur full name"
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
    start_tag = '<View style={styles.docsListContainer}>'
    end_tag = '</View>\n\n            {/* Safe & Secure Bottom Card */}'
    idx_s = text.find(start_tag)
    idx_e = text.find(end_tag)
    if idx_s != -1 and idx_e != -1:
        new_doc_list = """<View style={styles.docsListContainer}>
              {/* Row 1: PAN Card (Mandatory) */}
              <LoanDocItemRow
                title="Applicant PAN Card"
                subtitle="Copy of applicant PAN Card (Front Side)"
                isMandatory
                iconNode={
                  <View style={styles.panBadgeFrame}>
                    <Text style={styles.panBadgeText}>PAN</Text>
                    <View style={styles.panBadgeLineLong} />
                    <View style={styles.panBadgeLineLong} />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'pan_card', ['pan'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('pan_card', 'Applicant PAN Card', 'Identity Proof')}
              />
              <View style={styles.docDivider} />

              {/* Row 2: Aadhaar Card (Mandatory) */}
              <LoanDocItemRow
                title="Applicant Aadhaar Card"
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
                onUploadOrReupload={() => handleUploadOrReuploadDoc('aadhaar_card', 'Applicant Aadhaar Card', 'Identity Proof')}
              />
              <View style={styles.docDivider} />

              {/* Row 3: Machinery / Stock Quotation (Mandatory) */}
              <LoanDocItemRow
                title="Machinery / Stock Quotation"
                subtitle="Proforma invoice / quotation for equipment, plant machinery or inventory"
                isMandatory
                iconNode={
                  <View style={styles.genericDocCircle}>
                    <MaterialCommunityIcons name="cog-outline" size={20} color="#004aad" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'machinery_stock_quotation', ['machinery', 'quotation', 'equipment', 'stock'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('machinery_stock_quotation', 'Machinery / Stock Quotation', 'Other')}
              />
              <View style={styles.docDivider} />

              {/* Row 4: Udyam Aadhar / Business Registration */}
              <LoanDocItemRow
                title="Udyam Aadhar / Business Registration"
                subtitle="MSME Udyam registration / Shop Act license / Partnership deed (if registered)"
                iconNode={
                  <View style={styles.genericDocCircle}>
                    <MaterialCommunityIcons name="certificate-outline" size={20} color="#004aad" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'business_proof_udyam', ['udyam', 'msme', 'shop act', 'business registration'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('business_proof_udyam', 'Udyam Registration', 'Other')}
              />
              <View style={styles.docDivider} />

              {/* Row 5: Bank Statements */}
              <LoanDocItemRow
                title="Bank Statements"
                subtitle="Last 6 months' bank statements (Operating account / Savings)"
                iconNode={
                  <View style={styles.bankDocSquare}>
                    <Ionicons name="business" size={14} color="#004aad" />
                    <View style={styles.bankSquareBottom}>
                      <Text style={styles.bankSquareBottomText}>BANK</Text>
                    </View>
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'bank_statement', ['statement', 'passbook'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('bank_statement', 'Bank Statement', 'Income Proof')}
              />
              <View style={styles.docDivider} />

              {/* Row 6: Project Outline / Business Plan */}
              <LoanDocItemRow
                title="Project Outline"
                subtitle="Brief business activity profile / estimated sales & costs"
                iconNode={
                  <View style={styles.genericDocCircle}>
                    <MaterialCommunityIcons name="file-chart-outline" size={20} color="#004aad" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'project_outline', ['project', 'outline', 'business plan', 'profile'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('project_outline', 'Project Outline', 'Other')}
              />
              <View style={styles.docDivider} />

              {/* Row 7: Photograph (Applicant) */}
              <LoanDocItemRow
                title="Photograph (Applicant)"
                subtitle="Recent passport-size photo (clear and front facing)"
                iconNode={
                  <View style={styles.photoDocFrame}>
                    <Ionicons name="person" size={18} color="#004aad" />
                  </View>
                }
                uploadedDoc={findUserDocument(user, 'passport_photo', ['photo', 'passport'])}
                onView={handleViewDocument}
                onUploadOrReupload={() => handleUploadOrReuploadDoc('passport_photo', 'Passport Size Photo', 'Identity Proof')}
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
    print("MudraLoanApplyScreen updated successfully!")

if __name__ == '__main__':
    update_mudra_loan()
