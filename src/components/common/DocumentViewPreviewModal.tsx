import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DocumentItem } from '../../types';
import { colors } from '../../theme/colors';

interface DocumentViewPreviewModalProps {
  visible: boolean;
  doc: DocumentItem | null;
  onClose: () => void;
}

export const DocumentViewPreviewModal: React.FC<DocumentViewPreviewModalProps> = ({
  visible,
  doc,
  onClose,
}) => {
  if (!doc) return null;

  const isImage =
    doc.fileUri &&
    (doc.fileUri.startsWith('http') || doc.fileUri.startsWith('data:image')) &&
    doc.fileType !== 'PDF';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top Title Bar */}
          <View style={styles.topRow}>
            <View style={styles.titleWrap}>
              <Ionicons name="document-text" size={18} color={colors.primary} />
              <Text style={styles.titleText} numberOfLines={1}>
                {doc.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <View style={styles.body}>
            {isImage ? (
              <View style={styles.imagePreviewWrap}>
                <Image
                  source={{ uri: doc.fileUri }}
                  style={styles.actualImagePreview}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.fileBanner}>
                <MaterialCommunityIcons
                  name={doc.fileType === 'PDF' ? 'file-pdf-box' : 'file-document-outline'}
                  size={56}
                  color={colors.primary}
                />
                <Text style={styles.fileName}>{doc.name}</Text>
                <Text style={styles.fileMeta}>
                  {doc.category} · {doc.fileType} Format · {doc.fileSizeKb || 45} KB
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Status: {doc.status || 'Verified'}</Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
              {doc.fileUri && doc.fileUri.startsWith('http') ? (
                <TouchableOpacity
                  style={styles.openBrowserBtn}
                  onPress={() => {
                    if (doc.fileUri) Linking.openURL(doc.fileUri);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="open-outline" size={16} color="#ffffff" />
                  <Text style={styles.openBrowserBtnText}>Open File</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.doneBtnText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  imagePreviewWrap: {
    width: '100%',
    height: 220,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actualImagePreview: {
    width: '100%',
    height: '100%',
  },
  fileBanner: {
    width: '100%',
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fileName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  fileMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  statusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#a7f3d0',
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  openBrowserBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },
  openBrowserBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
  },
  doneBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
