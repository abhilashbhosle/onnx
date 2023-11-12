import { View, Text, FlatList, ImageBackground, Dimensions, StyleSheet, TouchableOpacity } from 'react-native'
import React from 'react'
import { gallery } from './utils/gallery'

const {height,width}=Dimensions.get('screen')

export default function Home({navigation}) {
    const renderItem=({item})=>{
        return(
           <ImageBackground
           source={{uri:item.path}}
           style={{height:height/2,width:width}}
           imageStyle={{resizeMode:'cover'}}
           >
            <TouchableOpacity onPress={()=>{navigation.navigate('GalleryView',{fetch_name:item.fetch_name})}}>
            <View style={{height:height/2,width:width,backgroundColor:'#0005',justifyContent:'center',alignItems:'center'}}>
            <Text style={styles.name}>
                {item.name}
            </Text>
            </View>
            </TouchableOpacity>
            </ImageBackground>
        )
    }
  return (
    <View>
        <FlatList
        data={gallery}
        keyExtractor={item=>item.id}
        renderItem={renderItem}
        />
    </View>
  )
}
const styles=StyleSheet.create({
    name:{
        fontSize:22,
        color:'#fff',
    }

})