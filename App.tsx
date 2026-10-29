import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { UserProfile, LoanApplication, LoanCategory, LoanType } from './src/types';

// Web Reset: Remove default web browser outline and border from all inputs
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    input, textarea, select {
      outline: none !important;
      outline-width: 0 !important;
      box-shadow: none !important;
      border: none !important;
      border-width: 0 !important;
      background: transparent !important;
    }
    input:focus, textarea:focus, select:focus {
      outline: none !important;
      outline-width: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }
  `;
  document.head.appendChild(styleEl);
}
import { authService } from './src/services/authService';
import { loanService } from './src/services/loanService';
import { notificationService } from './src/services/notificationService';
import { COMPANY_INFO } from './src/data/mockData';
import { colors } from './src/theme/colors';

// Layout & Navigation
import { TopBar } from './src/components/navigation/TopBar';
import { BottomNav, TabType } from './src/components/navigation/BottomNav';

// Screens
import { HomeScreen } from './src/components/screens/HomeScreen';
import { ApplicationsScreen } from './src/components/screens/ApplicationsScreen';
import { ApplicationDetailScreen } from './src/components/screens/ApplicationDetailScreen';
import { ServicesScreen } from './src/components/screens/ServicesScreen';
import { LoanDetailScreen } from './src/components/screens/LoanDetailScreen';
import { LoanApplicationScreen } from './src/components/screens/LoanApplicationScreen';
import { EmiCalculatorScreen } from './src/components/screens/EmiCalculatorScreen';
import { EligibilityScreen } from './src/components/screens/EligibilityScreen';
import { BalanceTransferScreen } from './src/components/screens/BalanceTransferScreen';
import { RateComparisonScreen } from './src/components/screens/RateComparisonScreen';
import { CibilServicesScreen } from './src/components/screens/CibilServicesScreen';
import { DocumentsScreen } from './src/components/screens/DocumentsScreen';
import { SupportScreen } from './src/components/screens/SupportScreen';
import { OffersReferralScreen } from './src/components/screens/OffersReferralScreen';
import { RateUsScreen } from './src/components/screens/RateUsScreen';
import { ProfileScreen } from './src/components/screens/ProfileScreen';
import { AdminScreen } from './src/components/screens/AdminScreen';
import { NotificationCenterModal } from './src/components/screens/NotificationCenterModal';
import { AuthScreens } from './src/components/auth/AuthScreens';
import { SplashScreen } from './src/components/common/SplashScreen';
import { CompleteProfileModal } from './src/components/common/CompleteProfileModal';

function MainApp() {
  const insets = useSafeAreaInsets();
  const [isSplashActive, setIsSplashActive] = useState<boolean>(true);

  // Global State
  const [user, setUser] = useState<UserProfile | null>(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    authService.getAuthState().isAuthenticated
  );
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState<boolean>(false);

  // Entities
  const [categories] = useState<LoanCategory[]>(loanService.getCategories());
  const [applications, setApplications] = useState<LoanApplication[]>(
    loanService.getApplications()
  );
  const [selectedCategory, setSelectedCategory] = useState<LoanCategory | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);

  // Notifications & Language
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(
    notificationService.getUnreadCount()
  );
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'mr' | 'hi'>('en');
  const [incomingReferralCode, setIncomingReferralCode] = useState<string>('');

  // Read incoming deep link referral (e.g. loanpoint://ref/RAHUL123 or https://loanpoint.in/ref/RAHUL123)
  useEffect(() => {
    const checkInitialLink = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const match = initialUrl.match(/ref[=/]([A-Za-z0-9_-]+)/i);
          if (match && match[1]) {
            setIncomingReferralCode(match[1].toUpperCase());
          }
        }
      } catch {
        // ignore deep link parsing errors
      }
    };
    checkInitialLink();
  }, []);

  // Sync notifications count
  useEffect(() => {
    setUnreadNotifications(notificationService.getUnreadCount());
  }, [isNotificationOpen]);

  // Support Handlers
  const handleOpenCall = () => {
    Linking.openURL(`tel:${COMPANY_INFO.contactPhoneRaw}`).catch(() => {});
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello Loan Point Nanded, I am inquiring about loans through your mobile app.`
    );
    Linking.openURL(`whatsapp://send?phone=91${COMPANY_INFO.contactPhoneRaw}&text=${text}`).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=91${COMPANY_INFO.contactPhoneRaw}&text=${text}`);
    });
  };

  // Navigation Handlers
  const handleSelectCategory = (id: LoanType) => {
    const cat = loanService.getCategoryById(id);
    if (cat) {
      setSelectedCategory(cat);
      setActiveSubScreen('loan_detail');
    }
  };

  const handleNavigate = (screen: string, params?: Record<string, unknown>) => {
    if (screen === 'home' || screen === 'applications' || screen === 'services' || screen === 'profile') {
      setCurrentTab(screen as TabType);
      setActiveSubScreen(null);
      return;
    }

    if (screen === 'loan_apply') {
      const type = (params?.loanType as LoanType) || 'personal';
      const cat = loanService.getCategoryById(type) || categories[0];
      setSelectedCategory(cat);
      setActiveSubScreen('loan_apply');
      return;
    }

    if (screen === 'application_detail') {
      const appId = params?.applicationId as string;
      const app = applications.find((a) => a.id === appId) || applications[0];
      setSelectedApplication(app);
      setActiveSubScreen('application_detail');
      return;
    }

    // Normalize hyphen-separated routes to underscore format if needed
    const normalizedScreen = screen === 'balance-transfer' ? 'balance_transfer' : screen;
    setActiveSubScreen(normalizedScreen);
  };

  const handleBack = () => {
    if (activeSubScreen === 'loan_apply' && selectedCategory) {
      setActiveSubScreen('loan_detail');
      return;
    }
    setActiveSubScreen(null);
  };

  // Reset Demo State
  const handleResetDemo = () => {
    loanService.resetToDefaultDemo();
    setApplications(loanService.getApplications());
    setUser(authService.loginDemoUser());
    setIsAuthenticated(true);
    setCurrentTab('home');
    setActiveSubScreen(null);
  };

  const getScreenTitle = (): string | undefined => {
    if (!activeSubScreen) return undefined;
    switch (activeSubScreen) {
      case 'loan_detail':
        return selectedCategory?.title || 'Loan Details';
      case 'loan_apply':
        return `Apply · ${selectedCategory?.title || 'Loan'}`;
      case 'application_detail':
        return selectedApplication?.id || 'Application Tracking';
      case 'emi_calculator':
        return 'EMI Calculator';
      case 'eligibility_checker':
        return 'Eligibility Calculator';
      case 'balance_transfer':
        return 'Balance Transfer & Foreclosure';
      case 'rate_comparison':
        return 'Rate Comparison';
      case 'cibil_services':
        return 'CIBIL & Credit Advisory';
      case 'documents':
        return 'My Documents';
      case 'support':
        return 'Customer Support';
      case 'offers_referral':
        return 'Offers & Rewards';
      case 'rate_us':
        return 'Rate Us & Feedback';
      case 'admin':
        return 'Admin Console';
      default:
        return undefined;
    }
  };

  const pendingDocsCount = applications.reduce(
    (acc, a) => acc + (a.pendingDocuments?.length || 0),
    0
  );

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setActiveSubScreen(null);
    setCurrentTab('home');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      {!isAuthenticated ? (
        <AuthScreens
          initialReferralCode={incomingReferralCode}
          onAuthSuccess={(authedUser) => {
            setUser(authedUser);
            setIsAuthenticated(true);
            // If logged in as admin, navigate directly to admin view
            if (authedUser.role === 'admin') {
              setActiveSubScreen('admin');
              setShowCompleteProfileModal(false);
            } else {
              // First time login after OTP verify -> display popup for "Complete Your Profile"
              setShowCompleteProfileModal(true);
            }
          }}
          onSkipToDemo={() => {
            setUser(authService.loginDemoUser());
            setIsAuthenticated(true);
          }}
        />
      ) : user?.role === 'admin' && activeSubScreen === 'admin' ? (
        <AdminScreen
          currentUser={user}
          onLogout={handleLogout}
          onSwitchToCustomerView={() => {
            setActiveSubScreen(null);
            setCurrentTab('home');
          }}
        />
      ) : (
        <View style={styles.appContainer}>
          {/* Mobile Top Header */}
          <TopBar
            title={getScreenTitle()}
            showBack={!!activeSubScreen}
            onBack={handleBack}
            unreadCount={unreadNotifications}
            onOpenNotifications={() => setIsNotificationOpen(true)}
            onOpenSupport={handleOpenCall}
            userName={user?.name || 'Rahul'}
            isHomeScreen={!activeSubScreen && currentTab === 'home'}
          />

          {/* Main Body View */}
          <View style={styles.mainView}>
            {activeSubScreen === 'loan_detail' && selectedCategory && (
              <LoanDetailScreen
                category={selectedCategory}
                onApplyNow={(cat) => {
                  setSelectedCategory(cat);
                  setActiveSubScreen('loan_apply');
                }}
                onOpenCalculator={(cat) => {
                  setSelectedCategory(cat);
                  setActiveSubScreen('emi_calculator');
                }}
                onBack={handleBack}
              />
            )}

            {activeSubScreen === 'loan_apply' && selectedCategory && (
              <LoanApplicationScreen
                category={selectedCategory}
                user={user}
                onCategoryChange={(cat) => setSelectedCategory(cat)}
                onNavigateToProfile={() => {
                  setCurrentTab('profile');
                  setActiveSubScreen(null);
                }}
                onSuccess={(newApp) => {
                  setApplications(loanService.getApplications());
                  setSelectedApplication(newApp);
                  setActiveSubScreen('application_detail');
                }}
                onCancel={handleBack}
              />
            )}

            {activeSubScreen === 'application_detail' && selectedApplication && (
              <ApplicationDetailScreen
                application={selectedApplication}
                onBack={handleBack}
                onApplicationUpdated={(updated) => {
                  setApplications(loanService.getApplications());
                  setSelectedApplication(updated);
                }}
              />
            )}

            {activeSubScreen === 'emi_calculator' && (
              <EmiCalculatorScreen
                initialLoanType={selectedCategory?.id || 'personal'}
                onApplyWithValues={(amount, tenure) => {
                  const cat = selectedCategory || categories[0];
                  setSelectedCategory(cat);
                  setActiveSubScreen('loan_apply');
                }}
              />
            )}

            {activeSubScreen === 'eligibility_checker' && (
              <EligibilityScreen
                onApplyForLoan={() => {
                  setSelectedCategory(categories[0]);
                  setActiveSubScreen('loan_apply');
                }}
                onOpenAdvisorCall={handleOpenCall}
              />
            )}

            {activeSubScreen === 'balance_transfer' && (
              <BalanceTransferScreen
                onApplyForTransfer={() => {
                  const cat = categories.find((c) => c.id === 'home') || categories[0];
                  setSelectedCategory(cat);
                  setActiveSubScreen('loan_apply');
                }}
                onRequestAssistance={() => setActiveSubScreen('support')}
              />
            )}

            {activeSubScreen === 'rate_comparison' && (
              <RateComparisonScreen
                onApplyForLoan={(loanType) => {
                  const cat = loanService.getCategoryById(loanType) || categories[0];
                  setSelectedCategory(cat);
                  setActiveSubScreen('loan_apply');
                }}
              />
            )}

            {activeSubScreen === 'cibil_services' && (
              <CibilServicesScreen
                user={user}
                onRequestConsultation={() => {
                  setActiveSubScreen('support');
                }}
              />
            )}

            {activeSubScreen === 'documents' && <DocumentsScreen />}

            {activeSubScreen === 'support' && <SupportScreen user={user} />}

            {activeSubScreen === 'offers_referral' && (
              <OffersReferralScreen
                user={user}
                onNavigateLoan={(type) => {
                  const cat = categories.find((c) => c.id === type) || categories[0];
                  setSelectedCategory(cat);
                  setActiveSubScreen('loan_apply');
                }}
              />
            )}

            {activeSubScreen === 'rate_us' && <RateUsScreen />}

            {activeSubScreen === 'admin' && (
              <AdminScreen
                currentUser={user}
                onLogout={handleLogout}
                onSwitchToCustomerView={() => {
                  setActiveSubScreen(null);
                  setCurrentTab('home');
                }}
              />
            )}

            {/* If no sub-screen is active, render bottom tab destinations */}
            {!activeSubScreen && (
              <>
                {currentTab === 'home' && (
                  <HomeScreen
                    user={user}
                    categories={categories}
                    applications={applications}
                    onSelectCategory={handleSelectCategory}
                    onNavigate={handleNavigate}
                    onOpenCall={handleOpenCall}
                    onOpenWhatsApp={handleOpenWhatsApp}
                  />
                )}

                {currentTab === 'applications' && (
                  <ApplicationsScreen
                    applications={applications}
                    onSelectApplication={(app) => {
                      setSelectedApplication(app);
                      setActiveSubScreen('application_detail');
                    }}
                    onApplyNew={() => {
                      setSelectedCategory(categories[0]);
                      setActiveSubScreen('loan_apply');
                    }}
                    onUploadDocForApp={(app) => {
                      setSelectedApplication(app);
                      setActiveSubScreen('application_detail');
                    }}
                  />
                )}

                {currentTab === 'services' && (
                  <ServicesScreen
                    onSelectCategory={handleSelectCategory}
                    onNavigate={handleNavigate}
                  />
                )}

                {currentTab === 'profile' && (
                  <ProfileScreen
                    user={user}
                    onUpdateUser={(updatedUser) => setUser(updatedUser)}
                    currentLanguage={currentLanguage}
                    onLanguageChange={(l) => setCurrentLanguage(l)}
                    onLogout={() => {
                      authService.logout();
                      setIsAuthenticated(false);
                      setUser(null);
                    }}
                    onNavigate={handleNavigate}
                    onResetDemoData={handleResetDemo}
                  />
                )}
              </>
            )}
          </View>

          {/* Fixed Bottom Tab Navigation */}
          {!activeSubScreen && (
            <BottomNav
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setActiveSubScreen(null);
              }}
              pendingDocsCount={pendingDocsCount}
            />
          )}

          {/* Notification Drawer Modal */}
          <NotificationCenterModal
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            onNavigateScreen={(screen) => handleNavigate(screen)}
          />

          {/* Complete Your Profile Popup Modal on First Login */}
          <CompleteProfileModal
            visible={showCompleteProfileModal}
            user={user}
            onCompleteNow={() => {
              setShowCompleteProfileModal(false);
              // Direct navigation to Documents & KYC screen
              setActiveSubScreen('documents');
            }}
            onDismiss={() => setShowCompleteProfileModal(false)}
          />
        </View>
      )}
      {isSplashActive && (
        <SplashScreen
          duration={2200}
          onFinish={() => setIsSplashActive(false)}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  mainView: {
    flex: 1,
  },
});
