import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Share,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import QRCodeGen from 'qrcode';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { UserProfile } from '../../types';
import { COMPANY_INFO } from '../../data/mockData';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 28, 385);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.615); // Standard credit/visiting card aspect ratio

interface DigitalVisitingCardProps {
  user: UserProfile | null;
  onEditProfile?: () => void;
  onEditIncome?: () => void;
}

export const DigitalVisitingCard: React.FC<DigitalVisitingCardProps> = ({
  user,
  onEditProfile,
  onEditIncome,
}) => {
  // Ref attached to the ENTIRE card view so screenshot captures the whole card
  const cardSnapshotRef = useRef<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Derived user information
  const displayName =
    user?.name && user.name.trim().length > 0 && user.name !== 'Valued Customer'
      ? user.name.trim()
      : user?.mobile
      ? `Member ${user.mobile.slice(-4)}`
      : 'Valued Client';

  const rawMobile = user?.mobile || '9545555999';
  const displayMobile = `+91 ${rawMobile.slice(0, 5)} ${rawMobile.slice(5)}`;

  // Dynamic referral code & download link
  const userReferralCode = user?.referralCode || `LP${rawMobile.slice(-4)}`;
  const referralUrl = `https://loanpoint.in/refer?code=${userReferralCode}&ref=${rawMobile}`;

  // Income string
  const monthlyIncome = user?.monthlyIncome || 0;
  const displayIncome =
    monthlyIncome > 0 ? `₹${monthlyIncome.toLocaleString('en-IN')}/mo` : 'Add Net Salary';

  // Digital card number simulated from mobile or registration date
  const memberIdSim = `LP · 2026 · ${rawMobile.slice(-4)} · REF:${userReferralCode}`;

  /**
   * Universal Download / Share Card Image Handler:
   * Captures the ENTIRE COMPLETED CARD (Background, Logo, Member Name, Mobile, QR Code, Services)
   * into an image file, downloading it on Web or opening the device native Share/Save sheet on Mobile.
   */
  const handleDownloadCard = async () => {
    try {
      setIsGenerating(true);
      const fileName = `LoanPoint_Visiting_Card_${userReferralCode}.png`;
      const shareTitle = `Loan Point Digital Card - ${displayName}`;
      const shareMessage = `🌟 *LOAN POINT DIGITAL VISITING CARD*\n👤 *${displayName}* (+91 ${rawMobile})\n\n📲 *Scan QR or Apply Online with my referral code:* ${userReferralCode}\n👉 ${referralUrl}\n\n💼 *Services Facilitated:* Personal Loan • Home Loan • Business Loan • LAP • Car Loan • Gold Loan\n📞 Helpline: ${COMPANY_INFO.contactNumber}\n🌐 ${COMPANY_INFO.website}`;

      // 1. WEB BROWSER CANVAS EXPORT (Renders full completed card with QR & Logo)
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 492;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const r = 28;

          ctx.save();
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(0, 0, w, h, r);
          } else {
            ctx.rect(0, 0, w, h);
          }
          ctx.clip();

          // Gradient background: Deep Royal Navy -> Petrol Teal
          const grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, '#0a192f');
          grad.addColorStop(0.5, '#112240');
          grad.addColorStop(1, '#075665');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Glowing background circles
          ctx.beginPath();
          ctx.arc(w * 0.85, h * 0.15, 200, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 142, 204, 0.15)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(w * 0.2, h * 0.85, 160, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
          ctx.fill();

          // Card Gold Border
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
          ctx.lineWidth = 5;
          ctx.stroke();

          // Brand Logo text & subtitle
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px sans-serif';
          ctx.fillText('LOAN POINT', 42, 60);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('FINANCIAL SERVICES & LOAN CONSULTANCY', 42, 82);

          // Verified Borrower Gold Badge at Top Right
          ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
          if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(w - 225, 36, 180, 32, 8);
            ctx.fill();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('✓ VERIFIED BORROWER', w - 210, 57);

          // Gold Separator Line
          ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
          ctx.fillRect(42, 100, w - 84, 2);

          // Member Name
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 32px sans-serif';
          ctx.fillText(displayName, 42, 160);

          // Mobile Badge & Verified Borrower
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 20px monospace';
          ctx.fillText(`Mobile: ${displayMobile}`, 42, 205);

          // Referral Code Earn Money Tag
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText(`Referral Code: ${userReferralCode}`, 42, 248);

          ctx.fillStyle = '#86efac';
          ctx.font = '600 14px sans-serif';
          ctx.fillText('✓ Scan QR Code to Register & Earn Referral Rewards', 42, 275);

          // Card simulated ID
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '14px monospace';
          ctx.fillText(memberIdSim, 42, 330);

          // Generate complete high-res QR code directly using qrcode engine
          let qrDataUri = '';
          try {
            qrDataUri = await QRCodeGen.toDataURL(referralUrl, {
              errorCorrectionLevel: 'H',
              width: 150,
              margin: 1,
              color: {
                dark: '#0a192f',
                light: '#ffffff',
              },
            });
          } catch (e) {
            console.warn('QRCodeGen error:', e);
          }

          if (qrDataUri) {
            const qrImg = new window.Image();
            qrImg.onload = () => {
              // White backdrop for QR on canvas
              ctx.fillStyle = '#ffffff';
              if (typeof ctx.roundRect === 'function') {
                ctx.beginPath();
                ctx.roundRect(w - 200, 130, 155, 155, 12);
                ctx.fill();
              } else {
                ctx.fillRect(w - 200, 130, 155, 155);
              }
              ctx.drawImage(qrImg, w - 192, 138, 140, 140);
              finalizeWebExport();
            };
            qrImg.onerror = () => {
              finalizeWebExport();
            };
            qrImg.src = qrDataUri;
          } else {
            finalizeWebExport();
          }

          function finalizeWebExport() {
            if (!ctx) return;
            // Bottom Services Banner
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(0, h - 85, w, 85);

            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText('SERVICES FACILITATED BY LOAN POINT:', 42, h - 50);

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '600 13px sans-serif';
            ctx.fillText('Personal Loan  •  Home Loan  •  Business Loan  •  LAP  •  Car Loan  •  Education  •  Gold Loan', 42, h - 25);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(`Call/WhatsApp: ${COMPANY_INFO.contactNumber}`, w - 280, h - 25);

            ctx.restore();

            // Export to data URL & download file to computer/device
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
            setIsGenerating(false);
          }
          return;
        }
      }

      // 2. NATIVE ANDROID / iOS SNAPSHOT (Captures Entire Card View into Image)
      if (cardSnapshotRef.current) {
        try {
          const snapshotUri = await captureRef(cardSnapshotRef, {
            format: 'png',
            quality: 1.0,
            result: 'tmpfile',
          });

          // Move/copy to clean named file in cache directory
          const finalFile = new File(Paths.cache, fileName);
          // Read base64 from snapshot & write
          const snapshotFile = new File(snapshotUri);
          if (snapshotFile.exists) {
            const base64Data = await snapshotFile.base64();
            if (!finalFile.exists) {
              finalFile.create();
            }
            await finalFile.write(base64Data, { encoding: 'base64' });
          }

          const shareTargetUri = finalFile.exists ? finalFile.uri : snapshotUri;

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(shareTargetUri, {
              mimeType: 'image/png',
              dialogTitle: `Share ${shareTitle}`,
              UTI: 'public.png',
            });
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
          } else {
            await Share.share({
              title: shareTitle,
              message: shareMessage,
              url: shareTargetUri,
            });
          }
        } catch (captureErr) {
          console.warn('captureRef failed, falling back to text share:', captureErr);
          await Share.share({
            title: shareTitle,
            message: shareMessage,
          });
        }
      } else {
        await Share.share({
          title: shareTitle,
          message: shareMessage,
        });
      }
    } catch (err: any) {
      console.warn('Visiting card error:', err);
      Alert.alert('Notice', 'Visiting card ready to share.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* 
        The Whole Completed Card View Container:
        Ref attached here ensures captureRef snapshots the entire card:
        Gradient background, Logo, Brand Title, Member Name, Mobile, QR Code, and Services.
      */}
      <View
        ref={cardSnapshotRef}
        collapsable={false}
        style={[styles.cardContainer, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
      >
        {/* Vector Background Graphic */}
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="visitingCardGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#0a192f" />
              <Stop offset="50%" stopColor="#112240" />
              <Stop offset="100%" stopColor="#075665" />
            </LinearGradient>

            <LinearGradient id="visitingCyanArc" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#008ecc" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
            </LinearGradient>

            <LinearGradient id="visitingGoldArc" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#ca8a04" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Rounded Card Base with Gold Stroke */}
          <Rect
            x="0"
            y="0"
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            rx={18}
            fill="url(#visitingCardGrad)"
            stroke="rgba(234, 179, 8, 0.45)"
            strokeWidth="1.5"
          />

          {/* Glowing Arcs */}
          <Circle
            cx={CARD_WIDTH * 0.85}
            cy={CARD_HEIGHT * 0.15}
            r={CARD_WIDTH * 0.3}
            fill="url(#visitingCyanArc)"
          />
          <Circle
            cx={CARD_WIDTH * 0.15}
            cy={CARD_HEIGHT * 0.9}
            r={CARD_WIDTH * 0.25}
            fill="url(#visitingGoldArc)"
          />

          {/* Bottom Sleek Wave */}
          <Path
            d={`M 0 ${CARD_HEIGHT * 0.74} Q ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.88} ${CARD_WIDTH} ${CARD_HEIGHT * 0.68} L ${CARD_WIDTH} ${CARD_HEIGHT} L 0 ${CARD_HEIGHT} Z`}
            fill="rgba(10, 25, 47, 0.85)"
          />
        </Svg>

        {/* Foreground Content */}
        <View style={styles.cardContent}>
          {/* Top Row: Official Loan Point Logo + Verified Badge */}
          <View style={styles.topRow}>
            {/* Authentic Loan Point Logo & Brand text */}
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../../assets/logo/loan-point-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitleText}>LOAN POINT</Text>
                <Text style={styles.brandSubtitleText}>TRUSTED FINANCIAL SERVICES</Text>
              </View>
            </View>

            {/* Verified Borrower Gold Badge */}
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#facc15" />
              <Text style={styles.verifiedBadgeText}>VERIFIED BORROWER</Text>
            </View>
          </View>

          {/* Middle Row: Left Info (Name + Mobile + Refer Info) & Right QR Code (Referral Link) */}
          <View style={styles.middleRow}>
            {/* Left Column: User Name & Mobile Number (Job & City removed as requested) */}
            <View style={styles.leftInfoCol}>
              <Text style={styles.userNameText} numberOfLines={1}>
                {displayName}
              </Text>

              {/* Mobile Number Badge */}
              <View style={styles.mobileBadgeRow}>
                <Ionicons name="call" size={11} color="#38bdf8" />
                <Text style={styles.mobileBadgeText}>{displayMobile}</Text>
              </View>

              {/* Referral Code & Earn Money Highlight */}
              <View style={styles.referralBox}>
                <View style={styles.referralCodeBadge}>
                  <Text style={styles.referralCodeLabel}>REFERRAL CODE:</Text>
                  <Text style={styles.referralCodeVal}>{userReferralCode}</Text>
                </View>
                <Text style={styles.earnMoneyText}>
                  💰 Scan to download app & register
                </Text>
              </View>

              {/* Card Simulated ID */}
              <Text style={styles.cardNumberText} numberOfLines={1}>
                {memberIdSim}
              </Text>
            </View>

            {/* Right Column: Dynamic QR Code with Referral Link */}
            <View style={styles.qrCodeWrapper}>
              <View style={styles.qrCodeBox}>
                <QRCode
                  value={referralUrl}
                  size={76}
                  color="#0a192f"
                  backgroundColor="#ffffff"
                  ecl="H"
                />
              </View>
              <View style={styles.scanPill}>
                <Ionicons name="scan-outline" size={9} color="#ffffff" />
                <Text style={styles.scanPillText}>SCAN & EARN</Text>
              </View>
            </View>
          </View>

          {/* Bottom Bar: Loan Point Services Strip */}
          <View style={styles.bottomServicesStrip}>
            <View style={styles.servicesHeadingRow}>
              <Text style={styles.servicesLabel}>SERVICES:</Text>
              <Text style={styles.servicesListText} numberOfLines={1}>
                Personal • Home • Business • Mortgage • Car • Gold
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Underneath Action Bar: Prominent Download / Share Card Button */}
      <View style={[styles.bottomActionBar, { width: CARD_WIDTH }]}>
        <TouchableOpacity
          style={[
            styles.downloadMainBtn,
            downloadSuccess && styles.downloadMainBtnSuccess,
          ]}
          onPress={handleDownloadCard}
          disabled={isGenerating}
          activeOpacity={0.82}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <View style={styles.downloadIconWrap}>
                <Ionicons
                  name={downloadSuccess ? 'checkmark' : 'arrow-down-circle'}
                  size={18}
                  color="#ffffff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.downloadBtnTitle}>
                  {downloadSuccess ? 'Full Card Downloaded / Shared!' : 'Download & Share Complete Visiting Card'}
                </Text>
                <Text style={styles.downloadBtnSub}>
                  Saves full card image with name, mobile, logo & referral QR
                </Text>
              </View>
              <Ionicons name="share-social-outline" size={17} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Two Quick Profile Action Pills: Edit Profile & Income Details */}
      <View style={[styles.quickActionsRow, { width: CARD_WIDTH }]}>
        <TouchableOpacity
          style={styles.quickActionPill}
          onPress={onEditProfile}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="create-outline" size={14} color="#0284c7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionBtnTitle}>Edit Profile</Text>
            <Text style={styles.actionBtnSub} numberOfLines={1}>
              Change Name & Info
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionPill, styles.quickActionPillIncome]}
          onPress={onEditIncome}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#fef3c7' }]}>
            <FontAwesome5 name="wallet" size={12} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionBtnTitle}>Income Details</Text>
            <Text style={[styles.actionBtnSub, { color: '#b45309', fontWeight: '700' }]} numberOfLines={1}>
              {displayIncome}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color="#64748b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginVertical: 10,
  },
  cardContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0a192f',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cardContent: {
    flex: 1,
    padding: 13,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234, 179, 8, 0.25)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#eab308',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoImage: {
    width: 26,
    height: 26,
  },
  brandTextWrap: {},
  brandTitleText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.2,
  },
  brandSubtitleText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.7,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(234, 179, 8, 0.5)',
  },
  verifiedBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: 0.5,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 4,
  },
  leftInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  mobileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  mobileBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  referralBox: {
    marginTop: 5,
    gap: 2,
  },
  referralCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 142, 204, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#38bdf8',
    gap: 4,
  },
  referralCodeLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#bae6fd',
  },
  referralCodeVal: {
    fontSize: 10,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: 0.8,
  },
  earnMoneyText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#86efac',
    marginTop: 2,
  },
  cardNumberText: {
    fontSize: 9.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  qrCodeWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  qrCodeBox: {
    padding: 5,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#eab308',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  scanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  scanPillText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  bottomServicesStrip: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 4,
  },
  servicesHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  servicesLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: 0.6,
  },
  servicesListText: {
    flex: 1,
    fontSize: 9,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  bottomActionBar: {
    marginTop: 10,
  },
  downloadMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  downloadMainBtnSuccess: {
    backgroundColor: '#16a34a',
    borderColor: '#86efac',
  },
  downloadIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  downloadBtnSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#e0f2fe',
    marginTop: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionPillIncome: {
    borderColor: '#fed7aa',
    backgroundColor: '#fffdf5',
  },
  actionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.text,
  },
  actionBtnSub: {
    fontSize: 9.5,
    color: colors.textMuted,
    marginTop: 1,
  },
});
