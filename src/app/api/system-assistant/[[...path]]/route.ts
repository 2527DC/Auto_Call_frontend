import { apiHandler } from "@/utils/apiHandler";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  const endpoint = path && path.length > 0 ? `/system-assistant/${path.join("/")}` : "/system-assistant";
  return apiHandler(request, endpoint);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  const endpoint = path && path.length > 0 ? `/system-assistant/${path.join("/")}` : "/system-assistant";
  return apiHandler(request, endpoint);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  const endpoint = path && path.length > 0 ? `/system-assistant/${path.join("/")}` : "/system-assistant";
  return apiHandler(request, endpoint);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  const endpoint = path && path.length > 0 ? `/system-assistant/${path.join("/")}` : "/system-assistant";
  return apiHandler(request, endpoint);
}
