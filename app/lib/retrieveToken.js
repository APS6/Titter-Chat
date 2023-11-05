'use client'
import { initFirebase } from "@/firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
export default async function retrieveToken (accessToken){
    const firebaseApp = initFirebase()
    try {
        if (typeof window != 'undefined' && navigator?.serviceWorker) {
            const messaging = getMessaging(firebaseApp);

            // Retrieve the notification permission status
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();

                // Check if permission is granted before retrieving the token
                if (permission === 'granted') {
                    const currentToken = await getToken(messaging, {
                        vapidKey:
                            'BLwYfECvEYwvoWZNyzQYlX3GqnOaqW754d8Vg8u-45x3_hYSsVoS0UNqsC3l3Yt8KVRfgYHbTazEEk7AdQM2vis',
                    });
                    if (currentToken) {
                        const body = {
                            token: currentToken,
                          };
                          try {
                            const response = await fetch("/api/subscribeToken", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: accessToken,
                              },
                              body: JSON.stringify(body),
                            });
                            if (response.status !== 200) {
                              console.log("something went wrong while saving FCM token");
                            } else {
                              console.log("Saved FCM token successfully ");
                            }
                          } catch (error) {
                            console.log("there was an error saving FCM token", error);
                          }
                    } else {
                        console.log(
                            'No registration token available.'
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.log('An error occurred while retrieving token:', error);
    }
};