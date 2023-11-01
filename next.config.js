/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com"
            }
        ],
        domains: ['uploadthing.com']
    }
}

module.exports = nextConfig
