const bcrypt = require('bcryptjs');
const { connectDB, User, Friend, Transaction } = require('./db');

async function seed() {
  await connectDB();

  console.log('🌱 Seeding MongoDB database with demo user & circle transactions...');

  const email = 'demo@moneytracker.com';
  let demoUser = await User.findOne({ email });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('demo123', salt);

  if (!demoUser) {
    demoUser = await User.create({
      name: 'Demo Account',
      email,
      password: hashedPassword,
      currency: '₹'
    });
    console.log(`Created demo user: ${demoUser.email} (Password: demo123)`);
  } else {
    // Clear old transactions & friends for demo user
    await Transaction.deleteMany({ userId: demoUser.id });
    await Friend.deleteMany({ userId: demoUser.id });
  }

  // 2. Friends
  const rahul = await Friend.create({
    userId: demoUser.id,
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul.s@example.com',
    avatarColor: '#3b82f6',
    avatarEmoji: '🍕',
    relationshipTag: 'Roommate',
    notes: 'Flat 402 roommate'
  });

  const priya = await Friend.create({
    userId: demoUser.id,
    name: 'Priya Patel',
    phone: '+91 91234 56789',
    email: 'priya.p@example.com',
    avatarColor: '#ec4899',
    avatarEmoji: '☕',
    relationshipTag: 'Colleague',
    notes: 'Design team lead'
  });

  const amit = await Friend.create({
    userId: demoUser.id,
    name: 'Amit Verma',
    phone: '+91 99887 76655',
    email: 'amit.v@example.com',
    avatarColor: '#10b981',
    avatarEmoji: '🚗',
    relationshipTag: 'College Friend',
    notes: 'Goa road trip buddy'
  });

  const sneha = await Friend.create({
    userId: demoUser.id,
    name: 'Sneha Roy',
    phone: '+91 97654 32109',
    email: 'sneha.r@example.com',
    avatarColor: '#8b5cf6',
    avatarEmoji: '🎬',
    relationshipTag: 'Friend',
    notes: 'Movie group'
  });

  // 3. Transactions
  await Transaction.create({
    userId: demoUser.id,
    friendId: rahul.id,
    type: 'GIVEN',
    amount: 1200,
    impactOnUser: 1200,
    category: 'Food & Dining',
    note: 'Weekend Pizza Party & Drinks (Swiggy)',
    date: '2026-08-22',
    time: '20:30',
    paymentMethod: 'UPI',
    receiptNote: 'Order #SWIG-8821'
  });

  await Transaction.create({
    userId: demoUser.id,
    friendId: rahul.id,
    type: 'GIVEN',
    amount: 750,
    impactOnUser: 750,
    category: 'Rent & Bills',
    note: 'WiFi High-speed Fiber Bill share',
    date: '2026-08-25',
    time: '11:15',
    paymentMethod: 'Google Pay',
    receiptNote: 'Airtel Broadband'
  });

  await Transaction.create({
    userId: demoUser.id,
    friendId: rahul.id,
    type: 'SETTLED',
    amount: 500,
    impactOnUser: -500,
    category: 'Settlement',
    note: 'Partial payback via UPI',
    date: '2026-08-28',
    time: '18:40',
    paymentMethod: 'PhonePe',
    receiptNote: 'Trans ID: P260828001'
  });

  await Transaction.create({
    userId: demoUser.id,
    friendId: priya.id,
    type: 'RECEIVED',
    amount: 620,
    impactOnUser: -620,
    category: 'Food & Dining',
    note: 'Team Lunch at Blue Tokai Cafe (Priya paid)',
    date: '2026-08-24',
    time: '13:45',
    paymentMethod: 'Card',
    receiptNote: 'Flat White + Bagel'
  });

  await Transaction.create({
    userId: demoUser.id,
    friendId: priya.id,
    type: 'SETTLED',
    amount: 200,
    impactOnUser: 200,
    category: 'Settlement',
    note: 'Paid cash for morning coffee',
    date: '2026-08-27',
    time: '09:30',
    paymentMethod: 'Cash',
    receiptNote: 'Cash handoff'
  });

  await Transaction.create({
    userId: demoUser.id,
    friendId: amit.id,
    type: 'SPLIT',
    amount: 2500,
    impactOnUser: 2500,
    category: 'Travel & Trips',
    note: 'Goa Resort Stay 2-Nights Booking Share',
    date: '2026-08-15',
    time: '16:00',
    paymentMethod: 'Card',
    receiptNote: 'Booking Ref #GOA-901'
  });

  await Transaction.create({
    userId: demoUser.id,
    friendId: amit.id,
    type: 'GIVEN',
    amount: 1000,
    impactOnUser: 1000,
    category: 'Loans & Cash',
    note: 'Emergency fuel & highway toll cash',
    date: '2026-08-17',
    time: '22:10',
    paymentMethod: 'Cash',
    receiptNote: 'Fastag recharge'
  });

  await Transaction.create({
    userId: demoUser.id,
    friendId: sneha.id,
    type: 'GIVEN',
    amount: 850,
    impactOnUser: 850,
    category: 'Entertainment',
    note: 'IMAX Cinema Tickets (Inception 2)',
    date: '2026-08-10',
    time: '19:00',
    paymentMethod: 'BookMyShow',
    receiptNote: '2 Tickets'
  });

  await Transaction.create({
    userId: demoUser.id,
    friendId: sneha.id,
    type: 'SETTLED',
    amount: 850,
    impactOnUser: -850,
    category: 'Settlement',
    note: 'Full payback via GPay',
    date: '2026-08-11',
    time: '10:05',
    paymentMethod: 'Google Pay',
    receiptNote: 'Ref #UPI-449102'
  });

  console.log('✅ MongoDB database seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ MongoDB seed error:', err);
  process.exit(1);
});
