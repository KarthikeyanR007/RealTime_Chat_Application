/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, FlatList, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Menu, Provider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [visible, setVisible] = useState(false);
  const user = useSelector((state) => state.user.user);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

   const handleNavigationChat = () => {
     navigation.navigate('Home');
    };

  const handleNavigationGroup = () => {
     navigation.navigate('Chat');
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{flexDirection:'row'}}>
          <TouchableOpacity onPress={handleOpenCamera}>
              <Icon name="camera-alt" size={24} color="white" style={{ marginRight: 25 }} />
            </TouchableOpacity>

          <Menu
          visible={visible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity onPress={openMenu}>
              <Icon name="more-vert" size={24} color="white" style={{ marginRight: 25 }} />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={handleSettings}
            title="Settings"
            style={{ height: 30 }}
          />
          <Menu.Item
            onPress={handleLogOut}
            title="Log Out"
            style={{ height: 30 }}
          />
         </Menu>
        </View>
        
      ),
    });
  }, [navigation, visible]);


  const handleOpenCamera = () => {
    console.log('open camera');
  };
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const snapshot = await firestore()
        .collection("user")
        .where("email", "!=", user)
        .get();
      if (snapshot.empty) {
        console.log("No matching documents.");
        return;
      }
      let usersList = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  const handlePrtChat = (id,username) => {
    navigation.navigate("PrtChat", { ChatId: id, userName: username});
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
    setVisible(false);
  };

  const handleLogOut = async () => {
    try {
      await auth().signOut();
      console.log('User signed out!');
      await AsyncStorage.removeItem('@user_token');
    } catch (error) {
      console.error('Sign out error:', error.message);
    }
  };

  const Item = (props) => (
    <TouchableOpacity onPress={() => handlePrtChat(props.id,props.name)} style={styles.item}>
      <Image source={{ uri: props.userImg ?  props.userImg : 'https://via.placeholder.com/150' }} style={styles.UserImg}/> 
      <Text style={{ color: "white", fontWeight: '700', fontSize: 17 }}>{props.name}</Text>
    </TouchableOpacity>
  );

  return (
    <Provider>
      <View style={styles.fullContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleNavigationChat}>
             <Text style={styles.headerText}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNavigationGroup}>
             <Text style={styles.headerText}>Groupes</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={users}
          renderItem={({ item }) => <Item name={item.username} userImg={item.imageUrl} id={item.id} />}
          keyExtractor={(item) => item.id}
          style={{backgroundColor:'#141921'}}
        />
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Chat")}
            style={styles.chatButton}
          >
            <Icon name="chat" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    bottom: 5,
    right: 10,
  },
  fullContainer: {
    flex: 1,
  },
  chatButton: {
    backgroundColor: "#2196f3",
    height: 50,
    width: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2196f3",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    marginRight: 20,
    marginBottom: 50,
  },
  item: {
    flexDirection: 'row',
    height: 75,
    width: "100%",
    borderWidth: 0,
    borderTopWidth:0,
    alignItems: 'center',
  },
  title: {
    color: "black",
  },
  UserImg: {
    height: 50,
    width: 50,
    borderRadius: 50,
    borderWidth: 2,
    marginHorizontal: 20,
  },
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
});

export default Home;
