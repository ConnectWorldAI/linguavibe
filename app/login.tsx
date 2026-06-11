import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import * as Auth from "@/lib/_core/auth";
import { setCurrentUserId, UserStorage, MIGRATABLE_KEYS } from "@/lib/user-storage";
import { trpc } from "@/lib/trpc";
import { BrandName } from "@/components/brand-name";

type AuthMode = "login" | "signup" | "forgot";

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const handleOAuthLogin = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await startOAuthLogin();
    } catch (e) {
      Alert.alert("Login Error", "Could not open login page. Please try again.");
    }
    // On native, loading stays true until OAuth callback returns
    if (Platform.OS === "web") setLoading(false);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    // Validate password against stored credentials
    const storedCreds = await AsyncStorage.getItem(`@credentials_${email.toLowerCase()}`);
    if (storedCreds) {
      const creds = JSON.parse(storedCreds);
      if (creds.password !== password) {
        setLoading(false);
        Alert.alert("Invalid Credentials", "The email or password you entered is incorrect.");
        return;
      }
    }

    // Credentials valid - proceed with login
    await AsyncStorage.setItem("@auth_user", JSON.stringify({ email, name: name || "User" }));
    await AsyncStorage.setItem("@auth_logged_in", "true");
    const userId = `local_${email}`;
    await Auth.setUserInfo({
      id: Date.now(),
      openId: userId,
      name: name || "User",
      email,
      loginMethod: "email",
      lastSignedIn: new Date(),
    });
    // Set user-scoped storage and migrate existing data
    await setCurrentUserId(userId);
    await UserStorage.migrateGlobalToUser(MIGRATABLE_KEYS);
    setLoading(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    await AsyncStorage.setItem("@auth_user", JSON.stringify({ email, name }));
    await AsyncStorage.setItem("@auth_logged_in", "true");
    setLoading(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/onboarding");
  };

  const sendResetCodeMutation = trpc.emailAuth.sendResetCode.useMutation();
  const verifyResetCodeMutation = trpc.emailAuth.verifyResetCode.useMutation();
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "code" | "done">("email");

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Enter Email", "Please enter your email address.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      await sendResetCodeMutation.mutateAsync({ email: email.toLowerCase() });
      setResetStep("code");
    } catch (e: any) {
      Alert.alert("Error", "Could not send reset code. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyResetCode = async () => {
    if (!resetCode.trim() || resetCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code from your email.");
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert("Weak Password", "New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyResetCodeMutation.mutateAsync({
        email: email.toLowerCase(),
        code: resetCode,
        newPassword,
      });
      if (result.success) {
        // Update stored credentials locally
        await AsyncStorage.setItem(`@credentials_${email.toLowerCase()}`, JSON.stringify({
          password: newPassword,
          updatedAt: new Date().toISOString(),
        }));
        setResetStep("done");
        setResetSent(true);
      } else {
        Alert.alert("Error", result.error || "Invalid code.");
      }
    } catch (e: any) {
      Alert.alert("Error", "Could not verify code. Please try again.");
    }
    setLoading(false);
  };

  const renderLogin = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => setMode("forgot")}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={Colors.textPrimary} />
        ) : (
          <Text style={styles.primaryBtnText}>Log In</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialBtn} onPress={handleOAuthLogin}>
          <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
          <Text style={styles.socialBtnText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialBtn} onPress={handleOAuthLogin}>
          <Ionicons name="logo-apple" size={20} color={Colors.textPrimary} />
          <Text style={styles.socialBtnText}>Apple</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSignup = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="mail" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Min 6 characters"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="next"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={Colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="done"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={Colors.textPrimary} />
        ) : (
          <Text style={styles.primaryBtnText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By signing up, you agree to our Terms of Service and Privacy Policy
      </Text>
    </>
  );

  const renderForgot = () => (
    <>
      {resetStep === "done" ? (
        <View style={styles.resetSentCard}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          <Text style={styles.resetSentTitle}>Password Reset!</Text>
          <Text style={styles.resetSentDesc}>
            Your password has been updated successfully. You can now log in with your new password.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => { setMode("login"); setResetSent(false); setResetStep("email"); }}>
            <Text style={styles.primaryBtnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      ) : resetStep === "code" ? (
        <>
          <Text style={styles.forgotDesc}>
            Enter the 6-digit code we sent to {email} and your new password.
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reset Code</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor={Colors.textMuted}
                value={resetCode}
                onChangeText={setResetCode}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="next"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={Colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                returnKeyType="done"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyResetCode} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>Reset Password</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 12 }}>
            <Text style={styles.forgotText}>Resend Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.forgotDesc}>
            Enter your email address and we'll send you a code to reset your password.
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleForgotPassword} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>Send Reset Code</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {mode !== "login" && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setMode("login"); setResetSent(false); }}
              >
                <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="globe" size={40} color={Colors.secondary} />
            </View>
            <BrandName size="xl" showTagline={mode === "login"} animated animationDelay={200} glow pulsingGlow />
            {mode !== "login" && (
              <Text style={styles.tagline}>
                {mode === "signup" && "Create your account and start your journey."}
                {mode === "forgot" && "Reset Your Password"}
              </Text>
            )}
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {mode === "login" && renderLogin()}
            {mode === "signup" && renderSignup()}
            {mode === "forgot" && renderForgot()}
          </View>

          {/* Footer Toggle */}
          {mode !== "forgot" && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              </Text>
              <TouchableOpacity onPress={() => mode === "login" ? router.replace("/signup") : setMode("login")}>
                <Text style={styles.footerLink}>
                  {mode === "login" ? "Sign Up" : "Log In"}
                </Text>
              </TouchableOpacity>
            </View>
          )}


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  header: {
    height: 44,
    justifyContent: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.glowBorder,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  aiScript: {
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: FontSize.xl,
    color: "#FFFFFF",
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingVertical: 14,
  },
  forgotText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: "600",
    textAlign: "right",
  },
  primaryBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  termsText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
  },
  forgotDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  resetSentCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  resetSentTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  resetSentDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.secondary,
  },
  skipBtn: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
