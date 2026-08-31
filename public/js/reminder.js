/**
 * CircleLedger - WhatsApp Payment Reminder Generator
 * Generates personalized polite, casual, funny, and formal payment reminder texts.
 */

const Reminder = {
  tones: {
    polite: {
      name: 'Polite & Friendly',
      template: (friendName, amount, currency, myName, reason) => 
        `Hey ${friendName}! 😊 Hope you're doing well.\n\nJust a gentle reminder regarding our shared expense${reason ? ` for "${reason}"` : ''} of ${currency}${amount}.\nWhenever you get a chance, could you please settle it? Thanks a lot! 🙌`
    },
    casual: {
      name: 'Casual / Bro',
      template: (friendName, amount, currency, myName, reason) => 
        `Yo ${friendName}! 👋 Quick heads up on the ${currency}${amount} balance${reason ? ` for ${reason}` : ''}. Ping me or send via UPI whenever free! 🚀`
    },
    funny: {
      name: 'Humorous / Meme',
      template: (friendName, amount, currency, myName, reason) => 
        `Hello ${friendName}! 📢 Breaking news: My bank balance is missing ${currency}${amount} from our last hangout${reason ? ` (${reason})` : ''}! 🍕💸 Please send UPI before inflation eats it away! 😂`
    },
    formal: {
      name: 'Formal Ledger Statement',
      template: (friendName, amount, currency, myName, reason) => 
        `*Payment Reminder - CircleLedger*\n\nTo: ${friendName}\nOutstanding Dues: ${currency}${amount}\nReference: ${reason || 'Shared Circle Expense'}\nDate: ${new Date().toLocaleDateString()}\n\nPlease transfer to my UPI / Bank account at your earliest convenience. Thank you.`
    }
  },

  buildMessage(friendName, amount, currency = '₹', myName = 'Me', reason = '', tone = 'polite') {
    const generator = this.tones[tone] ? this.tones[tone].template : this.tones.polite.template;
    return generator(friendName, amount, currency, myName, reason);
  },

  generateWhatsAppUrl(phone, message) {
    let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    if (cleanPhone) {
      // If starts with 0 or doesn't have country code, leave or format
      return `https://wa.me/${cleanPhone}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  }
};

window.Reminder = Reminder;
