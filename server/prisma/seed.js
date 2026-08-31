const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo user & circle transactions...');

  // 1. Create or retrieve demo user
  const email = 'demo@moneytracker.com';
  let demoUser = await prisma.user.findUnique({ where: { email } });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('demo123', salt);

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        name: 'Demo Account',
        email,
        password: hashedPassword,
        currency: '₹'
      }
    });
    console.log(`Created demo user: ${demoUser.email} (Password: demo123)`);
  } else {
    // Clear old data for demo user
    await prisma.transaction.deleteMany({ where: { userId: demoUser.id } });
    await prisma.friend.deleteMany({ where: { userId: demoUser.id } });
  }

  // 2. Friends
  // Friend 1: Rahul Sharma (Owes ₹1,450)
  const rahul = await prisma.friend.create({
    data: {
      userId: demoUser.id,
      name: 'Rahul Sharma',
      phone: '+91 98765 43210',
      email: 'rahul.s@example.com',
      avatarColor: '#3b82f6',
      avatarEmoji: '🍕',
      relationshipTag: 'Roommate',
      notes: 'Flat 402 roommate'
    }
  });

  // Friend 2: Priya Patel (You owe ₹420)
  const priya = await prisma.friend.create({
    data: {
      userId: demoUser.id,
      name: 'Priya Patel',
      phone: '+91 91234 56789',
      email: 'priya.p@example.com',
      avatarColor: '#ec4899',
      avatarEmoji: '☕',
      relationshipTag: 'Colleague',
      notes: 'Design team lead'
    }
  });

  // Friend 3: Amit Verma (Owes ₹3,500)
  const amit = await prisma.friend.create({
    data: {
      userId: demoUser.id,
      name: 'Amit Verma',
      phone: '+91 99887 76655',
      email: 'amit.v@example.com',
      avatarColor: '#10b981',
      avatarEmoji: '🚗',
      relationshipTag: 'College Friend',
      notes: 'Goa road trip buddy'
    }
  });

  // Friend 4: Sneha Roy (All Settled ₹0)
  const sneha = await prisma.friend.create({
    data: {
      userId: demoUser.id,
      name: 'Sneha Roy',
      phone: '+91 97654 32109',
      email: 'sneha.r@example.com',
      avatarColor: '#8b5cf6',
      avatarEmoji: '🎬',
      relationshipTag: 'Friend',
      notes: 'Movie group'
    }
  });

  // 3. Transactions
  // Rahul transactions
  await prisma.transaction.create({
    data: {
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
    }
  });

  await prisma.transaction.create({
    data: {
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
    }
  });

  await prisma.transaction.create({
    data: {
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
    }
  });

  // Priya transactions
  await prisma.transaction.create({
    data: {
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
    }
  });

  await prisma.transaction.create({
    data: {
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
    }
  });

  // Amit transactions
  await prisma.transaction.create({
    data: {
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
    }
  });

  await prisma.transaction.create({
    data: {
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
    }
  });

  // Sneha transactions
  await prisma.transaction.create({
    data: {
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
    }
  });

  await prisma.transaction.create({
    data: {
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
    }
  });

  console.log('✅ Demo data seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
