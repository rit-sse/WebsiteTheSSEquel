"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // if the user scrolls down, show the button
    const toggleVisibility = () => {
      // button should not appear in mobile view
      if(window.innerWidth > 640) {
        window.scrollY > 400 ? setIsVisible(true) : setIsVisible(false)
      } else {
        setIsVisible(false)
      }
    }
    // listen for scroll events
    window.addEventListener("scroll", toggleVisibility)

    // clear the listener on component unmount
    return () => {
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  // handles the animation when scrolling to the top
  const scrollToTop = () => {
    isVisible &&
      window.scrollTo({
        top: 0,
        behavior: "auto",
      })
  }

  return (
    <button
      className={`fixed bottom-16 right-4 p-2 rounded-full border border-border/60 bg-muted/80 text-foreground shadow-sm transition-opacity duration-200 hover:bg-muted ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  )
}

export default ScrollToTopButton