"use client"

import { useEffect, useState } from "react"

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
      className={`fixed bottom-16 right-4 p-2 bg-primary rounded-full transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={scrollToTop}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        stroke="currentColor"
        className="h-5 w-5"
        fillRule="evenodd" 
        clipRule="evenodd">
        <path d="M12 7C12.2652 7 12.5196 7.10536 12.7071 7.29289L19.7071 14.2929C20.0976 14.6834 20.0976 15.3166 19.7071 15.7071C19.3166 16.0976 18.6834 16.0976 18.2929 15.7071L12 9.41421L5.70711 15.7071C5.31658 16.0976 4.68342 16.0976 4.29289 15.7071C3.90237 15.3166 3.90237 14.6834 4.29289 14.2929L11.2929 7.29289C11.4804 7.10536 11.7348 7 12 7Z"/>
      </svg>
    </button>
  )
}

export default ScrollToTopButton