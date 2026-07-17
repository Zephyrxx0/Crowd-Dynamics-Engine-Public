"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import * as THREE from "three"
import { useScenarioStore } from "@/hooks/useScenarioStore"
import { useMemo } from "react"

const SEVERITY_SCORES: Record<string, number> = { green: 1, amber: 2, red: 3, critical: 4 }
const SEVERITY_COLORS: Record<string, string> = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  critical: "#991b1b",
}

function Pitch() {
  return (
    <group position={[0, 0, 0]}>
      {/* Field base */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[7.2, 0.1, 4.7]} />
        <meshStandardMaterial color="#064e3b" roughness={0.9} /> {/* Emerald 900 */}
      </mesh>
      
      {/* Pitch Lines */}
      <group position={[0, 0.105, 0]}>
        {/* Outer Bounds */}
        <mesh position={[0, 0, -2.15]} receiveShadow><boxGeometry args={[6.8, 0.02, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 0, 2.15]} receiveShadow><boxGeometry args={[6.8, 0.02, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[-3.4, 0, 0]} receiveShadow><boxGeometry args={[0.06, 0.02, 4.36]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[3.4, 0, 0]} receiveShadow><boxGeometry args={[0.06, 0.02, 4.36]} /><meshStandardMaterial color="#ffffff" /></mesh>

        {/* Center line */}
        <mesh position={[0, 0, 0]} receiveShadow><boxGeometry args={[0.06, 0.02, 4.36]} /><meshStandardMaterial color="#ffffff" /></mesh>

        {/* Center circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <torusGeometry args={[0.6, 0.03, 16, 64]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* Left Penalty Box */}
        <mesh position={[-2.2, 0, 0]} receiveShadow><boxGeometry args={[0.06, 0.02, 2.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[-2.8, 0, -1.0]} receiveShadow><boxGeometry args={[1.2, 0.02, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[-2.8, 0, 1.0]} receiveShadow><boxGeometry args={[1.2, 0.02, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>

        {/* Right Penalty Box */}
        <mesh position={[2.2, 0, 0]} receiveShadow><boxGeometry args={[0.06, 0.02, 2.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[2.8, 0, -1.0]} receiveShadow><boxGeometry args={[1.2, 0.02, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
        <mesh position={[2.8, 0, 1.0]} receiveShadow><boxGeometry args={[1.2, 0.02, 0.06]} /><meshStandardMaterial color="#ffffff" /></mesh>
      </group>
    </group>
  )
}

function Grandstand({ position, rotation, color, length, label }: { position: [number, number, number], rotation: [number, number, number], color: string, length: number, label: string }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Tier 1 */}
      <mesh position={[0, 0.2, -0.25]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.4, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Tier 2 */}
      <mesh position={[0, 0.4, -0.75]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.8, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Tier 3 */}
      <mesh position={[0, 0.6, -1.25]} castShadow receiveShadow>
        <boxGeometry args={[length, 1.2, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Back Wall */}
      <mesh position={[0, 0.8, -1.6]} castShadow receiveShadow>
        <boxGeometry args={[length, 1.6, 0.2]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Floating Banner */}
      <Text
        position={[0, 2.0, -1.6]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        letterSpacing={0.1}
      >
        {label}
      </Text>
    </group>
  )
}

function CornerPillar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, 2.0, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#ffedd5" emissive="#f97316" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  )
}

function StadiumScene() {
  const latestOutput = useScenarioStore((state) => state.latestSimulationOutput)

  const zoneColors = useMemo(() => {
    const defaultColor = "#334155" // Slate-700 for a permanently visible greyed-out state
    const colors: Record<string, string> = { north: defaultColor, south: defaultColor, east: defaultColor, west: defaultColor }
    
    if (!latestOutput) return colors

    const ranks: Record<string, number> = {}

    latestOutput.phaseZoneMatrix.forEach(row => {
      const score = SEVERITY_SCORES[row.occupancySeverity] || 0
      if (!ranks[row.zoneId] || score > ranks[row.zoneId]) {
        ranks[row.zoneId] = score
        colors[row.zoneId] = SEVERITY_COLORS[row.occupancySeverity as keyof typeof SEVERITY_COLORS] || defaultColor
      }
    })

    return colors
  }, [latestOutput])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} color="#38bdf8" />

      <Pitch />

      {/* 4 Grandstands with increased spacing and corrected East/West rotation */}
      <Grandstand position={[0, 0, -2.8]} rotation={[0, 0, 0]} color={zoneColors.north} length={7.2} label="NORTH" />
      <Grandstand position={[0, 0, 2.8]} rotation={[0, Math.PI, 0]} color={zoneColors.south} length={7.2} label="SOUTH" />
      <Grandstand position={[4.0, 0, 0]} rotation={[0, -Math.PI / 2, 0]} color={zoneColors.east} length={4.5} label="EAST" />
      <Grandstand position={[-4.0, 0, 0]} rotation={[0, Math.PI / 2, 0]} color={zoneColors.west} length={4.5} label="WEST" />

      {/* 4 Corner Light Pillars pushed out slightly */}
      <CornerPillar position={[-4.5, 0, -3.2]} />
      <CornerPillar position={[4.5, 0, -3.2]} />
      <CornerPillar position={[-4.5, 0, 3.2]} />
      <CornerPillar position={[4.5, 0, 3.2]} />

      {/* Base Floor (dark ground plane) */}
      <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#020617" roughness={1} />
      </mesh>

      <OrbitControls enableDamping autoRotate autoRotateSpeed={0.4} maxPolarAngle={Math.PI / 2 - 0.05} />
    </>
  )
}

export default function ThreeStadium() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617]">
      {/* Live 3D Render Overlay */}
      <div className="absolute top-4 left-4 z-10 border border-orange-500/50 bg-orange-950/40 text-orange-500 text-[10px] px-2 py-1 font-mono tracking-widest uppercase rounded-sm backdrop-blur-sm">
        Live 3D Render
      </div>
      <Canvas camera={{ position: [8, 7, 8], fov: 45 }} shadows>
        <StadiumScene />
      </Canvas>
    </div>
  )
}
