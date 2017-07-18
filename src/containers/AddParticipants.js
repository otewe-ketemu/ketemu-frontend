import React from 'react';
import { View, } from 'react-native';
import { Container, Content, Card, CardItem, Text, Body, Item, Input, Button, ListItem, Badge } from 'native-base';
import { inputParticipantsMeetUp } from '../actions/createMeetUp'
import { connect } from  'react-redux'
import Axios from 'axios'

class AddParticipants extends React.Component {
  constructor(props) {
    super(props)
    this.state =  {
      searchUser: '',
      possibleUsers: [],
      users: this.props.createMeetUp.participants,
    }
  }

  handleUsernameSearch = (text) => {
    this.setState({
      searchUser: text,
    })
    Axios.get(`http://otw-env.cjqaqzzhwf.us-west-2.elasticbeanstalk.com/searchuser/${text}`)
      .then ((response) => {
        this.setState({
          possibleUsers: response.data,
        })
      })
      .catch ((error) => {
        this.setState({
          possibleUsers: [],
        })
        console.log(error)
        console.log('axios error cuy')
      })
  }

  handleUsernameSelect = (user) => {
    if(this.state.users.find((existedUser) => existedUser.id === user._id)) {
      this.setState({
        possibleUsers: [],
        searchUser: '',
      })
    }
    else {
      let stateUser = {id: user._id, username: user.username}
      this.setState({
        users: [...this.state.users, stateUser],
        searchUser:'',
        possibleUsers: [],
      })
    }
  }

  createParticipants(){
    // console.log('oke');
    const navigasiNext = this.props.navigation.navigate;
    if(this.state.users.length<1){
      alert('wrong participants')
    } else {
      this.props.create_Participants(this.state.users)
      navigasiNext('AddConfirmationDeadline')
    }
  }

  render() {
    return (
      <Container>
        <Content>
          <Card style={{marginLeft:4, marginRight:4}}>
            <CardItem header>
              <Text>Add Participants</Text>
            </CardItem>
            <CardItem>
              <Body>
                <Item regular regular style={{marginTop:1, height:30}}>
                  <Input placeholder='Add His/Her Username' value={this.state.searchUser} onChangeText={(text) => this.handleUsernameSearch(text)}/>
                </Item>
                <View style={{flex:1, flexDirection:'row', flexWrap:'wrap'}}>
                {
                  this.state.users.map((user) => {
                  return (
                      <Badge success key={`users.${user.id}`} style={{marginLeft:2, marginRight:2, marginTop:2  }}>
                          <Text>{user.username}</Text>
                      </Badge>
                  )})
                }
                </View>

                { this.state.possibleUsers.map((user) => {
                  return (
                    <ListItem key={`possUsers.${user._id}`}>
                      <Text onPress={() => this.handleUsernameSelect(user)}>{user.username}</Text>
                    </ListItem>
                  )})
                }
              </Body>
            </CardItem>

         </Card>
        </Content>

        <Button full onPress={()=> this.createParticipants()}>
          <Text>Next</Text>
        </Button>
      </Container>
    )
  }
}

const mapStateToProps = (state)=>{
  return{
    createMeetUp: state.createMeetUp,
    users: state.users,
  }
}

const mapDispatchToProps = (dispatch) =>{
  return{
    create_Participants:(users)=>dispatch(inputParticipantsMeetUp(users)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps) (AddParticipants)
