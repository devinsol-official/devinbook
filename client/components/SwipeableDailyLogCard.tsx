"use client"

import React, { useState } from "react"
import { motion, useAnimation, PanInfo, useMotionValue, useTransform } from "framer-motion"
import { Edit2 } from "lucide-react"

interface SwipeableDailyLogCardProps {
    children: React.ReactNode
    onModify: () => void
    onClick: () => void
    isLogged: boolean
}

export function SwipeableDailyLogCard({
    children,
    onModify,
    onClick,
    isLogged,
}: SwipeableDailyLogCardProps) {
    const controls = useAnimation()
    const x = useMotionValue(0)
    const buttonOpacity = useTransform(x, [0, -30], [0, 1])
    const [isSwipedOpen, setIsSwipedOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const threshold = -90

    const onDragStart = () => {
        setIsDragging(true)
    }

    const onDragEnd = (event: any, info: PanInfo) => {
        const isFlick = info.velocity.x < -300
        const isPastThreshold = info.offset.x < -40
        const isClosingFlick = info.velocity.x > 300

        setTimeout(() => setIsDragging(false), 50)

        if (isSwipedOpen) {
            if (isClosingFlick || info.offset.x > 40) {
                controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } })
                setIsSwipedOpen(false)
            } else {
                controls.start({ x: threshold, transition: { type: "spring", stiffness: 400, damping: 30 } })
            }
            return
        }

        if (isFlick || isPastThreshold) {
            controls.start({ x: threshold, transition: { type: "spring", stiffness: 400, damping: 30 } })
            setIsSwipedOpen(true)
        } else {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } })
            setIsSwipedOpen(false)
        }
    }

    const handleTap = () => {
        if (isDragging) return

        if (isSwipedOpen) {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } })
            setIsSwipedOpen(false)
        } else {
            onClick()
        }
    }

    return (
        <div
            className="relative overflow-hidden rounded-[32px] w-full mb-4"
            style={{ touchAction: 'pan-y' }}
        >
            {/* Action Button Container */}
            <motion.div style={{ opacity: buttonOpacity }} className="absolute inset-y-0 right-0 flex items-center pr-4 z-0">
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onModify()
                        controls.start({ x: 0 })
                        setIsSwipedOpen(false)
                    }}
                    className="w-16 h-[80%] bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-90 transition-all border border-indigo-500/50"
                >
                    <Edit2 className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase">{isLogged ? "Edit" : "Modify"}</span>
                </button>
            </motion.div>

            {/* The visible card */}
            <motion.div
                drag="x"
                style={{ x }}
                dragDirectionLock
                dragConstraints={{ left: threshold, right: 0 }}
                dragElastic={0.1}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                animate={controls}
                onTap={handleTap}
                className="relative z-10 cursor-pointer rounded-[32px]"
            >
                {children}
            </motion.div>
        </div>
    )
}
