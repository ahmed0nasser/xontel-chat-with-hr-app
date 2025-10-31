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
  onMessagesUpdate: (messages: Message[]) => void,
  options: { markAsRead: boolean; userId?: string } = { markAsRead: false }
): (() => void) => {
  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, async (querySnapshot) => {
    const messages: Message[] = [];
    const batch = writeBatch(db);
    let performUpdate = false;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let messageIsRead = data.isRead;

      if (
        options.markAsRead &&
        options.userId &&
        data.senderId !== options.userId &&
        !data.isRead
      ) {
        batch.update(doc.ref, { isRead: true });
        performUpdate = true;
        messageIsRead = true; // Optimistic update for the UI
      }

      messages.push({
        id: doc.id,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp.toDate(),
        isRead: messageIsRead,
      });
    });

    if (performUpdate) {
      await batch.commit();
    }

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
  conversationId: string,
  onConversationUpdate: (conversation: Conversation) => void
): (() => void) => {
  const conversationRef = doc(db, 'conversations', conversationId);

  return onSnapshot(conversationRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const conversation: Conversation = {
        id: docSnap.id,
        participantNames: data.participantNames,
        lastMessage: data.lastMessage,
        lastMessageTimestamp: data.lastMessageTimestamp.toDate(),
        messages: [], // Messages subcollection is not loaded here
      };
      onConversationUpdate(conversation);
    }
  });
};