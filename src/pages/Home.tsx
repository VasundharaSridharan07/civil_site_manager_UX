import { useState } from 'react'
import { Button, Icon, Select } from '../components/ui'
import { ProjectCard } from '../components/ProjectCard'

const REGION_OPTIONS = [
  { label: 'North America', value: 'north-america' },
  { label: 'Europe', value: 'europe' },
  { label: 'Asia Pacific', value: 'asia-pacific' },
]

const PROJECTS = [
  {
    id: '1',
    name: 'Sanders Dam Project',
    account: 'Sanderson Account',
    imageUrl: 'https://www.figma.com/api/mcp/asset/dd3d393b-c90b-4e11-a171-236ac234b8ca',
  },
  {
    id: '2',
    name: 'Green Line Phase 2',
    account: 'Sanderson Account',
    imageUrl: 'https://www.figma.com/api/mcp/asset/b50dd6ef-3b57-41f1-bb5a-0452cfac7f4a',
  },
  {
    id: '3',
    name: 'Summit Dam Fix',
    account: 'Turner Construction',
    imageUrl: 'https://www.figma.com/api/mcp/asset/71f09f6b-21bc-4d62-be4b-0770b2c2faa2',
  },
  {
    id: '4',
    name: 'East Flood Works',
    account: 'Turner Construction',
    imageUrl: 'https://www.figma.com/api/mcp/asset/aee1ef82-6ffa-45e6-b102-00888293be12',
  },
  {
    id: '5',
    name: 'Bassin Project',
    account: 'Sanderson Account',
    imageUrl: 'https://www.figma.com/api/mcp/asset/9b6f9540-2e95-469e-8f87-326a24b2fb99',
  },
  {
    id: '6',
    name: "David's Project",
    account: 'Sanderson Account',
    imageUrl: 'https://www.figma.com/api/mcp/asset/dd3d393b-c90b-4e11-a171-236ac234b8ca',
  },
  {
    id: '7',
    name: 'Riverway Extension',
    account: 'Sanderson Account',
    imageUrl: 'https://www.figma.com/api/mcp/asset/71f09f6b-21bc-4d62-be4b-0770b2c2faa2',
  },
]

type ViewMode = 'grid' | 'list' | 'map'

export const Home = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [region, setRegion] = useState('north-america')

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'var(--modus-wc-color-base-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingTop: '48px',
        paddingLeft: '80px',
        paddingRight: '80px',
        paddingBottom: '48px',
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '48px',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 400,
            lineHeight: '36px',
            color: 'var(--modus-wc-color-base-content)',
          }}
        >
          My Projects
        </h2>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* View toggle + utility icon buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="borderless"
              color="tertiary"
              shape="square"
              pressed={viewMode === 'grid'}
              ariaLabel="Grid view"
              onClick={() => setViewMode('grid')}
            >
              <Icon name="view_grid" variant="solid" decorative size="sm" />
            </Button>
            <Button
              variant="borderless"
              color="tertiary"
              shape="square"
              pressed={viewMode === 'list'}
              ariaLabel="List view"
              onClick={() => setViewMode('list')}
            >
              <Icon name="format_list_bulleted" decorative size="sm" />
            </Button>
            <Button
              variant="borderless"
              color="tertiary"
              shape="square"
              pressed={viewMode === 'map'}
              ariaLabel="Map view"
              onClick={() => setViewMode('map')}
            >
              <Icon name="map_marker" variant="solid" decorative size="sm" />
            </Button>
            <Button
              variant="borderless"
              color="tertiary"
              shape="square"
              ariaLabel="Filter"
              onClick={() => {}}
            >
              <Icon name="filter_list" decorative size="sm" />
            </Button>
            <Button
              variant="borderless"
              color="tertiary"
              shape="square"
              ariaLabel="Export"
              onClick={() => {}}
            >
              <Icon name="upload" decorative size="sm" />
            </Button>
          </div>

          {/* Primary action — only one per page */}
          <Button color="primary" onClick={() => {}}>
            New
          </Button>
        </div>
      </div>

      {/* Region filter */}
      <div style={{ width: '180px', flexShrink: 0 }}>
        <Select
          options={REGION_OPTIONS}
          value={region}
          onChange={setRegion}
        />
      </div>

      {/* Project cards grid */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '50px',
          paddingTop: '12px',
          paddingBottom: '12px',
        }}
      >
        {PROJECTS.map((project) => (
          <ProjectCard
            key={project.id}
            name={project.name}
            account={project.account}
            imageUrl={project.imageUrl}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  )
}
