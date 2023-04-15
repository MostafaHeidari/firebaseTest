import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/storage'


import * as config from '../../firebaseConfig.js'

@Injectable({
  providedIn: 'root'
})

export class FireService {
  firebaseApplication;
  firestore: firebase.firestore.Firestore;
  auth: firebase.auth.Auth;
  storage: firebase.storage.Storage;
  // the default image if the user does not have any image URL will be the default one.
  currentlySignedInUserImageURL: string = "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80";

  messages: any[] = [];

  constructor() {
    this.firebaseApplication = firebase.initializeApp(config.firebaseConfig);
    this.firestore = firebase.firestore();
    this.auth = firebase.auth();
    this.storage = firebase.storage();
    this.auth.onAuthStateChanged((user) => {
      if(user) {
        this.getMessages();
        this.getImageOfSignedInUser();
      }
    })
    this.firestore.useEmulator("localhost",2003);
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
    let messageDTO: MessageDTO = {
      messageContent: sendThisMessage,
      timestamp: new Date(),
      user: 'some user'
    }
    this.firestore
      .collection('myChat')
      .add(messageDTO);
  }

  getMessages() {
    this.firestore
      .collection('myChat')
      .where('user', '==', 'some user')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if(change.type=="added") {
            this.messages.push({id: change.doc.id, data: change.doc.data()});
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

  signIn(email: string, password: string) {
    this.auth.signInWithEmailAndPassword(email, password);
  }

  signOut() {
    this.auth.signOut();
  }
}

export interface MessageDTO {
  messageContent: string;
  timestamp: Date;
  user: string;
}
