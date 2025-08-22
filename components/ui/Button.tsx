import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Theme } from '../../constants/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={getLoadingColor()}
          size={size === 'small' ? 'small' : 'small'}
        />
      );
    }

    if (icon) {
      return (
        <View style={styles.contentWithIcon}>
          {iconPosition === 'left' && (
            <View style={styles.iconContainer}>{icon}</View>
          )}
          <Text style={textStyleCombined}>{title}</Text>
          {iconPosition === 'right' && (
            <View style={styles.iconContainer}>{icon}</View>
          )}
        </View>
      );
    }

    return <Text style={textStyleCombined}>{title}</Text>;
  };

  const getLoadingColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return Theme.colors.primary;
      case 'danger':
        return Theme.colors.textLight;
      case 'success':
        return Theme.colors.textLight;
      default:
        return Theme.colors.textLight;
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    ...Theme.shadows.small,
  },
  
  // Variantes modernas
  primary: {
    backgroundColor: Theme.colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: Theme.colors.secondary,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    ...Theme.shadows.none,
  },
  ghost: {
    backgroundColor: Theme.colors.primaryMuted,
    borderWidth: 0,
    ...Theme.shadows.none,
  },
  danger: {
    backgroundColor: Theme.colors.error,
    borderWidth: 0,
  },
  success: {
    backgroundColor: Theme.colors.success,
    borderWidth: 0,
  },
  
  // Tamanhos modernos
  small: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    minHeight: Theme.layout.buttonHeightSmall,
  },
  medium: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    minHeight: Theme.layout.buttonHeight,
  },
  large: {
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    minHeight: Theme.layout.buttonHeightLarge,
  },
  
  // Estados
  disabled: {
    opacity: 0.5,
    ...Theme.shadows.none,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Texto
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  
  primaryText: {
    color: Theme.colors.textLight,
  },
  secondaryText: {
    color: Theme.colors.textLight,
  },
  outlineText: {
    color: Theme.colors.primary,
  },
  ghostText: {
    color: Theme.colors.primary,
  },
  dangerText: {
    color: Theme.colors.textLight,
  },
  successText: {
    color: Theme.colors.textLight,
  },
  
  smallText: {
    fontSize: Theme.typography.buttonSmall.fontSize,
    lineHeight: Theme.typography.buttonSmall.lineHeight,
  },
  mediumText: {
    fontSize: Theme.typography.button.fontSize,
    lineHeight: Theme.typography.button.lineHeight,
  },
  largeText: {
    fontSize: 18,
    lineHeight: 22,
  },
  
  disabledText: {
    opacity: 0.7,
  },
  
  // Conteúdo com ícone
  contentWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconContainer: {
    marginHorizontal: Theme.spacing.xs,
  },
});