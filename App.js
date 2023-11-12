import { View, Text, FlatList, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { API_KEY } from './config'
const { width, height } = Dimensions.get('screen')
const API_URL = 'https://api.pexels.com/v1/search?query=nike_shoe&per_page=20&page=3'
const IMAGE_SIZE = 80
const SPACE = 10


const fetchNature = async () => {
  try {
    let data = await fetch(API_URL, {
      headers: {
        'Authorization': API_KEY
      },
    })
    const result = await data.json()
    return result
  } catch (error) {
    console.log(error)
    throw error
  }
}

export default function App() {
  const [images, setImages] = React.useState(null)
  const [activeIndex,setActiveIndex]=React.useState(0)
  useEffect(() => {
    (async () => {
      let result = await fetchNature()
      setImages(result.photos)
    })()
  }, [])

  const renderItem = ({ item }) => {
    return (
      <View style={{ width, height }}>
        <Image
          source={{ uri: item.src.portrait }}
          style={[StyleSheet.absoluteFillObject]}
        />
      </View>
    )
  }
  const topRef=useRef(null)
  const bottomRef=useRef(null)
  if (!images) {
    return <Text style={{ marginVertical: 30, paddingHorizontal: 10 }}>Loading...</Text>
  }

  const scrollToActiveIndex=(index)=>{
    setActiveIndex(index)
    topRef.current.scrollToOffset({
      offset:index*width,
      animated:true
    })
    if(index*(IMAGE_SIZE+SPACE)>width/2){
      bottomRef.current.scrollToOffset({
        offset:index*(IMAGE_SIZE+SPACE)-width/2+IMAGE_SIZE/2,
        animated:true
      })
    }else{
      bottomRef.current.scrollToOffset({
        offset:index,
        animated:true
      })
    }
  }
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={topRef}
        data={images}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={ev=>{scrollToActiveIndex(Math.floor(ev.nativeEvent.contentOffset.x/width))}}
      />
      <FlatList
      ref={bottomRef}
        data={images}
        keyExtractor={item => item.id.toString()}
        style={{position:'absolute',bottom:IMAGE_SIZE}}
        contentContainerStyle={{paddingHorizontal:SPACE}}
        renderItem={({item,index}) => {
          return (
            <TouchableOpacity onPress={()=>scrollToActiveIndex(index)}>
            <Image
              source={{ uri: item.src.portrait }}
              style={{height:IMAGE_SIZE,
                width:IMAGE_SIZE,
                marginRight:SPACE,
                borderRadius:12,
                borderWidth:2,
                borderColor:index==activeIndex?'#fff':'transparent'
              }}
            />
            </TouchableOpacity>
          )
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}