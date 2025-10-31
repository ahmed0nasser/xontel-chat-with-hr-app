import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User, Message, Conversation } from '@/types';

export const getUserById = async (userId: string): Promise<User> => {
  const userDoc = await getDoc(doc(db, 'employees', userId));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const data = userDoc.data();
  return {
    id: userDoc.id,
    username: data.username,
    firstName: data.firstName,
    lastName: data.lastName,
    title: data.title,
    profilePictureUrl: data.profilePictureUrl,
    role: data.role,
    joinedDate: data.joinedDate.toDate(),
    createdAt: data.createdAt.toDate(),
  };
};

export const getHRUser = async (): Promise<User> => {
  const q = query(collection(db, 'employees'), where('role', '==', 'hr'), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('HR user not found');
  }

  const hrDoc = querySnapshot.docs[0];
  const data = hrDoc.data();

  return {
    id: hrDoc.id,
    username: data.username,
    firstName: data.firstName,
    lastName: data.lastName,
    title: data.title,
    profilePictureUrl: data.profilePictureUrl,
    role: data.role,
    joinedDate: data.joinedDate.toDate(),
    createdAt: data.createdAt.toDate(),
  };
};

export const subscribeToMessages = (
  conversationId: string,
  onMessagesUpdate: (messages: Message[]) => void
): (() => void) => {
  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (querySnapshot) => {
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp.toDate(),
        isRead: data.isRead,
      });
    });
    onMessagesUpdate(messages);
  });
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  const messagesRef = collection(conversationRef, 'messages');

  const batch = writeBatch(db);

  batch.set(
    conversationRef,
    {
      lastMessage: text,
      lastMessageTimestamp: Timestamp.now(),
    },
    { merge: true }
  );

  batch.set(doc(messagesRef), {
    senderId,
    text,
    timestamp: Timestamp.now(),
    isRead: false,
  });

  await batch.commit();
};

export const markMessagesAsRead = async (
  conversationId: string
): Promise<void> => {
  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );
  const hrUser = await getHRUser();
  const q = query(
    messagesRef,
    where('senderId', '==', hrUser.id),
    where('isRead', '==', false)
  );

  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.forEach((document) => {
    batch.update(document.ref, { isRead: true });
  });

  await batch.commit();
};

export const subscribeToUnreadCount = (
  conversationId: string,
  onCountUpdate: (count: number) => void
): (() => void) => {
  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );
  
  getHRUser().then(hrUser => {
    const q = query(
      messagesRef,
      where('senderId', '==', hrUser.id),
      where('isRead', '==', false)
    );

    return onSnapshot(q, (querySnapshot) => {
      onCountUpdate(querySnapshot.size);
    });
  });

  return () => {};
};

export const subscribeToConversation = (
  conversationId: string, onConversationUpdate: (conversation: Conversation) => void
): (() => void) => {
  const conversationRef = collection(db, 'conversations', conversationId);
  const q = query(conversationRef);

  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs[0].data();
    const conversation: Conversation = {
        id: querySnapshot.docs[0].id,
        participantNames: data.participantNames,
        lastMessage: data.lastMessage,
        lastMessageTimestamp: data.lastMessageTimestamp.toDate(),
        messages: [], // Messages subcollection is not loaded here
      };
    onConversationUpdate(conversation);
  });
};