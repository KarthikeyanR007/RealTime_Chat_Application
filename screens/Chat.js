import { TouchableOpacity, Text } from 'react-native';
import React, { useState, useCallback, useLayoutEffect } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [sentImages, setSentImages] = useState(new Set());
  const navigation = useNavigation();

  const signOut = async () => {
    try {
      await auth().signOut();
      console.log('User signed out!');
      await AsyncStorage.removeItem('@user_token');
    } catch (error) {
      console.error('Sign out error:', error.message);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 10 }} onPress={signOut}>
          <Icon name="logout" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useLayoutEffect(() => {
    const collectionRef = firestore().collection('chats');
    const q = collectionRef.orderBy('createdAt', 'desc');

    const unsubscribe = q.onSnapshot(
      (querySnapshot) => {
        const newMessages = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            _id: data._id,
            createdAt: data.createdAt.toDate(),
            text: data.text,
            user: data.user,
            image: data.image || null, // Handle image messages
          };
        });
        setMessages(newMessages);
      },
      (error) => {
        console.error('Firestore query error:', error);
      }
    );

    return unsubscribe;
  }, []);

  const onSend = useCallback((messages = []) => {
    const newMessage = messages[0]; // Get the latest message

    // Update Firestore with the new message
    firestore()
      .collection('chats')
      .add(newMessage)
      // .then((docRef) => {
      //   setMessages((previousMessages) =>
      //     GiftedChat.append(previousMessages, [
      //       { ...newMessage, _id: docRef.id },
      //     ])
      //   );
      // })
      .catch((error) => {
        console.error('Error adding document:', error);
      });
  }, []);

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
          createdAt: new Date(),
          user: {
            _id: auth().currentUser?.email || 'anonymous',
            avatar: 'https://placeimg.com/140/140/any',
          },
          image: image,
        };

        onSend([newMessage]);
        setSentImages((prev) => new Set(prev).add(image));
      }
    });
  };

  return (
    <GiftedChat
      messages={messages}
      showAvatarForEveryMessage={false}
      showUserAvatar={true}
      onSend={(messages) => onSend(messages)}
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
        avatar: 'https://i.pravatar.cc/300',
      }}
      renderActions={() => (
        <TouchableOpacity  style={{marginBottom:10,marginLeft:5}} onPress={selectImage}>
          <Icon name="image" size={24} color="black" />
        </TouchableOpacity>
      )}
    />
  );
}
