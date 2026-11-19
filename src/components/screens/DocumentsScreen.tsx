import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Image,
  Animated,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { DocumentItem, UserProfile } from '../../types';
import { documentService } from '../../services/documentService';
import { authService } from '../../services/authService';
import { dbSyncService } from '../../services/dbSyncService';
import { COMPANY_INFO, LOAN_CATEGORIES } from '../../data/mockData';
import { colors } from '../../theme/colors';

interface DocumentsScreenProps {
  user?: UserProfile | null;
  onBack?: () => void;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

// 3 Universal KYC Documents mandatory across ALL loan categories
const UNIVERSAL_MANDATORY_KYC = [
  {
    docKey: 'pan_card',
    title: 'PAN Card',
    category: 'Identity Proof' as DocumentItem['category'],
    sub: 'Income Tax permanent account number for credit check',
    icon: 'id-card',
    iconType: 'fa5' as const,
  },
  {
    docKey: 'aadhaar_card',
    title: 'Aadhaar Card',
    category: 'Identity Proof' as DocumentItem['category'],
    sub: 'UIDAI government identity & residence verification',
    icon: 'fingerprint',
    iconType: 'mci' as const,
  },
  {
    docKey: 'passport_photo',
    title: 'Passport Size Photograph',
    category: 'Identity Proof' as DocumentItem['category'],
    sub: 'Recent passport photo with clean light background',
    icon: 'camera-account',
    iconType: 'mci' as const,
  },
];

// Helper to generate normalized docKey from loan checklist string
export const getDocKeyFromTitle = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes('salary')) return 'salary_slips';
  if (lower.includes('bank statement') || lower.includes('banking records') || lower.includes('passbook') || lower.includes('bank account statement')) return 'bank_statement';
  if (lower.includes('itr') || lower.includes('tax return')) return 'itr_acknowledgement';
  if (lower.includes('residence') || lower.includes('electricity') || lower.includes('utility')) return 'address_proof';
  if (lower.includes('registration') || lower.includes('udyam') || lower.includes('shop act')) return 'business_registration';
  if (lower.includes('gst')) return 'gst_returns';
  if (lower.includes('property') || lower.includes('sale agreement') || lower.includes('title deed') || lower.includes('blueprint')) return 'property_papers';
  if (lower.includes('7/12') || lower.includes('satbara') || lower.includes('8a') || lower.includes('ferfar')) return 'land_records_712';
  if (lower.includes('noc')) return 'noc_certificate';
  if (lower.includes('quotation') || lower.includes('proforma invoice')) return 'purchase_quotation';
  if (lower.includes('rc book') || lower.includes('vehicle insurance')) return 'rc_vehicle_copy';
  if (lower.includes('admission')) return 'admission_letter';
  if (lower.includes('mark sheet') || lower.includes('academic')) return 'academic_marksheets';
  if (lower.includes('crop') || lower.includes('pik pahani')) return 'crop_cultivation_cert';
  if (lower.includes('project') || lower.includes('business outline')) return 'project_outline';
  return lower.replace(/[^a-z0-9]/g, '_').slice(0, 30);
};

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({ user: propUser, onUpdateAvatar }) => {
  const currentUser = propUser || authService.getUser();
  const [documents, setDocuments] = useState<DocumentItem[]>(currentUser?.documents || documentService.getDocuments());
  const [selectedCategory, setSelectedCategory] = useState<DocumentItem['category']>('Identity Proof');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('personal');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadingTargetName, setUploadingTargetName] = useState<string>('');
  const [isLoadingFromDb, setIsLoadingFromDb] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active Receipt Modal View State
  const [viewingReceiptDoc, setViewingReceiptDoc] = useState<DocumentItem | null>(null);
  // Active In-App Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadCompleted, setDownloadCompleted] = useState<boolean>(false);
  const whatsappPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (viewingReceiptDoc) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(whatsappPulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(whatsappPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      whatsappPulseAnim.setValue(1);
    }
  }, [viewingReceiptDoc]);

  // Fetch freshest documents directly from user record in Neon database on screen mount
  useEffect(() => {
    if (currentUser?.mobile) {
      setIsLoadingFromDb(true);
      dbSyncService
        .getUserByMobile(currentUser.mobile)
        .then((freshUser) => {
          if (freshUser && freshUser.documents) {
            documentService.setDocuments(freshUser.documents);
            setDocuments(freshUser.documents);
          } else {
            documentService.setDocuments([]);
            setDocuments([]);
          }
        })
        .catch((e) => {
          console.warn('Error loading documents from user DB:', e);
        })
        .finally(() => {
          setIsLoadingFromDb(false);
        });
    }
  }, [currentUser?.mobile]);

  // Auto-remove success message after 3.5 seconds
  useEffect(() => {
    if (successMessage) {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    }
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, [successMessage]);

  const categoryChips: {
    category: DocumentItem['category'];
    icon: string;
    iconType: 'mci' | 'fa5' | 'ion';
    activeColor: string;
    lightColor: string;
  }[] = [
    { category: 'Identity Proof', icon: 'id-card', iconType: 'fa5', activeColor: '#008ecc', lightColor: '#e0f2fe' },
    { category: 'Address Proof', icon: 'home-city-outline', iconType: 'mci', activeColor: '#16a34a', lightColor: '#dcfce7' },
    { category: 'Income Proof', icon: 'wallet', iconType: 'fa5', activeColor: '#d97706', lightColor: '#fef3c7' },
    { category: 'Property Document', icon: 'shield-home', iconType: 'mci', activeColor: '#2d3091', lightColor: '#e0e7ff' },
  ];

  // Specific finder for mandatory KYC: PAN, Aadhaar, Photo
  const findUploadedKycDoc = (docKey: string): DocumentItem | undefined => {
    return documents.find((d) => {
      if (d.docKey) return d.docKey === docKey;
      return d.name.toLowerCase().includes(docKey.replace('_', ' '));
    });
  };

  // Specific finder for loan checklist item
  const findUploadedLoanDoc = (reqDocTitle: string): DocumentItem | undefined => {
    const key = getDocKeyFromTitle(reqDocTitle);
    return documents.find((d) => {
      // 1. Strict match on docKey takes highest priority to avoid cross-talk
      if (d.docKey) {
        return d.docKey === key;
      }
      // 2. Strict keyword matching when docKey is missing
      const lower = d.name.toLowerCase();
      if (key === 'salary_slips') {
        return lower.includes('salary') && !lower.includes('bank') && !lower.includes('statement');
      }
      if (key === 'bank_statement') {
        return (lower.includes('bank') || lower.includes('statement') || lower.includes('passbook')) && !lower.includes('salary');
      }
      if (key === 'itr_acknowledgement' && lower.includes('itr')) return true;
      if (key === 'business_registration' && (lower.includes('udyam') || lower.includes('shop') || lower.includes('registration'))) return true;
      if (key === 'gst_returns' && lower.includes('gst')) return true;
      if (key === 'property_papers' && (lower.includes('title') || lower.includes('deed') || lower.includes('sale agreement'))) return true;
      if (key === 'land_records_712' && (lower.includes('7/12') || lower.includes('satbara') || lower.includes('8a') || lower.includes('ferfar'))) return true;
      if (key === 'purchase_quotation' && (lower.includes('quotation') || lower.includes('invoice'))) return true;
      if (key === 'rc_vehicle_copy' && (lower.includes('rc') || lower.includes('insurance'))) return true;
      if (key === 'admission_letter' && lower.includes('admission')) return true;
      if (key === 'academic_marksheets' && (lower.includes('mark') || lower.includes('academic'))) return true;
      if (key === 'crop_cultivation_cert' && lower.includes('crop')) return true;
      if (key === 'project_outline' && (lower.includes('project') || lower.includes('outline'))) return true;
      return false;
    });
  };

  // Map loan required doc string to best-fit category
  const inferCategoryFromDocName = (docTitle: string): DocumentItem['category'] => {
    const lower = docTitle.toLowerCase();
    if (lower.includes('kyc') || lower.includes('pan') || lower.includes('aadhaar') || lower.includes('photo') || lower.includes('voter') || lower.includes('passport')) {
      return 'Identity Proof';
    }
    if (lower.includes('address') || lower.includes('electricity') || lower.includes('bill') || lower.includes('residence') || lower.includes('rent')) {
      return 'Address Proof';
    }
    if (
      lower.includes('property') ||
      lower.includes('deed') ||
      lower.includes('7/12') ||
      lower.includes('blueprint') ||
      lower.includes('noc') ||
      lower.includes('tax receipt') ||
      lower.includes('satbara') ||
      lower.includes('8a') ||
      lower.includes('ferfar') ||
      lower.includes('sale agreement') ||
      lower.includes('chain of title') ||
      lower.includes('sanctioned') ||
      lower.includes('rc book')
    ) {
      return 'Property Document';
    }
    return 'Income Proof';
  };

  const currentLoan = LOAN_CATEGORIES.find((l) => l.id === selectedLoanId) || LOAN_CATEGORIES[0];
  const requiredDocsForLoan = currentLoan.requiredDocuments || [];

  // Central File Upload Handler - authentic picker, no dummy generation
  const handlePickAndUploadFile = (categoryOverride?: DocumentItem['category'], defaultDocName?: string, docKeyOverride?: string) => {
    const targetCategory = categoryOverride || selectedCategory;
    const labelForFile = defaultDocName || targetCategory;
    const finalDocKey = docKeyOverride || (defaultDocName ? getDocKeyFromTitle(defaultDocName) : undefined);
    setUploadingTargetName(labelForFile);

    // 1. Web File Picker via Input Element
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png,image/*,application/pdf';
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target?.files?.[0];
        if (!file) {
          setUploadingTargetName('');
          return;
        }

        const validation = documentService.validateFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
        });

        if (!validation.valid) {
          Alert.alert('Invalid File', validation.error || 'Please select a valid PDF, JPG, or PNG under 5MB.');
          setUploadingTargetName('');
          return;
        }

        setSuccessMessage(null);
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async () => {
          const fileDataUri = reader.result as string;
          try {
            const displayName = defaultDocName ? defaultDocName : file.name;
            const newDoc = await documentService.uploadDocument(
              {
                name: displayName,
                size: file.size,
                type: file.type || 'application/pdf',
                uri: fileDataUri,
              },
              targetCategory,
              currentUser?.mobile,
              finalDocKey
            );
            setDocuments(documentService.getDocuments());
            setSuccessMessage(`Document "${newDoc.name}" uploaded and saved to your database vault.`);

            // If passport size photo was uploaded, update profile avatar in top header
            if (finalDocKey === 'passport_photo' && newDoc.fileUri) {
              if (onUpdateAvatar) {
                onUpdateAvatar(newDoc.fileUri);
              }
              if (currentUser) {
                currentUser.avatar = newDoc.fileUri;
              }
            }
          } catch {
            Alert.alert('Upload Error', 'Document upload failed. Please try again.');
          } finally {
            setIsUploading(false);
            setUploadingTargetName('');
          }
        };
        reader.onerror = () => {
          setIsUploading(false);
          setUploadingTargetName('');
          Alert.alert('Error', 'Unable to read selected file.');
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    // 2. Native Mobile Platform Document & Image Picker
    Alert.alert(
      'Choose Document Source',
      `Upload authentic file for ${labelForFile}:`,
      [
        {
          text: 'Choose Document (PDF/Doc)',
          onPress: async () => {
            try {
              const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
              });

              if (res.canceled || !res.assets || res.assets.length === 0) {
                setUploadingTargetName('');
                return;
              }

              const asset = res.assets[0];
              setIsUploading(true);

              const newDoc = await documentService.uploadDocument(
                {
                  name: defaultDocName || asset.name,
                  size: asset.size || 250 * 1024,
                  type: asset.mimeType || 'application/pdf',
                  uri: asset.uri,
                },
                targetCategory,
                currentUser?.mobile,
                finalDocKey
              );
              setDocuments(documentService.getDocuments());
              setSuccessMessage(`Document "${newDoc.name}" uploaded to vault.`);
            } catch {
              Alert.alert('Upload Failed', 'Could not access document picker.');
            } finally {
              setIsUploading(false);
              setUploadingTargetName('');
            }
          },
        },
        {
          text: 'Take Photo / Gallery',
          onPress: async () => {
            try {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert('Permission Denied', 'Camera roll permission is required to select photos.');
                setUploadingTargetName('');
                return;
              }

              const isPassportPhoto = finalDocKey === 'passport_photo' || labelForFile.toLowerCase().includes('passport') || labelForFile.toLowerCase().includes('photo');
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: isPassportPhoto,
                aspect: isPassportPhoto ? [1, 1] : undefined,
                quality: 0.85,
              });

              if (result.canceled || !result.assets || result.assets.length === 0) {
                setUploadingTargetName('');
                return;
              }

              const asset = result.assets[0];
              setIsUploading(true);

              const newDoc = await documentService.uploadDocument(
                {
                  name: defaultDocName || `${labelForFile}.jpg`,
                  size: asset.fileSize || 300 * 1024,
                  type: 'image/jpeg',
                  uri: asset.uri,
                },
                targetCategory,
                currentUser?.mobile,
                finalDocKey
              );
              setDocuments(documentService.getDocuments());
              setSuccessMessage(`Photo "${newDoc.name}" uploaded to vault.`);

              // If passport size photo, automatically sync with user top profile avatar circle
              if (isPassportPhoto && newDoc.fileUri) {
                if (onUpdateAvatar) {
                  onUpdateAvatar(newDoc.fileUri);
                }
                if (currentUser) {
                  currentUser.avatar = newDoc.fileUri;
                }
              }
            } catch {
              Alert.alert('Upload Failed', 'Could not open image picker.');
            } finally {
              setIsUploading(false);
              setUploadingTargetName('');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setUploadingTargetName('');
          },
        },
      ]
    );
  };

  // View uploaded document - opens directly in current app modal viewer
  const handleViewDocument = (doc: DocumentItem) => {
    // Open in-app modal viewer directly inside the application (no external browser redirect)
    setPreviewDoc(doc);
  };

  // Download uploaded document - Web direct download or Native mobile download
  const handleDownloadUploadedDoc = async (doc: DocumentItem) => {
    const uri = doc.fileUri;
    
    // Determine exact file extension & MIME type to prevent Android saving as .bin
    let ext = (doc.fileType || 'pdf').toLowerCase().replace('.', '');
    if (ext !== 'pdf' && ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
      if (doc.mimeType?.includes('png')) ext = 'png';
      else if (doc.mimeType?.includes('jpeg') || doc.mimeType?.includes('jpg')) ext = 'jpg';
      else ext = 'pdf';
    }
    const cleanBaseName = (doc.name || 'document').replace(/[^a-zA-Z0-9_-]/g, '_');
    const downloadName = `${cleanBaseName}.${ext}`;
    const targetMime = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg';

    // 1. Web Platform Download
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (uri && uri.startsWith('http')) {
        // Fetch blob and download cleanly to avoid CORS direct link blocks
        try {
          const res = await fetch(uri);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          Alert.alert('Download Complete', `"${downloadName}" downloaded to your device.`);
          return;
        } catch {
          window.open(uri, '_blank');
          return;
        }
      } else {
        const link = document.createElement('a');
        link.href = uri || `data:text/plain;charset=utf-8,${encodeURIComponent(`Document: ${doc.name}\nCategory: ${doc.category}`)}`;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Download Complete', `"${downloadName}" downloaded to your device.`);
        return;
      }
    }

  // 2. Native Mobile Platform Download / Local Device Save (Save to device storage & open Share/Save dialog)
    try {
      if (uri && uri.startsWith('http')) {
        const baseDir = FileSystemLegacy.documentDirectory || FileSystemLegacy.cacheDirectory || '';
        const targetPath = `${baseDir}${downloadName}`;
        
        // Directly download file to local cache/documents
        const downloadRes = await FileSystemLegacy.downloadAsync(uri, targetPath);
        if (downloadRes.status === 200) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadRes.uri, {
              dialogTitle: `Save or Download ${downloadName}`,
              mimeType: targetMime,
              UTI: ext === 'pdf' ? 'com.adobe.pdf' : 'public.jpeg',
            });
          } else {
            Alert.alert('File Saved', `Document downloaded to device storage: ${downloadName}`);
          }
          return;
        }
      } else if (uri && (uri.startsWith('file://') || uri.startsWith('content://'))) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            dialogTitle: `Save ${downloadName}`,
            mimeType: targetMime,
            UTI: ext === 'pdf' ? 'com.adobe.pdf' : 'public.jpeg',
          });
          return;
        }
      }

      if (uri && uri.startsWith('http')) {
        await Linking.openURL(uri);
        return;
      }
      Alert.alert('Download', `Document ready: ${downloadName}`);
    } catch (e) {
      console.warn('Native download error:', e);
      if (uri && uri.startsWith('http')) {
        try {
          await Linking.openURL(uri);
          return;
        } catch {
          // fallback
        }
      }
      Alert.alert('Download Error', 'Could not complete download to device storage.');
    }
  };

  const handleRemove = async (id: string) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to delete this document from your secure vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await documentService.removeDocument(id, currentUser?.mobile);
            setDocuments(documentService.getDocuments());
            setSuccessMessage('Document removed from your vault.');
          },
        },
      ]
    );
  };

  const handleShareDocReceipt = async (doc: DocumentItem) => {
    const textReceipt = `
=============================================
LOAN POINT — OFFICIAL RECEIPT
=============================================
Receipt ID: LP-REC-${doc.id}
Date: ${doc.uploadDate}
Document Name: ${doc.name}
Category: ${doc.category}
File Format: ${doc.fileType} (${doc.fileSizeKb} KB)
Verification Status: ${doc.status}
${doc.fileUri && doc.fileUri.startsWith('http') ? `Cloud URL: ${doc.fileUri}\n` : ''}Facilitator: Loan Point Official
Advisor: ${COMPANY_INFO.leadRelationshipManager}
Helpline: ${COMPANY_INFO.contactNumber}
=============================================
This is an authentic digital receipt generated by LoanPoint Mobile.
`.trim();

    try {
      await Share.share({
        message: textReceipt,
        title: `Receipt_${doc.id}`,
      });
    } catch {
      // ignore
    }
  };

  const handleStartDownload = async () => {
    if (!viewingReceiptDoc) return;
    setIsDownloading(true);
    setDownloadCompleted(false);

    try {
      const receiptFilename = `Receipt_LP-REC-${viewingReceiptDoc.id}.txt`;
      const receiptContent = `=====================================================
LOAN POINT — OFFICIAL SUBMISSION ACKNOWLEDGMENT
=====================================================
Receipt Number     : LP-REC-${viewingReceiptDoc.id}
Date of Upload     : ${viewingReceiptDoc.uploadDate}
Document Name      : ${viewingReceiptDoc.name}
Category           : ${viewingReceiptDoc.category}
File Format        : ${viewingReceiptDoc.fileType} (${viewingReceiptDoc.fileSizeKb} KB)
Verification Status: ${viewingReceiptDoc.status}
${viewingReceiptDoc.fileUri && viewingReceiptDoc.fileUri.startsWith('http') ? `Cloud CDN URL      : ${viewingReceiptDoc.fileUri}\n` : ''}
Facilitator Desk   : ${COMPANY_INFO.name}
Relationship Head  : ${COMPANY_INFO.leadRelationshipManager}
Helpline / Support : ${COMPANY_INFO.contactNumber}
=====================================================
DIGITALLY RECORDED & VERIFIED BY LOAN POINT SYSTEM
=====================================================`;

      // Web / Browser automatic download
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = receiptFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        // Native Android / iOS download to device file system
        const baseDir = FileSystemLegacy.documentDirectory || FileSystemLegacy.cacheDirectory || '';
        const targetPath = `${baseDir}${receiptFilename}`;
        await FileSystemLegacy.writeAsStringAsync(targetPath, receiptContent, {
          encoding: FileSystemLegacy.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(targetPath, {
            dialogTitle: `Save Receipt ${receiptFilename}`,
            mimeType: 'text/plain',
            UTI: 'public.plain-text',
          });
        } else {
          Alert.alert('Receipt Downloaded', `Receipt saved: ${receiptFilename}`);
        }
      }

      setDownloadCompleted(true);
    } catch {
      Alert.alert('Download Error', 'Could not complete receipt download.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadgeStyle = (status: DocumentItem['status']) => {
    switch (status) {
      case 'Verified':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
      case 'Under Review':
        return { bg: colors.primaryLight, text: colors.primaryDark, border: colors.primaryBorder };
      case 'Action Needed':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ================= 1. HEADER CARD ================= */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerIconBadge}>
              <MaterialCommunityIcons name="folder-lock" size={24} color="#ffffff" />
            </View>
            <View style={styles.headerTitleWrap}>
              <View style={styles.tagBadge}>
                <View style={styles.tagDot} />
                <Text style={styles.tagText}>ENCRYPTED DIGITAL VAULT</Text>
              </View>
              <Text style={styles.screenHeading}>My Documents & Vault</Text>
            </View>
          </View>
          <Text style={styles.screenSub}>
            Secure cloud storage for your loan documents. All files are verified and directly saved in your personal database vault.
          </Text>
          {isLoadingFromDb && (
            <View style={styles.syncRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.syncText}>Syncing with secure database vault...</Text>
            </View>
          )}
        </View>

        {/* ================= 2. QUICK UPLOAD DOCUMENT SECTION (TOP POSITION) ================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="cloud-upload" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Quick Upload Document</Text>
              <Text style={styles.cardSubtitle}>Choose category and select a file to instantly save to vault</Text>
            </View>
          </View>

          {/* Category Chips Selector */}
          <Text style={styles.inputLabel}>Select Category to Upload:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsRow}>
            {categoryChips.map((tab) => {
              const isSelected = selectedCategory === tab.category;
              return (
                <TouchableOpacity
                  key={tab.category}
                  style={[
                    styles.catChip,
                    isSelected && {
                      backgroundColor: tab.activeColor,
                      borderColor: tab.activeColor,
                      shadowColor: tab.activeColor,
                    },
                  ]}
                  onPress={() => setSelectedCategory(tab.category)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.catChipIconWrap,
                      {
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.22)' : tab.lightColor,
                      },
                    ]}
                  >
                    {tab.iconType === 'mci' ? (
                      <MaterialCommunityIcons
                        name={tab.icon as any}
                        size={13}
                        color={isSelected ? '#ffffff' : tab.activeColor}
                      />
                    ) : tab.iconType === 'fa5' ? (
                      <FontAwesome5
                        name={tab.icon as any}
                        size={11}
                        color={isSelected ? '#ffffff' : tab.activeColor}
                      />
                    ) : (
                      <Ionicons
                        name={tab.icon as any}
                        size={13}
                        color={isSelected ? '#ffffff' : tab.activeColor}
                      />
                    )}
                  </View>
                  <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                    {tab.category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Upload Drop Area */}
          <TouchableOpacity
            style={styles.uploadDropzone}
            onPress={() => handlePickAndUploadFile()}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <View style={{ alignItems: 'center', padding: 8 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.uploadTitle}>
                  Uploading {uploadingTargetName || selectedCategory} to ImageKit & Vault...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="cloud-upload" size={26} color={colors.primary} />
                </View>
                <Text style={styles.uploadTitle}>Tap to Browse & Upload {selectedCategory}</Text>
                <Text style={styles.uploadSub}>Select PDF, JPG, PNG from device (max 5MB)</Text>
              </>
            )}
          </TouchableOpacity>

          {successMessage && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.successBannerText}>{successMessage}</Text>
              <TouchableOpacity onPress={() => setSuccessMessage(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color="#059669" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ================= 3. MANDATORY COMMON KYC DOCUMENTS (PAN, AADHAAR, PHOTO) ================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="shield-checkmark" size={17} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: '#0369a1' }]}>Common Mandatory KYC (All Loans)</Text>
              <Text style={styles.cardSubtitle}>
                These 3 documents are compulsory for every loan application:
              </Text>
            </View>
          </View>

          <View style={styles.mandatoryKycList}>
            {UNIVERSAL_MANDATORY_KYC.map((kyc) => {
              const uploadedDoc = findUploadedKycDoc(kyc.docKey);
              const isDone = !!uploadedDoc;

              return (
                <View
                  key={kyc.docKey}
                  style={[styles.kycCard, isDone && styles.kycCardDone]}
                >
                  <View style={styles.kycCardLeft}>
                    <View style={[styles.kycIconBox, isDone && { backgroundColor: '#dcfce7' }]}>
                      {kyc.iconType === 'fa5' ? (
                        <FontAwesome5
                          name={kyc.icon as any}
                          size={15}
                          color={isDone ? '#16a34a' : '#0284c7'}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={kyc.icon as any}
                          size={18}
                          color={isDone ? '#16a34a' : '#0284c7'}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.kycTitle, isDone && styles.kycTitleDone]}>
                          {kyc.title}
                        </Text>
                        <View style={styles.mandatoryTag}>
                          <Text style={styles.mandatoryTagText}>COMPULSORY</Text>
                        </View>
                      </View>
                      <Text style={styles.kycSub}>{kyc.sub}</Text>
                      {uploadedDoc && (
                        <Text style={styles.kycAttachedMeta}>
                          ✓ Attached: {uploadedDoc.name} ({uploadedDoc.fileType} · {uploadedDoc.uploadDate})
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.kycCardRight}>
                    {isDone ? (
                      <View style={styles.kycButtonsRow}>
                        {/* Active View Button */}
                        <TouchableOpacity
                          style={styles.kycViewBtn}
                          onPress={() => handleViewDocument(uploadedDoc)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="eye" size={13} color="#ffffff" />
                          <Text style={styles.kycViewBtnText}>View</Text>
                        </TouchableOpacity>

                        {/* Re-upload option */}
                        <TouchableOpacity
                          style={styles.kycReuploadBtn}
                          onPress={() => handlePickAndUploadFile(kyc.category, kyc.title, kyc.docKey)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="cloud-upload-outline" size={13} color={colors.text} />
                          <Text style={styles.kycReuploadBtnText}>Re-upload</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.kycUploadBtn}
                        onPress={() => handlePickAndUploadFile(kyc.category, kyc.title, kyc.docKey)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="cloud-upload" size={14} color="#ffffff" />
                        <Text style={styles.kycUploadBtnText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ================= 4. LOAN-SPECIFIC REMINDER DOCUMENTS ACCORDING TO LOAN TYPE ================= */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="document-text-outline" size={17} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: '#92400e' }]}>Loan-Specific Additional Documents</Text>
              <Text style={styles.cardSubtitle}>
                Select loan category to check additional required documentation:
              </Text>
            </View>
          </View>

          {/* Loan Category Selector Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.loanTabsScroll}>
            {LOAN_CATEGORIES.map((loan) => {
              const isSelected = selectedLoanId === loan.id;
              return (
                <TouchableOpacity
                  key={loan.id}
                  style={[styles.loanTabChip, isSelected && styles.loanTabChipActive]}
                  onPress={() => setSelectedLoanId(loan.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.loanTabText, isSelected && styles.loanTabTextActive]}>
                    {loan.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Checklist Items */}
          <View style={styles.checklistItems}>
            {(() => {
              // Check if both salary slip and bank statement exist in the checklist for this loan
              const salaryIdx = requiredDocsForLoan.findIndex((d) => d.toLowerCase().includes('salary'));
              const bankIdx = requiredDocsForLoan.findIndex(
                (d) =>
                  d.toLowerCase().includes('bank') &&
                  (d.toLowerCase().includes('statement') || d.toLowerCase().includes('passbook'))
              );

              // Render individual row helper
              const renderDocRow = (reqDoc: string, idx: number, isLast: boolean, customBorder = true) => {
                const uploadedDoc = findUploadedLoanDoc(reqDoc);
                const isDone = !!uploadedDoc;
                const inferredCat = inferCategoryFromDocName(reqDoc);
                const docKey = getDocKeyFromTitle(reqDoc);

                return (
                  <View
                    key={idx}
                    style={[
                      styles.checkItemRow,
                      customBorder && isLast && { borderBottomWidth: 0 },
                      isDone && styles.checkItemRowDone,
                    ]}
                  >
                    <View
                      style={[
                        styles.checkItemIconWrap,
                        isDone && { backgroundColor: '#dcfce7' },
                      ]}
                    >
                      <Ionicons
                        name={isDone ? 'checkmark-circle' : 'time-outline'}
                        size={17}
                        color={isDone ? '#16a34a' : '#d97706'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkItemTitle, isDone && styles.checkItemTitleDone]}>
                        {reqDoc}
                      </Text>
                      <View style={styles.checkItemMetaRow}>
                        <View style={styles.checkItemCatBadge}>
                          <Text style={styles.checkItemCatBadgeText}>{inferredCat}</Text>
                        </View>
                        <Text style={[styles.checkItemStatusText, { color: isDone ? '#16a34a' : '#d97706' }]}>
                          {isDone ? '✓ Attached in Vault' : 'Pending Upload'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {isDone && uploadedDoc && (
                        <TouchableOpacity
                          style={styles.viewMiniBtn}
                          onPress={() => handleViewDocument(uploadedDoc)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="eye" size={13} color="#ffffff" />
                          <Text style={styles.viewMiniText}>View</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.uploadMiniBtn,
                          isDone && { backgroundColor: '#059669' },
                        ]}
                        onPress={() => handlePickAndUploadFile(inferredCat, reqDoc, docKey)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isDone ? 'cloud-done-outline' : 'cloud-upload-outline'}
                          size={13}
                          color="#ffffff"
                        />
                        <Text style={styles.uploadMiniText}>{isDone ? 'Re-upload' : 'Upload'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              };

              // If both salary slip and bank statement exist, group them in a clear combination card with " OR "
              if (salaryIdx !== -1 && bankIdx !== -1) {
                const salaryDoc = requiredDocsForLoan[salaryIdx];
                const bankDoc = requiredDocsForLoan[bankIdx];
                const otherDocs = requiredDocsForLoan.filter((_, i) => i !== salaryIdx && i !== bankIdx);

                const salaryUploaded = findUploadedLoanDoc(salaryDoc);
                const bankUploaded = findUploadedLoanDoc(bankDoc);
                const comboDone = !!(salaryUploaded || bankUploaded);

                return (
                  <>
                    {/* Combined Income Proof Card (Salary Slips OR Bank Statement) */}
                    <View style={[styles.comboCard, comboDone && styles.comboCardDone]}>
                      <View style={styles.comboHeaderRow}>
                        <View style={styles.comboBadge}>
                          <Ionicons name="wallet-outline" size={13} color="#b45309" />
                          <Text style={styles.comboBadgeText}>INCOME / BANKING PROOF</Text>
                        </View>
                        <Text style={[styles.comboSubtitleText, comboDone && { color: '#16a34a', fontWeight: '800' }]}>
                          {salaryUploaded && bankUploaded
                            ? '✓ Both Documents Uploaded'
                            : comboDone
                            ? '✓ Income Proof Satisfied'
                            : 'Upload either or both for higher loan sanction'}
                        </Text>
                      </View>

                      {/* Salary Slip Sub-Card */}
                      {renderDocRow(salaryDoc, salaryIdx, false, false)}

                      {/* Prominent "OR" Divider */}
                      <View style={styles.orDividerContainer}>
                        <View style={styles.orDividerLine} />
                        <View style={styles.orBadge}>
                          <Text style={styles.orBadgeText}>OR</Text>
                        </View>
                        <View style={styles.orDividerLine} />
                      </View>

                      {/* Bank Statement Sub-Card */}
                      {renderDocRow(bankDoc, bankIdx, false, false)}
                    </View>

                    {/* Remaining Checklist Items */}
                    {otherDocs.map((reqDoc, idx) =>
                      renderDocRow(reqDoc, idx + 100, idx === otherDocs.length - 1)
                    )}
                  </>
                );
              }

              // Standard render if not both present
              return requiredDocsForLoan.map((reqDoc, idx) =>
                renderDocRow(reqDoc, idx, idx === requiredDocsForLoan.length - 1)
              );
            })()}
          </View>
        </View>

        {/* ================= 5. SUBMITTED DOCUMENT VAULT & ACTIONS ================= */}
        <View style={styles.card}>
          <View style={styles.docListHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Uploaded Documents Vault ({documents.length})</Text>
              <Text style={styles.docListSub}>All authentic files uploaded by you saved in the database</Text>
            </View>
            {documents.length > 0 && (
              <View style={styles.vaultCountBadge}>
                <Ionicons name="lock-closed" size={11} color={colors.primary} />
                <Text style={styles.docCountText}>{documents.length} Saved</Text>
              </View>
            )}
          </View>

          {documents.length === 0 ? (
            <View style={styles.emptyDocState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="folder-open-outline" size={38} color={colors.textLight} />
              </View>
              <Text style={styles.emptyDocTitle}>Your Vault is Currently Empty</Text>
              <Text style={styles.emptyDocSub}>
                No demo or dummy documents are displayed. Upload your PAN, Aadhaar, photo, or income documents above to safely save them to your account.
              </Text>
              <TouchableOpacity
                style={styles.emptyUploadCta}
                onPress={() => handlePickAndUploadFile()}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={16} color="#ffffff" />
                <Text style={styles.emptyUploadCtaText}>Upload Your First Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.documentsList}>
              {documents.map((doc) => {
                const badge = getStatusBadgeStyle(doc.status);
                return (
                  <View key={doc.id} style={styles.docCard}>
                    {/* Top Row: File icon, title/details, and status badge */}
                    <View style={styles.docCardTop}>
                      <View
                        style={[
                          styles.docIconBox,
                          {
                            backgroundColor:
                              doc.category === 'Identity Proof'
                                ? '#e0f2fe'
                                : doc.category === 'Address Proof'
                                ? '#dcfce7'
                                : doc.category === 'Income Proof'
                                ? '#fef3c7'
                                : '#e0e7ff',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={
                            doc.fileType === 'PDF'
                              ? 'file-pdf-box'
                              : 'file-image-outline'
                          }
                          size={24}
                          color={
                            doc.category === 'Identity Proof'
                              ? '#0284c7'
                              : doc.category === 'Address Proof'
                              ? '#16a34a'
                              : doc.category === 'Income Proof'
                              ? '#d97706'
                              : '#2d3091'
                          }
                        />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docName} numberOfLines={2}>{doc.name}</Text>
                        <Text style={styles.docMeta}>
                          {doc.category} · {doc.fileSizeKb} KB · {doc.uploadDate}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>{doc.status}</Text>
                      </View>
                    </View>

                    {/* Responsive Actions Grid: View, Download, Receipt, Share, Delete */}
                    <View style={styles.docCardActionsGrid}>
                      {/* Active Prominent View Button */}
                      <TouchableOpacity
                        style={styles.actionBtnView}
                        onPress={() => handleViewDocument(doc)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="eye" size={14} color="#ffffff" />
                        <Text style={styles.actionBtnViewText}>View</Text>
                      </TouchableOpacity>

                      {/* Download File */}
                      <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={() => handleDownloadUploadedDoc(doc)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="download-outline" size={14} color={colors.text} />
                        <Text style={styles.actionBtnOutlineText}>Download</Text>
                      </TouchableOpacity>

                      {/* Official Receipt */}
                      <TouchableOpacity
                        style={styles.actionBtnReceipt}
                        onPress={() => {
                          setDownloadCompleted(false);
                          setViewingReceiptDoc(doc);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="receipt-outline" size={14} color="#92400e" />
                        <Text style={styles.actionBtnReceiptText}>Receipt</Text>
                      </TouchableOpacity>

                      {/* WhatsApp / Native Share */}
                      <TouchableOpacity
                        style={styles.actionBtnIconOnly}
                        onPress={() => handleShareDocReceipt(doc)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="share-social-outline" size={15} color={colors.text} />
                      </TouchableOpacity>

                      {/* Delete */}
                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleRemove(doc.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= IN-APP DOCUMENT PREVIEW MODAL ================= */}
      <Modal visible={!!previewDoc} animationType="fade" transparent onRequestClose={() => setPreviewDoc(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.previewModalCard}>
            <View style={styles.modalTopRow}>
              <View style={styles.previewTitleWrap}>
                <Ionicons name="document-text" size={18} color={colors.primary} />
                <Text style={styles.previewTitleText} numberOfLines={1}>
                  {previewDoc?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewDoc(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {previewDoc && (
              <View style={styles.previewBody}>
                {/* Visual Image / Document Preview Banner */}
                {previewDoc.fileUri && (previewDoc.fileUri.startsWith('http') || previewDoc.fileUri.startsWith('data:image')) && previewDoc.fileType !== 'PDF' ? (
                  <View style={styles.imagePreviewWrap}>
                    <Image
                      source={{ uri: previewDoc.fileUri }}
                      style={styles.actualImagePreview}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.previewFileBanner}>
                    <MaterialCommunityIcons
                      name={previewDoc.fileType === 'PDF' ? 'file-pdf-box' : 'file-image-outline'}
                      size={52}
                      color={colors.primary}
                    />
                    <Text style={styles.previewFileName}>{previewDoc.fileName || previewDoc.name}</Text>
                    <Text style={styles.previewFileMeta}>
                      {previewDoc.category} · {previewDoc.fileType} Format · {previewDoc.fileSizeKb} KB
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', marginTop: 6 }]}>
                      <Text style={[styles.statusBadgeText, { color: '#065f46' }]}>
                        Status: {previewDoc.status}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.previewActions}>
                  {previewDoc.fileUri && previewDoc.fileUri.startsWith('http') && (
                    <TouchableOpacity
                      style={styles.openInBrowserBtn}
                      onPress={() => {
                        if (previewDoc.fileUri) Linking.openURL(previewDoc.fileUri);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="open-outline" size={16} color={colors.white} />
                      <Text style={styles.openInBrowserText}>Open in Browser</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.downloadCtaBtn}
                    onPress={() => {
                      if (previewDoc) handleDownloadUploadedDoc(previewDoc);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="download" size={16} color={colors.white} />
                    <Text style={styles.downloadCtaText}>Download File</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.receiptActionBtn}
                    onPress={() => {
                      const doc = previewDoc;
                      setPreviewDoc(null);
                      setViewingReceiptDoc(doc);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                    <Text style={styles.receiptActionBtnText}>Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= OFFICIAL RECEIPT PREVIEW & DOWNLOAD MODAL ================= */}
      <Modal visible={!!viewingReceiptDoc} animationType="slide" transparent onRequestClose={() => setViewingReceiptDoc(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {viewingReceiptDoc && (
              <>
                <View style={styles.modalTopRow}>
                  <View style={styles.receiptBadge}>
                    <Ionicons name="checkmark-done" size={14} color={colors.white} />
                    <Text style={styles.receiptBadgeText}>OFFICIAL ACKNOWLEDGMENT</Text>
                  </View>
                  <TouchableOpacity onPress={() => setViewingReceiptDoc(null)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Simulated Paper Receipt */}
                <View style={styles.paperReceipt}>
                  <View style={styles.paperHeader}>
                    <Text style={styles.paperBrand}>{COMPANY_INFO.name}</Text>
                    <Text style={styles.paperSub}>Loan Consultancy Facilitator</Text>
                  </View>

                  <View style={styles.paperDivider} />

                  <View style={styles.receiptDataRow}>
                    <Text style={styles.receiptDataLabel}>Receipt ID:</Text>
                    <Text style={styles.receiptDataVal}>LP-REC-{viewingReceiptDoc.id}</Text>
                  </View>
                  <View style={styles.receiptDataRow}>
                    <Text style={styles.receiptDataLabel}>Upload Date:</Text>
                    <Text style={styles.receiptDataVal}>{viewingReceiptDoc.uploadDate}</Text>
                  </View>
                  <View style={styles.receiptDataRow}>
                    <Text style={styles.receiptDataLabel}>Document:</Text>
                    <Text style={styles.receiptDataVal}>{viewingReceiptDoc.name}</Text>
                  </View>
                  <View style={styles.receiptDataRow}>
                    <Text style={styles.receiptDataLabel}>Category:</Text>
                    <Text style={styles.receiptDataVal}>{viewingReceiptDoc.category}</Text>
                  </View>
                  <View style={styles.receiptDataRow}>
                    <Text style={styles.receiptDataLabel}>Status:</Text>
                    <Text style={[styles.receiptDataVal, { color: colors.success }]}>
                      {viewingReceiptDoc.status}
                    </Text>
                  </View>
                  <View style={styles.receiptDataRow}>
                    <Text style={styles.receiptDataLabel}>Advisor:</Text>
                    <Text style={styles.receiptDataVal}>{COMPANY_INFO.leadRelationshipManager}</Text>
                  </View>

                  <View style={styles.paperFooter}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                    <Text style={styles.paperFooterText}>Digitally Verified & Recorded by Loan Point</Text>
                  </View>
                </View>

                {downloadCompleted ? (
                  <View style={styles.downloadSuccessBox}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.downloadSuccessText}>
                      Receipt downloaded to your Downloads folder as "Receipt_LP-REC-{viewingReceiptDoc.id}.txt"
                    </Text>
                  </View>
                ) : null}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.downloadCtaBtn}
                    onPress={handleStartDownload}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    {isDownloading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name={downloadCompleted ? 'checkmark' : 'download'} size={16} color={colors.white} />
                        <Text style={styles.downloadCtaText}>
                          {downloadCompleted ? 'Download Again' : 'Download Receipt'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareWhatsAppBtn}
                    onPress={() => handleShareDocReceipt(viewingReceiptDoc)}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={{ transform: [{ scale: whatsappPulseAnim }] }}>
                      <Ionicons name="logo-whatsapp" size={22} color={colors.white} />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  /* 1. Header Card */
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: 0.5,
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  screenSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  syncText: {
    fontSize: 11.5,
    color: colors.primary,
    fontWeight: '600',
  },

  /* Structured Content Cards */
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDeep,
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* 2. Quick Upload Box & Chips */
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  categoryChipsRow: {
    gap: 8,
    paddingBottom: 12,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  catChipIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  catChipTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  uploadDropzone: {
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 2,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  uploadSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  successBannerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#065f46',
    flex: 1,
  },

  /* 3. Mandatory Common KYC List */
  mandatoryKycList: {
    gap: 10,
  },
  kycCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 10,
  },
  kycCardDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  kycCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  kycIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  kycTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  kycTitleDone: {
    color: '#166534',
  },
  mandatoryTag: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  mandatoryTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#b91c1c',
    letterSpacing: 0.3,
  },
  kycSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  kycAttachedMeta: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 4,
  },
  kycCardRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  kycButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kycViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  kycViewBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  kycReuploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  kycReuploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  kycUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  kycUploadBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* 4. Loan Category Tabs & Reminders */
  loanTabsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  loanTabChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loanTabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  loanTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  loanTabTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  checklistItems: {
    gap: 8,
  },
  /* Combination Card for Salary Slips OR Bank Statement */
  comboCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    padding: 12,
    gap: 8,
    marginBottom: 4,
  },
  comboCardDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  comboHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 119, 6, 0.12)',
    flexWrap: 'wrap',
    gap: 6,
  },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  comboBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  comboSubtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 8,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f59e0b',
    opacity: 0.35,
  },
  orBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  orBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  checkItemRowDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  checkItemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  checkItemTitleDone: {
    color: '#166534',
  },
  checkItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  checkItemCatBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  checkItemCatBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textMuted,
  },
  checkItemStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  viewMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  viewMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  uploadMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  uploadMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },

  /* 5. Submitted Document Vault */
  docListHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  docListSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  vaultCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  docCountText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  emptyDocState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyDocTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  emptyDocSub: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 320,
  },
  emptyUploadCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 6,
  },
  emptyUploadCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  documentsList: {
    gap: 12,
  },
  docCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  docCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  docIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 17,
  },
  docMeta: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  docCardActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 6,
  },
  actionBtnView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minHeight: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnViewText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 32,
  },
  actionBtnOutlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  actionBtnReceipt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    minHeight: 32,
  },
  actionBtnReceiptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  actionBtnIconOnly: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnDelete: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginLeft: 'auto',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    paddingBottom: 32,
  },
  previewModalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    paddingBottom: 32,
    maxHeight: '92%',
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  previewTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  previewBody: {
    gap: 16,
  },
  imagePreviewWrap: {
    width: '100%',
    height: 320,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actualImagePreview: {
    width: '100%',
    height: '100%',
  },
  previewFileBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  previewFileName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  previewFileMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  openInBrowserBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 120,
  },
  openInBrowserText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  receiptActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: 6,
    minWidth: 100,
  },
  receiptActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  receiptBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  paperReceipt: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 14,
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  paperHeader: {
    alignItems: 'center',
  },
  paperBrand: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  paperSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  paperAddress: {
    fontSize: 9,
    color: colors.textLight,
  },
  paperDivider: {
    height: 1,
    backgroundColor: colors.borderDark,
    marginVertical: 10,
    borderStyle: 'dashed',
  },
  receiptDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  receiptDataLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  receiptDataVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  paperFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  paperFooterText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  downloadSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  downloadSuccessText: {
    fontSize: 11,
    color: '#065f46',
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadCtaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 110,
  },
  downloadCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  shareWhatsAppBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
  },
});
