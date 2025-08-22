import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Theme } from '../../constants/Theme';
import { useAuth } from '../../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const success = await login(data);
    
    if (success) {
      router.replace('/(main)/(tabs)');
    }
  };

  const handleRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo e Título */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>cioccoletti</Text>
              <View style={styles.separator} />
              <Text style={styles.locationText}>SÃO PAULO</Text>
            </View>
            <Text style={styles.subtitle}>
              Sistema de Gestão
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Entrar</Text>
            
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-mail"
                  placeholder="Digite seu e-mail"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Senha"
                  placeholder="Digite sua senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
              )}
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title="Entrar"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Criar Conta"
              onPress={handleRegister}
              variant="outline"
              style={styles.registerButton}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: 36,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    fontFamily: 'serif',
    marginBottom: Theme.spacing.sm,
  },
  
  separator: {
    width: 80,
    height: 2,
    backgroundColor: Theme.colors.primary,
    marginBottom: Theme.spacing.sm,
  },
  
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
  
  subtitle: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
  
  formContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.xxl,
    padding: Theme.spacing.xl,
    ...Theme.shadows.large,
    borderWidth: 1,
    borderColor: Theme.colors.borderLight,
  },
  
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  
  errorContainer: {
    backgroundColor: Theme.colors.error + '20',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  
  errorText: {
    color: Theme.colors.error,
    textAlign: 'center',
    fontSize: 14,
  },
  
  loginButton: {
    marginBottom: Theme.spacing.lg,
  },
  
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  
  dividerText: {
    marginHorizontal: Theme.spacing.md,
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  
  registerButton: {
    marginBottom: Theme.spacing.md,
  },
});
