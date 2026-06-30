"use client"

import React, { useState } from "react"
import { motion, useAnimation, PanInfo, useMotionValue, useTransform } from "framer-motion"
import { Edit2, Trash2 } from "lucide-react"

interface SwipeableTransactionItemProps {
    children: React.ReactNode
    onEdit: () => void
    onDelete: () => void
    onClick: () => void
    canDelete?: boolean
}

export function SwipeableTransactionItem({
    children,
    onEdit,
    onDelete,
    onClick,
    canDelete = true,
}: SwipeableTransactionItemProps) {
    const controls = useAnimation()
    const x = useMotionValue(0)
    const buttonOpacity = useTransform(x, [0, -30], [0, 1])
    const [isSwipedOpen, setIsSwipedOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Threshold depends on whether we show one or two buttons
    const threshold = canDelete ? -160 : -80

    const onDragStart = () => {
        setIsDragging(true)
    }

    const onDragEnd = (event: any, info: PanInfo) => {
        const isFlick = info.velocity.x < -300
        const isPastThreshold = info.offset.x < -40
        const isClosingFlick = info.velocity.x > 300

        // Use a small timeout to unset dragging so tap doesn't fire immediately
        setTimeout(() => setIsDragging(false), 50)

        // If we are already open, a flick to the right or a drag back should close it
        if (isSwipedOpen) {
            if (isClosingFlick || info.offset.x > 40) {
                controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } })
                setIsSwipedOpen(false)
            } else {
                // Stay open
                controls.start({ x: threshold, transition: { type: "spring", stiffness: 400, damping: 30 } })
            }
            return
        }

        // Handle opening
        if (isFlick || isPastThreshold) {
            controls.start({ x: threshold, transition: { type: "spring", stiffness: 400, damping: 30 } })
            setIsSwipedOpen(true)
        } else {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } })
            setIsSwipedOpen(false)
        }
    }

    const handleTap = () => {
        if (isDragging) return // Don't tap if we were dragging

        if (isSwipedOpen) {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } })
            setIsSwipedOpen(false)
        } else {
            onClick()
        }
    }

    return (
        <div
            className="relative overflow-hidden rounded-[24px] w-full mb-3"
            style={{ touchAction: 'pan-y' }}
        >
            {/* Action Buttons Container - FIXED size and position */}
            <motion.div style={{ opacity: buttonOpacity }} className="absolute inset-y-0 right-0 flex items-center pr-3 gap-3 h-full z-0">
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit();
                        controls.start({ x: 0 });
                        setIsSwipedOpen(false);
                    }}
                    className="w-16 h-[80%] bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-90 transition-all border border-indigo-500/50"
                >
                    <Edit2 className="h-5 w-5" />
                    <span className="text-[10px] font-black uppercase">Edit</span>
                </button>
                {canDelete && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete();
                            controls.start({ x: 0 });
                            setIsSwipedOpen(false);
                        }}
                        className="w-16 h-[80%] bg-red-600 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-90 transition-all border border-red-400/50"
                    >
                        <Trash2 className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase">Delete</span>
                    </button>
                )}
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
                className="relative glass border border-white/30 dark:border-white/10 shadow-md z-10 cursor-pointer rounded-[24px]"            >
                {children}
            </motion.div>
        </div>
    )
}
