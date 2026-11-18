import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentItem } from '../../types';
import { colors } from '../../theme/colors';

interface LoanDocItemRowProps {
  title: string;
  subtitle: string;
  iconNode?: React.ReactNode;
  isMandatory?: boolean;
  uploadedDoc?: DocumentItem | null;
  onView?: (doc: DocumentItem) => void;
  onUploadOrReupload?: () => void;
}

export const LoanDocItemRow: React.FC<LoanDocItemRowProps> = ({
  title,
  subtitle,
  iconNode,
  isMandatory = false,
  uploadedDoc,
  onView,
  onUploadOrReupload,
}) => {
  const isDone = !!uploadedDoc;

  return (
    <View style={styles.container}>
      {/* Icon Graphic */}
      <View style={styles.iconCol}>{iconNode}</View>

      {/* Info Column */}
      <View style={styles.infoCol}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{title}</Text>
          {isMandatory && (
            <View style={styles.mandatoryBadge}>
              <Text style={styles.mandatoryBadgeText}>Mandatory</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitleText}>{subtitle}</Text>
        {isDone && uploadedDoc && (
          <Text style={styles.attachedMetaText} numberOfLines={1}>
            ✓ Attached: {uploadedDoc.name} ({uploadedDoc.fileType})
          </Text>
        )}
      </View>

      {/* Action Buttons Column */}
      <View style={styles.actionsCol}>
        {isDone && uploadedDoc ? (
          <View style={styles.btnRow}>
            {/* View Button */}
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => onView && onView(uploadedDoc)}
              activeOpacity={0.75}
            >
              <Ionicons name="eye" size={13} color="#ffffff" />
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>

            {/* Re-upload Button */}
            <TouchableOpacity
              style={styles.reuploadBtn}
              onPress={onUploadOrReupload}
              activeOpacity={0.75}
            >
              <Ionicons name="cloud-upload-outline" size={13} color={colors.text} />
              <Text style={styles.reuploadBtnText}>Re-upload</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Upload Button */
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={onUploadOrReupload}
            activeOpacity={0.75}
          >
            <Ionicons name="cloud-upload" size={14} color="#ffffff" />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  iconCol: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  mandatoryBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#fca5a5',
  },
  mandatoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b91c1c',
  },
  subtitleText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  attachedMetaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 3,
  },
  actionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  reuploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
  },
  reuploadBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  uploadBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
