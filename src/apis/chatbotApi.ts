import axios from 'axios';

const AI_URL = 'http://127.0.0.1:7001';

interface ChatbotRequest {
  thread_id: string;
  action: string;
  query: string;
  document: string;
  json_document?: any;
  topic_id?: string | null;
  negative_id?: string | null;
}

interface ChatbotResponse {
  session?: string;
  status?: string;
  response_type?: string;
  message?: string | null;
  title?: string | null;
  thread_id?: string;
  data?: any;
}

export const sendChatbotMessage = async (
  message: string,
  threadId: string = 'default',
  action: string = 'first',
  document: string = '',
  topicId: string = '',
  negativeId: string = ''
): Promise<ChatbotResponse> => {
  const requestBody: ChatbotRequest = {
    thread_id: threadId,
    action: action,
    query: message,
    document: document,
    json_document: null,
    topic_id: topicId || null,
    negative_id: negativeId || null,
  };

  const response = await axios.post<ChatbotResponse>(
    `${AI_URL}/api/v1/chatbot/request`,
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
