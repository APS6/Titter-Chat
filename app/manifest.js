export default function manifest() {
    return {
        name: "Titter Chat",
        short_name: "Titter",
        description: "Titter Chat the birb app. Titter is a new birb chat app which is completely different than its competitors twitter, discord and threads? Titter is just better than all of them. By Anirudha Pratap Sah",
        start_url: "/Home",
        display: "standalone",
        icons: [
            {
                "src": "/android-chrome-192x192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/android-chrome-512x512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ],
        background_color: "#161616",
        categories: ["social"],
        orientation: "portrait",
        theme_color: "#7228bd",
        shortcuts: [
            {
                "name": "Home",
                "url": "/Home"
            },
            {
                "name": "Direct Messages",
                "url": "/DMs"
            }
        ]
    }
}