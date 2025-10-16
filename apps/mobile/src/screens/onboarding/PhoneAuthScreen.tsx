import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, FontSizes } from '../../utils/colors';
import { PHONE_REGEX } from '../../utils/constants';

type PhoneAuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PhoneAuth'>;

export const PhoneAuthScreen: React.FC = () => {
  const navigation = useNavigation<PhoneAuthScreenNavigationProp>();
  const { login } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('+84');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!PHONE_REGEX.test(phoneNumber)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return;
    }

    setLoading(true);
    // TODO: Implement Azure AD B2C OTP send
    setTimeout(() => {
      setShowOtp(true);
      setLoading(false);
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến số điện thoại của bạn');
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 số');
      return;
    }

    setLoading(true);
    try {
      await login(phoneNumber, otp);
      // Navigation will be handled automatically by RootNavigator
    } catch (error) {
      Alert.alert('Lỗi', 'Xác thực thất bại. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Nhập số điện thoại của bạn</Text>

        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+84xxxxxxxxx"
          keyboardType="phone-pad"
          editable={!showOtp}
        />

        {showOtp && (
          <>
            <Text style={styles.label}>Nhập mã OTP</Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
            />
          </>
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={showOtp ? handleVerifyOtp : handleSendOtp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Đang xử lý...' : showOtp ? 'Xác thực' : 'Gửi mã OTP'}
          </Text>
        </Pressable>

        {showOtp && (
          <Pressable onPress={() => setShowOtp(false)}>
            <Text style={styles.linkText}>Gửi lại mã</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    padding: Spacing.xxl,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.grey,
    marginBottom: Spacing.xxl,
  },
  label: {
    fontSize: FontSizes.md,
    color: Colors.black,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGrey,
    borderRadius: 12,
    padding: Spacing.lg,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.lg,
  },
  button: {
    backgroundColor: Colors.primaryPurple,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  linkText: {
    color: Colors.primaryPurple,
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
