import {
  View,
  Text,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Touchable,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {API_KEY} from '../config';

export default function GalleryView({route}) {
  const {fetch_name} = route.params;
  const {height, width} = Dimensions.get('screen');
  const [images, setImages] = React.useState(null);
  const API_URL = `https://api.pexels.com/v1/search?query=${fetch_name}&per_page=10&page=5`;
  const IMAGE_SIZE=80
  const SPACING=10
  const [activeIndex,setActiveIndex]=React.useState(0)

  //========FETCHING THE IMAGES BASED ON THE CATEGORY SELECTED=========//
  useEffect(() => {
    //===IIFE===//
    (async () => {
      try {
        let result = await fetch(API_URL, {
          headers: {
            Authorization: API_KEY,
          },
        });
        let data = await result.json();
        setImages(data.photos);
      } catch (error) {
        console.log(error, 'error in fetching images');
        throw error;
      }
    })();
  }, [fetch_name]);
//   ========REFS========//
const topRef=useRef(null)
const bottomRef=useRef(null)

  if (!images) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading...</Text>
      </View>
    );
  }
  const scrollToIndex=(index)=>{
    setActiveIndex(index)
    topRef.current.scrollToOffset({
        offset:index*width,
        animated:true,
    })
    if(index*(IMAGE_SIZE+SPACING)>width/2){
        bottomRef.current.scrollToOffset({
            offset:index*(IMAGE_SIZE+SPACING)+IMAGE_SIZE/2-width/2,
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
    <View style={{flex: 1}}>
      {/* =======TOP FLATLIST======== */}
      <FlatList
      ref={topRef}
        data={images}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={{height, width}}>
            <Image
              source={{uri: item.src.portrait}}
              style={[StyleSheet.absoluteFillObject]}
            />
          </View>
        )}
        onMomentumScrollEnd={(event)=>scrollToIndex(Math.floor(event.nativeEvent.contentOffset.x/width))}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
      />
      {/* =======BOTTOM FLATLIST======== */}
      <FlatList
      ref={bottomRef}
       data={images}
       keyExtractor={item => item.id.toString()}
       renderItem={({item,index}) => (
         <TouchableOpacity onPress={()=>scrollToIndex(index)}>
           <Image
             source={{uri: item.src.portrait}}
             style={{
                    height:activeIndex==index?IMAGE_SIZE+10:IMAGE_SIZE,
                    width:IMAGE_SIZE,
                    marginRight:SPACING,
                    borderRadius:10,
                    borderColor:activeIndex==index?'#fff':'transparent',
                    borderWidth:2,

                }}
           />
         </TouchableOpacity>
       )}
       style={{position:'absolute',bottom:IMAGE_SIZE}}
       contentContainerStyle={{paddingHorizontal:SPACING,alignItems:'center'}}
       horizontal
       showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}
