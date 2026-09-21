import { useEffect, useRef } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { useDataStore } from '@/store/dataStore'

const TICK_MS = 200

export function useSimulationEngine() {
  const lastTick = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTick.current
      lastTick.current = now
      useSimulationStore.getState().tick(delta)

      const activeContainerId = useSimulationStore.getState().activeContainerId
      const activeVesselId = useDataStore.getState().containers.find((c) => c.id === activeContainerId)?.vesselId
      useDataStore.getState().driftVessels(delta, activeVesselId ? [activeVesselId] : [])
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [])
}
