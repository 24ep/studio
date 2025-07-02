// Test built-in fetch
console.log('Testing built-in fetch...');

try {
  const response = await fetch('http://httpbin.org/get');
  const data = await response.json();
  console.log('Fetch test successful:', data.url);
} catch (error) {
  console.error('Fetch test failed:', error);
} 