import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Theme } from '../../constants/Theme';

export default function WaitingApprovalScreen() {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>cioccoletti</Text>
            <View style={styles.separator} />
            <Text style={styles.locationText}>SÃO PAULO</Text>
          </View>
        </View>

        {/* Conteúdo Principal */}
        <View style={styles.mainContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⏳</Text>
          </View>
          
          <Text style={styles.title}>
            Aguardando Aprovação
          </Text>
          
          <Text style={styles.description}>
            Sua conta foi criada com sucesso! Agora você precisa aguardar a aprovação do administrador para acessar o sistema.
          </Text>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>O que acontece agora?</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Seus dados foram enviados para revisão
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                O administrador verificará suas informações
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Você receberá uma notificação quando for aprovado
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Após a aprovação, você poderá fazer login normalmente
              </Text>
            </View>
          </View>

          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>Precisa de ajuda?</Text>
            <Text style={styles.contactText}>
              Entre em contato com o administrador do sistema ou com a equipe de TI.
            </Text>
          </View>
        </View>

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <Button
            title="Voltar para Login"
            onPress={handleBackToLogin}
            variant="outline"
            style={styles.backButton}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  content: {
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xxl,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    fontFamily: 'serif',
    marginBottom: Theme.spacing.sm,
  },
  
  separator: {
    width: 60,
    height: 2,
    backgroundColor: Theme.colors.primary,
    marginBottom: Theme.spacing.sm,
  },
  
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
  
  mainContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.medium,
  },
  
  iconContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  
  icon: {
    fontSize: 64,
    marginBottom: Theme.spacing.md,
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  
  description: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Theme.spacing.xl,
  },
  
  infoContainer: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  
  infoBullet: {
    fontSize: 16,
    color: Theme.colors.primary,
    marginRight: Theme.spacing.sm,
    fontWeight: 'bold',
  },
  
  infoText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  
  contactContainer: {
    backgroundColor: Theme.colors.info + '20',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info,
  },
  
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.info,
    marginBottom: Theme.spacing.sm,
  },
  
  contactText: {
    fontSize: 14,
    color: Theme.colors.info,
    lineHeight: 20,
  },
  
  buttonContainer: {
    alignItems: 'center',
  },
  
  backButton: {
    minWidth: 200,
  },
});
