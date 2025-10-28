import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

// REPLACE this dummy firebaseConfig
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  {
    username: 'hr.manager',
    password: 'hrpassword123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    title: 'HR Manager',
    profilePictureUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
    role: 'hr',
    joinedDate: new Date('2022-01-15'),
  },
  {
    username: 'john.doe',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    title: 'Software Engineer',
    profilePictureUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
    role: 'employee',
    joinedDate: new Date('2023-06-20'),
  },
];

async function seedUsers() {
  console.log('Starting user seeding...');
  const userIds: { [key: string]: string } = {};

  for (const userData of users) {
    try {
      const email = `${userData.username}@chatapp.com`;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        userData.password
      );

      const userId = userCredential.user.uid;
      userIds[userData.username] = userId;

      await setDoc(doc(db, 'employees', userId), {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        title: userData.title,
        profilePictureUrl: userData.profilePictureUrl,
        role: userData.role,
        joinedDate: Timestamp.fromDate(userData.joinedDate),
        createdAt: Timestamp.now(),
      });

      console.log(`Created user: ${userData.username} (${userId})`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${userData.username} already exists, skipping...`);
      } else {
        console.error(`Error creating user ${userData.username}:`, error);
      }
    }
  }

  return userIds;
}

async function seedConversations(userIds: { [key: string]: string }) {
  console.log('\nStarting conversation seeding...');

  if (!userIds['hr.manager'] || !userIds['john.doe']) {
    console.log('User IDs not found, skipping conversation seeding');
    return;
  }

  const hrId = userIds['hr.manager'];
  const johnId = userIds['john.doe'];
  const conversationRef = doc(db, 'conversations', johnId);
  await setDoc(conversationRef, {
    participantNames: ['Sarah Johnson', 'John Doe'],
    lastMessage: "That's wonderful to hear! If you need anything, feel free to reach out.",
    lastMessageTimestamp: Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)),
  });

  const messagesRef = collection(conversationRef, 'messages');
  const messages = [
    {
      senderId: hrId,
      text: 'Hi John! Welcome to the team. How are you settling in?',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
      isRead: true,
    },
    {
      senderId: johnId,
      text: 'Thank you Sarah! Everything is going great so far.',
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1.5 * 60 * 60 * 1000)),
      isRead: true,
    },
    {
      senderId: hrId,
      text: "That's wonderful to hear! If you need anything, feel free to reach out.",
      timestamp: Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000)),
      isRead: false,
    },
  ];

  for (const message of messages) {
    try {
      await addDoc(messagesRef, message);
      console.log('Created message:', message.text.substring(0, 30) + '...');
    } catch (error) {
      console.error('Error creating message:', error);
    }
  }
}

async function main() {
  console.log('Firebase Seeding Script');
  console.log('======================\n');
  console.log('IMPORTANT: Replace the Firebase config above with your actual Firebase project credentials before running this script!\n');

  try {
    const userIds = await seedUsers();
    await seedConversations(userIds);

    console.log('\n======================');
    console.log('Seeding completed successfully!');
    console.log('======================\n');

    console.log('Demo Credentials:');
    console.log('Username: john.doe');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

main();
