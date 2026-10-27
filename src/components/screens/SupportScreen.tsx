import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { COMPANY_INFO, INITIAL_COMPLAINTS } from '../../data/mockData';
import { ComplaintTicket, CallbackRequest, UserProfile } from '../../types';
import { crmService } from '../../services/crmService';
import { colors } from '../../theme/colors';

interface SupportScreenProps {
  user: UserProfile | null;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'callback' | 'complaint' | 'track_complaint'>('contact');

  // Callback Form
  const [callbackName, setCallbackName] = useState<string>(user?.name || '');
  const [callbackMobile, setCallbackMobile] = useState<string>(user?.mobile || '');
  const [callbackDate, setCallbackDate] = useState<string>('Tomorrow');
  const [callbackSlot, setCallbackSlot] = useState<string>('11:00 AM – 01:00 PM');
  const [callbackTopic, setCallbackTopic] = useState<string>('Home Loan Advisory');
  const [callbackSuccess, setCallbackSuccess] = useState<boolean>(false);
  const [isSubmittingCallback, setIsSubmittingCallback] = useState<boolean>(false);

  // Complaint Form
  const [complaintCategory, setComplaintCategory] = useState<string>('Document Clarification');
  const [complaintSubject, setComplaintSubject] = useState<string>('');
  const [complaintDesc, setComplaintDesc] = useState<string>('');
  const [complaintsList, setComplaintsList] = useState<ComplaintTicket[]>(INITIAL_COMPLAINTS);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState<boolean>(false);

  const handleCall = () => {
    Linking.openURL(`tel:${COMPANY_INFO.contactPhoneRaw}`).catch(() => {
      Alert.alert('Call', `Please dial: ${COMPANY_INFO.contactNumber}`);
    });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent('Hello Loan Point Nanded, I need assistance regarding customer services.');
    Linking.openURL(`whatsapp://send?phone=91${COMPANY_INFO.contactPhoneRaw}&text=${text}`).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=91${COMPANY_INFO.contactPhoneRaw}&text=${text}`);
    });
  };

  const handleCallbackSubmit = async () => {
    if (!callbackName.trim() || !callbackMobile.trim()) {
      Alert.alert('Incomplete Form', 'Please provide applicant name and mobile number.');
      return;
    }

    setIsSubmittingCallback(true);
    try {
      await crmService.submitCallbackRequest({
        customerName: callbackName,
        mobile: callbackMobile,
        preferredDate: callbackDate,
        preferredTimeSlot: callbackSlot,
        topic: callbackTopic,
        status: 'Pending',
      });
      setCallbackSuccess(true);
    } finally {
      setIsSubmittingCallback(false);
    }
  };

  const handleComplaintSubmit = async () => {
    if (!complaintSubject.trim() || !complaintDesc.trim()) {
      Alert.alert('Incomplete Form', 'Please enter subject and description of your grievance.');
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      const result = await crmService.submitComplaintTicket({
        category: complaintCategory,
        subject: complaintSubject,
        description: complaintDesc,
      });

      const newTicket: ComplaintTicket = {
        id: result.crmRecordId || `LP-TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        category: complaintCategory,
        subject: complaintSubject,
        description: complaintDesc,
        status: 'Received',
        createdAt: 'Just now',
        updatedAt: 'Just now',
        assignedTo: COMPANY_INFO.leadRelationshipManager,
        resolutionRemarks: 'Assigned to branch desk for resolution within 24 hours.',
      };

      setComplaintsList([newTicket, ...complaintsList]);
      setSubmittedTicketId(newTicket.id);
      setComplaintSubject('');
      setComplaintDesc('');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.card}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>HELP DESK</Text>
        </View>
        <Text style={styles.screenHeading}>Customer Support</Text>
        <Text style={styles.screenSub}>
          Connect with Loan Point Nanded office or register a service request
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {[
          { id: 'contact', label: 'Branch & Call' },
          { id: 'callback', label: 'Request Callback' },
          { id: 'complaint', label: 'Grievance Desk' },
          { id: 'track_complaint', label: 'Track Tickets' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveTab(tab.id as typeof activeTab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab 1: Contact Details */}
      {activeTab === 'contact' && (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>DIRECT ADVISORY DESK</Text>
            <Text style={styles.bodyText}>
              Connect directly with our branch team headed by{' '}
              <Text style={styles.boldText}>{COMPANY_INFO.leadRelationshipManager}</Text> for fast processing.
            </Text>

            <View style={styles.actionButtonsCol}>
              <TouchableOpacity style={styles.callCtaBtn} onPress={handleCall} activeOpacity={0.8}>
                <Ionicons name="call" size={16} color={colors.white} />
                <Text style={styles.ctaBtnText}>Call +91 95455 55999</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.whatsappCtaBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
                <Ionicons name="logo-whatsapp" size={16} color={colors.white} />
                <Text style={styles.ctaBtnText}>WhatsApp Loan Desk</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionHeading}>BRANCH INFORMATION</Text>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Office Address</Text>
                <Text style={styles.infoVal}>{COMPANY_INFO.address}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Working Hours</Text>
                <Text style={styles.infoVal}>{COMPANY_INFO.workingHours}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Primary Email</Text>
                <Text style={styles.infoVal}>{COMPANY_INFO.primaryEmail}</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Tab 2: Request Callback */}
      {activeTab === 'callback' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>SCHEDULE A TELE-CALL</Text>

          {callbackSuccess ? (
            <View style={styles.successStateBox}>
              <Ionicons name="checkmark-circle" size={40} color="#059669" />
              <Text style={styles.successStateHeading}>Callback Scheduled!</Text>
              <Text style={styles.successStateSub}>
                Our advisor will reach out to {callbackMobile} during your requested slot ({callbackSlot}).
              </Text>
              <TouchableOpacity
                style={styles.bookAnotherBtn}
                onPress={() => setCallbackSuccess(false)}
              >
                <Text style={styles.bookAnotherText}>Schedule Another</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.inputLabel}>Applicant Full Name</Text>
              <TextInput style={styles.input} value={callbackName} onChangeText={setCallbackName} />

              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={callbackMobile}
                onChangeText={setCallbackMobile}
                maxLength={10}
              />

              <Text style={styles.inputLabel}>Preferred Date</Text>
              <TextInput style={styles.input} value={callbackDate} onChangeText={setCallbackDate} />

              <Text style={styles.inputLabel}>Preferred Time Slot</Text>
              <TextInput style={styles.input} value={callbackSlot} onChangeText={setCallbackSlot} />

              <TouchableOpacity
                style={styles.submitCtaBtn}
                onPress={handleCallbackSubmit}
                disabled={isSubmittingCallback}
                activeOpacity={0.8}
              >
                {isSubmittingCallback ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitCtaText}>Confirm Callback Request</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Tab 3: Grievance Desk */}
      {activeTab === 'complaint' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>REGISTER GRIEVANCE TICKET</Text>

          {submittedTicketId ? (
            <View style={styles.successStateBox}>
              <Ionicons name="checkmark-circle" size={40} color="#059669" />
              <Text style={styles.successStateHeading}>Grievance Logged!</Text>
              <Text style={styles.successStateSub}>
                Ticket Ref ID: <Text style={styles.boldText}>{submittedTicketId}</Text>. Our grievance redressal officer will review within 24 business hours.
              </Text>
              <TouchableOpacity
                style={styles.bookAnotherBtn}
                onPress={() => setSubmittedTicketId(null)}
              >
                <Text style={styles.bookAnotherText}>Submit Another Ticket</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.inputLabel}>Grievance Category</Text>
              <TextInput style={styles.input} value={complaintCategory} onChangeText={setComplaintCategory} />

              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={complaintSubject}
                onChangeText={setComplaintSubject}
                placeholder="Brief summary of concern"
              />

              <Text style={styles.inputLabel}>Detailed Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                value={complaintDesc}
                onChangeText={setComplaintDesc}
                placeholder="Please describe issue with application ID if relevant"
              />

              <TouchableOpacity
                style={styles.submitCtaBtn}
                onPress={handleComplaintSubmit}
                disabled={isSubmittingComplaint}
                activeOpacity={0.8}
              >
                {isSubmittingComplaint ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitCtaText}>Submit Ticket</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Tab 4: Track Complaints */}
      {activeTab === 'track_complaint' && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>REGISTERED GRIEVANCE TICKETS ({complaintsList.length})</Text>

          <View style={styles.ticketList}>
            {complaintsList.map((ticket) => (
              <View key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketTopRow}>
                  <Text style={styles.ticketId}>{ticket.id}</Text>
                  <View style={styles.ticketStatusBadge}>
                    <Text style={styles.ticketStatusText}>{ticket.status}</Text>
                  </View>
                </View>
                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <Text style={styles.ticketDesc}>{ticket.description}</Text>
                <Text style={styles.ticketDate}>Logged on: {ticket.createdAt} · Assigned to: {ticket.assignedTo}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    elevation: 1,
  },
  tagBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  screenSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  actionButtonsCol: {
    gap: 8,
  },
  callCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  whatsappCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  ctaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 6,
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: colors.text,
  },
  submitCtaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  submitCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  successStateBox: {
    alignItems: 'center',
    padding: 16,
    gap: 6,
  },
  successStateHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  successStateSub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  bookAnotherBtn: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  bookAnotherText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  ticketList: {
    gap: 10,
    marginTop: 4,
  },
  ticketCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketId: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  ticketStatusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ticketStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  ticketSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  ticketDesc: {
    fontSize: 11,
    color: colors.textMuted,
  },
  ticketDate: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 2,
  },
});
