import React, { useState, useRef, useEffect } from "react";
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
  Image,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
// ImagePicker imported conditionally to avoid web crash with createPermissionHook
let ImagePicker: any = null;
if (Platform.OS !== "web") {
  ImagePicker = require("expo-image-picker");
}
import { trpc, vanillaClient } from "@/lib/trpc";
import * as Auth from "@/lib/_core/auth";
import { setCurrentUserId, UserStorage, MIGRATABLE_KEYS } from "@/lib/user-storage";
import { BrandNameInline } from "@/components/brand-name";

type SignupStep = "info" | "verify" | "username" | "photo" | "bio" | "tos";

const AVATAR_OPTIONS = [
  { id: "1", emoji: "🌍", color: "#0a7ea4" },
  { id: "2", emoji: "🎵", color: "#7c3aed" },
  { id: "3", emoji: "📚", color: "#059669" },
  { id: "4", emoji: "🎯", color: "#dc2626" },
  { id: "5", emoji: "✨", color: "#d97706" },
  { id: "6", emoji: "🚀", color: "#2563eb" },
];

export default function SignupScreen() {
  const [step, setStep] = useState<SignupStep>("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [agreedToTos, setAgreedToTos] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralAffiliate, setReferralAffiliate] = useState<string | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  
  // Animated logo - continuous floating + glow pulse
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  const logoTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const logoScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const sendVerification = trpc.emailAuth.sendVerification.useMutation();
  const verifyCode = trpc.emailAuth.verifyCode.useMutation();
  const registerUsername = trpc.emailAuth.registerUsername.useMutation();
  
  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);
  
  // Referral code validation
  // Check for 30-day referral cookie on mount (web only)
  useEffect(() => {
    if (Platform.OS === "web") {
      (async () => {
        try {
          const resp = await fetch("/api/referral-cookie", { credentials: "include" });
          const data = await resp.json();
          if (data.refCode && !referralCode) {
            setReferralCode(data.refCode);
          }
        } catch { /* no cookie or not on web */ }
      })();
    }
  }, []);

  useEffect(() => {
    if (referralCode.length < 3) {
      setReferralValid(null);
      setReferralAffiliate(null);
      return;
    }
    setCheckingReferral(true);
    const timer = setTimeout(async () => {
      try {
        const result = await vanillaClient.affiliate.validateCode.query({ code: referralCode.toUpperCase() });
        setReferralValid(result.valid);
        setReferralAffiliate(result.affiliateName || null);
      } catch {
        setReferralValid(null);
      }
      setCheckingReferral(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [referralCode]);

  // Username debounce check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      // Simple client-side validation for now
      const normalized = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
      setUsernameAvailable(normalized.length >= 3);
      setCheckingUsername(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);
  
  const handleSendCode = async () => {
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
    
    try {
      // TODO: Re-enable email verification once Resend domain is verified
      // await sendVerification.mutateAsync({ email, name, password });
      // setStep("verify");
      // setResendTimer(60);
      
      // BYPASS: Skip email verification, go straight to username step
      await new Promise((r) => setTimeout(r, 500)); // Brief loading feel
      setStep("username");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to proceed.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCodeDigitChange = (index: number, value: string) => {
    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);
    
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits filled
    const fullCode = newDigits.join("");
    if (fullCode.length === 6) {
      handleVerifyCode(fullCode);
    }
  };
  
  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !codeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || codeDigits.join("");
    if (codeToVerify.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code.");
      return;
    }
    
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    
    try {
      const result = await verifyCode.mutateAsync({ email, code: codeToVerify });
      if (result.success) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep("username");
      } else {
        Alert.alert("Verification Failed", result.error || "Invalid code.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await sendVerification.mutateAsync({ email, name, password });
      setResendTimer(60);
      setCodeDigits(["", "", "", "", "", ""]);
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleUsernameNext = async () => {
    if (username.length < 3) {
      Alert.alert("Invalid Username", "Username must be at least 3 characters.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("photo");
  };
  
  const handlePickPhoto = async () => {
    if (Platform.OS === "web") {
      // On web, use file input fallback
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setProfilePhoto(url);
          setSelectedAvatar(null);
        }
      };
      input.click();
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
      setSelectedAvatar(null);
    }
  };
  
  const handleSelectAvatar = (id: string) => {
    setSelectedAvatar(id);
    setProfilePhoto(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePhotoNext = () => {
    setStep("bio");
  };
  
  const handleBioNext = () => {
    setStep("tos");
  };
  
  const handleComplete = async () => {
    // Age check
    const year = parseInt(birthYear);
    const currentYear = new Date().getFullYear();
    if (!birthYear || year > currentYear - 13 || year < 1900) {
      Alert.alert("Age Requirement", "You must be at least 13 years old to use ConnectWorld AI.");
      return;
    }
    if (!agreedToTos) {
      Alert.alert("Terms Required", "Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    
    try {
      // Save user data locally
      const userData = {
        email,
        name,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        profilePhoto: profilePhoto || null,
        selectedAvatar: selectedAvatar || null,
        bio: bio.trim(),
        birthYear: parseInt(birthYear),
        createdAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem("@auth_user", JSON.stringify(userData));
      await AsyncStorage.setItem("@auth_logged_in", "true");
      
      // Save referral code and record referral attribution
      const finalReferralCode = referralCode.trim().toUpperCase();
      if (finalReferralCode) {
        await AsyncStorage.setItem("@signup_referral_code", finalReferralCode);
        // Record referral in DB for attribution tracking
        try {
          await vanillaClient.affiliate.recordReferral.mutate({
            referralCode: finalReferralCode,
            referredUserId: Date.now(),
            source: Platform.OS === "web" ? "web_signup" : "mobile_signup",
          });
        } catch { /* Non-critical - attribution still saved locally */ }
      }
      await AsyncStorage.setItem("@user_username", userData.username);
      if (profilePhoto) {
        await AsyncStorage.setItem("@user_profile_photo", profilePhoto);
      }
      if (selectedAvatar) {
        await AsyncStorage.setItem("@user_avatar", selectedAvatar);
      }
      
      // Also save in the format that useAuth() reads (SecureStore/localStorage)
      const userId = `local_${userData.username}`;
      await Auth.setUserInfo({
        id: Date.now(),
        openId: userId,
        name: userData.name,
        email: userData.email,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Store credentials for login validation
      await AsyncStorage.setItem(`@credentials_${email.toLowerCase()}`, JSON.stringify({
        password,
        name: userData.name,
        username: userData.username,
        createdAt: userData.createdAt,
      }));

      // Set user-scoped storage
      await setCurrentUserId(userId);
      await UserStorage.migrateGlobalToUser(MIGRATABLE_KEYS);
      
      setLoading(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to onboarding
      router.replace("/onboarding");
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Error", "Failed to create account. Please try again.");
    }
  };
  
  const renderInfoStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        {/* Animated Logo */}
        <View style={styles.logoGlowContainer}>
          <Animated.View style={[styles.logoGlowRing, { opacity: glowOpacity }]} />
          <Animated.Image
            source={require("../assets/images/icon.png")}
            style={[styles.logoImage, { transform: [{ translateY: logoTranslateY }, { scale: logoScale }] }]}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join <BrandNameInline aiColor="#FFFFFF" glow /></Text>
        <Text style={[styles.subtitle, { marginTop: 2, fontWeight: '400' }]}>Learn And Hear The World Your Way!</Text>
        <View style={styles.brandAccentLine} />
      </View>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#00AAFF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#4A7A9B"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#00AAFF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#4A7A9B"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#00AAFF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password (6+ characters)"
            placeholderTextColor="#4A7A9B"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="next"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#5B8DB8" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#00AAFF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#4A7A9B"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            returnKeyType="done"
          />
        </View>
      </View>
      
      <TouchableOpacity
        style={[styles.primaryBtn, (!name || !email || !password || !confirmPassword) && styles.btnDisabled]}
        onPress={handleSendCode}
        disabled={loading || !name || !email || !password || !confirmPassword}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Continue</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.loginLink}>
        <Text style={styles.loginLinkText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.loginLinkAction}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderVerifyStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail" size={32} color="#00AAFF" />
        </View>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{"\n"}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>
      </View>
      
      <View style={styles.codeContainer}>
        {codeDigits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { codeInputRefs.current[index] = ref; }}
            style={[styles.codeInput, digit && styles.codeInputFilled]}
            value={digit}
            onChangeText={(value) => handleCodeDigitChange(index, value.replace(/[^0-9]/g, "").slice(-1))}
            onKeyPress={({ nativeEvent }) => handleCodeKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>
      
      <TouchableOpacity
        style={[styles.primaryBtn, codeDigits.join("").length !== 6 && styles.btnDisabled]}
        onPress={() => handleVerifyCode()}
        disabled={loading || codeDigits.join("").length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Verify</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleResendCode} disabled={resendTimer > 0} style={styles.resendBtn}>
        <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend Code"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setStep("info")} style={styles.backLink}>
        <Ionicons name="arrow-back" size={16} color="#5B8DB8" />
        <Text style={styles.backLinkText}>Change email</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderUsernameStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Choose a Username</Text>
        <Text style={styles.subtitle}>This is how others will find and connect with you</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.atSymbol}>@</Text>
        <TextInput
          style={[styles.input, { paddingLeft: 4 }]}
          placeholder="username"
          placeholderTextColor="#4A7A9B"
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          returnKeyType="done"
        />
        {checkingUsername && <ActivityIndicator size="small" color="#0a7ea4" style={styles.usernameStatus} />}
        {!checkingUsername && usernameAvailable === true && (
          <Ionicons name="checkmark-circle" size={20} color="#22C55E" style={styles.usernameStatus} />
        )}
        {!checkingUsername && usernameAvailable === false && (
          <Ionicons name="close-circle" size={20} color="#EF4444" style={styles.usernameStatus} />
        )}
      </View>
      
      {username.length > 0 && username.length < 3 && (
        <Text style={styles.hintText}>Username must be at least 3 characters</Text>
      )}
      
      <TouchableOpacity
        style={[styles.primaryBtn, (username.length < 3 || usernameAvailable === false) && styles.btnDisabled]}
        onPress={handleUsernameNext}
        disabled={username.length < 3 || usernameAvailable === false}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderPhotoStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Add a Profile Photo</Text>
        <Text style={styles.subtitle}>Help others recognize you — pick a photo or choose an avatar</Text>
      </View>
      
      <TouchableOpacity style={styles.photoPickerCircle} onPress={handlePickPhoto}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
        ) : selectedAvatar ? (
          <View style={[styles.avatarPreview, { backgroundColor: AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.color || "#0a7ea4" }]}>
            <Text style={styles.avatarEmoji}>{AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.emoji}</Text>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={32} color="#9BA1A6" />
            <Text style={styles.photoPlaceholderText}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Text style={styles.orText}>or choose an avatar</Text>
      
      <View style={styles.avatarGrid}>
        {AVATAR_OPTIONS.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={[
              styles.avatarOption,
              { backgroundColor: avatar.color },
              selectedAvatar === avatar.id && styles.avatarSelected,
            ]}
            onPress={() => handleSelectAvatar(avatar.id)}
          >
            <Text style={styles.avatarOptionEmoji}>{avatar.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity style={styles.primaryBtn} onPress={handlePhotoNext}>
        <Text style={styles.primaryBtnText}>
          {profilePhoto || selectedAvatar ? "Continue" : "Skip for Now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderBioStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>About You</Text>
        <Text style={styles.subtitle}>Tell others a bit about yourself and your language goals</Text>
      </View>
      
      <View style={styles.bioContainer}>
        <TextInput
          style={styles.bioInput}
          placeholder="e.g., Learning Spanish to connect with my family's roots 🇲🇽"
          placeholderTextColor="#4A7A9B"
          value={bio}
          onChangeText={(text) => setBio(text.slice(0, 150))}
          multiline
          maxLength={150}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/150</Text>
      </View>
      
      <TouchableOpacity style={styles.primaryBtn} onPress={handleBioNext}>
        <Text style={styles.primaryBtnText}>{bio.trim() ? "Continue" : "Skip for Now"}</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderTosStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Almost There!</Text>
        <Text style={styles.subtitle}>Just a couple more things to get you started</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Ionicons name="calendar-outline" size={20} color="#FFB800" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Birth Year (e.g., 1995)"
          placeholderTextColor="#4A7A9B"
          value={birthYear}
          onChangeText={(text) => setBirthYear(text.replace(/[^0-9]/g, "").slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          returnKeyType="done"
        />
      </View>
      <Text style={styles.hintText}>You must be 13+ to use ConnectWorld AI</Text>
      
      <View style={styles.inputContainer}>
        <Ionicons name="gift-outline" size={20} color="#FFB800" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Referral Code (optional)"
          placeholderTextColor="#4A7A9B"
          value={referralCode}
          onChangeText={(text) => setReferralCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          autoCapitalize="characters"
          returnKeyType="done"
          maxLength={20}
        />
        {checkingReferral && <ActivityIndicator size="small" color="#0a7ea4" />}
        {referralValid === true && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
        {referralValid === false && <Ionicons name="close-circle" size={20} color="#EF4444" />}
      </View>
      {referralValid === true && referralAffiliate && (
        <Text style={[styles.hintText, { color: "#22C55E", marginTop: -4, marginBottom: 12 }]}>
          Referred by {referralAffiliate}
        </Text>
      )}
      {referralValid === false && (
        <Text style={[styles.hintText, { color: "#EF4444", marginTop: -4, marginBottom: 12 }]}>
          Invalid referral code
        </Text>
      )}
      
      <TouchableOpacity
        style={styles.tosRow}
        onPress={() => {
          setAgreedToTos(!agreedToTos);
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <View style={[styles.checkbox, agreedToTos && styles.checkboxChecked]}>
          {agreedToTos && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={styles.tosText}>
          I agree to the{" "}
          <Text style={styles.tosLink} onPress={() => router.push("/terms-of-service" as any)}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text style={styles.tosLink} onPress={() => router.push("/privacy-policy" as any)}>
            Privacy Policy
          </Text>
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.primaryBtn, (!agreedToTos || !birthYear) && styles.btnDisabled]}
        onPress={handleComplete}
        disabled={loading || !agreedToTos || !birthYear}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Create Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );
  
  const renderStep = () => {
    switch (step) {
      case "info": return renderInfoStep();
      case "verify": return renderVerifyStep();
      case "username": return renderUsernameStep();
      case "photo": return renderPhotoStep();
      case "bio": return renderBioStep();
      case "tos": return renderTosStep();
    }
  };
  
  // Progress indicator
  const steps: SignupStep[] = ["info", "verify", "username", "photo", "bio", "tos"];
  const currentIndex = steps.indexOf(step);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Progress bar */}
        <View style={styles.progressBar}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= currentIndex && styles.progressDotActive,
                i < currentIndex && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040810",
  },
  keyboardView: {
    flex: 1,
  },
  logoGlowContainer: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: 140,
    height: 140,
  },
  logoGlowRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 30,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#00AAFF",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 26,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  progressBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0, 170, 255, 0.15)",
  },
  progressDotActive: {
    backgroundColor: "#00AAFF",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  progressDotCompleted: {
    backgroundColor: "#FFB800",
    shadowColor: "#FFB800",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 12,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandAccentLine: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginTop: 12,
    backgroundColor: "#FFB800",
    shadowColor: "#FFB800",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(0, 170, 255, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 170, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F0F6FF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#5B8DB8",
    textAlign: "center",
    lineHeight: 22,
  },
  aiScript: {
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: 16,
    color: "#FFFFFF",
  },
  emailHighlight: {
    color: "#00AAFF",
    fontWeight: "600",
  },
  inputGroup: {
    gap: 14,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 22, 40, 0.8)",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
    borderColor: "rgba(0, 170, 255, 0.2)",
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#F0F6FF",
    fontSize: 16,
    height: "100%",
  },
  eyeBtn: {
    padding: 8,
  },
  atSymbol: {
    color: "#00AAFF",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 4,
  },
  usernameStatus: {
    marginLeft: 8,
  },
  primaryBtn: {
    backgroundColor: "#00AAFF",
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginLinkText: {
    color: "#5B8DB8",
    fontSize: 14,
  },
  loginLinkAction: {
    color: "#FFB800",
    fontSize: 14,
    fontWeight: "700",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  codeInput: {
    width: 46,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(10, 22, 40, 0.8)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 170, 255, 0.2)",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#F0F6FF",
  },
  codeInputFilled: {
    borderColor: "#00AAFF",
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  resendBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  resendText: {
    color: "#FFB800",
    fontSize: 14,
    fontWeight: "600",
  },
  resendDisabled: {
    color: "#5B8DB8",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 4,
  },
  backLinkText: {
    color: "#5B8DB8",
    fontSize: 14,
  },
  hintText: {
    color: "#5B8DB8",
    fontSize: 12,
    marginTop: -4,
    marginBottom: 12,
    paddingLeft: 4,
  },
  photoPickerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  avatarPreview: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 48,
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(10, 22, 40, 0.8)",
    borderWidth: 2,
    borderColor: "rgba(0, 170, 255, 0.3)",
    borderStyle: "dashed",
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    color: "#5B8DB8",
    fontSize: 12,
    marginTop: 4,
  },
  orText: {
    color: "#5B8DB8",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarSelected: {
    borderColor: "#fff",
    transform: [{ scale: 1.1 }],
  },
  avatarOptionEmoji: {
    fontSize: 24,
  },
  bioContainer: {
    marginBottom: 24,
  },
  bioInput: {
    backgroundColor: "rgba(10, 22, 40, 0.8)",
    borderRadius: 14,
    padding: 16,
    color: "#F0F6FF",
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: "rgba(0, 170, 255, 0.2)",
    lineHeight: 22,
  },
  charCount: {
    color: "#5B8DB8",
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },
  tosRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    marginTop: 16,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(0, 170, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#00AAFF",
    borderColor: "#00AAFF",
    shadowColor: "#00AAFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tosText: {
    flex: 1,
    color: "#5B8DB8",
    fontSize: 14,
    lineHeight: 20,
  },
  tosLink: {
    color: "#FFB800",
    fontWeight: "600",
  },
});
