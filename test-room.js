import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

// Test user credentials - use timestamp to ensure unique users
const timestamp = Date.now();
const testUser1 = {
  email: `test1${timestamp}@example.com`,
  password: 'password123',
  name: 'Test User 1'
};

const testUser2 = {
  email: `test2${timestamp}@example.com`, 
  password: 'password123',
  name: 'Test User 2'
};

let user1Token = '';
let user2Token = '';
let roomCode = '';

async function testRoomFlow() {
  try {
    console.log('=== Testing Room Creation and Joining ===\n');

    // Register and login user 1
    console.log('1. Registering User 1...');
    try {
      const registerRes = await axios.post(`${API_BASE}/auth/register`, testUser1);
      console.log('User 1 registered successfully');
    } catch (error) {
      console.log('User 1 registration failed:', error.response?.data || error.message);
      throw error;
    }

    console.log('2. Logging in User 1...');
    const user1LoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser1.email,
      password: testUser1.password
    });
    user1Token = user1LoginRes.data.token;
    console.log('User 1 logged in successfully');
    console.log('User 1 Token:', user1Token);

    // Register and login user 2
    console.log('3. Registering User 2...');
    try {
      const registerRes2 = await axios.post(`${API_BASE}/auth/register`, testUser2);
      console.log('User 2 registered successfully');
    } catch (error) {
      console.log('User 2 registration failed:', error.response?.data || error.message);
      throw error;
    }

    console.log('4. Logging in User 2...');
    const user2LoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser2.email,
      password: testUser2.password
    });
    user2Token = user2LoginRes.data.token;
    console.log('User 2 logged in successfully');

    // Create room with User 1
    console.log('5. Creating room with User 1...');
    const roomRes = await axios.post(`${API_BASE}/rooms`, {
      name: 'Test Room',
      description: 'A test room for debugging',
      visibility: 'private'
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    
    const room = roomRes.data.data;
    roomCode = room.code;
    console.log('Room created successfully!');
    console.log('Room ID:', room._id);
    console.log('Room Code:', roomCode);
    console.log('Room Name:', room.name);

    // User 2 tries to join the room
    console.log('\n6. User 2 attempting to join room...');
    const joinRes = await axios.post(`${API_BASE}/rooms/join`, {
      code: roomCode
    }, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });

    console.log('User 2 joined room successfully!');
    console.log('Join response:', joinRes.data);

    console.log('\n=== Test Completed Successfully! ===');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Full error:', error);
  }
}

testRoomFlow();