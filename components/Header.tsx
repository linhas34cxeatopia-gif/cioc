import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Theme';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  notificationsCount?: number;
}

export default function Header({ 
  title, 
  showBackButton = false, 
  onBackPress, 
  onMenuPress, 
  notificationsCount = 0 
}: HeaderProps) {
  const navigation = useNavigation();
  const router = useRouter();

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleNotificationsPress = () => {
    router.push('/(main)/notifications' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={styles.header.backgroundColor} />
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleMenuPress} style={styles.iconButton}>
              <Ionicons name="menu" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.centerSection}>
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity onPress={handleNotificationsPress} style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="white" />
            {notificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationsCount > 99 ? '99+' : notificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.accent,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    height: Theme.layout.headerHeight,
    ...Theme.shadows.medium,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  title: {
    fontSize: Theme.typography.h4.fontSize,
    fontWeight: Theme.typography.h4.fontWeight as any,
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  notificationButton: {
    padding: Theme.spacing.sm,
    position: 'relative',
    borderRadius: Theme.borderRadius.md,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Theme.colors.error,
    borderRadius: Theme.borderRadius.round,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.accent,
  },
  notificationBadgeText: {
    color: Theme.colors.textLight,
    fontSize: 10,
    fontWeight: '700',
  },
});