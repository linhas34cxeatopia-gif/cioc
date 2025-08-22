import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Theme } from '../../constants/Theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
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

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <TextInput
        {...textInputProps}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          inputStyle,
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={Theme.colors.textSecondary}
      />
      
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
    marginBottom: Theme.spacing.md,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  
  input: {
    borderWidth: 2,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.background,
    ...Theme.shadows.small,
  },
  
  inputFocused: {
    borderColor: Theme.colors.primary,
    ...Theme.shadows.medium,
  },
  
  inputError: {
    borderColor: Theme.colors.error,
  },
  
  error: {
    fontSize: 14,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
  },
});
