export interface Device {
  id: string
  name: string
  description: string
  deviceType: string
  serialNumber: string
  activeDesign: string
  lastReported: string
  fieldData: string
  fieldSoftware: string
  designPublished: number
  remote: boolean
  statusMessage: string
}

export const DEVICES: Device[] = [
  {
    id: '1',
    name: 'SJEC520',
    description: 'aa',
    deviceType: 'EC520',
    serialNumber: 'SJEC520',
    activeDesign: '-',
    lastReported: '-',
    fieldData: '',
    fieldSoftware: '-',
    designPublished: 0,
    remote: true,
    statusMessage: 'Awaiting Status Message',
  },
  {
    id: '2',
    name: 'EC520-2911',
    description: 'EC520-2911',
    deviceType: 'EC520',
    serialNumber: 'EC520-2911',
    activeDesign: '-',
    lastReported: '-',
    fieldData: 'View',
    fieldSoftware: '-',
    designPublished: 2,
    remote: true,
    statusMessage: 'Awaiting Status Message',
  },
  {
    id: '3',
    name: 'GCS900-4501',
    description: 'Dozer D6 - Main site',
    deviceType: 'GCS900',
    serialNumber: 'GCS900-4501',
    activeDesign: 'Sanders Dam v3.2',
    lastReported: 'Apr 4, 2026 2:15 PM',
    fieldData: 'View',
    fieldSoftware: 'v12.87',
    designPublished: 5,
    remote: true,
    statusMessage: 'Online — Last sync 2 min ago',
  },
  {
    id: '4',
    name: 'SPS986-0073',
    description: 'Base station - North ridge',
    deviceType: 'SPS986',
    serialNumber: 'SPS986-0073',
    activeDesign: 'Sanders Dam v3.2',
    lastReported: 'Apr 4, 2026 1:48 PM',
    fieldData: 'View',
    fieldSoftware: 'v6.12',
    designPublished: 3,
    remote: false,
    statusMessage: 'Online — Streaming corrections',
  },
  {
    id: '5',
    name: 'TSC7-1188',
    description: 'Survey controller - Crew A',
    deviceType: 'TSC7',
    serialNumber: 'TSC7-1188',
    activeDesign: 'Topo Survey R4',
    lastReported: 'Apr 3, 2026 5:32 PM',
    fieldData: 'View',
    fieldSoftware: 'v2.40',
    designPublished: 1,
    remote: true,
    statusMessage: 'Offline — Last seen 18h ago',
  },
  {
    id: '6',
    name: 'TD520-0042',
    description: 'Excavator - Pond area',
    deviceType: 'TD520',
    serialNumber: 'TD520-0042',
    activeDesign: 'Sanders Dam v3.2',
    lastReported: 'Apr 4, 2026 11:05 AM',
    fieldData: '',
    fieldSoftware: 'v4.10',
    designPublished: 5,
    remote: true,
    statusMessage: 'Online — Idle',
  },
  {
    id: '7',
    name: 'EC520-3055',
    description: 'Grader - Access road',
    deviceType: 'EC520',
    serialNumber: 'EC520-3055',
    activeDesign: 'Access Rd v1.0',
    lastReported: 'Apr 2, 2026 4:18 PM',
    fieldData: 'View',
    fieldSoftware: '-',
    designPublished: 1,
    remote: false,
    statusMessage: 'Offline — Last seen 2d ago',
  },
]
