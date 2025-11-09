type CountTemplate = {
  singular: string
  plural: string
}

type ReleaseChannelMeta = {
  name: string
  description: string
}

type ReleaseChannelLabels = {
  label: string
  summaryPrefix: string
  stable: ReleaseChannelMeta
  beta: ReleaseChannelMeta
  develop: ReleaseChannelMeta
  badges: {
    stable: string
    beta: string
    develop: string
  }
}

type DownloadTranslation = {
  home: {
    title: string
    description: string
    stats: {
      categories: string
      collections: string
      files: string
    }
  }
  browser: {
    categoriesTitle: string
    allButton: string
    allHeading: string
    allDescription: string
    collectionDescription: string
    itemCount: CountTemplate
    empty: string
  }
  cardGrid: {
    sortUpdated: string
    sortName: string
    searchPlaceholder: string
    updatedLabel: string
    itemsLabel: string
  }
  listing: {
    notFound: string
    headingDescription: string
    stats: {
      subdirectories: string
      files: string
      lastUpdated: string
    }
    collectionsTitle: string
    collectionsCount: CountTemplate
    empty: string
    infoTitle: string
    infoPath: string
    infoSource: string
    infoNotice: string
  }
  fileTable: {
    sortName: string
    sortUpdated: string
    sortSize: string
    filterPlaceholder: string
    headers: {
      name: string
      size: string
      updated: string
      actions: string
    }
  }
  copyButton: {
    tooltip: string
  }
  breadcrumbRoot: string
}

type SolutionOverride = {
  title?: string
  tagline?: string
  description?: string
  features?: string[]
  bodyHtml?: string
  primaryCtaLabel?: string
  secondaryCtaLabel?: string
  tertiaryCtaLabel?: string
}

type ContactPanelItemOverride = {
  title?: string
  description?: string
  bodyHtml?: string
  ctaLabel?: string
}

type ArticleOverride = {
  title?: string
  author?: string
  readingTime?: string
  excerpt?: string
  tags?: string[]
}

type SidebarOverride = {
  title?: string
  bodyHtml?: string
  ctaLabel?: string
  ctaHref?: string
  tags?: string[]
}

type MarketingHomeTranslation = {
  hero: {
    eyebrow?: string
    title?: string
    subtitle?: string
    highlights?: string[]
    bodyHtml?: string
    primaryCtaLabel?: string
    secondaryCtaLabel?: string
  }
  tabsLabel: string
  tabsAriaLabel: string
  productMatrix: {
    badge: string
    title: string
    description: string
    highlights: string[]
    topicsLabel: string
    capabilitiesLabel: string
  }
  heroFallback: {
    title: string
    description: string
  }
  articleFeed: {
    eyebrow: string
    title: string
    viewAll: string
    empty: string
    dateLocale: string
  }
  contactPanel: {
    buttonLabel: string
    expandLabel: string
    collapseLabel: string
    qrAltSuffix: string
    title?: string
    subtitle?: string
    items?: Record<string, ContactPanelItemOverride>
  }
  articleOverrides?: Record<string, ArticleOverride>
  sidebarOverrides?: Record<string, SidebarOverride>
  solutionOverrides?: Record<string, SolutionOverride>
}

type AuthHighlight = {
  title: string
  description: string
}

type AuthRegisterAlerts = {
  success: string
  passwordMismatch: string
  missingFields: string
  userExists: string
  usernameExists?: string
  invalidName?: string
  agreementRequired?: string
  invalidEmail: string
  weakPassword: string
  genericError: string
  verificationSent?: string
  verificationFailed?: string
  invalidCode?: string
  codeRequired?: string
  preSubmitHint?: string
  verificationReady?: string
  verificationResent?: string
  registrationComplete?: string
}

type AuthLoginAlerts = {
  registered: string
  missingCredentials: string
  invalidCredentials: string
  userNotFound?: string
  genericError: string
  passwordRequired?: string
  mfa?: {
    missing: string
    invalid: string
    invalidFormat?: string
    setupRequired?: string
    challengeFailed?: string
  }
}

type AuthEmailVerificationAlerts = {
  missingEmail: string
  codeRequired: string
  verificationSent: string
  verificationResent?: string
  verificationFailed: string
  verificationReady?: string
  genericError: string
}

type AuthRegisterTranslation = {
  badge: string
  title: string
  subtitle: string
  highlights: AuthHighlight[]
  bottomNote: string
  uuidNote: string
  form: {
    title: string
    subtitle: string
    email: string
    emailPlaceholder: string
    password: string
    passwordPlaceholder: string
    confirmPassword: string
    confirmPasswordPlaceholder: string
    agreement: string
    terms: string
    submit: string
    submitting?: string
    verifySubmit?: string
    verifying?: string
    completeSubmit?: string
    completing?: string
    verificationCodeLabel: string
    verificationCodeDescription?: string
    verificationCodeResend: string
    verificationCodeResending?: string
    validation?: {
      initializing?: string
      submitting?: string
      verifying?: string
      completing?: string
      emailMissing?: string
      emailInvalid?: string
      passwordMissing?: string
      confirmPasswordMissing?: string
      passwordWeak?: string
      passwordMismatch?: string
      agreementRequired?: string
      codeIncomplete?: string
      passwordUnavailable?: string
    }
  }
  social: {
    title: string
    github: string
    wechat: string
  }
  loginPrompt: {
    text: string
    link: string
  }
  alerts: AuthRegisterAlerts
}

type AuthLoginTranslation = {
  badge: string
  title: string
  subtitle: string
  highlights: AuthHighlight[]
  bottomNote: string
  form: {
    title: string
    subtitle: string
    email: string
    emailPlaceholder: string
    password: string
    passwordPlaceholder: string
    remember: string
    submit: string
    submitting?: string
    mfa: {
      mode: string
      passwordOnly: string
      passwordAndTotp: string
      codeLabel: string
      codePlaceholder: string
    }
  }
  forgotPassword: string
  social: {
    title: string
    github: string
    wechat: string
  }
  registerPrompt: {
    text: string
    link: string
  }
  alerts: AuthLoginAlerts
}

type AuthEmailVerificationTranslation = {
  badge?: string
  title: string
  description: string
  emailFallback?: string
  form: {
    codeLabel: string
    codePlaceholder?: string
    helper?: string
    submit: string
    submitting?: string
  }
  resend: {
    label: string
    resending?: string
  }
  alerts: AuthEmailVerificationAlerts
  switchAction: {
    text: string
    link: string
  }
  footnote?: string
  bottomNote?: string
}

type AuthTranslation = {
  register: AuthRegisterTranslation
  login: AuthLoginTranslation
  emailVerification: AuthEmailVerificationTranslation
}

type UserCenterOverviewTranslation = {
  heading: string
  loading: string
  welcome: string
  guest: string
  uuidNote: string
  lockBanner: {
    title: string
    body: string
    action: string
    docs: string
    logout: string
  }
  cards: {
    uuid: {
      label: string
      description: string
      copy: string
      copied: string
    }
    username: {
      label: string
      description: string
    }
    email: {
      label: string
      description: string
    }
    mfa: {
      label: string
      description: string
      action: string
    }
    vless: {
      label: string
      description: string
      linkLabel: string
      linkHelper: string
      copyLink: string
      copied: string
      downloadQr: string
      downloadConfig: string
      generating: string
      error: string
      missingUuid: string
      downloadTooltip: string
      warning: string
      macPath: string
      linuxPath: string
      qrAlt: string
    }
  }
}

type UserCenterMfaTranslation = {
  title: string
  subtitle: string
  pendingHint: string
  enabledHint: string
  summary: {
    description: string
    statusLabel: string
    manage: string
    bind: string
  }
  generate: string
  regenerate: string
  secretLabel: string
  issuerLabel: string
  accountLabel: string
  uriLabel: string
  manualHint: string
  codeLabel: string
  codePlaceholder: string
  verify: string
  verifying: string
  successTitle: string
  successBody: string
  guide: {
    step1Title: string
    step1Description: string
    step1Ios: string
    step1Android: string
    step2Title: string
    step2Description: string
    step3Title: string
    step3Description: string
  }
  status: {
    issuedAt: string
    confirmedAt: string
  }
  state: {
    enabled: string
    pending: string
    disabled: string
  }
  qrLabel: string
  lockedMessage: string
  steps: {
    intro: string
    provision: string
    verify: string
  }
  actions: {
    help: string
    description: string
    logout: string
    docs: string
    docsUrl: string
    setup: string
  }
  modal: {
    title: string
    close: string
  }
  disable: {
    title: string
    description: string
    action: string
    confirming: string
  }
  errors: {
    provisioningFailed: string
    verificationFailed: string
    missingCode: string
    invalidCode: string
    locked: string
    sessionExpired: string
    network: string
    disableFailed: string
  }
  error: string
}

type UserCenterTranslation = {
  overview: UserCenterOverviewTranslation
  mfa: UserCenterMfaTranslation
}

export type Translation = {
  hero: {
    title: string
    description: string
    start: string
    learn: string
  }
  featuresTitle: string
  featuresSubtitle: string
  openSourceTitle: string
  downloadTitle: string
  downloadSubtitle: string
  footerLinks: [string, string, string]
  nav: {
    openSource: {
      title: string
      features: string
      projects: string
      download: string
    }
    services: {
      title: string
      artifact: string
      cloudIac: string
      insight: string
      docs: string
    }
    account: {
      title: string
      register: string
      login: string
      demo: string
      welcome: string
      logout: string
      userCenter: string
      management: string
    }
    releaseChannels: ReleaseChannelLabels
  }
  login: {
    title: string
    description: string
    usernameLabel: string
    passwordLabel: string
    submit: string
    success: string
    goHome: string
    missingUsername: string
    missingPassword: string
    missingTotp?: string
    invalidCredentials: string
    userNotFound: string
    genericError: string
    serviceUnavailable?: string
    disclaimer: string
  }
  termsTitle: string
  termsPoints: string[]
  contactTitle: string
  contactDescription?: string
  contactEmailLabel?: string
  contactEmail?: string
  download: DownloadTranslation
  auth: AuthTranslation
  userCenter: UserCenterTranslation
  marketing: {
    home: MarketingHomeTranslation
  }
}

export const translations: Record<'en' | 'zh', Translation> = {
  en: {
    hero: {
      title: 'Cloud-Neutral',
      description: 'Unified tools for building and managing your cloud native stack.',
      start: 'Get Started',
      learn: 'Learn More',
    },
    featuresTitle: 'Features',
    featuresSubtitle: 'Everything you need to build, ship and run applications',
    openSourceTitle: 'Open Source Projects',
    downloadTitle: 'Download',
    downloadSubtitle: 'Select your platform',
    footerLinks: ['Privacy Policy', 'Terms of Service', 'Contact Us'],
    nav: {
      openSource: {
        title: 'Open Source',
        features: 'Features',
        projects: 'Projects',
        download: 'Download',
      },
      services: {
        title: 'Services',
        artifact: 'Artifact / Mirror',
        cloudIac: 'Cloud IaC Catalog',
        insight: 'Insight Workbench',
        docs: 'Docs / Solutions',
      },
      account: {
        title: 'Account',
        register: 'Register',
        login: 'Login',
        demo: 'Demo',
        welcome: 'Welcome, {username}',
        logout: 'Sign out',
        userCenter: 'User Center',
        management: 'Management Console',
      },
      releaseChannels: {
        label: 'Preview',
        summaryPrefix: 'Mode',
        stable: {
          name: 'Stable',
          description: 'Reliable production-ready experience.',
        },
        beta: {
          name: 'Beta',
          description: 'Early access to upcoming features for evaluation.',
        },
        develop: {
          name: 'Develop',
          description: 'Latest experimental changes and prototypes.',
        },
        badges: {
          stable: 'Stable',
          beta: 'Beta',
          develop: 'Dev',
        },
      },
    },
    login: {
      title: 'Account Login',
      description: 'Sign in to personalize your Cloud-Neutral experience.',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
      submit: 'Sign in',
      success: 'Welcome back, {username}! 🎉',
      goHome: 'Return to homepage',
      missingUsername: 'Please enter a username to continue.',
      missingPassword: 'Please enter your password or switch to email + authenticator mode.',
      missingTotp: 'Enter the verification code from your authenticator app.',
      invalidCredentials: 'Incorrect username or password. Please try again.',
      userNotFound: 'We could not find an account with that username.',
      genericError: 'We could not sign you in. Please try again later.',
      serviceUnavailable: 'The account service is temporarily unavailable. Please try again shortly.',
      disclaimer: 'This demo login keeps your username in memory only to personalize navigation while you browse.',
    },
    termsTitle: 'Terms of Service',
    termsPoints: [
      'A free, open-source version for self-hosting on Windows, Linux, and macOS',
      'Affordable 1-on-1 consulting for technical setup',
      'A premium plan with cloud sync, mobile support, and device linking',
      'A future SaaS version for users who want one-click deployment with no setup required',
    ],
    contactTitle: 'Contact Us',
    contactDescription:
      'Share your feedback or feature ideas and we will respond as soon as possible. For technical help, reach us via email.',
    contactEmailLabel: 'Technical support email',
    contactEmail: 'manbuzhe2008@gmail.com',
    download: {
      home: {
        title: 'Download Center',
        description: 'Browse offline packages, releases, and other curated resources hosted on dl.svc.plus.',
        stats: {
          categories: 'Top-level categories',
          collections: 'Resource collections',
          files: 'Files tracked',
        },
      },
      browser: {
        categoriesTitle: 'Categories',
        allButton: 'All resources',
        allHeading: 'All downloads',
        allDescription: 'Browse the complete catalog of offline packages, releases, and artifacts.',
        collectionDescription: 'Showing resources from the {{collection}} collection.',
        itemCount: {
          singular: '{{count}} item',
          plural: '{{count}} items',
        },
        empty: 'No downloadable resources found for this category yet.',
      },
      cardGrid: {
        sortUpdated: 'Sort by Updated',
        sortName: 'Sort by Name',
        searchPlaceholder: 'Search',
        updatedLabel: 'Updated:',
        itemsLabel: 'Items:',
      },
      listing: {
        notFound: 'Directory not found.',
        headingDescription: 'Explore downloads and artifacts available under the {{directory}} directory.',
        stats: {
          subdirectories: 'Subdirectories',
          files: 'Files',
          lastUpdated: 'Last updated',
        },
        collectionsTitle: 'Collections',
        collectionsCount: {
          singular: '{{count}} entry',
          plural: '{{count}} entries',
        },
        empty: 'This directory does not contain downloadable artifacts yet.',
        infoTitle: 'Directory info',
        infoPath: 'Path',
        infoSource: 'Source',
        infoNotice: 'Data sourced from dl.svc.plus.',
      },
      fileTable: {
        sortName: 'Name',
        sortUpdated: 'Updated',
        sortSize: 'Size',
        filterPlaceholder: 'Filter ext (.tar.gz)',
        headers: {
          name: 'Name',
          size: 'Size',
          updated: 'Updated',
          actions: 'Actions',
        },
      },
      copyButton: {
        tooltip: 'Copy link',
      },
      breadcrumbRoot: 'Download',
    },
    auth: {
      register: {
        badge: 'Create account',
        title: 'Join Cloud-Neutral',

        subtitle: 'We’ll email a verification code so you can confirm your address before accessing the workspace.',

        highlights: [
          {
            title: 'Explore open source solutions',
            description: 'Deploy databases, monitoring, CI/CD, and observability stacks in one click—no more juggling installs.',
          },
          {
            title: 'Experience AI copilots online',
            description: 'Let AI troubleshoot issues, automate ops, generate scripts, and surface optimizations—like gaining a reliable teammate.',
          },
        ],
        bottomNote: 'Select only the capabilities you need—pay as you go.',
        uuidNote:
          'Every account receives a globally unique UUID. After registration, sign in to the user center to view and copy it for future integrations.',
        form: {
          title: 'Create your account',
          subtitle: 'Submit your email and password, request the code, and enter it to activate your account.',
          email: 'Work email',
          emailPlaceholder: 'name@example.com',
          password: 'Password',
          passwordPlaceholder: 'At least 8 characters',
          confirmPassword: 'Confirm password',
          confirmPasswordPlaceholder: 'Re-enter your password',
          agreement: 'I agree to the',
          terms: 'terms & privacy policy',
          submit: 'Create account',
          submitting: 'Creating account…',
          verifySubmit: 'Verify & complete',
          verifying: 'Verifying…',
          completeSubmit: 'Complete registration',
          completing: 'Finishing up…',
          verificationCodeLabel: 'Email verification code',
          verificationCodeDescription: 'Enter the 6-digit code sent to your email. It expires in 10 minutes.',
          verificationCodeResend: 'Resend',
          verificationCodeResending: 'Resending…',
          validation: {
            initializing: 'Loading the registration form…',
            submitting: 'Submitting your registration…',
            verifying: 'Verifying the code you entered…',
            completing: 'Finalizing your registration…',
            emailMissing: 'Enter your work email to continue.',
            emailInvalid: 'The email format looks incorrect.',
            passwordMissing: 'Enter and confirm your password to continue.',
            confirmPasswordMissing: 'Re-enter your password in the confirmation field.',
            passwordWeak: 'Use at least 8 characters that include both letters and numbers.',
            passwordMismatch: 'The two password entries must match exactly.',
            agreementRequired: 'You must accept the terms to continue.',
            codeIncomplete: 'Enter the complete 6-digit verification code sent to your email.',
            passwordUnavailable: 'Your password is missing. Restart the registration flow.',
          },
        },
        social: {
          title: 'Or continue with',
          github: 'Continue with GitHub',
          wechat: 'Continue with WeChat',
        },
        loginPrompt: {
          text: 'Already have an account?',
          link: 'Sign in',
        },
        alerts: {
          success: 'Account created successfully. Please sign in.',
          passwordMismatch: 'Passwords do not match.',
          missingFields: 'Please complete all required fields.',
          userExists: 'An account with this email already exists.',
          usernameExists: 'This username is already taken. Please choose another.',
          invalidName: 'Enter a valid name.',
          agreementRequired: 'You must accept the terms to continue.',
          invalidEmail: 'Enter a valid email address.',
          weakPassword: 'Your password must be at least 8 characters long.',
          genericError: 'We could not complete your registration. Please try again.',
          verificationSent:
            'A verification code has been sent to your email. Enter the 6-digit code within 10 minutes. If you do not receive it, click the resend button.',
          verificationFailed: 'Verification failed. Request a new code and try again.',
          invalidCode: 'Enter the 6-digit verification code sent to your email.',
          codeRequired: 'Enter the 6-digit verification code to continue.',
          preSubmitHint:
            'A verification code has been sent to your email. Enter the 6-digit code within 10 minutes. If you do not receive it, click the resend button.',
          verificationReady: 'Code verified. Click “Complete registration” to sign in automatically.',
          verificationResent: 'A new verification code has been sent to your email.',
          registrationComplete: 'Registration complete! Redirecting to your dashboard.',
        },
      },
      login: {
        badge: 'Secure login',
        title: 'Welcome back',
        subtitle: 'Access your projects and account settings from a single console.',
        highlights: [
          {
            title: 'Personalized dashboard',
            description: 'Resume your work with saved queries and deployment history.',
          },
          {
            title: 'Team spaces',
            description: 'Switch between organizations and environments with one click.',
          },
          {
            title: 'Adaptive security',
            description: 'Multi-factor prompts and IP policies keep threats away.',
          },
        ],
        bottomNote: 'Need help signing in? Email support@svc.plus for enterprise onboarding assistance.',
        form: {
          title: 'Sign in to your account',
          subtitle: 'Use the email, password, and authenticator code you registered with.',
          email: 'User email',
          emailPlaceholder: 'name@example.com',
          password: 'Password',
          passwordPlaceholder: 'Enter your password',
          remember: 'Remember this device',
          submit: 'Sign in',
          mfa: {
            mode: 'Authentication method',
            passwordOnly: 'Password only',
            passwordAndTotp: 'Password + authenticator code',
            codeLabel: 'Authenticator code',
            codePlaceholder: '6-digit code from your authenticator',
          },
        },
        forgotPassword: 'Forgot password?',
        social: {
          title: 'Or continue with',
          github: 'Continue with GitHub',
          wechat: 'Continue with WeChat',
        },
        registerPrompt: {
          text: 'New to Cloud-Neutral?',
          link: 'Create an account',
        },
        alerts: {
          registered: 'Registration complete. Sign in to continue.',
          missingCredentials: 'Enter your username or email and the authenticator code to continue.',
          invalidCredentials: 'Incorrect username or password. Please try again.',
          userNotFound: 'We could not find an account with that username.',
          genericError: 'We could not sign you in. Please try again later.',
          passwordRequired: 'Enter your password when signing in with a username.',
          mfa: {
            missing: 'Enter the verification code from your authenticator app.',
            invalid: 'The verification code is not valid. Try again.',
            invalidFormat: 'Enter the 6-digit code from your authenticator app.',
            setupRequired: 'Multi-factor authentication must be completed before accessing the console.',
            challengeFailed: 'We could not prepare the multi-factor challenge. Try again later.',
          },
        },
      },
      emailVerification: {
        badge: 'Verify email',
        title: 'Check your inbox',
        description: 'Enter the 6-digit verification code we sent to {{email}}.',
        emailFallback: 'your email address',
        form: {
          codeLabel: 'Verification code',
          codePlaceholder: '123456',
          helper: 'The code expires in 10 minutes.',
          submit: 'Continue',
          submitting: 'Verifying…',
        },
        resend: {
          label: 'Resend email',
          resending: 'Resending…',
        },
        alerts: {
          missingEmail: 'Return to the sign-up form and enter your email address again.',
          codeRequired: 'Enter the 6-digit verification code to continue.',
          verificationSent: 'We emailed a 6-digit code to your address.',
          verificationResent: 'A new verification code has been sent. Check your inbox.',
          verificationFailed: 'The verification code was invalid or expired. Try again.',
          verificationReady: 'Email verified. Redirecting to sign in…',
          genericError: 'We could not verify your email. Please try again.',
        },
        switchAction: {
          text: 'Already verified?',
          link: 'Sign in',
        },
        footnote: 'Didn’t receive the email? Check your spam folder or contact support@svc.plus.',
        bottomNote: 'Need to start over? Return to the registration form to request a new code.',
      },
    },
    userCenter: {
      overview: {
        heading: 'User Center',
        loading: 'Loading your personalized space…',
        welcome: 'Welcome back, {name}.',
        guest: 'Sign in to unlock your user center.',
        uuidNote: 'Your UUID uniquely identifies you across XControl services.',
        lockBanner: {
          title: 'Finish MFA setup',
          body: 'Complete multi-factor authentication to unlock every panel section.',
          action: 'Set up MFA',
          docs: 'View setup guide',
          logout: 'Sign out',
        },
        cards: {
          uuid: {
            label: 'UUID',
            description: 'This fingerprint ties every service action back to your account.',
            copy: 'Copy',
            copied: 'Copied',
          },
          username: {
            label: 'Username',
            description: 'System-facing credential for automation and teammates.',
          },
          email: {
            label: 'Email',
            description: 'Receive notifications and maintain a trusted identity chain.',
          },
          mfa: {
            label: 'Multi-factor authentication',
            description: 'Secure the console by pairing an authenticator app.',
            action: 'Manage MFA',
          },
          vless: {
            label: 'VLESS QR code',
            description: 'Scan to import the accelerator configuration instantly.',
            linkLabel: 'VLESS URI',
            linkHelper: 'Click "Copy link" to copy your private VLESS URI.',
            copyLink: 'Copy link',
            copied: 'Link copied',
            downloadQr: 'Download QR',
            downloadConfig: 'Download config',
            generating: 'Generating QR code…',
            error: 'We could not generate the QR code. Try again later.',
            missingUuid: 'We could not locate your UUID. Refresh the page or sign in again.',
            downloadTooltip:
              'Your UUID is the only credential required to access this node. Keep it private and do not share it.\nmacOS: /opt/homebrew/etc/config.json\nLinux: /usr/local/etc/config.json',
            warning: 'Your UUID is the only credential required to access this node. Keep it private and do not share it.',
            macPath: '/opt/homebrew/etc/config.json',
            linuxPath: '/usr/local/etc/config.json',
            qrAlt: 'VLESS connection QR code',
          },
        },
      },
      mfa: {
        title: 'Multi-factor authentication',
        subtitle: 'Bind Google Authenticator to finish securing your account.',
        pendingHint: 'Complete this step to unlock the user center and other console features.',
        enabledHint: 'Authenticator codes are now required for every sign-in.',
        summary: {
          description: 'View your authenticator status and manage binding without leaving the dashboard.',
          statusLabel: 'Current status',
          manage: 'Manage binding',
          bind: 'Bind now',
        },
        generate: 'Generate setup key',
        regenerate: 'Regenerate key',
        secretLabel: 'Secret key',
        issuerLabel: 'Issuer',
        accountLabel: 'Account label',
        uriLabel: 'Authenticator link',
        manualHint: 'Scan the link with Google Authenticator or enter the key manually.',
        codeLabel: 'Verification code',
        codePlaceholder: 'Enter the 6-digit code',
        verify: 'Verify and enable',
        verifying: 'Verifying…',
        successTitle: 'Authenticator connected',
        successBody: 'Your account now requires an authenticator code at sign-in.',
        guide: {
          step1Title: '1. Install an authenticator app',
          step1Description:
            'Download Alibaba Cloud Authenticator or Google Authenticator on your phone to get started.',
          step1Ios:
            'iOS: Search for “Google Authenticator” or “Alibaba Cloud Authenticator” in the App Store and install it.',
          step1Android:
            'Android: Search for “Google Authenticator” or “Alibaba Cloud Authenticator” in Google Play and install it.',
          step2Title: '2. Scan the QR code to bind Google Authenticator',
          step2Description:
            'Open the authenticator app and scan this QR code. Unable to scan? Enter the secret key manually.',
          step3Title: '3. Enter the verification code to finish',
          step3Description: 'Enter the 6-digit code generated by the authenticator app to complete binding.',
        },
        status: {
          issuedAt: 'Key generated at',
          confirmedAt: 'Enabled at',
        },
        state: {
          enabled: 'Enabled',
          pending: 'Pending setup',
          disabled: 'Not enabled',
        },
        qrLabel: 'Authenticator QR code',
        lockedMessage: 'Finish the binding flow before exploring other sections.',
        steps: {
          intro: 'Complete these two steps to secure your account:',
          provision: '1. Generate a secret and scan the QR code with Google Authenticator.',
          verify: '2. Enter the 6-digit verification code to enable MFA.',
        },
        actions: {
          help: 'Need help staying secure?',
          description: 'If you run into issues, sign out or review the setup documentation.',
          logout: 'Sign out',
          docs: 'View setup guide',
          docsUrl: '/docs/account-service-configuration/latest',
          setup: 'Resume setup',
        },
        modal: {
          title: 'Manage multi-factor authentication',
          close: 'Close window',
        },
        disable: {
          title: 'Unbind authenticator',
          description: 'Removing MFA will disable extra verification until you bind an authenticator again.',
          action: 'Unbind MFA',
          confirming: 'Unbinding…',
        },
        errors: {
          provisioningFailed: 'We could not generate a new secret. Please try again.',
          verificationFailed: 'The verification failed. Enter a fresh authenticator code.',
          missingCode: 'Enter the 6-digit code from your authenticator.',
          invalidCode: 'The code did not match. Try again with a new one.',
          locked: 'Too many invalid attempts. Wait for the cooldown before retrying.',
          sessionExpired: 'Your authentication session has expired. Sign in again to continue.',
          network: 'The account service is not reachable right now. Try again in a moment.',
          disableFailed: 'We could not reset MFA. Please try again later.',
        },
        error: 'We could not complete the request. Please try again.',
      },
    },
    marketing: {
      home: {
        hero: {
          eyebrow: 'Cloud-Native Suite',
          title: 'A Unified Toolkit for Cloud-Native Environments',
          subtitle:
            'Unify asset management, access control, observability, and automated runbooks in a responsive workspace.',
          highlights: [
            'Unified governance across clusters and clouds',
            'Policy-driven security and compliance automation',
            'Template-driven workflows accelerate delivery',
            'Modular capabilities you can enable on demand',
          ],
          bodyHtml:
            '<p>XControl uses a modular architecture so you can add observability, identity, and orchestration packages without disrupting the core platform. Open APIs and event streams connect seamlessly with the DevOps toolchain you already rely on.</p>',
          primaryCtaLabel: 'Try it now',
          secondaryCtaLabel: 'Product docs',
        },
        tabsLabel: 'Product Matrix',
        tabsAriaLabel: 'XControl product suite',
        productMatrix: {
          badge: 'Cloud-Native Suite',
          title: 'A Unified Toolkit for Cloud-Native Environments',
          description:
            'Bring asset management, access control, observability, and automated runbooks into a single, responsive experience.',
          highlights: [
            'Unified governance for multi-cluster and multi-cloud fleets',
            'Policy-centric security and compliance automation',
            'Standardized templates accelerate business delivery',
          ],
          topicsLabel: 'Product spotlights',
          capabilitiesLabel: 'Capability highlights',
        },
        heroFallback: {
          title: 'Platform overview',
          description:
            'With a unified control plane and open interfaces, XControl combines governance, observability, security, and workflows so teams can confidently scale cloud-native workloads.',
        },
        articleFeed: {
          eyebrow: 'Latest updates',
          title: 'Product & community news',
          viewAll: 'Browse all updates →',
          empty: 'No updates yet—stay tuned for the latest product and community announcements.',
          dateLocale: 'en-US',
        },
        articleOverrides: {
          '2024-08-15-release-notes': {
            title: 'Release 1.8: Policy automation and observability upgrades',
            author: 'XControl Product Team',
            readingTime: '8 min read',
            excerpt:
              'A new policy chaining engine and cross-cluster metric federation deliver unified governance at scale.',
            tags: ['Release notes', 'Policy Center', 'Observability'],
          },
          '2024-07-30-observability-insight': {
            title: 'Observability as a Service: Unified insight from logs to business metrics',
            author: 'Observability Team',
            readingTime: '5 min read',
            excerpt:
              'We rebuilt metrics and log pipelines for multi-tenant environments, enabling second-level visualization and business-aware troubleshooting.',
            tags: ['Best practices', 'Observability', 'Data analytics'],
          },
          '2024-07-12-community-events': {
            title: 'Community roadshow kicks off: Hands-on sessions and product roadmap',
            author: 'Community Team',
            readingTime: '3 min read',
            excerpt:
              'Join the eight-city tour for platform engineering case studies, security automation workshops, and open Q&A on the roadmap.',
            tags: ['Community events', 'Ecosystem'],
          },
        },
        contactPanel: {
          buttonLabel: 'Stay connected',
          expandLabel: 'Expand stay connected panel',
          collapseLabel: 'Collapse stay connected panel',
          qrAltSuffix: 'QR code',
          title: 'Stay connected',
          subtitle: 'Scan to follow updates or join the community for product news and support.',
          items: {
            'wechat-official': {
              title: 'WeChat official account',
              description: 'Learn about commercial offerings and professional support.',
              bodyHtml: 'Follow the XControl official account to unlock cloud adoption stories and expert insights.',
            },
            'wechat-group': {
              title: 'Join the WeChat community',
              description: 'Chat with the product team and peers in real time.',
              bodyHtml: 'Add the XControl community assistant to receive event updates and join focused groups.',
            },
            support: {
              title: 'Get support',
              description: 'Share feedback and tap into community support.',
              ctaLabel: 'Contact us',
              bodyHtml:
                'Send us your feedback or feature suggestions and we will respond as quickly as possible.<br />For technical help, contact <strong>manbuzhe2008@gmail.com</strong>.',
            },
            'github-star': {
              title: 'Show your support',
              description: 'Star us on GitHub to stay informed.',
              bodyHtml:
                'Visit the CloudNativeSuite GitHub organization, star the repositories, and keep up with project updates.',
            },
          },
        },
        sidebarOverrides: {
          community: {
            title: 'Community highlights',
            ctaLabel: 'Join the community',
            bodyHtml:
              '<ul><li><a href="#">Platform engineering book club</a> — Weekly deep dives into governance case studies.</li><li><a href="#">Slack community</a> — Chat live with 2,000+ practitioners.</li><li><a href="#">GitHub Issues</a> — Share feature requests and report bugs.</li></ul>',
          },
          newsletter: {
            title: 'Subscribe to the digest',
            ctaLabel: 'Subscribe now',
            bodyHtml:
              'Receive roadmap updates, best-practice articles, and event invites in your inbox once a month.',
          },
          resources: {
            title: 'Recommended resources',
            bodyHtml:
              '<ol><li><a href="#">Launch guide</a> — Best practices for rolling out XControl in phases.</li><li><a href="#">Security policy handbook</a> — Policy templates for common compliance baselines.</li><li><a href="#">Observability whitepaper</a> — Build a unified view of metrics and logs.</li></ol>',
          },
          tags: {
            title: 'Popular topics',
            tags: ['Policy-driven', 'Cloud-native security', 'Platform engineering', 'Observability insights', 'Cost governance', 'Best practices'],
          },
        },
        solutionOverrides: {
          xcloudflow: {
            tagline: 'Multi-cloud IaC',
            description:
              'Orchestrate multi-cloud infrastructure with declarative models that enforce policy and compliance automatically.',
            features: [
              'Blueprint multi-cloud resources with parameterized delivery',
              'GitOps workflows drive infrastructure changes',
              'Built-in approvals and auditing ensure compliance',
            ],
            bodyHtml:
              '<p>XCloudFlow unifies Terraform, Pulumi, and other IaC models into one workspace, enabling self-service delivery with centralized governance across every cloud.</p>',
            primaryCtaLabel: 'Try now',
            secondaryCtaLabel: 'Download',
            tertiaryCtaLabel: 'Documentation',
          },
          xscopehub: {
            tagline: 'AI & observability',
            description:
              'Use an AI-powered analysis workbench to unify logs, metrics, and traces, pinpoint anomalies, and recommend fixes.',
            features: [
              'Federated search across full-stack observability data',
              'Intelligent alert correlation and root-cause analysis',
              'Built-in AI copilot delivers operations guidance',
            ],
            bodyHtml:
              '<p>XScopeHub blends semantic search with time-series analytics to consolidate cross-environment observability and surface actionable insights.</p>',
            primaryCtaLabel: 'Try now',
            secondaryCtaLabel: 'Download',
            tertiaryCtaLabel: 'Documentation',
          },
          xcontrol: {
            title: 'XControl Platform',
            tagline: 'Cloud-native governance hub',
            description:
              'Give every team unified permissions, policy, and workflow orchestration so delivery and governance stay in sync.',
            features: [
              'One-stop permissions and compliance policy center',
              'Workflow automation fuels cross-team collaboration',
              'Extensible plugin architecture links existing systems',
            ],
            bodyHtml:
              '<p>XControl puts policy-as-code at the core to deliver an observable, governable, and auditable control plane for cloud-native infrastructure.</p>',
            primaryCtaLabel: 'Try now',
            secondaryCtaLabel: 'Download',
            tertiaryCtaLabel: 'Documentation',
          },
          xstream: {
            tagline: 'Global network accelerator',
            description:
              'Build a programmable worldwide network to keep cross-region applications and data sync low-latency and reliable.',
            features: [
              'Dynamic path optimization and bandwidth scheduling',
              'Zero-trust security and access control built in',
              'Connect with leading CDNs and edge locations',
            ],
            bodyHtml:
              '<p>XStream applies software-defined acceleration to deliver stable global links for real-time interaction, media streaming, and data distribution.</p>',
            primaryCtaLabel: 'Try now',
            secondaryCtaLabel: 'Download',
            tertiaryCtaLabel: 'Documentation',
          },
        },
      },
    },
  },
  zh: {
    hero: {
      title: '云原生套件',
      description: '为构建和管理云原生环境提供统一工具',
      start: '开始使用',
      learn: '了解更多',
    },
    featuresTitle: '功能特性',
    featuresSubtitle: '助您轻松构建、交付和运行应用',
    openSourceTitle: '开源项目',
    downloadTitle: '下载',
    downloadSubtitle: '选择适合的平台',
    footerLinks: ['隐私政策', '服务条款', '联系我们'],
    nav: {
      openSource: {
        title: '开源项目',
        features: '功能特性',
        projects: '开源项目',
        download: '下载',
      },
      services: {
        title: '服务',
        artifact: 'Artifact / 镜像',
        cloudIac: 'Cloud IaC 编排',
        insight: 'Insight 工作台',
        docs: '文档 / 解决方案',
      },
      account: {
        title: '账户',
        register: '注册',
        login: '登录',
        demo: '演示',
        welcome: '欢迎，{username}',
        logout: '退出登录',
        userCenter: '用户中心',
        management: '管理控制台',
      },
      releaseChannels: {
        label: '体验版本',
        summaryPrefix: '模式',
        stable: {
          name: '稳定',
          description: '推荐的默认体验。',
        },
        beta: {
          name: '测试',
          description: '提前体验即将上线的新功能。',
        },
        develop: {
          name: '开发',
          description: '预览仍在开发中的实验特性。',
        },
        badges: {
          stable: '稳定',
          beta: '测试',
          develop: '开发',
        },
      },
    },
    login: {
      title: '账户登录',
      description: '登录以获得个性化的 Cloud-Neutral 体验。',
      usernameLabel: '用户名',
      passwordLabel: '密码',
      submit: '立即登录',
      success: '{username}，欢迎回来！🎉',
      goHome: '返回首页',
      missingUsername: '请输入用户名后再尝试登录。',
      missingPassword: '请输入密码，或切换为“邮箱 + 动态口令”模式。',
      missingTotp: '请输入动态验证码完成登录。',
      invalidCredentials: '用户名或密码不正确，请重试。',
      userNotFound: '未找到该用户名对应的账户。',
      genericError: '登录失败，请稍后再试。',
      serviceUnavailable: '账户服务暂时不可用，请稍后再试。',
      disclaimer: '此演示登录仅会在浏览期间保留用户名，以便展示个性化的导航体验。',
    },
    termsTitle: '服务条款',
    termsPoints: [
      '提供在 Windows、Linux 和 macOS 上可自托管的免费开源版本',
      '提供经济实惠的 1 对 1 技术部署咨询服务',
      '提供带云同步、移动端支持和设备绑定的高级版计划',
      '未来将推出无需设置、一键部署的 SaaS 版本',
    ],
    contactTitle: '联系我们',
    contactDescription: '欢迎提交使用反馈或功能建议，我们会尽快回复。如需技术协助，请通过下方邮箱联系我们。',
    contactEmailLabel: '技术支持邮箱',
    contactEmail: 'manbuzhe2008@gmail.com',
    download: {
      home: {
        title: '下载中心',
        description: '浏览托管于 dl.svc.plus 的离线安装包、发布版本和精选资源。',
        stats: {
          categories: '顶级分类',
          collections: '资源集合',
          files: '已收录文件',
        },
      },
      browser: {
        categoriesTitle: '分类',
        allButton: '全部资源',
        allHeading: '全部下载',
        allDescription: '浏览所有离线安装包、发布版本和制品。',
        collectionDescription: '当前展示 {{collection}} 分类下的资源。',
        itemCount: {
          singular: '{{count}} 项',
          plural: '{{count}} 项',
        },
        empty: '当前分类暂时没有可下载的资源。',
      },
      cardGrid: {
        sortUpdated: '按更新时间排序',
        sortName: '按名称排序',
        searchPlaceholder: '搜索',
        updatedLabel: '更新于：',
        itemsLabel: '数量：',
      },
      listing: {
        notFound: '未找到对应的目录。',
        headingDescription: '浏览 {{directory}} 目录下可用的下载内容和制品。',
        stats: {
          subdirectories: '子目录',
          files: '文件',
          lastUpdated: '最近更新',
        },
        collectionsTitle: '集合',
        collectionsCount: {
          singular: '{{count}} 个条目',
          plural: '{{count}} 个条目',
        },
        empty: '该目录暂时没有可下载的内容。',
        infoTitle: '目录信息',
        infoPath: '路径',
        infoSource: '来源',
        infoNotice: '数据来源于 dl.svc.plus。',
      },
      fileTable: {
        sortName: '名称',
        sortUpdated: '更新时间',
        sortSize: '大小',
        filterPlaceholder: '按后缀过滤（如 .tar.gz）',
        headers: {
          name: '名称',
          size: '大小',
          updated: '更新时间',
          actions: '操作',
        },
      },
      copyButton: {
        tooltip: '复制链接',
      },
      breadcrumbRoot: '下载',
    },
    auth: {
      register: {
        badge: '立即注册',
        title: '加入 Cloud-Neutral',
        subtitle: '我们会先向你的邮箱发送验证码，确认地址后即可进入工作台。',

        highlights: [
          {
            title: '试试各种开源解决方案',
            description: '数据库、监控、CI/CD、可观测性……一键部署与体验，告别繁琐安装，不用再东找西找。',
          },
          {
            title: '在线体验 AI 帮手',
            description: '未来的 AI 不只是聊天机器人，它能帮你查问题、做运维、生成脚本，甚至提出优化建议。随时随地，像多了一个可靠的伙伴。',
          },
        ],
        bottomNote: '注册用户按需选择需要的功能，Pay AS GO。',
        uuidNote: '注册完成后，系统会为你分配一个全局唯一的 UUID，可在用户中心查看并复制，用于后续服务对接。',
        form: {
          title: '创建账号',
          subtitle: '先提交邮箱和密码获取验证码，再输入邮箱收到的验证码完成注册。',
          email: '邮箱',
          emailPlaceholder: 'name@example.com',
          password: '密码',
          passwordPlaceholder: '至少 8 位字符',
          confirmPassword: '确认密码',
          confirmPasswordPlaceholder: '请再次输入密码',
          agreement: '我已阅读并同意',
          terms: '服务条款与隐私政策',
          submit: '立即注册',
          submitting: '注册中…',
          verifySubmit: '验证并完成',
          verifying: '验证中…',
          completeSubmit: '完成注册',
          completing: '完成中…',
          verificationCodeLabel: '动态验证码',
          verificationCodeDescription: '请输入发送到注册邮箱的 6 位数字验证码，10 分钟内有效。',
          verificationCodeResend: '重发',
          verificationCodeResending: '重发中…',
          validation: {
            initializing: '正在载入注册表单…',
            submitting: '正在提交注册请求…',
            verifying: '正在校验验证码…',
            completing: '正在完成注册…',
            emailMissing: '请输入邮箱地址以继续。',
            emailInvalid: '邮箱格式看起来不正确。',
            passwordMissing: '请输入密码并再次确认后继续。',
            confirmPasswordMissing: '请在确认密码栏中再次输入密码。',
            passwordWeak: '密码至少 8 位，并同时包含字母和数字。',
            passwordMismatch: '两次输入的密码必须完全一致。',
            agreementRequired: '请先勾选同意条款后再继续。',
            codeIncomplete: '请输入邮箱收到的完整 6 位验证码。',
            passwordUnavailable: '密码信息缺失，请重新开始注册流程。',
          },
        },
        social: {
          title: '或选择以下方式',
          github: '使用 GitHub 注册',
          wechat: '使用微信注册',
        },
        loginPrompt: {
          text: '已经拥有账号？',
          link: '立即登录',
        },
        alerts: {
          success: '注册成功，请使用账号登录。',
          passwordMismatch: '两次输入的密码不一致。',
          missingFields: '请填写所有必填信息。',
          userExists: '该邮箱已注册，请直接登录。',
          usernameExists: '该用户名已被占用，请更换后重试。',
          invalidName: '请输入有效的姓名。',
          agreementRequired: '请先同意服务条款后再继续。',
          invalidEmail: '请输入有效的邮箱地址。',
          weakPassword: '密码长度至少需要 8 个字符。',
          genericError: '注册失败，请稍后重试。',
          verificationSent:
            '动态验证码已经发送到您的邮箱，请输入发送到注册邮箱的 6 位数字验证码，10 分钟内有效，如果没有收到，可以点击重发按钮！',
          verificationFailed: '验证码验证失败，请重新获取验证码再试。',
          invalidCode: '请输入邮箱收到的 6 位数字验证码。',
          codeRequired: '请输入验证码后再继续。',
          preSubmitHint:
            '动态验证码已经发送到您的邮箱，请输入发送到注册邮箱的 6 位数字验证码，10 分钟内有效，如果没有收到，可以点击重发按钮！',
          verificationReady: '验证码校验通过，点击“完成注册”即可自动登录。',
          verificationResent: '新的动态验证码已发送，请及时查收邮箱。',
          registrationComplete: '注册完成，正在跳转到用户主页。',
        },
      },
      login: {
        badge: '安全登录',
        title: '欢迎回来',
        subtitle: '在一个控制台中管理项目和账号设置。',
        highlights: [],
        bottomNote: '如需支持，请联系 manbuzhe2008@gmail.com。',
        form: {
          title: '登录账号',
          subtitle: '使用注册时的邮箱、密码和动态验证码即可访问。',
          email: '用户邮箱',
          emailPlaceholder: 'name@example.com',
          password: '密码',
          passwordPlaceholder: '请输入密码',
          remember: '记住这台设备',
          submit: '登录',
          mfa: {
            mode: '验证方式',
            passwordOnly: '仅密码验证',
            passwordAndTotp: '密码 + 动态口令',
            codeLabel: '动态验证码',
            codePlaceholder: '来自认证器的 6 位数字',
          },
        },
        forgotPassword: '忘记密码？',
        social: {
          title: '或继续使用',
          github: '使用 GitHub 登录',
          wechat: '使用微信登录',
        },
        registerPrompt: {
          text: '还没有账号？',
          link: '立即创建',
        },
        alerts: {
          registered: '注册成功，请登录后继续。',
          missingCredentials: '请输入用户名或邮箱，并填写动态验证码。',
          invalidCredentials: '用户名或密码错误，请重试。',
          userNotFound: '未找到该用户名对应的账户。',
          genericError: '暂时无法登录，请稍后再试。',
          passwordRequired: '使用用户名登录时需要输入密码。',
          mfa: {
            missing: '请输入动态验证码。',
            invalid: '动态验证码不正确，请重试。',
            invalidFormat: '请输入认证器生成的 6 位数字验证码。',
            setupRequired: '请先完成多因素认证绑定后再访问控制台。',
            challengeFailed: '暂时无法发起多因素验证，请稍后再试。',
          },
        },
      },
      emailVerification: {
        badge: '邮箱验证',
        title: '检查您的收件箱',
        description: '请输入发送到 {{email}} 的 6 位验证码，10 分钟内有效。',
        emailFallback: '注册邮箱',
        form: {
          codeLabel: '验证码',
          codePlaceholder: '请输入 6 位数字',
          helper: '验证码仅在 10 分钟内有效，请尽快完成验证。',
          submit: '继续',
          submitting: '验证中…',
        },
        resend: {
          label: '重新发送电子邮件',
          resending: '重发中…',
        },
        alerts: {
          missingEmail: '请返回注册页面重新填写邮箱后再试。',
          codeRequired: '请输入邮箱收到的 6 位验证码。',
          verificationSent: '验证码已发送，请检查邮箱收件箱。',
          verificationResent: '新的验证码已发送，请注意查收。',
          verificationFailed: '验证码无效或已过期，请重试。',
          verificationReady: '邮箱验证成功，即将跳转至登录页面…',
          genericError: '暂时无法完成验证，请稍后再试。',
        },
        switchAction: {
          text: '已经完成验证？',
          link: '前往登录',
        },
        footnote: '没有收到邮件？请检查垃圾邮箱，或联系 support@svc.plus。',
        bottomNote: '需要重新开始？请回到注册页面重新获取验证码。',
      },
    },
    userCenter: {
      overview: {
        heading: '用户中心',
        loading: '正在加载你的专属空间…',
        welcome: '欢迎回来，{name}。',
        guest: '请登录后解锁属于你的用户中心。',
        uuidNote: 'UUID 是你在 XControl 中的唯一身份凭证，后续的所有服务都与它关联在一起。',
        lockBanner: {
          title: '完成多因素认证',
          body: '完成 MFA 绑定后即可访问所有控制台板块。',
          action: '立即设置',
          docs: '查看操作指引',
          logout: '退出登录',
        },
        cards: {
          uuid: {
            label: 'UUID',
            description: '这串指纹标识让平台中的每项服务都能准确识别你。',
            copy: '复制',
            copied: '已复制',
          },
          username: {
            label: '用户名',
            description: '面向系统与团队成员的登录凭据。',
          },
          email: {
            label: '邮箱',
            description: '用于接收通知、验证操作，并保持可信链路。',
          },
          mfa: {
            label: '多因素认证',
            description: '绑定认证器即可保护控制台访问。',
            action: '前往设置',
          },
          vless: {
            label: 'VLESS 二维码',
            description: 'VLESS 二维码 - 扫码即可导入加速器配置',
            linkLabel: 'VLESS 链接',
            linkHelper: '点击「复制链接」即可获取专属 VLESS 链接。',
            copyLink: '复制链接',
            copied: '链接已复制',
            downloadQr: '下载二维码',
            downloadConfig: '下载配置',
            generating: '二维码生成中…',
            error: '二维码生成失败，请稍后重试。',
            missingUuid: '无法获取您的 UUID，请刷新页面或重新登录。',
            downloadTooltip:
              'UUID 是访问节点的唯一凭证，请谨慎保存，勿随意分发。\nmacOS：/opt/homebrew/etc/config.json\nLinux：/usr/local/etc/config.json',
            warning: 'UUID 是访问节点的唯一凭证，请谨慎保存，勿随意分发。',
            macPath: '/opt/homebrew/etc/config.json',
            linuxPath: '/usr/local/etc/config.json',
            qrAlt: 'VLESS 连接二维码',
          },
        },
      },
      mfa: {
        title: '多因素认证',
        subtitle: '绑定 Google Authenticator，完成账号安全校验。',
        pendingHint: '启用多因素认证后即可访问用户中心和更多控制台功能。',
        enabledHint: '以后登录都需要输入动态验证码。',
        summary: {
          description: '在此查看当前绑定状态，并随时完成认证器的绑定或解绑。',
          statusLabel: '当前状态',
          manage: '管理绑定',
          bind: '立即绑定',
        },
        generate: '生成绑定密钥',
        regenerate: '重新生成密钥',
        secretLabel: '密钥',
        issuerLabel: '签发方',
        accountLabel: '账户标识',
        uriLabel: '认证链接',
        manualHint: '使用 Google Authenticator 扫描链接或手动输入密钥。',
        codeLabel: '动态验证码',
        codePlaceholder: '请输入 6 位数字验证码',
        verify: '验证并启用',
        verifying: '验证中…',
        successTitle: '认证器绑定成功',
        successBody: '以后登录时将需要动态验证码，账号更安全。',
        guide: {
          step1Title: '1 请在手机端下载阿里云 APP 或 Google Authenticator 身份验证器',
          step1Description: '下载并安装验证器应用，准备开始绑定流程。',
          step1Ios: '苹果：在 App Store 搜索 “Google Authenticator” 或 “阿里云 身份验证器” 并安装。',
          step1Android: '安卓：在应用商店搜索 “Google Authenticator” 或 “阿里云 身份验证器” 并安装。',
          step2Title: '2 使用阿里云或 Google Authenticator 身份验证器获取验证码',
          step2Description: '打开验证器扫描下方二维码，如无法扫描可手动输入密钥。',
          step3Title: '3 输入验证码完成绑定',
          step3Description: '在验证器中查看 6 位验证码并输入完成绑定。',
        },
        status: {
          issuedAt: '密钥生成时间',
          confirmedAt: '启用时间',
        },
        state: {
          enabled: '已启用',
          pending: '待验证',
          disabled: '未开启',
        },
        qrLabel: '认证二维码',
        lockedMessage: '请先完成绑定流程，再访问其他板块。',
        steps: {
          intro: '按照以下两步完成账号安全加固：',
          provision: '1. 生成密钥并在认证器中扫描二维码。',
          verify: '2. 输入认证器中的 6 位验证码完成启用。',
        },
        actions: {
          help: '需要帮助？',
          description: '遇到问题时可以退出重新登录，或查看绑定指引。',
          logout: '退出登录',
          docs: '查看操作指引',
          docsUrl: '/docs/account-service-configuration/latest',
          setup: '继续设置',
        },
        modal: {
          title: '管理多因素认证',
          close: '关闭窗口',
        },
        disable: {
          title: '解绑认证器',
          description: '解绑后将暂停额外验证，建议在重新绑定前谨慎操作。',
          action: '立即解绑',
          confirming: '解绑中…',
        },
        errors: {
          provisioningFailed: '暂时无法生成新的密钥，请稍后重试。',
          verificationFailed: '验证码校验失败，请重新输入新的动态验证码。',
          missingCode: '请输入 6 位动态验证码以继续。',
          invalidCode: '验证码不正确，请重试或等待新的验证码。',
          locked: '错误次数过多，请等待冷却时间后再试。',
          sessionExpired: '登录状态已失效，请重新登录后再继续操作。',
          network: '账户服务暂时不可用，请稍后再试。',
          disableFailed: '无法重置多因素认证，请稍后再试。',
        },
        error: '操作失败，请稍后再试。',
      },
    },
    marketing: {
      home: {
        hero: {},
        tabsLabel: '产品矩阵',
        tabsAriaLabel: 'XControl 产品套件',
        productMatrix: {
          badge: '云原生套件',
          title: '构建一体化的云原生工具集',
          description: '将资产管理、访问控制、可观测与自动化工作流整合到一个响应迅速的体验里，帮助团队高效落地治理策略。',
          highlights: [
            '跨集群与多云环境的一体化策略治理',
            '以策略为核心的安全与合规自动化',
            '将标准化模板加速落地业务流程',
          ],
          topicsLabel: '产品专题',
          capabilitiesLabel: '能力速览',
        },
        heroFallback: {
          title: '平台概览',
          description:
            '通过统一的控制平面与开放接口，XControl 将治理、观测、安全与工作流整合为一体，让团队可以自信地扩展云原生业务。',
        },
        articleFeed: {
          eyebrow: '最新动态',
          title: '产品与社区快讯',
          viewAll: '浏览全部更新 →',
          empty: '暂无内容，敬请期待更多来自产品与社区的最新动态。',
          dateLocale: 'zh-CN',
        },
        contactPanel: {
          buttonLabel: '保持联系',
          expandLabel: '展开保持联系面板',
          collapseLabel: '折叠保持联系面板',
          qrAltSuffix: '二维码',
          title: '保持联系',
          subtitle: '扫码关注或加入社区，获取最新产品动态与支持。',
        },
      },
    },
  },
}
