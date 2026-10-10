export interface SystemAssistantPublicConfig {
  is_enabled: boolean;
  bot_name: string;
  welcome_message: string;
  suggested_prompts: string[];
}

export interface SystemAssistantAdminConfig {
  _id?: string;
  id?: string;
  is_enabled: boolean;
  bot_name: string;
  welcome_message: string;
  ai_provider: 'gemini' | 'openai' | 'anthropic';
  ai_model: string;
  custom_api_key?: string;
  custom_api_key_set?: boolean;
  temperature: number;
  system_prompt: string;
  suggested_prompts: string[];
  updated_at?: string;
}

export interface SystemAssistantKnowledge {
  _id: string;
  id: string;
  title: string;
  category: 'workflow_nodes' | 'flows' | 'contacts' | 'campaigns' | 'voice_agents' | 'phone_numbers' | 'settings' | 'general' | 'troubleshooting';
  route_match: string[];
  content: string;
  tags: string[];
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface ChatRequest {
  message: string;
  conversation_history?: { role: 'user' | 'assistant'; content: string }[];
  current_path?: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    reply: string;
    sources: string[];
  };
}

export interface KnowledgeListResponse {
  success: boolean;
  data: {
    articles: SystemAssistantKnowledge[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
