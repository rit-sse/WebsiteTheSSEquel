"use client"
import { useEffect, useRef, useState } from "react"


const WinterBall = () => {
  const [sliderText, setSliderText] = useState("")
  const diffRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)


  useEffect(() => {
    const diffElement = diffRef.current;
    if (!diffElement) {
      return
    }


    const slider = diffElement.querySelector(".diff-resizer")
    if (!slider) {
      return
    } 


    const updateTextBasedOnPosition = (e: MouseEvent) => {
      if (!isDragging.current) {
        return
      }


      const diffRect = diffElement.getBoundingClientRect()
      const sliderPosition = e.clientX - diffRect.left
      const diffWidth = diffRect.width


      if (sliderPosition < diffWidth / 3) {
        setSliderText("WINTER BALL TEXT AND STUFF")
      } 
      else if (sliderPosition < diffWidth * 3) {
        setSliderText("HI CHRISTIAN AND TESS")
      }
    }


    const startDrag = () => {
      isDragging.current = true
      document.addEventListener("mousemove", updateTextBasedOnPosition)
    }


    const stopDrag = () => {
      isDragging.current = false
      document.removeEventListener("mousemove", updateTextBasedOnPosition)
    }


    slider.addEventListener("mousedown", startDrag)
    document.addEventListener("mouseup", stopDrag)


    return () => {
      slider.removeEventListener("mousedown", startDrag)
      document.removeEventListener("mouseup", stopDrag)
      document.removeEventListener("mousemove", updateTextBasedOnPosition)
    }
  },
    [])
  return (
    <>
      <div ref={diffRef} className="diff lg:h-72 lg:aspect-[16/9] sm:aspect-[16/9]">
        <div className="diff-item-1">
          <div className="bg-primary text-primary-content font-black grid place-content-center text-4xl sm:text-9xl">Winter Ball</div>
        </div>
        <div className="diff-item-2">
          <div className="bg-base-200 font-black grid place-content-center text-4xl sm:text-9xl">Spring Fling</div>
        </div>
        <div className="diff-resizer"></div>
      </div>
      <h1>{sliderText}</h1>
    </>
  )
}


export default WinterBall
