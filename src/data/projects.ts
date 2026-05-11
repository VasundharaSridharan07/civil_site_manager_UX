export interface Project {
  id: string
  name: string
  account: string
  imageUrl: string
  region: string
}

export const PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Sanders Dam Project',
    account: 'Sanderson Account',
    imageUrl: '/projects/sanders-dam.jpg',
    region: 'north-america',
  },
  {
    id: '2',
    name: 'Green Line Phase 2',
    account: 'Sanderson Account',
    imageUrl: '/projects/green-line.jpg',
    region: 'north-america',
  },
  {
    id: '3',
    name: 'Summit Dam Fix',
    account: 'Turner Construction',
    imageUrl: '/projects/summit-dam.jpg',
    region: 'north-america',
  },
  {
    id: '4',
    name: 'East Flood Works',
    account: 'Turner Construction',
    imageUrl: '/projects/east-flood.jpg',
    region: 'north-america',
  },
  {
    id: '5',
    name: 'Survey Project',
    account: 'Sanderson Account',
    imageUrl: '/projects/survey.png',
    region: 'north-america',
  },
  {
    id: '6',
    name: 'Central Tunnel',
    account: 'Turner Construction',
    imageUrl: '/projects/central-tunnel.png',
    region: 'north-america',
  },
  {
    id: '7',
    name: 'SketchUp Project 01',
    account: 'Sanderson Account',
    imageUrl: '/projects/sketchup-01.png',
    region: 'north-america',
  },
  {
    id: '8',
    name: 'Bassin Project',
    account: 'Sanderson Account',
    imageUrl: '/projects/bassin.jpg',
    region: 'north-america',
  },
  {
    id: '9',
    name: "David's Project",
    account: 'Sanderson Account',
    imageUrl: '/projects/sanders-dam.jpg',
    region: 'north-america',
  },
  {
    id: '10',
    name: 'Riverway Extension',
    account: 'Sanderson Account',
    imageUrl: '/projects/summit-dam.jpg',
    region: 'north-america',
  },
]

export const REGION_OPTIONS = [
  { label: 'North America', value: 'north-america' },
  { label: 'Europe', value: 'europe' },
  { label: 'Asia Pacific', value: 'asia-pacific' },
]
