export interface EventWebhook {
    id: string;
    name: string;
    endpoint_url: string;
    events: string[];
    is_active: boolean;
    // Signs each delivery (X-Voxeno-Signature header).
    secret?: string;
    // Call transcripts are personal data: only sent when this is on.
    include_transcript?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface WebhooksResponse {
    success: boolean;
    data: EventWebhook[];
    pagination: {
        total: number;
        page: number;
        pages: number;
    };
}

export interface EventWebhookModalProps {
    isOpen: boolean
    onClose: () => void
    webhookToEdit?: EventWebhook
}