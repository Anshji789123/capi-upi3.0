// This is a temporary script to help with the edit
const fs = require('fs');

// Read the current file
const content = fs.readFileSync('components/dashboard.tsx', 'utf8');

// Find and replace the max attribute and available display
const updatedContent = content
  .replace(
    /max=\{userData\.balance\}/,
    `max={selectedSubCard ? 
                        (userData.subCards?.find(sc => sc.id === selectedSubCard)?.limit || 0) - 
                        (userData.subCards?.find(sc => sc.id === selectedSubCard)?.used || 0) : 
                        userData.balance}`
  )
  .replace(
    /<p className="text-gray-400 text-sm mt-1">Available: [^<]*<\/p>/,
    `<p className="text-gray-400 text-sm mt-1">
                      Available: ₹{selectedSubCard ? 
                        ((userData.subCards?.find(sc => sc.id === selectedSubCard)?.limit || 0) - 
                         (userData.subCards?.find(sc => sc.id === selectedSubCard)?.used || 0)).toLocaleString() :
                        userData.balance.toLocaleString()}
                      {selectedSubCard && (
                        <span className="text-blue-400 ml-2">
                          ({userData.subCards?.find(sc => sc.id === selectedSubCard)?.name})
                        </span>
                      )}
                    </p>`
  );

// Write the updated content
fs.writeFileSync('components/dashboard.tsx', updatedContent);
console.log('Payment form updated successfully');
