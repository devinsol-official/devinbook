"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCurrency } from "@/contexts/CurrencyContext"

interface CategoryData {
    name: string
    value: number
    color: string
}

interface CategoryPieChartProps {
    data: CategoryData[]
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    const { currency } = useCurrency()
    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground font-medium italic">
                No data for this period
            </div>
        )
    }

    const totalAmount = data.reduce((sum, item) => sum + item.value, 0)

    const chartConfig = data.reduce((acc, curr, index) => {
        acc[curr.name] = {
            label: curr.name,
            color: curr.color,
        }
        return acc
    }, {} as any)

    return (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={85}
                        outerRadius={130}
                        paddingAngle={4}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                        cornerRadius={8}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                        <Label
                            content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                    return (
                                        <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            <tspan
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                className="fill-foreground text-2xl font-black"
                                            >
                                                {totalAmount.toLocaleString()}
                                            </tspan>
                                            <tspan
                                                x={viewBox.cx}
                                                y={(viewBox.cy || 0) + 20}
                                                className="fill-muted-foreground text-xs font-bold uppercase tracking-widest"
                                            >
                                                Total
                                            </tspan>
                                        </text>
                                    )
                                }
                            }}
                        />
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-background/95 backdrop-blur-sm border rounded-2xl p-3 shadow-2xl skew-y-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full" style={{ background: payload[0].payload.color }} />
                                            <p className="font-black text-xs uppercase tracking-widest text-muted-foreground">
                                                {payload[0].name}
                                            </p>
                                        </div>
                                        <p className="font-black text-xl">{payload[0].value.toLocaleString()} <span className="text-xs text-muted-foreground font-bold">{currency}</span></p>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
    )
}
