import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/storage'


import * as config from '../../firebaseConfig.js'
import axios, {AxiosError} from "axios";

@Injectable({
  providedIn: 'root'
})

export class FireService {
  firebaseApplication;
  firestore: firebase.firestore.Firestore;
  auth: firebase.auth.Auth;
  storage: firebase.storage.Storage;
  //functions: firebase.functions.Functions;
  // the default image if the user does not have any image URL will be the default one.
  currentlySignedInUserImageURL: string = "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80";
  baseUrl: string = "http://127.0.0.1:7015/fir-test-a8acb/us-central1/api/";

  messages: any[] = [];
  errMsg: string = "";

  constructor() {
    this.firebaseApplication = firebase.initializeApp(config.firebaseConfig);
    this.firestore = firebase.firestore();
    this.auth = firebase.auth();
    this.storage = firebase.storage();
    //this.functions = firebase.functions();
    this.auth.onAuthStateChanged((user) => {
      if(user) {
        this.getMessages();
        this.getImageOfSignedInUser();
      }
    })
    //using emulators and trying to use http and not https.
    /*
     this.firestore.useEmulator("localhost",7067);
     this.storage.useEmulator("localhost",7065);
     this.auth.useEmulator("http://localhost:7014");
     //this.functions.useEmulator('localhost', 7015);
     */
  }


  async getImageOfSignedInUser() {
    this.currentlySignedInUserImageURL = await this.storage
      .ref('image')
      .child(this.auth.currentUser?.uid+"")
      .getDownloadURL();
  }

  async updateUserImage($event) {
    const img = $event.target.files[0];
    const uploadTask = await this.storage
      .ref('image')
      .child(this.auth.currentUser?.uid+"")
      .put(img);
    this.currentlySignedInUserImageURL = await uploadTask.ref.getDownloadURL();
  }


  sendMessage(sendThisMessage: any) {
    const currentUser = this.auth.currentUser;

    if (!currentUser) {
      console.error('User is not authenticated');
      return;
    }

    const messageDTO = {
      messageContent: sendThisMessage,
      user: currentUser.uid,
      timestamp: new Date(),
      id: (Math.random() + 1).toString(20).substring(2, 15),
    };

    this.firestore
      .collection('chat')
      .add(messageDTO)
      .then(() => {
        console.log('Message added successfully');
      })
      .catch((error) => {
        console.error('Error adding message: ', error);
      });
  }




  getMessages() {
    this.firestore
      .collection('chat')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if(change.type=="added") {
            const index = this.messages.findIndex(m => m.id == change.doc.id)
            if(index == -1) {
              this.messages.push(change.doc.data()); // Use push instead of unshift to add new messages at the end
            } else  {
              this.messages[index].hasNotBeenThroughToxicityFilterYet = false;
            }

          } if (change.type=='modified') {
            const index = this.messages.findIndex(document => document.id != change.doc.id);
            this.messages[index] =
              {id: change.doc.id, data: change.doc.data()}

          } if(change.type=="removed") {
            this.messages = this.messages.filter(m => m.id != change.doc.id);
          }
        })
      })
  }




  register(email: string, password: string) {
    this.auth.createUserWithEmailAndPassword(email, password);
  }

  async signIn(email: string, password: string){
    await this.auth.signInWithEmailAndPassword(email, password)
  }

  signOut() {
    this.auth.signOut();
  }

  deleteMessageByID(id: any) {
    this.firestore
      .collection('chat')
      .doc(id).delete();
  }
}
