import {
  View,
  TouchableOpacity,
  Alert,
  Text,
  Platform,
  StyleSheet,
  Modal,
  PermissionsAndroid,
} from 'react-native';
import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import storage from '@react-native-firebase/storage';

export default function PrtChat({ route }) {
  const { ChatId, userName } = route.params;
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [users, setUsers] = useState([]);
  const [matchedDocs, setMatchedDocs] = useState([]);
  const [sentImages, setSentImages] = useState(new Set());
  const navigation = useNavigation();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const usermain = useSelector(state => state.user.user);
  const [docIdToUse, setDocIdToUse] = useState(null); // New state to hold the docId to use for Firestore
  const [modalVisible,setModalVisible] = useState(false);
    useEffect(() => {
    navigation.setOptions({
     title: userName === '' ? 'No title' : userName,
    });
  }, [navigation, userName]);


  const signOut = async () => {
    try {
      await auth().signOut();
      console.log('User signed out!');
      await AsyncStorage.removeItem('@user_token');
    } catch (error) {
      console.error('Sign out error:', error.message);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await firestore().collection('user').doc(ChatId).get();
        if (userDoc.exists) {
          setUserData(userDoc.data());
        } else {
          Alert.alert('No such user!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to fetch user data');
      }
    };

    fetchUserData();
  }, [ChatId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 10 }} onPress={signOut}>
          <Icon name="logout" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (userData) {
      const docId1 = `${usermain}_${userData.email}`;
      const docId2 = `${userData.email}_${usermain}`;

      const fetchDocuments = async () => {
        try {
          const snapshot = await firestore().collection('prtChats').get();
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Compare IDs
          const matched = docs.filter(doc => doc.id === docId1 || doc.id === docId2);
          setMatchedDocs(matched);
          console.log('docs ', matched);

          // Set the docIdToUse for Firestore subscription
          const ids = matched.map(item => item.id);
          const foundDocId = ids.find(id => id === docId1 || id === docId2);
          setDocIdToUse(foundDocId); // Save the found docId
        } catch (error) {
          console.error('Error fetching documents: ', error);
        }
      };

      fetchDocuments();
    }
  }, [usermain, userData]);

  // useEffect(()=>{
  //   if(userData){
  //     console.log('userdata ',userData.email);
  //     const  fetchImg = async() => {
  //         try{
  //           const snap = await firestore
  //                  .collection('user')
  //                  .where('email', '==', userData.email)
  //                  .get();

  //             if (snap.empty) {
  //                   console.log("No matching documents.");
  //                   return;
  //                 }
  //            let usersList = [];
  //            snap.forEach((doc) => {
  //              usersList.push({ id: doc.id, ...doc.data() });
  //            });
  //            setUsers(usersList);
  //         }catch(e){
  //           console.error("Error fetching users:", e);
  //         }
  //     };
  //     fetchImg();
  //   }
  // },[userData]);

  useEffect(() => {
  if (usermain) {
    console.log('userdata ', usermain);
    const fetchImg = async () => {
      try {
        const snap = await firestore()
          .collection('user')
          .where('email', '==', usermain)  // Use '==' for equality check
          .get();

        if (snap.empty) {
          console.log('No matching documents.');
          return;
        }

        const usersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    };

    fetchImg();
  }
}, [usermain]);

  useEffect(()=>{
    if(users){
      console.log('users.....',users);
    }
  },[users]);

  useLayoutEffect(() => {
    if (userData && docIdToUse) {
      const docRef = firestore().collection('prtChats').doc(docIdToUse);

      const unsubscribe = docRef.onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          const newMessages = data.messages || [];

          // Format messages and reverse order
          const formattedMessages = newMessages.map(msg => ({
            ...msg,
            createdAt: msg.createdAt.toDate(),
          })).reverse();

          setMessages(formattedMessages);
        } else {
          console.error('No such document!');
        }
      }, (error) => {
        console.error('Firestore query error:', error);
      });

      return unsubscribe;
    }
  }, [userData, usermain, docIdToUse]);

  const onSend = useCallback((messages = []) => {
    const { _id, text, user } = messages[0];
    console.log('id:',_id,' text:',text,' user :',user);
    // Update local state first
    setMessages(previousMessages => GiftedChat.append(previousMessages, messages));

    const docId = `${usermain}_${userData?.email || 'unknown'}`; // Fallback to 'unknown' if userData is not available

    // Create a new message with a temporary timestamp
    const newMessage = {
      _id,
      text,
      user,
      createdAt: new Date(), // Temporarily set a local timestamp
    };

    // Save the message to Firestore
    firestore().collection('prtChats').doc(docIdToUse || docId).set({
      messages: firestore.FieldValue.arrayUnion(newMessage),
    }, { merge: true }).then(() => {
      // After the document is created, update it with server timestamp
      return firestore().collection('prtChats').doc(docIdToUse || docId).update({
        'messages': firestore.FieldValue.arrayUnion({
          _id,
          createdAt: firestore.FieldValue.serverTimestamp(),
          text,
          user,
        }),
      });
    }).catch((error) => {
      console.error('Error adding document:', error);
    });
  }, [usermain, userData,docIdToUse]);

  const onSendImage = useCallback((messages = []) => {
    const { _id, image, user } = messages[0];
    console.log('id:',_id,' text:',image,' user :',user);
    // Update local state first
    setMessages(previousMessages => GiftedChat.append(previousMessages, messages));

    const docId = `${usermain}_${userData?.email || 'unknown'}`; // Fallback to 'unknown' if userData is not available

    // Create a new message with a temporary timestamp
    const newMessage = {
      _id,
      image,
      user,
      createdAt: new Date(), // Temporarily set a local timestamp
    };

    // Save the message to Firestore
    firestore().collection('prtChats').doc(docIdToUse || docId).set({
      messages: firestore.FieldValue.arrayUnion(newMessage),
    }, { merge: true }).then(() => {
      // After the document is created, update it with server timestamp
      return firestore().collection('prtChats').doc(docIdToUse || docId).update({
        'messages': firestore.FieldValue.arrayUnion({
          _id,
          createdAt: firestore.FieldValue.serverTimestamp(),
          image,
          user,
        }),
      });
    }).catch((error) => {
      console.error('Error adding document:', error);
    });
  }, [usermain, userData,docIdToUse]);


  //Image for storage
  const uploadFile = async () => {
    setModalVisible(false);
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
      if(imageUrl){
        console.log('Image Url', url);
        const newMessage = {
           _id: Date.now(), // Use timestamp as a unique ID
           // createdAt: new Date(),
           user: {
             _id: auth().currentUser?.email || 'anonymous',
             avatar: users[0]?.imageUrl ? users[0].imageUrl : 'https://i.pravatar.cc/300',
           },
           image: url,
         };
         onSendImage([newMessage]);
         setSentImages((prev) => new Set(prev).add(url));
      }

      Alert.alert('Image Send Successful');
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };


  //Video for storage
  const UploadVideo = () => {
    console.log('It is called');
  const requestStoragePermission = async () => {
    console.log('It is called requestStoragePermission');
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'This app needs access to your storage to upload videos',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const uploadVideo = async () => {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          Alert.alert('Permission denied', 'Cannot access storage');
          return;
        }

        const options = {
          mediaType: 'video',
        };

        launchImageLibrary(options, async (response) => {
          if (response.didCancel) {
            console.log('User cancelled video picker');
          } else if (response.error) {
            console.log('VideoPicker Error: ', response.error);
          } else if (response.assets && response.assets.length > 0) {
            const videoUri = response.assets[0].uri;

            // Get the video file name
            const fileName = response.assets[0].fileName || videoUri.substring(videoUri.lastIndexOf('/') + 1);

            // Create a reference to the location you want to upload the video
            const reference = storage().ref(`videos/${fileName}`);

            try {
              // Upload the video
              await reference.putFile(videoUri);

              // Optionally, get the download URL
              const downloadURL = await reference.getDownloadURL();
              console.log('Video uploaded successfully. Download URL: ', downloadURL);
              Alert.alert('Upload Success', `Video uploaded! URL: ${downloadURL}`);
            } catch (uploadError) {
              console.error('Upload failed: ', uploadError);
              Alert.alert('Upload Failed', 'There was an error uploading your video.');
            }
          }
        });
      };
    };


      const selectImage = () => {
       launchImageLibrary({ mediaType: 'photo' }, (response) => {
       if (response.assets && response.assets.length > 0) {
         const image = response.assets[0].uri;
         // Check if the image has already been sent
         if (sentImages.has(image)) {
           console.warn('Image already sent');
           return; // Exit if the image is a duplicate
         }
         const newMessage = {
           _id: Date.now(), // Use timestamp as a unique ID
           // createdAt: new Date(),
           user: {
             _id: auth().currentUser?.email || 'anonymous',
             avatar: users[0]?.imageUrl ? users[0].imageUrl : 'https://i.pravatar.cc/300',
           },
           image: image,
         };
         onSendImage([newMessage]);
         setSentImages((prev) => new Set(prev).add(image));
       }
     });
   };

   const handleModal = () => {
     setModalVisible(true);
   };

    const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <GiftedChat
          messages={messages}
          showAvatarForEveryMessage={false}
          showUserAvatar={true}
          onSend={messages => onSend(messages)}
          messagesContainerStyle={{
            backgroundColor: '#141921',
          }}
          textInputStyle={{
            backgroundColor: '#fff',
            borderRadius: 20,
            color: 'black',
          }}
          user={{
            _id: auth().currentUser?.email || 'anonymous',
            avatar: users[0]?.imageUrl ? users[0].imageUrl : 'https://i.pravatar.cc/300',
          }}
          renderActions={() => (
          <TouchableOpacity  style={{marginBottom:10,marginLeft:15}} onPress={handleModal}>
            <AntDesign name="link" size={24} color="black" />
          </TouchableOpacity>
        )}
          
        />
        <View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalView}>
              <View style={{flexDirection:'row',justifyContent:'space-evenly'}}>
                <TouchableOpacity onPress={UploadVideo} style={styles.MovieIcon}>
                  <Icon name="video-collection" size={34} color="white"/>
                </TouchableOpacity>
                <TouchableOpacity onPress={uploadFile} style={styles.MovieIcon}>
                  <Icon name="image" size={34} color="white"/>
                </TouchableOpacity>
              </View>
                <View style={styles.modalButton}>
                  <TouchableOpacity onPress={UploadVideo}><Text style={[styles.modalText,{marginRight:20}]}>Video</Text></TouchableOpacity>
                  <TouchableOpacity onPress={uploadFile} ><Text style={[styles.modalText,{marginRight:20}]}>Image</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
    </>
  );
}

const styles = StyleSheet.create({
  header:{
    height:40,
    width:'100%',
    backgroundColor:'#202a32',
    flexDirection:'row',
    justifyContent:'space-evenly',
    alignContent:'center',
    alignItems:'center',
  },
  headerText:{
    fontSize:17,
  },
   modalOverlay: {
      flex: 1,
      justifyContent: 'space-evenly',
      // alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalButton:{
      flexDirection:'row',
      justifyContent:'space-evenly',
      marginTop:10,

    },
    modalText:{
      marginLeft:20,
    },
     modalView: {
      margin: 20,
      backgroundColor: '#141921',
      borderRadius: 10,
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
    MovieIcon:{
      marginLeft:0,
      height:60,
      width:60,
      borderRadius:50,
      backgroundColor:'#3498db',
      justifyContent:'center',
      alignItems:'center',
    },
});
