import admin from "firebase-admin"

import serviceAccount from "./serviceAccount";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
export default admin