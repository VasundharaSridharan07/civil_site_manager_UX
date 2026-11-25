import { useState } from 'react'
import { LeftIconRail } from '../components/three-d/LeftIconRail'
import { ProjectDataPanel } from '../components/three-d/ProjectDataPanel'
import { Project3DCanvas } from '../components/three-d/Project3DCanvas'
import { ProjectTimeline } from '../components/three-d/ProjectTimeline'

export const Project3DViewer = () => {
  const [terrainVisible, setTerrainVisible] = useState(true)
  const [timelineOpen, setTimelineOpen] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
      }}
    >
      <LeftIconRail />
      {timelineOpen ? (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: '0 0 60%', minHeight: 0, display: 'flex' }}>
            <Project3DCanvas terrainVisible={terrainVisible} />
          </div>
          <div style={{ flex: '0 0 40%', minHeight: 0, display: 'flex' }}>
            <ProjectTimeline onClose={() => setTimelineOpen(false)} />
          </div>
        </div>
      ) : (
        <>
          <ProjectDataPanel
            terrainVisible={terrainVisible}
            onToggleTerrain={() => setTerrainVisible((v) => !v)}
            onOpenTimeline={() => setTimelineOpen(true)}
          />
          <Project3DCanvas terrainVisible={terrainVisible} />
        </>
      )}
    </div>
  )
}
