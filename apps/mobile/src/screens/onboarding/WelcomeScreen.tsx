import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { Colors, Spacing, FontSizes } from '../../utils/colors';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🪷</Text>
        <Text style={styles.title}>Numeroly</Text>
        <Text style={styles.tagline}>Khám phá bản thân qua thần số học</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('PhoneAuth')}
        >
          <Text style={styles.buttonText}>Bắt đầu</Text>
        </Pressable>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  logo: {
    fontSize: 100,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primaryPurple,
    marginBottom: Spacing.md,
  },
  tagline: {
    fontSize: FontSizes.lg,
    color: Colors.grey,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.xxl,
  },
  button: {
    backgroundColor: Colors.primaryPurple,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
});
