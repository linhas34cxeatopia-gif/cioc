import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'filled',
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    textInputProps.onFocus?.(undefined as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    textInputProps.onBlur?.(undefined as any);
  };

  const getInputContainerStyle = () => {
    const baseStyle = [styles.inputContainer, styles[variant]];
    
    if (isFocused) {
      baseStyle.push(styles.inputFocused);
    }
    
    if (error) {
      baseStyle.push(styles.inputError);
    }
    
    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons name={leftIcon as any} size={20} color={Theme.colors.textSecondary} />
          </View>
        )}
        
        <TextInput
          {...textInputProps}
          style={[styles.input, inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={Theme.colors.textSecondary}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
          >
            <Ionicons name={rightIcon as any} size={20} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.lg,
  },
  
  label: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.small,
  },
  
  // Variantes
  default: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  
  filled: {
    backgroundColor: Theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
  },
  
  input: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.text,
    minHeight: 48,
  },
  
  inputFocused: {
    borderColor: Theme.colors.primary,
    ...Theme.shadows.medium,
  },
  
  inputError: {
    borderColor: Theme.colors.error,
  },
  
  leftIconContainer: {
    paddingLeft: Theme.spacing.md,
  },
  
  rightIconContainer: {
    paddingRight: Theme.spacing.md,
    padding: Theme.spacing.sm,
  },
  
  error: {
    fontSize: Theme.typography.caption.fontSize,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
});