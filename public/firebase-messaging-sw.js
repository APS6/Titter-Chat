importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCEvkSTr1EzBlH4VyxQtLf3Ak-8tTA3s4I",
  authDomain: "titter-chat.firebaseapp.com",
  projectId: "titter-chat",
  storageBucket: "titter-chat.appspot.com",
  messagingSenderId: "620344154307",
  appId: "1:620344154307:web:320a7c98c4580d92faaa76"
});


const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
});