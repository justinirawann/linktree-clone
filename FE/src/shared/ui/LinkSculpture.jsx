import { LazyMotion, domAnimation, useReducedMotion, useSpring } from 'motion/react'
import { div as MotionDiv } from 'motion/react-m'
import { ArrowUpRight, Camera, ShoppingBag, Sparkle } from 'lucide-react'
import './link-sculpture.css'

const TILT_SPRING = { stiffness: 145, damping: 22 }

export function LinkSculpture() {
  const reducedMotion = useReducedMotion()
  const rotateX = useSpring(0, TILT_SPRING)
  const rotateY = useSpring(0, TILT_SPRING)

  function followPointer(event) {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    rotateX.set((0.5 - (event.clientY - bounds.top) / bounds.height) * 16)
    rotateY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 22)
  }

  function center() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <div
      className="sculpture"
      aria-hidden="true"
      onPointerMove={followPointer}
      onPointerLeave={center}
    >
      <div className="sculpture-orbit" />
      <LazyMotion features={domAnimation} strict>
        <MotionDiv
          className="sculpture-assembly"
          style={reducedMotion ? undefined : { rotateX, rotateY }}
        >
          <img
            className="sculpture-chain"
            src="/linkfy-chain.webp"
            alt=""
            width="960"
            height="960"
            fetchPriority="high"
            draggable="false"
          />
          <div className="sculpture-tag sculpture-shop">
            <i>
              <ShoppingBag size={18} />
            </i>{' '}
            Toko online <ArrowUpRight size={13} />
          </div>
          <div className="sculpture-tag sculpture-portfolio">
            <i>
              <Camera size={18} />
            </i>{' '}
            Portofolio <ArrowUpRight size={13} />
          </div>
          <Sparkle className="sculpture-star" strokeWidth={1.4} />
        </MotionDiv>
      </LazyMotion>
    </div>
  )
}
