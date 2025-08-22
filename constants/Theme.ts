export const Theme = {
  colors: {
    // Paleta principal baseada no dourado Cioccoletti
    primary: '#D4AF37', // Dourado principal
    primaryDark: '#B8860B', // Dourado escuro
    primaryLight: '#F4E4BC', // Dourado claro
    primaryMuted: '#F9F5E7', // Dourado muito claro
    
    // Cores secundárias elegantes
    secondary: '#8B4513', // Bronze escuro
    secondaryLight: '#CD853F', // Bronze claro
    secondaryMuted: '#F5E6D3', // Bronze muito claro
    
    // Cores de apoio modernas
    accent: '#2C3E50', // Azul escuro elegante
    accentLight: '#34495E', // Azul médio
    accentMuted: '#ECF0F1', // Azul muito claro
    
    // Cores neutras sofisticadas
    neutral: '#6C757D',
    neutralLight: '#ADB5BD',
    neutralMuted: '#F8F9FA',
    
    // Cores de fundo
    background: '#FFFFFF',
    backgroundSecondary: '#FAFBFC',
    backgroundTertiary: '#F8F9FA',
    backgroundDark: '#1A1A1A',
    
    // Cores de texto
    text: '#212529',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    textLight: '#FFFFFF',
    textMuted: '#868E96',
    
    // Cores de status modernas
    success: '#10B981', // Verde moderno
    successLight: '#D1FAE5',
    warning: '#F59E0B', // Amarelo moderno
    warningLight: '#FEF3C7',
    error: '#EF4444', // Vermelho moderno
    errorLight: '#FEE2E2',
    info: '#3B82F6', // Azul moderno
    infoLight: '#DBEAFE',
    
    // Cores de borda
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Cores de sombra
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.2)',
    
    // Cores de overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    round: 50,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
    },
  },
  
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  
  // Configurações de animação
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  // Configurações de layout
  layout: {
    headerHeight: 60,
    tabBarHeight: 60,
    fabSize: 56,
    buttonHeight: 48,
    buttonHeightSmall: 36,
    buttonHeightLarge: 56,
  },
};