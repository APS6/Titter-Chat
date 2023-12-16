'use client'
import { initFirebase } from "@/firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

export default async function retrieveToken(accessToken) {
    const firebaseApp = initFirebase()
    try {
        if (typeof window != 'undefined' && navigator?.serviceWorker) {
            const messaging = getMessaging(firebaseApp);

            // Retrieve the notification permission status
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
            }
            // Check if permission is granted before retrieving the token
            if (permission === 'granted' || Notification.permission === 'granted') {
                const currentToken = await getToken(messaging, {
                    vapidKey:
                        'BLwYfECvEYwvoWZNyzQYlX3GqnOaqW754d8Vg8u-45x3_hYSsVoS0UNqsC3l3Yt8KVRfgYHbTazEEk7AdQM2vis',
                });

                if (currentToken) {
                    console.log(currentToken)
                    const body = {
                        token: currentToken,
                    };
                    try {
                        await fetch("/api/saveFCMToken", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: accessToken,
                            },
                            body: JSON.stringify(body),
                        });
                        window.localStorage.setItem("lastRefreshed", Date.now())
                    } catch (error) {
                        console.log("there was an error saving FCM token", response.error);
                    }
                } else {
                    console.log(
                        'No registration token available.'
                    );
                }
            }
        }
    } catch (error) {
        console.log('An error occurred while retrieving token:', error);
    }
};