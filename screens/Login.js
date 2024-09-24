import React, { useState } from "react";
import { StyleSheet, Text, View, Button, TextInput, Image, SafeAreaView, TouchableOpacity, StatusBar, Alert } from "react-native";
import auth from '@react-native-firebase/auth';
import { signInWithEmailAndPassword } from "firebase/auth";
import { colors } from '../constants/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
const backImage = require('../assets/background.png');


export default function Login({ navigation }) {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isFocused1, setIsFocused1] = useState(false);
    const [isFocused2, setIsFocused2] = useState(false);
    const { setUsers } = useAuth();
    const dispatch = useDispatch();

    const onHandleLogin = async() => {
         try {
                const userCredential = await auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log('User signed in!', user);
                await AsyncStorage.setItem('@user_token', user.uid);
                setUsers(userCredential.user);
                // if(userCredential){
                //     navigation.navigate('Home');
                // }
                //return user;
                dispatch(setUser(user.email));
            } catch (error) {
                console.error(error.message);
                throw error;
            }
        // if (email !== "" && password !== "") {
        //     signInWithEmailAndPassword(auth, email, password)
        //         .then(() => console.log("Login success"))
        //         .catch((err) => Alert.alert("Login error", err.message));
        // }
    };

    return (
        <View style={styles.container}>
            <Image source={backImage} style={styles.backImage} />
            <View style={styles.whiteSheet} />
            <SafeAreaView style={styles.form}>
                <Text style={styles.title}>Log In</Text>
                <TextInput
                    style={[styles.input, isFocused1 && styles.focused]}
                    placeholder="Enter email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoFocus={true}
                    value={email}
                    onFocus={() => setIsFocused1(true)}
                    onBlur={() => setIsFocused1(false)}
                    onChangeText={(text) => setEmail(text)}
                    placeholderTextColor="#888"
                />
                <TextInput
                     style={[styles.input, isFocused2 && styles.focused]}
                    placeholder="Enter password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={true}
                    textContentType="password"
                    value={password}
                    onFocus={() => setIsFocused2(true)}
                    onBlur={() => setIsFocused2(false)}
                    onChangeText={(text) => setPassword(text)}
                    placeholderTextColor="#888"
                />
                <TouchableOpacity style={styles.button} onPress={onHandleLogin}>
                    <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 18 }}> Log In</Text>
                </TouchableOpacity>
                <View style={{ marginTop: 30, flexDirection: 'row', alignItems: 'center', alignSelf: 'center' }}>
                    <Text style={{ color: 'gray', fontWeight: '600', fontSize: 14 }}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => { navigation.navigate("SignUp") }}>
                        <Text style={{ color: colors.pink, fontWeight: '600', fontSize: 14 }}> Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
            <StatusBar barStyle="light-content" />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'black',
        alignSelf: "center",
        paddingBottom: 24,
        marginBottom:10,
        marginTop:10,
    },
    input: {
        backgroundColor: "#F6F7FB",
        height: 58,
        marginBottom: 20,
        fontSize: 16,
        borderRadius: 10,
        padding: 12,
        color: 'black',
    },
    focused: {
         borderColor: '#007BFF',
         borderWidth:1,
    },
    backImage: {
        width: "100%",
        height: 340,
        position: "absolute",
        top: 0,
        resizeMode: 'cover',
    },
    whiteSheet: {
        width: '100%',
        height: '75%',
        position: "absolute",
        bottom: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 60,
    },
    form: {
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 30,
    },
    button: {
        backgroundColor: colors.primary,
        height: 58,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
});
