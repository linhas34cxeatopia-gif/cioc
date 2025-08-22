export const Theme = {
  colors: {
    primary: '#D4AF37', // Dourado principal
    primaryDark: '#B8860B', // Dourado escuro
    primaryLight: '#F4E4BC', // Dourado claro
    secondary: '#CD853F', // Bronze
    accent: '#FFD700', // Dourado brilhante
    
    // Cores de fundo
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    backgroundDark: '#1A1A1A',
    
    // Cores de texto
    text: '#1A1A1A',
    textSecondary: '#6C757D',
    textLight: '#FFFFFF',
    
    // Cores de status
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
    
    // Cores de borda
    border: '#E9ECEF',
    borderDark: '#6C757D',
    
    // Cores de sombra
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
    },
  },
  
  shadows: {
    small: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
