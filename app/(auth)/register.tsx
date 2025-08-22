import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Theme } from '../../constants/Theme';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['vendas', 'cozinha']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'vendas',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    const success = await register(data);
    
    if (success) {
      // Mostrar mensagem de sucesso e redirecionar para login
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    }
  };

  const handleBackToLogin = () => {
    router.back();
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>cioccoletti</Text>
              <View style={styles.separator} />
              <Text style={styles.locationText}>SÃO PAULO</Text>
            </View>
            <Text style={styles.subtitle}>
              Criar Nova Conta
            </Text>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Cadastro</Text>
            
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nome Completo"
                  placeholder="Digite seu nome completo"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              )}
            />

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
                  autoComplete="new-password"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar Senha"
                  placeholder="Confirme sua senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                />
              )}
            />

            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={styles.roleContainer}>
                  <Text style={styles.roleLabel}>Função:</Text>
                  <View style={styles.roleButtons}>
                    <Button
                      title="Vendas"
                      variant={value === 'vendas' ? 'primary' : 'outline'}
                      size="small"
                      onPress={() => onChange('vendas')}
                      style={styles.roleButton}
                    />
                    <Button
                      title="Cozinha"
                      variant={value === 'cozinha' ? 'primary' : 'outline'}
                      size="small"
                      onPress={() => onChange('cozinha')}
                      style={styles.roleButton}
                    />
                  </View>
                </View>
              )}
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title="Criar Conta"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.registerButton}
            />

            <Button
              title="Voltar para Login"
              onPress={handleBackToLogin}
              variant="outline"
              style={styles.backButton}
            />
          </View>

          {/* Informações */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Após criar sua conta, você receberá um e-mail de confirmação e deverá aguardar a aprovação do administrador.
            </Text>
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
    marginBottom: Theme.spacing.xl,
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
  
  subtitle: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
  
  formContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.medium,
  },
  
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  
  roleContainer: {
    marginBottom: Theme.spacing.md,
  },
  
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  
  roleButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  
  roleButton: {
    flex: 1,
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
  
  registerButton: {
    marginBottom: Theme.spacing.md,
  },
  
  backButton: {
    marginBottom: Theme.spacing.md,
  },
  
  infoContainer: {
    backgroundColor: Theme.colors.info + '20',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info,
  },
  
  infoText: {
    color: Theme.colors.info,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
