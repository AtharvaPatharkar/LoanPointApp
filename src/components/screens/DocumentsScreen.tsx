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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentItem } from '../../types';
import { documentService } from '../../services/documentService';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';

interface DocumentsScreenProps {
  onBack?: () => void;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>(documentService.getDocuments());
  const [selectedCategory, setSelectedCategory] = useState<DocumentItem['category']>('Identity Proof');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Active Receipt Modal View State
  const [viewingReceiptDoc, setViewingReceiptDoc] = useState<DocumentItem | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadCompleted, setDownloadCompleted] = useState<boolean>(false);

  const categories: DocumentItem['category'][] = [
    'Identity Proof',
    'Address Proof',
    'Income Proof',
    'Property Document',
  ];

  const pendingChecklist = [
    { title: 'Last 6 Months Bank Statement', note: 'Required for underwriting credit verification', category: 'Income Proof' as const },
    { title: 'Form 16 / Latest ITR Acknowledgement', note: 'Mandatory for loans above ₹5 Lakhs', category: 'Income Proof' as const },
    { title: 'Updated Electricity / Utility Bill', note: 'Address verification within last 2 months', category: 'Address Proof' as const },
  ];

  // Open local file explorer to choose an authentic file
  const handlePickAndUploadFile = (categoryOverride?: DocumentItem['category']) => {
    const targetCategory = categoryOverride || selectedCategory;

    // Web / Desktop / Mobile Browser File Picker
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

        setSuccessMessage(null);
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async () => {
          const fileDataUri = reader.result as string;
          try {
            const newDoc = await documentService.uploadDocument(
              {
                name: file.name,
                size: file.size,
                type: file.type || 'application/pdf',
                uri: fileDataUri,
              },
              targetCategory
            );
            setDocuments(documentService.getDocuments());
            setSuccessMessage(`Document "${newDoc.fileName}" uploaded and submitted to Loan Point.`);
          } catch {
            Alert.alert('Upload Error', 'Document upload failed. Please try again.');
          } finally {
            setIsUploading(false);
          }
        };
        reader.onerror = () => {
          setIsUploading(false);
          Alert.alert('Error', 'Unable to read selected file.');
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    // Fallback for native platform when document-picker package isn't linked
    Alert.alert(
      'Select Document Source',
      'Choose a document to upload from your local storage:',
      [
        {
          text: 'Recent PDF / Scan',
          onPress: async () => {
            const fileName = `${targetCategory.replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}.pdf`;
            setIsUploading(true);
            try {
              const newDoc = await documentService.uploadDocument(
                { name: fileName, size: 1024 * 650, type: 'application/pdf' },
                targetCategory
              );
              setDocuments(documentService.getDocuments());
              setSuccessMessage(`Document "${newDoc.fileName}" uploaded and submitted.`);
            } finally {
              setIsUploading(false);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // View uploaded document
  const handleViewDocument = (doc: DocumentItem) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (doc.fileUri) {
        // Open file in new tab or popup window
        const win = window.open();
        if (win) {
          if (doc.fileType === 'PDF') {
            win.document.write(
              `<iframe src="${doc.fileUri}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
            );
          } else {
            win.document.write(
              `<div style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#111;"><img src="${doc.fileUri}" style="max-width:90%;max-height:90vh;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.5);"/></div>`
            );
          }
          win.document.title = doc.name;
          return;
        }
      }
    }
    Alert.alert(
      `Viewing: ${doc.name}`,
      `Format: ${doc.fileType} (${doc.fileSizeKb} KB)\nUploaded: ${doc.uploadDate}\nStatus: ${doc.status}`
    );
  };

  // Download uploaded document
  const handleDownloadUploadedDoc = (doc: DocumentItem) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const link = document.createElement('a');
      link.href = doc.fileUri || `data:text/plain;charset=utf-8,${encodeURIComponent(`Document: ${doc.name}\nFormat: ${doc.fileType}`)}`;
      link.download = doc.fileName || `${doc.name}.${doc.fileType.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Alert.alert('Download Started', `"${doc.fileName || doc.name}" has been downloaded.`);
      return;
    }
    Alert.alert('Download', `Downloading ${doc.fileName || doc.name}...`);
  };

  const handleRemove = (id: string) => {
    documentService.removeDocument(id);
    setDocuments(documentService.getDocuments());
  };

  const handleShareDocReceipt = async (doc: DocumentItem) => {
    const textReceipt = `
=============================================
LOAN POINT NANDED — OFFICIAL RECEIPT
=============================================
Receipt ID: LP-REC-${doc.id}
Date: ${doc.uploadDate}
Document Name: ${doc.name}
Category: ${doc.category}
File Format: ${doc.fileType} (${doc.fileSizeKb} KB)
Verification Status: ${doc.status}
Facilitator: Loan Point (Nanded Head Office)
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

  const handleStartDownload = () => {
    if (!viewingReceiptDoc) return;
    setIsDownloading(true);
    setDownloadCompleted(false);

    try {
      const receiptFilename = `Receipt_LP-REC-${viewingReceiptDoc.id}.txt`;
      const receiptContent = `=====================================================
LOAN POINT NANDED — OFFICIAL SUBMISSION ACKNOWLEDGMENT
=====================================================
Receipt Number     : LP-REC-${viewingReceiptDoc.id}
Date of Upload     : ${viewingReceiptDoc.uploadDate}
Document Name      : ${viewingReceiptDoc.name}
Category           : ${viewingReceiptDoc.category}
File Format        : ${viewingReceiptDoc.fileType} (${viewingReceiptDoc.fileSizeKb} KB)
Verification Status: ${viewingReceiptDoc.status}

Facilitator Desk   : ${COMPANY_INFO.name}
Branch Office      : ${COMPANY_INFO.address}
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
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
      case 'Action Needed':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.card}>
          <Text style={styles.screenHeading}>My Documents & Vault</Text>
          <Text style={styles.screenSub}>
            Secure repository for KYC, income proofs, checklists and official service receipts
          </Text>
        </View>

        {/* 1. Pending Document Checklist */}
        <View style={styles.card}>
          <View style={styles.checklistHeader}>
            <View style={styles.badgePending}>
              <Ionicons name="alert-circle" size={13} color="#92400e" />
              <Text style={styles.badgePendingText}>REQUIRED BY BANK</Text>
            </View>
            <Text style={styles.cardTitle}>Pending Document Checklist</Text>
          </View>

          <View style={styles.checklistItems}>
            {pendingChecklist.map((item, idx) => (
              <View key={idx} style={[styles.checkItemRow, idx === pendingChecklist.length - 1 && { borderBottomWidth: 0 }]}>
                <Ionicons name="time-outline" size={16} color={colors.accentGold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkItemTitle}>{item.title}</Text>
                  <Text style={styles.checkItemSub}>{item.note}</Text>
                </View>
                <TouchableOpacity
                  style={styles.uploadMiniBtn}
                  onPress={() => handlePickAndUploadFile(item.category)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.uploadMiniText}>Upload</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Upload Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upload Document</Text>

          <Text style={styles.inputLabel}>Choose Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsRow}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, isSelected && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.uploadDropzone}
            onPress={() => handlePickAndUploadFile()}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <View style={{ alignItems: 'center', padding: 8 }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.uploadTitle}>Uploading {selectedCategory}...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
                <Text style={styles.uploadTitle}>Tap to Browse & Upload</Text>
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

        {/* 3. Submitted Document History & Receipts */}
        <View style={styles.card}>
          <View style={styles.docListHeaderRow}>
            <Text style={styles.cardTitle}>Uploaded Documents ({documents.length})</Text>
            {documents.length > 0 && (
              <Text style={styles.docCountText}>Tap 'View Receipt' for PDF</Text>
            )}
          </View>

          {documents.length === 0 ? (
            <View style={styles.emptyDocState}>
              <Ionicons name="folder-open-outline" size={36} color={colors.textLight} />
              <Text style={styles.emptyDocTitle}>No Documents Uploaded Yet</Text>
              <Text style={styles.emptyDocSub}>
                Upload your KYC, address, or income proofs above. Only documents you upload will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.documentsList}>
              {documents.map((doc) => {
                const badge = getStatusBadgeStyle(doc.status);
                return (
                  <View key={doc.id} style={styles.docCard}>
                    <View style={styles.docCardTop}>
                      <View style={styles.docIconBox}>
                        <Ionicons name="document-text" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                        <Text style={styles.docMeta}>
                          {doc.category} · {doc.fileSizeKb} KB · {doc.uploadDate}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>{doc.status}</Text>
                      </View>
                    </View>

                    <View style={styles.docCardFooter}>
                      <TouchableOpacity
                        style={styles.actionBtnPrimary}
                        onPress={() => handleViewDocument(doc)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="eye-outline" size={14} color={colors.primary} />
                        <Text style={styles.actionBtnPrimaryText}>View</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnSecondary}
                        onPress={() => handleDownloadUploadedDoc(doc)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="download-outline" size={14} color={colors.text} />
                        <Text style={styles.actionBtnSecondaryText}>Download</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.receiptSmallBtn}
                        onPress={() => {
                          setDownloadCompleted(false);
                          setViewingReceiptDoc(doc);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="receipt-outline" size={14} color={colors.accentGold} />
                        <Text style={styles.receiptSmallText}>Receipt</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => handleShareDocReceipt(doc)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="share-social-outline" size={14} color={colors.textMuted} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleRemove(doc.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= OFFICIAL RECEIPT PREVIEW & DOWNLOAD MODAL ================= */}
      <Modal visible={!!viewingReceiptDoc} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {viewingReceiptDoc && (
              <>
                {/* Modal Top Bar */}
                <View style={styles.modalTopRow}>
                  <View style={styles.receiptBadge}>
                    <Ionicons name="checkmark-done" size={14} color={colors.white} />
                    <Text style={styles.receiptBadgeText}>OFFICIAL ACKNOWLEDGMENT</Text>
                  </View>
                  <TouchableOpacity onPress={() => setViewingReceiptDoc(null)}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Simulated Paper Receipt */}
                <View style={styles.paperReceipt}>
                  <View style={styles.paperHeader}>
                    <Text style={styles.paperBrand}>{COMPANY_INFO.name}</Text>
                    <Text style={styles.paperSub}>Loan Consultancy Facilitator · Nanded</Text>
                    <Text style={styles.paperAddress}>Shop No. 57, Alibhai Tower, Shivaji Nagar</Text>
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
                    <Text style={styles.paperFooterText}>Digitally Verified & Stamped</Text>
                  </View>
                </View>

                {/* Download State & Action */}
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
                    <Ionicons name="logo-whatsapp" size={16} color={colors.white} />
                    <Text style={styles.shareWhatsAppText}>Share to WhatsApp</Text>
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
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  screenSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  checklistHeader: {
    marginBottom: 6,
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgePendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400e',
  },
  checklistItems: {
    gap: 8,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
    gap: 8,
  },
  checkItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  checkItemSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  uploadMiniBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  uploadMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
  },
  categoryChipsRow: {
    gap: 6,
    paddingBottom: 10,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catChipText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  catChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  uploadDropzone: {
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 4,
  },
  uploadSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  successBannerText: {
    fontSize: 11,
    color: '#065f46',
    flex: 1,
  },
  docListHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  docCountText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  emptyDocState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyDocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  emptyDocSub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  documentsList: {
    gap: 8,
  },
  docCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 8,
  },
  docCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  docMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  docCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    gap: 8,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  receiptSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  receiptSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  shareBtn: {
    padding: 5,
    marginLeft: 'auto',
  },
  deleteBtn: {
    padding: 4,
  },
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
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    paddingVertical: 11,
    borderRadius: 8,
    gap: 6,
  },
  downloadCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  shareWhatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 8,
    gap: 6,
  },
  shareWhatsAppText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
