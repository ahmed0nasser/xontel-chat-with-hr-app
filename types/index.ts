export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName:string;
  title: string;
  profilePictureUrl: string;
  role: 'employee' | 'hr';
  joinedDate: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  isRead: boolean;
  timestamp: Date;
}

export interface Conversation {
  id:string;
  participantNames: [string, string];
  lastMessage: string;
  lastMessageTimestamp: Date;
  messages: Message[];
}