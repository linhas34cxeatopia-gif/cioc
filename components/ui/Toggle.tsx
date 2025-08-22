import React from 'react';
import { StyleSheet, Switch, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Theme } from '../../constants/Theme';

interface ToggleProps {
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  subtitle,
  value,
  onValueChange,
  containerStyle,
  labelStyle,
  subtitleStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.textBox}>
        <Text style={[styles.label, labelStyle]} numberOfLines={2}>{label}</Text>
        {subtitle ? <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={'#fff'}
        trackColor={{ false: '#d1d5db', true: Theme.colors.primary }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
  },
  textBox: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    color: Theme.colors.text,
    fontWeight: '600',
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
});


