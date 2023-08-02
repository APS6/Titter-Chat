'use client'
import { useEffect, useState } from "react";
import MobileBar from "./mobileBar"
import Sidebar from "./Sidebar"

export default function Navigation() {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
          setIsMobile(window.innerWidth <= 768);
        };
    
        window.addEventListener("resize", handleResize);
    
        return () => {
          window.removeEventListener("resize", handleResize);
        };
    }, []);

  if (isMobile){
    return (
        <MobileBar />
    )
  } else {
    return (
        <Sidebar />
    )
  }
}
