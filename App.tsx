import React, { useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  FlatList,
  View,
  Text,
  useWindowDimensions,
  Image,
  TouchableOpacity
} from 'react-native';
import { USERS } from './src/Fakedata';

function App(): JSX.Element {
  const [index, setIndex] = React.useState(0)
  const window = useWindowDimensions()
  const ref = React.useRef<FlatList>(null)
  const [viewPosition,setViewPosition]=React.useState(0)
  const renderItem = ({ item, index: findex }) => {
    return (
      <View style={{ marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
        <Image source={{ uri: item.avatar }} style={{ height: 250, width: 250,resizeMode:'contain' }} />
        <Text style={styles.name}>Name: {item.username}</Text>
        <Text style={{ ...styles.name, color: '#666', fontWeight: '500' }}>{item.email}</Text>
      </View>
    )
  }
  React.useEffect(()=>{
    ref.current?.scrollToIndex({
      index,
      animated:true,
      viewPosition
    })
  },[index])
  return (
    <>
      <FlatList
      ref={ref}
        data={USERS}
        renderItem={renderItem}
        initialScrollIndex={index}
        keyExtractor={item => item.userId}
        style={{ flex: 1 }}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.start} 
          onPress={()=>setViewPosition(0)}
          >
            <Text>S</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.start}
          onPress={()=>setViewPosition(0.5)}
          >
            <Text>C</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.start}
           onPress={()=>setViewPosition(1)}
          >
            <Text>E</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row' }}
      
        >
          <TouchableOpacity style={styles.start}
            onPress={()=>{
              if(index==0){
                return
              }
              setIndex(prev=>prev-1)
            }}
          >
            <Text>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.start}
            onPress={()=>{
              if(USERS.length-1==index){
                return
              }
              setIndex(prev=>prev+1)
            }}
          >
            <Text>Front</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    fontWeight: '700'
  },
  start: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2
  }
});

export default App;
