const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'controllers');
const files = fs.readdirSync(dir);
files.forEach(f => {
  let c = fs.readFileSync(path.join(dir, f), 'utf8');
  
  // Inject society scoping into query objects safely
  c = c.replace(/const query = \{\};/g, "const query = { society: req.user.society };");
  
  // Inject into specific hardcoded find queries
  c = c.replace(/\.find\(\{ isAvailable: true \}\)/g, ".find({ society: req.user.society, isAvailable: true })");
  c = c.replace(/\.find\(\{ user: req\.user\._id \}\)/g, ".find({ society: req.user.society, user: req.user._id })");
  c = c.replace(/\.find\(\{ role: 'resident', isActive: true \}\)/g, ".find({ society: req.user.society, role: 'resident', isActive: true })");
  c = c.replace(/\.countDocuments\(\{\}\)/g, ".countDocuments({ society: req.user.society })");
  
  // Complex specific queries like payment controllers
  c = c.replace(/\.find\(\{ month, year, status: 'paid' \}\)/g, ".find({ society: req.user.society, month, year, status: 'paid' })");
  c = c.replace(/\.find\(\{ month: currentMonth, year: currentYear, status: 'paid' \}\)/g, ".find({ society: req.user.society, month: currentMonth, year: currentYear, status: 'paid' })");
  
  // Booking overlapping logic
  c = c.replace(/facility: facilityId,/g, "society: req.user.society, facility: facilityId,");
  
  // For creations, inject the society
  c = c.replace(/Visitor\.create\(\{/g, "Visitor.create({ society: req.user.society,");
  c = c.replace(/Booking\.create\(\{/g, "Booking.create({ society: req.user.society,");
  c = c.replace(/Facility\.create\(\{/g, "Facility.create({ society: req.user.society,");
  c = c.replace(/Complaint\.create\(\{/g, "Complaint.create({ society: req.user.society,");
  c = c.replace(/Expense\.create\(\{/g, "Expense.create({ society: req.user.society,");
  c = c.replace(/Payment\.create\(\{/g, "Payment.create({ society: req.user.society,");
  
  // Analytics Match
  c = c.replace(/\$match: \{ status: 'confirmed' \}/g, "$match: { society: req.user.society, status: 'confirmed' }");
  c = c.replace(/\$match: \{ status: 'paid'/g, "$match: { society: req.user.society, status: 'paid'");

  fs.writeFileSync(path.join(dir, f), c);
});
console.log('Controllers migrated!');
