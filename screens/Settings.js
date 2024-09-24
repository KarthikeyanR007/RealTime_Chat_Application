import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingViewBase,
  SafeAreaView,
  Platform,
  Alert,
  Modal,
  Button,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DocumentPicker from 'react-native-document-picker';
import storage from '@react-native-firebase/storage';
import {useSelector} from 'react-redux';
const avtImg = require('../assets/defImg.jpg');

const ProfileScreen = () => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('Dwayne');
  const [status, setStatus] = useState('Busy');
  const [phone, setPhone] = useState('+1 123-456-7890');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const user = useSelector((state) => state.user.user);
  const [modalVisible, setModalVisible] = useState(false);


  const uploadFile = async () => {
    try {
      // Pick a file using Document Picker
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images],
      });

      // Set uploading to true
      setUploading(true);

      // Get the file URI and create a reference to Firebase Storage
      const fileUri =
        Platform.OS === 'ios' ? res.uri.replace('file://', '') : res.uri;
      const fileName = res.name;
      const reference = storage().ref(fileName);

      // Upload the file
      const task = reference.putFile(fileUri);

      // Monitor the upload progress
      task.on('state_changed', snapshot => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        );
        setProgress(progress);
      });

      // Handle completion
      await task;

      // Get the download URL of the uploaded image
      const url = await reference.getDownloadURL();
      setImageUrl(url);

      // Fetch the user document based on email
      const userQuerySnapshot = await firestore()
        .collection('user')
        .where('email', '==', user)
        .get();

      if (userQuerySnapshot.empty) {
        Alert.alert('Upload Failed', 'No matching user found.');
        return;
      }

      // Update the document for each matching user
      userQuerySnapshot.forEach(async doc => {
        await firestore().collection('user')
          .doc(users[0].id)
          .update({
            imageUrl: url,
          });
      });

      Alert.alert('Upload Successful', `File ${fileName} uploaded and URL saved!`);
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await firestore()
          .collection('user')
          .where('email', '==', user)
          .get();

        if (snapshot.empty) {
          console.log('No matching documents.');
          return;
        }

        let usersList = [];
        snapshot.forEach(doc => {
          usersList.push({id: doc.id, ...doc.data()});
        });
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [user]);

  const handleAbout = async () => {
  try {
    const snapshot = await firestore()
      .collection('user')
      .where('email', '==', user) // Ensure `user` is defined and valid
      .get();

    if (snapshot.empty) {
      console.log('No matching documents.');
      return;
    }
    
    const batch = firestore().batch();
    
    snapshot.forEach((doc) => {
      console.log(`Updating document ID: ${doc.id}`); // Log document ID being updated
      const docRef = firestore().collection('user').doc(doc.id);
      batch.update(docRef, {
        about: status, // Ensure `status` is defined and contains the new value
      });
    });

    await batch.commit();
    console.log('Fields updated successfully!');
  } catch (error) {
    console.error('Error updating fields:', error);
  }

  setModalVisible(false);
};

  if(users){
    console.log('users...',users);
  }


  const handleTextInputFocus = () => {
    setModalVisible(true);
    setStatus(users.length > 0 ? users[0].about : '');

  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Profile Image */}
     <SafeAreaView style={styles.form}>

      {/* Name Section */}
       {users.map(user => (
        <View style={{marginBottom:60}} key={user.id}>
          <View style={styles.imageContainer}>
            {uploading ? (
                  <Text style={{ textAlign: 'center', marginTop: 20,color:'white' }}>{progress}%</Text>
                ) : (
                  user.imageUrl ? (
                    <Image
                      style={styles.profileImage}
                      source={{ uri: user.imageUrl }}
                    />
                  ) : (
                    <Image
                      style={styles.profileImage}
                      source={avtImg}
                    />
                  )
                )}
                {/* <Image source={{ uri: profileImage }} style={styles.profileImage} /> */}
                <TouchableOpacity onPress={uploadFile} style={styles.cameraIcon}>
                <Icon name="camera-alt" size={24} color="white" />
                </TouchableOpacity>
          </View>

          <View  style={styles.section}>
                <Icon name="person" size={24} color="#25D366" />
                <View style={styles.textSection}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={user.username}
                    onChangeText={(text) => setName(text)}
                    editable={true}
                />
                </View>
          </View>

            {/* About Section */}
            <View style={styles.section}>
                <Icon name="info" size={24} color="#25D366" />
                <View style={styles.textSection}>
                <Text style={styles.label}>About</Text>
                <TextInput
                    style={styles.input}
                    value={user.about}
                    onChangeText={(text) => setStatus(text)}
                    editable={true}
                    onFocus={handleTextInputFocus}
                />
                </View>
            </View>

            {/* Phone Section */}
            <View style={styles.section}>
                <Icon name="mail" size={24} color="#25D366" />
                <View style={styles.textSection}>
                <Text style={styles.label}>Mail</Text>
                <TextInput
                    style={styles.input}
                    value={user.email}
                    onChangeText={(text) => setPhone(text)}
                    editable={true}
                />
                </View>
            </View>
        </View>
       ))}
       <View >
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalView}>
                <Text>Add About</Text>
                <TextInput
                    style={styles.input}
                    value={status}
                    onChangeText={(text) => setStatus(text)}
                    editable={true}
                    onFocus={handleTextInputFocus}
                />
                <View style={styles.modalButton}>
                  <TouchableOpacity onPress={closeModal}><Text style={styles.modalText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleAbout}><Text style={styles.modalText}>Save</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
       </View>
      </SafeAreaView>
      <StatusBar barStyle="light-content" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#141921',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth:1,
    borderColor:'black',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 10,
    right: 85,
    backgroundColor: '#25D366',
    borderRadius: 20,
    padding: 5,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  textSection: {
    marginLeft: 15,
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color:'white',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
    paddingVertical: 5,
    color:'white',
  },
  helperText: {
    fontSize: 12,
    color: 'gray',
    marginTop: 5,
  },
  form: {
      flex: 1,
    //   justifyContent: 'center',
      marginHorizontal: 20,
      marginBottom:60,
      backgroundColor:'#141921',
    },
    modalView: {
      margin: 20,
      backgroundColor: '#141921',
      borderRadius: 0,
      padding: 35,
      //alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      // alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalButton:{
      flexDirection:'row',
      justifyContent:'flex-end',
      marginTop:10,
    },
    modalText:{
      marginLeft:20,
    },
});

export default ProfileScreen;
