import './gesture-handler';
import '@react-native-firebase/app';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { colors } from './constants/constants';
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import Home from './screens/Home';
import Chat from './screens/Chat';
import Settings from './screens/Settings';
import PrtChat from './screens/PrtChat';
import { AuthProvider, useAuth } from './AuthContext';
import { useDispatch } from 'react-redux';
import { setUser } from './redux/userSlice';

const Stack = createStackNavigator();

const MainStack = () => (
  <Stack.Navigator   >
    <Stack.Screen name="Home" component={Home}  options={{
            title: 'Tokey',
            headerStyle: { backgroundColor: '#202a32' }, // Custom header style
            headerTintColor: '#fff', // Header text color
            headerTitleStyle: { fontWeight: 'bold' }, // Title text style
          }}/>
    <Stack.Screen name="Chat" component={Chat}  options={{
            title: 'Groupe Chat',
            headerStyle: { backgroundColor: '#202a32' }, // Custom header style
            headerTintColor: '#fff', // Header text color
            headerTitleStyle: { fontWeight: 'bold' }, // Title text style
          }}/>
    <Stack.Screen name="PrtChat" component={PrtChat} options={{
            headerStyle: { backgroundColor: '#202a32' }, // Custom header style
            headerTintColor: '#fff', // Header text color
            headerTitleStyle: { fontWeight: 'bold' }, // Title text style
          }} />
    <Stack.Screen name="Settings" component={Settings}  options={{
            title: 'Settings',
            headerStyle: { backgroundColor: '#202a32' }, // Custom header style
            headerTintColor: '#fff', // Header text color
            headerTitleStyle: { fontWeight: 'bold' }, // Title text style
          }}/>
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="SignUp" component={SignUp} />
  </Stack.Navigator>
);

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    // If you were using AsyncStorage or any other authentication check, handle it here
    setIsLoading(false); // For demonstration purposes, we assume loading is done immediately
  }, []);

  if(isLoading === false){
     user ? dispatch(setUser(user.email)) : null;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      { user ? <MainStack /> : <AuthStack /> }
    </NavigationContainer>
  );
};

const App = () => (
   <PaperProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
   </PaperProvider>
);

export default App;
