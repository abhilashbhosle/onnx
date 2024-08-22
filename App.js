import {View, Text} from 'react-native';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Home from './src/Home';
import GalleryView from './src/GalleryView';
import Test from './Test';

export default function App() {
  const Stack = createNativeStackNavigator();
  return (
    // {/* <NavigationContainer>
    //   <Stack.Navigator initialRouteName='Home' screenOptions={{headerShown:false}}>
    //     <Stack.Screen name='Home'component={Home}/>
    //     <Stack.Screen name='GalleryView'component={GalleryView}/>
    //   </Stack.Navigator>
    // </NavigationContainer> */}
    <Test />
  );
}
