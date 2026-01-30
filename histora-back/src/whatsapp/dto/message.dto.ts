// DTOs for sending messages via Meta API

export interface SendTextMessageDto {
  to: string;
  text: string;
}

export interface SendButtonsMessageDto {
  to: string;
  text: string;
  buttons: string[]; // Max 3 buttons, 20 chars each
}

export interface SendListMessageDto {
  to: string;
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttonText: string;
  sections: {
    title: string;
    rows: {
      id: string;
      title: string;
      description?: string;
    }[];
  }[];
}

export interface SendTemplateMessageDto {
  to: string;
  templateName: string;
  languageCode: string;
  components?: {
    type: 'header' | 'body' | 'button';
    parameters: {
      type: 'text' | 'image' | 'document';
      text?: string;
      image?: { link: string };
    }[];
  }[];
}

// Internal types
export interface ParsedIncomingMessage {
  from: string;
  waMessageId: string;
  type: 'text' | 'interactive' | 'button' | 'other';
  text: string;
  contactName?: string;
  timestamp: Date;
}

export interface AIResponse {
  text: string;
  buttons?: string[];
  capturedData?: Record<string, string>;
  intent?: string;
  shouldEscalate?: boolean;
  escalationReason?: string;
}
