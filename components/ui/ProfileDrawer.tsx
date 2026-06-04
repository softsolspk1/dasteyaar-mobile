import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Title, Text, Avatar, List, Button, Divider, useTheme, IconButton, Dialog, Portal, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getThemeColors } from '../../constants/theme';
import { useColorScheme } from 'react-native';

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ visible, onClose }: ProfileDrawerProps) {
  const { height } = useWindowDimensions();
  const router = useRouter();
  const { doctor, logout, refreshDoctor } = useAuth();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const theme = useTheme();
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [editName, setEditName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editSpecialty, setEditSpecialty] = React.useState('');

  if (!visible) return null;

  const handleProfilePhotoPress = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto
        },
        {
          text: 'Choose from Gallery',
          onPress: handlePickImage
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      await api.put('/doctors/me/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Profile photo updated successfully');
      await refreshDoctor();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to upload photo';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleEditProfile = () => {
    setEditName(doctor?.name || '');
    setEditPhone(doctor?.phone || '');
    setEditSpecialty(doctor?.specialty || '');
    setShowEditProfileDialog(true);
  };

  const submitProfileEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      await api.put('/doctors/me', {
        name: editName.trim(),
        phone: editPhone.trim(),
        specialty: editSpecialty.trim(),
      });

      Alert.alert('Success', 'Profile updated successfully');
      setShowEditProfileDialog(false);
      await refreshDoctor();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordDialog(true);
  };

  const submitPasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await api.put('/doctors/me/password', {
        newPassword: newPassword
      });

      Alert.alert('Success', 'Password changed successfully');
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DR';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={[styles.overlay, { height }]}>
      <TouchableOpacity style={styles.dismiss} onPress={onClose} />
      <View style={[styles.drawer, { backgroundColor: colors.surface }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
          <ScrollView style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
              <TouchableOpacity onPress={handleProfilePhotoPress}>
                <View>
                  {doctor?.profile_photo ? (
                    <Avatar.Image
                      size={80}
                      source={{ uri: doctor.profile_photo }}
                      style={styles.avatar}
                    />
                  ) : (
                    <Avatar.Text
                      size={80}
                      label={getInitials(doctor?.name)}
                      style={styles.avatar}
                    />
                  )}
                  <IconButton
                    icon="camera"
                    size={20}
                    iconColor="#fff"
                    style={styles.cameraIcon}
                    containerColor={colors.primary}
                  />
                </View>
              </TouchableOpacity>
              <Title style={styles.name}>{doctor?.name || 'Doctor'}</Title>
              <Text style={styles.email}>{doctor?.email}</Text>
              <Button
                mode="outlined"
                onPress={handleEditProfile}
                style={styles.editButton}
                textColor="#fff"
                icon="pencil"
              >
                Edit Profile
              </Button>
            </View>

            {/* Profile Info Card */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Title style={{ color: colors.text }}>Profile Information</Title>
              <List.Item
                title="Name"
                description={doctor?.name}
                left={props => <List.Icon {...props} icon="account" />}
              />
              <Divider />
              <List.Item
                title="Email"
                description={doctor?.email}
                left={props => <List.Icon {...props} icon="email" />}
              />
              <Divider />
              <List.Item
                title="Phone"
                description={doctor?.phone || 'Not set'}
                left={props => <List.Icon {...props} icon="phone" />}
              />
              <Divider />
              <List.Item
                title="Specialty"
                description={doctor?.specialty || 'General Physician'}
                left={props => <List.Icon {...props} icon="stethoscope" />}
              />
            </View>

            {/* Settings Card */}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Title style={{ color: colors.text }}>Settings</Title>
              <List.Item
                title="Change Password"
                left={props => <List.Icon {...props} icon="lock" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleChangePassword}
              />
            </View>

            {/* Logout Button */}
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              buttonColor={theme.colors.error}
              icon="logout"
            >
              Logout
            </Button>

            {/* Edit Profile Dialog */}
            <Portal>
              <Dialog visible={showEditProfileDialog} onDismiss={() => setShowEditProfileDialog(false)} style={{ backgroundColor: colors.surface }}>
                <Dialog.Title style={{ color: colors.text }}>Edit Profile</Dialog.Title>
                <Dialog.Content>
                  <TextInput
                    label="Name"
                    value={editName}
                    onChangeText={setEditName}
                    mode="outlined"
                    style={{ marginBottom: 12, backgroundColor: colors.surface }}
                    textColor={colors.text}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                  <TextInput
                    label="Phone"
                    value={editPhone}
                    onChangeText={setEditPhone}
                    mode="outlined"
                    keyboardType="phone-pad"
                    style={{ marginBottom: 12, backgroundColor: colors.surface }}
                    textColor={colors.text}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                  <TextInput
                    label="Specialty"
                    value={editSpecialty}
                    onChangeText={setEditSpecialty}
                    mode="outlined"
                    style={{ backgroundColor: colors.surface }}
                    textColor={colors.text}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowEditProfileDialog(false)} textColor={colors.text}>Cancel</Button>
                  <Button onPress={submitProfileEdit} buttonColor={colors.primary} textColor={colors.text}>Save</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>

            {/* Change Password Dialog */}
            <Portal>
              <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)} style={{ backgroundColor: colors.surface }}>
                <Dialog.Title style={{ color: colors.text }}>Change Password</Dialog.Title>
                <Dialog.Content>
                  <TextInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    mode="outlined"
                    secureTextEntry
                    style={{ marginBottom: 12, backgroundColor: colors.surface }}
                    textColor={colors.text}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    secureTextEntry
                    style={{ backgroundColor: colors.surface }}
                    textColor={colors.text}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowPasswordDialog(false)} textColor={colors.text}>Cancel</Button>
                  <Button onPress={submitPasswordChange} buttonColor={colors.primary} textColor={colors.text}>Save</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  dismiss: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 400,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  avatar: {
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4
  },
  email: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 16
  },
  editButton: {
    borderColor: '#fff',
    borderWidth: 1
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 4
  },
  statsTitle: {
    fontSize: 18,
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4
  },
  logoutButton: {
    margin: 16,
    marginTop: 8,
    marginBottom: 64,
  }
});