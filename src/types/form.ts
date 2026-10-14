export type FormFieldType = 'text' | 'number' | 'date' | 'time' | 'email' | 'phone' | 'yes_no' | 'choice';

export interface FormField {
  _id?: string;
  id?: string;
  label: string;
  key: string;
  question: string;
  required: boolean;
  type: FormFieldType;
  // Allowed answers for a "choice" field.
  options?: string[];
  // Extra guidance for the AI that reads the answer, e.g. "in lakhs".
  hint?: string;
}

export interface Form {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  fields: FormField[];
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface FormResponse {
  success: boolean;
  data: Form[];
}

export interface SingleFormResponse {
  success: boolean;
  data: Form;
}

export interface FormSubmission {
  _id: string;
  form_id: string;
  user_id: string;
  call_id?: any;
  responses: Record<string, any>;
  created_at: string;
  id?: string;
  phone?: string | null;
  status?: 'partial' | 'completed';
  direction?: string | null;
  contact_id?: { id?: string; _id?: string; first_name?: string; last_name?: string; phone_number?: string } | string | null;
}

export interface FormSubmissionsResponse {
  success: boolean;
  data: FormSubmission[];
}


export interface FormResponsesModalProps {
  isOpen: boolean
  onClose: () => void
  formId: string | null
}