import { useState } from 'react'
import { Button, Icon, Navbar, Select } from '../components/ui'
import { ProjectCard } from '../components/ProjectCard'
import { PROJECTS, REGION_OPTIONS } from '../data/projects'

type ViewMode = 'grid' | 'list' | '3d'

export const ConnectHome = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [region, setRegion] = useState('north-america')

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--modus-wc-color-base-page)',
      }}
    >
      <Navbar
        appName="Trimble Connect"
        userName="Vasundhara Sridharan"
        userEmail="vs@trimble.com"
        showThemeSwitcher
      />

      <div className="page-content">
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '48px',
            flexShrink: 0,
            marginBottom: '16px',
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
                pressed={viewMode === '3d'}
                ariaLabel="3D view"
                onClick={() => setViewMode('3d')}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  3D
                </span>
              </Button>
            </div>

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
            bordered={false}
            onChange={setRegion}
          />
        </div>

        {/* Project cards grid */}
        <div className="project-grid">
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.id}
              name={project.name}
              imageUrl={project.imageUrl}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
