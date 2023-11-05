import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCEvkSTr1EzBlH4VyxQtLf3Ak-8tTA3s4I",
  authDomain: "titter-chat.firebaseapp.com",
  projectId: "titter-chat",
  storageBucket: "titter-chat.appspot.com",
  messagingSenderId: "620344154307",
  appId: "1:620344154307:web:320a7c98c4580d92faaa76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const initFirebase = () => {
  return app
}