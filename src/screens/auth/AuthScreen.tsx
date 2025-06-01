import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AppTextInput from '../../components/common/AppTextInput';

interface FormValues {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
}

const loginValidationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const signupValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register, resetPassword } = useAuth();
  const { theme } = useTheme();

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(values.email, values.password);
      } else if (values.name) {
        await register(values.email, values.password, values.name);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred during authentication'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }
    
    try {
      await resetPassword(email);
      Alert.alert(
        'Password Reset',
        'Check your email for password reset instructions'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </Text>

        <Formik
          initialValues={
            isLogin
              ? { email: '', password: '' }
              : { name: '', email: '', password: '', confirmPassword: '' }
          }
          validationSchema={isLogin ? loginValidationSchema : signupValidationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit: formikSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              {!isLogin && (
                <AppTextInput
                  placeholder="Full Name"
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  value={values.name}
                  error={errors.name}
                  touched={touched.name}
                  autoCapitalize="words"
                  secureTextEntry={false}
                />
              )}

              <AppTextInput
                placeholder="Email"
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
                error={errors.email}
                touched={touched.email}
                keyboardType="email-address"
                autoCapitalize="none"
                secureTextEntry={false}
              />

              <AppTextInput
                placeholder="Password"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                error={errors.password}
                touched={touched.password}
                secureTextEntry={true}
              />

              {!isLogin && (
                <AppTextInput
                  placeholder="Confirm Password"
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  value={values.confirmPassword}
                  error={errors.confirmPassword}
                  touched={touched.confirmPassword}
                  secureTextEntry={true}
                />
              )}

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => formikSubmit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Login' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        {isLogin && (
          <TouchableOpacity
            onPress={() => {
              const email = '';  // You might want to get this from the form
              handleForgotPassword(email);
            }}
            style={styles.forgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          style={styles.toggleButton}
        >
          <Text style={[styles.toggleButtonText, { color: theme.colors.primary }]}>
            {isLogin
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    marginBottom: 20,
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
  },
});

export default AuthScreen; 