import { apiHandler } from '@/utils/apiHandler'
import { NextRequest } from 'next/server'

// Every whatsapp-automations endpoint goes to the backend unchanged.
type Ctx = { params: Promise<{ path: string[] }> }
const proxy = async (request: NextRequest, { params }: Ctx) => {
  const { path } = await params
  return apiHandler(request, `/whatsapp-automations/${path.map(encodeURIComponent).join('/')}`)
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE }
