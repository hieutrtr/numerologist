import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumerologyCard } from '../components/cards/NumerologyCard';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, FontSizes } from '../utils/colors';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const mockNumerologyData = [
    {
      number: 7,
      type: 'lifePath' as const,
      title: 'Số Mệnh',
      subtitle: 'Life Path',
      meaning: 'Con đường cuộc đời',
    },
    {
      number: 5,
      type: 'destiny' as const,
      title: 'Số Định Mệnh',
      subtitle: 'Destiny',
      meaning: 'Sứ mệnh của bạn',
    },
    {
      number: 3,
      type: 'soul' as const,
      title: 'Số Linh Hồn',
      subtitle: 'Soul Urge',
      meaning: 'Khao khát nội tâm',
    },
    {
      number: 9,
      type: 'personality' as const,
      title: 'Số Tính Cách',
      subtitle: 'Personality',
      meaning: 'Ấn tượng bên ngoài',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.name}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.phone}>{user?.phoneNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hồ sơ Thần số học</Text>
          <View style={styles.cardsGrid}>
            {mockNumerologyData.map((card, index) => (
              <NumerologyCard
                key={index}
                {...card}
                animateOnMount={true}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.logoutButton}
            onPress={logout}
          >
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },
  header: {
    padding: Spacing.xxl,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  name: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  phone: {
    fontSize: FontSizes.md,
    color: Colors.grey,
  },
  section: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
