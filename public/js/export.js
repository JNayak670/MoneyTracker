/**
 * CircleLedger - Export & Statement Generator
 * Handles CSV export, JSON backup downloads, and printable PDF statements.
 */

const Exporter = {
  // Export transactions to CSV
  exportTransactionsToCSV(transactions, currency = '₹') {
    if (!transactions || transactions.length === 0) {
      alert('No transactions to export!');
      return;
    }

    const headers = ['ID', 'Date', 'Time', 'Friend', 'Type', `Amount (${currency})`, 'Impact on You', 'Category', 'Description', 'Payment Method', 'Receipt Note'];
    
    const rows = transactions.map(t => [
      t.id,
      `"${t.date}"`,
      `"${t.time || ''}"`,
      `"${(t.friend_name || '').replace(/"/g, '""')}"`,
      `"${t.type}"`,
      t.amount,
      t.impact_on_user,
      `"${t.category}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.payment_method || ''}"`,
      `"${(t.receipt_note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `circle_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Export full JSON database backup
  downloadJSONBackup(backupData) {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `circle_ledger_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Generate a printable statement for an individual friend
  printFriendStatement(friendLedger, currency = '₹') {
    if (!friendLedger || !friendLedger.friend) return;
    const { friend, current_balance, transactions } = friendLedger;

    const statusText = current_balance > 0 
      ? `Friend Owes You: ${currency}${Math.abs(current_balance).toLocaleString()}`
      : current_balance < 0 
      ? `You Owe Friend: ${currency}${Math.abs(current_balance).toLocaleString()}`
      : 'All Dues Settled (₹0)';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ledger Statement - ${friend.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2rem; color: #1e293b; }
          .statement-header { border-bottom: 2px solid #6366f1; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .title { font-size: 1.6rem; font-weight: bold; color: #1e1b4b; }
          .meta { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.9rem; color: #64748b; }
          .balance-badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; font-size: 1.1rem; margin: 1rem 0; background: #e0e7ff; color: #3730a3; }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.9rem; }
          th { background: #f1f5f9; text-align: left; padding: 0.75rem; border-bottom: 1px solid #cbd5e1; }
          td { padding: 0.75rem; border-bottom: 1px solid #e2e8f0; }
          .green { color: #059669; font-weight: bold; }
          .red { color: #dc2626; font-weight: bold; }
          .footer { margin-top: 2rem; font-size: 0.8rem; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="statement-header">
          <div class="title">CircleLedger Statement</div>
          <div class="meta">
            <div><strong>Friend:</strong> ${friend.name} (${friend.relationship_tag || 'Friend'}) ${friend.phone ? '| ' + friend.phone : ''}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>
        
        <div class="balance-badge">${statusText}</div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(t => `
              <tr>
                <td>${t.date} ${t.time || ''}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td>${t.type}</td>
                <td class="${t.impact_on_user > 0 ? 'green' : t.impact_on_user < 0 ? 'red' : ''}">
                  ${t.impact_on_user > 0 ? '+' : t.impact_on_user < 0 ? '-' : ''}${currency}${t.amount.toLocaleString()}
                </td>
                <td><strong>${currency}${t.running_balance.toLocaleString()}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated automatically by CircleLedger Friend Debt & Balance Tracker.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

window.Exporter = Exporter;
