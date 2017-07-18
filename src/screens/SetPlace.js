import React, {Component} from 'react'
import { View, Text, Button, Image} from 'react-native'
import { Container, Content, List, ListItem, Spinner } from 'native-base';
import axios from 'axios'
import geolib from 'geolib'
import outliers from 'outliers'
import moment from 'moment-business-time'
import { NavigationActions } from 'react-navigation'
import MapView from 'react-native-maps';

export default class SetPlace extends Component {
  constructor(){
    super()
    this.state = {
      meetupId:'596c57d954bed30dcc5ac163',
      region: {
        latitude: -6.2656832,
        longitude: 106.7810439,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      markers:[],
      radius:500,
      loadingMessage: 'Analyzing places recomendation...',
      venueType:'restaurant',
      venueQuery:'restaurant',
      pageLoadedStatus: false,
      modalStatus: false,
      placeDetailStatus: false,
      placeDetail: '',
      detailImage: '',
      places:[
        {
          id:1,
          type:'',
          name:'Coworking Space',
        },
        {
          id:2,
          type:'library',
          name:'Library',
        },
        {
          id:3,
          type:'bar',
          name:'Bar',
        },
        {
          id:4,
          type:'cafe',
          name:'Coffe Shop',
        },
        {
          id:5,
          type:'shopping_mall',
          name:'Shopping Mall',
        },
        {
          id:6,
          type:'restaurant',
          name:'Restaurant',
        },
        {
          id:7,
          type:'park',
          name:'Park',
        }
      ]
    }
    this.onRegionChange = this.onRegionChange.bind(this)
    this.getCenter = this.getCenter.bind(this)
    this.getVenue = this.getVenue.bind(this)
    this.regionAdjustment = this.regionAdjustment.bind(this)
    this.finalizePlace = this.finalizePlace.bind(this)
  }

  onRegionChange(region) {
    this.setState({ region });
  }

  getCenter(coordinates){
    var geoArray = coordinates.map(a=>( {'latitude':a[0],'longitude':a[1]} ))

    var centerCoordinate = geolib.getCenter(geoArray);

    var distanceArray = coordinates.map(a=> geolib.getDistance({latitude: a[0], longitude: a[1]},centerCoordinate) )

    var OutliersDistanceArray=outliers(distanceArray)

    var OutlierIndex = []
    distanceArray.forEach((val,index)=>{
      OutliersDistanceArray.forEach((a)=>{
        if(a==val){
          OutlierIndex.push(index)
        }
      })
    })

    var newGeoArray = []
    geoArray.forEach((val,index)=>{
      OutlierIndex.forEach((a)=>{
        if(a!=index){
          newGeoArray.push(val)
        }
      })
    })

    if(newGeoArray.length>0){
      this.setState({
        region:{
          latitude: parseFloat(geolib.getCenter(newGeoArray).latitude),
          longitude: parseFloat(geolib.getCenter(newGeoArray).longitude),
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      })
      this.getVenue()
    } else {
      this.setState({
        region:{
          latitude: parseFloat(geolib.getCenter(geoArray).latitude),
          longitude: parseFloat(geolib.getCenter(geoArray).longitude),
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      })
      this.getVenue()
    }
  }

  getVenue(){
    axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${this.state.region.latitude},${this.state.region.longitude}&radius=${this.state.radius}&keyword=${this.state.venueQuery.split(' ').join('+')}&type=${this.state.venueType}&key=AIzaSyCnuZIr08cpL0ypqUlSX6ZfxZPfHWX_TrA`)
    .then(response=>{
      this.setState({'markers':response.data.results.slice(0,10)})
      if(this.state.markers.length<10){
        this.setState({'radius':this.state.radius+=500})
        if(this.state.radius<2500){
          return this.getVenue()
        }
      }
      if(this.state.markers.length>0){
        this.regionAdjustment()
        this.setState({'pageLoadedStatus':true})
      } else {
        this.setState({'pageLoadedStatus':true})
      }
    })
  }

  changeVenue(){
    axios.get(`http://otw-env.cjqaqzzhwf.us-west-2.elasticbeanstalk.com/detailmeetup/${this.state.meetupId}`)
    .then(response=>{
      let bussinessHour = moment(response.data.meetingTime).isWorkingTime()
      let coordinates = []
      if(bussinessHour){
        coordinates = [response.data.creator.officeAddressGeolocation]
        response.data.participants.forEach(participant=>{
          if(participant.status == 'yes'){
            coordinates.push(participant.user.officeAddressGeolocation)
          }
        })
      } else {
        coordinates = [response.data.creator.homeAddressGeolocation]
        response.data.participants.forEach(participant=>{
          if(participant.status == 'yes'){
            coordinates.push(participant.user.homeAddressGeolocation)
          }
        })
      }
      this.getCenter(coordinates)
    })
    .catch(err=>{
      let coordinates = [
        [0,0]
      ]
      this.getCenter(coordinates)
    })
  }

  retrieveData(){
    axios.get(`http://otw-env.cjqaqzzhwf.us-west-2.elasticbeanstalk.com/detailmeetup/${this.state.meetupId}`)
    .then(response=>{
      let bussinessHour = moment(response.data.meetingTime).isWorkingTime()
      let coordinates = []
      if(bussinessHour){
        coordinates = [response.data.creator.officeAddressGeolocation]
        response.data.participants.forEach(participant=>{
          if(participant.status == 'yes'){
            coordinates.push(participant.user.officeAddressGeolocation)
          }
        })
      } else {
        coordinates = [response.data.creator.homeAddressGeolocation]
        response.data.participants.forEach(participant=>{
          if(participant.status == 'yes'){
            coordinates.push(participant.user.homeAddressGeolocation)
          }
        })
      }
      if(response.data.typePlaces == 'coworking_space'){
        this.setState({'venueType':'','venueQuery':response.data.typePlaces.split('_').join('+')})
      } else {
        this.setState({'venueType':response.data.typePlaces,'venueQuery':response.data.typePlaces.split('_').join('+')})
      }
      this.getCenter(coordinates)
    })
    .catch(err=>{
      let coordinates = [
        [0,0]
      ]
      this.getCenter(coordinates)
    })
  }

  regionAdjustment(){
    var minX = this.state.markers[0].geometry.location.lat
    var maxX = this.state.markers[0].geometry.location.lat
    var minY = this.state.markers[0].geometry.location.lng
    var maxY = this.state.markers[0].geometry.location.lng
    this.state.markers.map((marker) => {
      minX = Math.min(minX, marker.geometry.location.lat-0.0025);
      maxX = Math.max(maxX, marker.geometry.location.lat+0.0025);
      minY = Math.min(minY, marker.geometry.location.lng-0.0025);
      maxY = Math.max(maxY, marker.geometry.location.lng+0.0025);
    });

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const deltaX = (maxX - minX);
    const deltaY = (maxY - minY);

    this.setState({
      region:{
        latitude: midX,
        longitude: midY,
        latitudeDelta: deltaX,
        longitudeDelta: deltaY
      }
    });
  }

  finalizePlace(){
    const goToUpcomingScreen = NavigationActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({ routeName: 'LandingPage'})
      ]
    })
    axios.put(`http://otw-env.cjqaqzzhwf.us-west-2.elasticbeanstalk.com/editmeetup/${this.state.meetupId}`,{
      typePlaces: this.state.venueType,
      placeAddressName: this.state.placeDetail.name,
      placeAddressGeolocation: [this.state.placeDetail.geometry.location.lat,this.state.placeDetail.geometry.location.lng],
      status: 'upcoming'
    })
    .then(res=>{
      this.props.navigation.dispatch(goToUpcomingScreen)
    })
    .catch(err=>{
      this.props.navigation.dispatch(goToUpcomingScreen)
    })
  }

  componentWillMount(){
    // this.setState({"meetupId":this.props.meetupId})
    this.retrieveData()
  }

  render() {
    if(this.state.pageLoadedStatus){
      if(this.state.modalStatus){
        return (
          <Container style={styles.container}>
            <Content>
              <List>
                { this.state.places.map((place)=> {
                    return (
                      <ListItem key={place.id} onPress={() => {
                        this.setState(
                          {
                            'venueType':place.type,
                            'venueQuery':place.name,
                            'markers':'',
                            'radius':500,
                            'modalStatus':false,
                            'pageLoadedStatus':false
                          },
                          ()=>this.changeVenue()
                        )
                      }}>
                        <Text>{place.name}</Text>
                      </ListItem>
                    )
                  })
                }
              </List>
            </Content>

            <View style={styles.parentView}>
              <Button onPress={()=>this.setState({'modalStatus':false})} title="cancel"/>
            </View>
          </Container>
        )
      } else if (!this.state.placeDetailStatus){
        return (
          <View style={{flex:1}}>
            <View style={{flex:1,backgroundColor:'#3399ff',justifyContent:'center',alignItems:'center'}}>
              <Text style={{color:'white', fontWeight:'bold',fontSize:20}}>
                {this.state.venueType?this.state.venueType.split('_').join(' ').toUpperCase():'Coworking Space'}
              </Text>
            </View>
            <View style={{flex:10}}>
              <MapView
                showCallout
                style={{flex:7}}
                region={this.state.region}
                onRegionChange={this.onRegionChange}
              >
              {this.state.markers.length != 0 ? this.state.markers.map((marker,index) => (
                <MapView.Marker
                  key={index}
                  pinColor="#3399ff"
                  coordinate={{latitude:marker.geometry.location.lat,longitude:marker.geometry.location.lng}}
                  title={marker.name}
                  description={`Click here to view details`}
                  onCalloutPress={e => {
                      this.setState({'placeDetailStatus':true,'placeDetail':marker})
                    }
                  }
                />
              )) : null}
              </MapView>
              {this.state.markers.length == 0 ? (
                <Text style={{flex:0.5,alignSelf:'center', fontWeight:'bold'}}>
                  No place found, please select other type of place
                </Text> ):null
              }
              <Button style={{flex:1}}onPress={()=>this.setState({'modalStatus':true})} title="Change venue type"/>
            </View>
          </View>
        )
      } else {
        return (
          <View style={{flex:1}}>
            <View style={{flex:11,justifyContent:'space-around',alignItems:'center'}}>
              <Image
                style={{width: 50, height: 50}}
                source={{uri: this.state.placeDetail.icon}}
              />
              <Text style={{fontWeight:'bold',fontSize:25}}>
                {this.state.placeDetail.name}
              </Text>
              <Text style={{fontWeight:'bold',alignItems:'center'}}>
                {'Adress: '}
                <Text>
                  {this.state.placeDetail.vicinity}
                </Text>
              </Text>
              <Text style={{fontWeight:'bold'}}>
                {'Rating: '}
                <Text>
                  {this.state.placeDetail.rating}
                </Text>
              </Text>
            </View>
            <View style={{flex:1,flexDirection:'row'}}>
              <View style={{flex:1}}>
              <Button
                color="#3399ff"
                style={{flex:1}}
                onPress={()=>{
                  this.setState({'loadingMessage':'finalizing place ...','pageLoadedStatus':false},()=>this.finalizePlace())
                }}
                title="Finalize place!"
              />
              </View>
              <View style={{flex:1}}>
              <Button
                color="red"
                style={{flex:1}}
                onPress={()=>{
                  this.setState({'placeDetailStatus':false,'placeDetail':''})
                }}
                title="Back"
              />
              </View>
            </View>
          </View>
        )
      }
    } else {
      return (
        <View style={styles.container}>
          <View style={{flex:1,backgroundColor:'#3399ff',justifyContent:'center',alignItems:'center'}}>
            {this.state.loadingMessage!='Done!'?<Spinner />:null}
            <Text style={{color:'white', fontWeight:'bold',fontSize:20}}>
              {this.state.loadingMessage}
            </Text>
          </View>
        </View>
      )
    }
  }
}

const styles = {
  container:{
    backgroundColor:'#FFFFFF',
    flex:1,
  },
  parentView:{
    backgroundColor:'#FFFFFF'
  },
  userView:{
    flex:1,
    backgroundColor: '#F5F5F5'
  },
};