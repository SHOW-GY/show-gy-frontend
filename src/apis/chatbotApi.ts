import axios from 'axios';

const AI_URL = 'http://127.0.0.1:7001';

interface ChatbotRequest {
  thread_id: string;
  action: string;
  message: string;
  document: string;
  topic_id: string;
}

interface ChatbotResponse {
  session: string;
  data: {
    additionalProp1: object;
  };
}

export const sendChatbotMessage = async (
  message: string,
  threadId: string = 'default',
  action: string = 'chat',
  document: string = '',
  topicId: string = ''
): Promise<ChatbotResponse> => {
  const requestBody: ChatbotRequest = {
    thread_id: threadId,
    action: action,
    message: message,
    document: document,
    topic_id: topicId,
  };

  const response = await axios.post<ChatbotResponse>(
    `${AI_URL}/api/v1/chatbot/request_temp`,
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
