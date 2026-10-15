import { PhoneNumber } from "./phone-number";

export interface Voice {
  id: string;
  voice_id: string;
  name: string;
  provider: string;
  category: string;
  preview_url: string | null;
  labels: {
    gender: string | null;
    age: string | null;
    accent: string | null;
    description: string | null;
  };
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface VoiceResponse {
  success: boolean;
  data: Voice[];
}

export interface VoiceCardProps {
  voice: Voice
  // Admins get a switch to show or hide the voice for clients.
  canManage?: boolean
}

export interface VoiceModel {
  model_id: string
  name: string
  description: string | null
  languages: { id: string; name: string }[]
  deprecated: boolean
  realtime: boolean | null
  price_per_1k_chars_usd: number | null
  allowed: boolean
  is_default: boolean
}

export interface VoiceModelsResponse {
  success: boolean
  data: { elevenlabs: VoiceModel[] }
}

// Masked except the last 4 characters; '' when the client has no key.
export interface ClientProviderKeys {
  elevenlabs_api_key?: string
  deepgram_api_key?: string
  sarvam_ai_api_key?: string
  plivo_auth_id?: string
  plivo_auth_token?: string
  plivo_app_id?: string
}

export interface AssignAgentModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: PhoneNumber | null
  onSubmit: (values: { agent_id: string | null }) => Promise<void>
  isLoading?: boolean
}